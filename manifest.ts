import path from 'path';
import fs from 'fs';
import { normalizePath } from 'vite';
import { set, get, getType, createUUID, parsePreCSS } from './utils';
import { match } from './utils/permission';
import {
  inputsReg,
  isNetWorkLink,
  includeNumber,
  isWebResources,
  isJSFile,
  isPrepCSSFile,
  executeScriptReg,
  annotationRows,
  insertCSSReg,
  filesReg,
} from './utils/reg';
import { hasMagic, sync } from 'glob';
import iife from './mixin/iife';
import {
  InputOptions,
  OutputAsset,
  PluginContext,
  OutputBundle,
  EmittedFile,
} from 'rollup';
import log from './utils/logger';

interface Resource {
  isEntry: boolean;
  relativePath: string;
  absolutePath: string;
  attrPath: string;
  ext: string;
  keyMap: string;
  output?: {
    path: string;
  };
}

type PreWork = {
  [key: string]: (...args: any[]) => {};
};

type MatchDynamic = {
  start: number;
  end: number;
  filesFieldStartIndex?: number;
  filesFieldEndIndex?: number;
  files?: {
    val: string;
    type: string;
  }[];
};

export class ManiFest {
  readonly origin: any;
  result: any;
  maniFestPath: string = '';
  // 存储所有输出资源 HashMap
  hashTable: { [key: string | number]: Resource } = {};
  // 存储动态导入资源
  dynamicImports = new Map();
  // 存储解析出的权限
  permission = [];
  // 存储所有入口资源
  inputs = {};
  // 写入manifest之前的处理操作，作用：对个别字段输出进行单独处理
  preWork: PreWork = {
    service_worker: async (plugin, chunk, bundle) => {
      if (!this.result['background.type']) {
        return await iife(plugin, chunk, bundle);
      } else {
        return chunk.fileName;
      }
    },
    web_accessible_resources: async (plugin, chunk, bundle, self) => {
      if (isJSFile.test(self.ext)) {
        return await iife(plugin, chunk, bundle);
      } else {
        return chunk.fileName;
      }
    },
    content_scripts: async (plugin, chunk, bundle, self) => {
      if (isJSFile.test(self.ext)) {
        return await iife(plugin, chunk, bundle);
      } else {
        return chunk.fileName;
      }
    },
    toIIFE: iife,
  };

  constructor(options: InputOptions) {
    let maniFestJson;

    try {
      if (typeof options.input === 'string') {
        maniFestJson = JSON.parse(
          fs.readFileSync(options.input, { encoding: 'utf-8' })
        );
        this.maniFestPath = options.input;
      } else if (typeof options.input === 'object') {
        const find = Object.values(options.input).find(item =>
          item.includes('manifest.json')
        );
        if (find) {
          maniFestJson = JSON.parse(
            fs.readFileSync(find, { encoding: 'utf-8' })
          );
          this.maniFestPath = find;
        }
      }
      if (!maniFestJson) {
        throw Error('manifest.json required');
      }
      this.origin = maniFestJson;
      this.result = new Proxy(maniFestJson, {
        set: <ProxyHandler<typeof ManiFest>['set']>set,
        get: <ProxyHandler<typeof ManiFest>['get']>get,
      });
      this.inputs = this.resolveInputs();
    } catch (error) {
      throw Error(<string>error);
    }
    log.primary(JSON.stringify(this.inputs, null, 2));
  }

  async handerPermission(code: string) {
    this.permission = [...new Set(this.permission.concat(<[]>match(code)))];
  }

  async handlerDynamicInput(plugin: PluginContext, code: string, id: string) {
    // 去除注释
    code = code.replace(annotationRows(), '');
    // 处理动态JS文件
    code = await this.handlerDynamicJS(plugin, code, id);
    // 处理动态CSS文件
    code = await this.handlerDynamicCSS(plugin, code, id);

    return code;
  }

  async handlerDynamicJS(plugin: PluginContext, code: string, id: string) {
    const matchAll = this.matchDynamicFilePaths(executeScriptReg(), code);
    if (!matchAll.length) return code;
    return await this.handlerMatchedPaths({
      type: 'chunk',
      matchAll: matchAll as Required<MatchDynamic>[],
      code,
      plugin,
      id,
    });
  }

  async handlerDynamicCSS(plugin: PluginContext, code: string, id: string) {
    const matchAll = this.matchDynamicFilePaths(insertCSSReg(), code);
    if (!matchAll.length) return code;
    return await this.handlerMatchedPaths({
      type: 'asset',
      plugin,
      matchAll: matchAll as Required<MatchDynamic>[],
      code,
      id,
    });
  }

  matchDynamicFilePaths(reg: RegExp, code: string): Required<MatchDynamic[]> {
    let reusltArr: MatchDynamic[] = [];
    for (const match of code.matchAll(reg)) {
      const lastIndex = match.index! + (match[0].length - 1);
      reusltArr.push({
        start: match.index!,
        end: lastIndex,
      });
    }

    return reusltArr.flatMap(item => {
      let result = ['('];

      while (result.length) {
        ++item.end;
        if (/[\(\{]/.test(code[item.end])) {
          result.push(code[item.end]);
        } else if (code[item.end] === ')') {
          result.splice(result.indexOf('('), 1);
        } else if (code[item.end] === '}') {
          result.splice(result.indexOf('{'), 1);
        }
      }

      let block = code.slice(item.start, item.end + 1);
      const filesField = block.match(filesReg());
      if (filesField) {
        const urlMatch = filesField[1].split(',').flatMap(i => {
          return [
            /[\"\'](.+)[\"\']$/g.test(i)
              ? { val: i.replace(/[\"\']/g, '').trim(), type: 'path' }
              : { val: i, type: 'variable' },
          ];
        });
        item.filesFieldStartIndex = filesField.index! + item.start;
        item.filesFieldEndIndex =
          filesField.index! + item.start + filesField[0].length;
        item.files = urlMatch;
        return [item];
      }
      return [];
    });
  }

  async handlerMatchedPaths({
    type,
    matchAll,
    code,
    plugin,
    id,
  }: {
    type: 'chunk' | 'asset';
    matchAll: Required<MatchDynamic>[];
    code: string;
    plugin: PluginContext;
    id: string;
  }) {
    let diff = 0;
    for (const iterator of matchAll) {
      const newFiles = await Promise.all(
        iterator.files.map(async file => {
          if (file.type === 'variable') {
            return file.val;
          } else if (file.type === 'path') {
            const filePath = normalizePath(
              path.resolve(path.dirname(id), file.val)
            );
            if (!fs.existsSync(filePath)) {
              throw Error(`dynamic ${file.val} Not Found`);
            }

            const fileInfo = path.parse(filePath);
            let fileName;

            if (type === 'asset') {
              fileName = `dynamic/${createUUID()}.css`;
              plugin.emitFile({
                type: 'asset',
                source: fs.readFileSync(filePath, 'utf-8'),
                fileName,
              });
              this.dynamicImports.set(
                fileName,
                path.relative(path.dirname(this.maniFestPath), filePath)
              );
            } else if (type === 'chunk') {
              fileName = `dynamic/${createUUID()}${fileInfo.ext}`;
              plugin.emitFile({
                id: filePath,
                type: 'chunk',
                fileName,
              });
            }
            return normalizePath(`/${fileName}`);
          }
        })
      );

      const replaceStr = code.slice(
          diff + iterator.filesFieldStartIndex,
          diff + iterator.filesFieldEndIndex
        ),
        replaceVal = `files: ${JSON.stringify(newFiles)}`;
      diff = diff + Math.max(0, replaceVal.length - replaceStr.length);
      code = code.replace(replaceStr, replaceVal);
    }

    return code;
  }

  async handlerCSS(
    plugin: PluginContext,
    chunk: OutputAsset,
    bundle: OutputBundle
  ) {
    let dependciesName = path.extname(chunk.fileName).slice(1),
      filePath = normalizePath(
        path.join(path.dirname(this.maniFestPath), chunk.fileName)
      );

    if (this.dynamicImports.has(chunk.fileName)) {
      const hash = this.dynamicImports.get(chunk.fileName);
      filePath = normalizePath(
        path.join(path.dirname(this.maniFestPath), hash)
      );
      dependciesName = path.extname(hash).slice(1);
    }

    if (!fs.existsSync(filePath)) {
      throw Error(`${filePath} Not Found`);
    }

    const source = await parsePreCSS(dependciesName, filePath);
    delete bundle[Object.keys(bundle).find(key => bundle[key] === chunk)!];

    const referenceId = plugin.emitFile({
      fileName: `${chunk.fileName.replace(
        path.extname(chunk.fileName),
        ''
      )}-${createUUID()}.css`,
      source,
      type: 'asset',
    });

    return plugin.getFileName(referenceId);
  }

  handlerResources(plugin: PluginContext) {
    Object.values(this.hashTable)
      .flatMap(resource => {
        return !resource.isEntry
          ? [
              {
                type: 'asset',
                fileName: normalizePath(
                  path.relative(
                    path.dirname(this.maniFestPath),
                    resource.absolutePath
                  )
                ),
                source: fs.readFileSync(resource.absolutePath),
              },
            ]
          : [];
      })
      .forEach(item => {
        plugin.emitFile(<EmittedFile>item);
      });
  }

  buildManifest(plugin: PluginContext) {
    Object.keys(this.hashTable).forEach(key => {
      const resource = this.hashTable[key];
      if (isWebResources.test(resource.attrPath)) return;

      if (resource.isEntry) {
        this.result[resource.attrPath] = resource.output!.path;
      } else if (isPrepCSSFile.test(resource.ext)) {
        this.result[resource.attrPath] = resource.output!.path;
      }
    });
    this.result.permissions = this.result.permissions
      ? [...new Set([...this.result.permissions, ...this.permission])]
      : this.permission;

    plugin.emitFile({
      source: JSON.stringify(this.result, null, 2),
      fileName: 'manifest.json',
      type: 'asset',
    });
  }

  traverseDeep(target: any, parent?: string) {
    for (const key in target) {
      if (!Object.hasOwnProperty.call(target, key)) continue;

      const type = getType(target[key]);
      let ext;
      if (type === '[object Object]' || type === '[object Array]') {
        this.traverseDeep(target[key], `${parent ? `${parent}.${key}` : key}`);
      } else if (
        typeof target[key] === 'string' &&
        !isNetWorkLink().test(target[key]) &&
        (ext = path.extname(target[key])) &&
        !includeNumber().test(ext)
      ) {
        // 处理有后缀的路径

        // 特例：处理 *.js *.html
        if (hasMagic(target[key]) && parent) {
          return this.matchFileByRules(target[key], parent);
        }

        const absolutePath = normalizePath(
          path.join(path.dirname(this.maniFestPath), target[key])
        );

        if (!fs.existsSync(absolutePath)) {
          log.error(`${absolutePath} Not Found`);
          continue;
        }

        let resource: Partial<Resource> = {};

        const keyMap = normalizePath(
          path.relative(path.dirname(this.maniFestPath), absolutePath)
        ).replace(ext, '');

        if (this.hashTable[keyMap]) {
          throw Error(`file ${keyMap} repeat`);
        }

        if (inputsReg.test(ext)) {
          resource.isEntry = true;
        }

        resource.relativePath = target[key];
        resource.absolutePath = absolutePath;
        resource.attrPath = `${parent ? `${parent}.${key}` : key}`;
        resource.keyMap = keyMap;
        resource.ext = ext;
        this.hashTable[keyMap] = <Required<Resource>>resource;
      } else if (parent && isWebResources.test(parent)) {
        // 处理有没后缀的路径
        // 是否有通配符
        if (hasMagic(target[key])) {
          this.matchFileByRules(target[key], parent);
        }
      }
    }
  }

  matchFileByRules(rules: string, parent: string = '') {
    const files = sync(rules, {
      cwd: path.dirname(this.maniFestPath),
    });
    files && files.length && this.traverseDeep(files, parent);
  }

  resolveInputs() {
    // 遍历解析 manifest.json
    this.traverseDeep(this.origin);
    return Object.entries(this.hashTable).reduce(
      (accumulator: { [key: string | number]: string }, current) => {
        if (current[1].isEntry) {
          accumulator[current[1].keyMap] = current[1].absolutePath;
        }
        return accumulator;
      },
      {}
    );
  }
}
