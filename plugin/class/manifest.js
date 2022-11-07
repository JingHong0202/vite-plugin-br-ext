import path from 'path';
import fs from 'fs';
import { normalizePath } from 'vite';
import { set, get, getType, createUUID } from '../utils';
import {
  inputsReg,
  isNetWorkLink,
  includeNumber,
  isWebResources,
  isJSFile,
  isPrepCSSFile,
} from '../utils/reg';
import { hasMagic, sync } from 'glob';
import iife from '../mixin/iife';

export class ManiFest {
  origin;
  result;
  maniFestPath;

  // rollup
  hashTable = {};
  resources = {};
  permission = [];
  inputs = [];
  preWork = {
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
  };

  constructor(options) {
    try {
      const maniFestJson = JSON.parse(
        fs.readFileSync(options.input, { encoding: 'utf-8' })
      );
      if (!maniFestJson) {
        throw Error('mainfest.js required');
      }
      this.maniFestPath = options.input;
      this.origin = maniFestJson;
      this.result = new Proxy(maniFestJson, {
        set,
        get,
      });
      this.inputs = this.resolveInputs();
    } catch (error) {
      throw Error(error);
    }
    console.log('inputs', this.inputs);
  }

  async handlerCSS(plugin, chunk, bundle) {
    const dependciesName = path.extname(chunk.fileName).slice(1);
    let source,
      filePath = normalizePath(
        path.join(path.dirname(this.maniFestPath), chunk.fileName)
      );
    if (dependciesName === 'scss' || dependciesName === 'sass') {
      const CSSHandler = require('sass');
      const result = CSSHandler.compile(filePath, { style: 'compressed' });
      source = result.css;
    } else if (dependciesName === 'less') {
      const CSSHandler = require('less');
      const result = await CSSHandler.render(
        fs.readFileSync(filePath, 'utf-8'),
        { compress: true }
      );
      source = result.css;
    } else if (dependciesName === 'styl' || dependciesName === 'stylus') {
      const CSSHandler = require('stylus');
      const result = CSSHandler.render(fs.readFileSync(filePath, 'utf-8'), {
        compress: true,
      });
      source = result;
    }
    // console.log(result);

    delete bundle[Object.keys(bundle).find(key => bundle[key] === chunk)];

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

  handlerResources(plugin) {
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
        // console.log('handlerResources:', item.fileName);
        plugin.emitFile(item);
      });
  }

  buildManifest(plugin) {
    Object.keys(this.hashTable).forEach(key => {
      const resource = this.hashTable[key];
      if (isWebResources.test(resource.attrPath)) return;

      if (resource.isEntry) {
        this.result[resource.attrPath] = resource.output.path;
      } else if (isPrepCSSFile.test(resource.ext)) {
        this.result[resource.attrPath] = resource.output.path;
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

  traverseDeep(target, parent) {
    for (const key in target) {
      if (!Object.hasOwnProperty.call(target, key)) continue;

      const type = getType(target[key]);
      let ext;
      if (type === '[object Object]' || type === '[object Array]') {
        this.traverseDeep(target[key], `${parent ? `${parent}.${key}` : key}`);
      } else if (
        typeof target[key] === 'string' &&
        !isNetWorkLink.test(target[key]) &&
        (ext = path.extname(target[key])) &&
        !includeNumber.test(ext)
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
          console.log(`${absolutePath} Not Found`);
          continue;
        }

        let resource = {};
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
        this.hashTable[keyMap] = resource;
      } else if (parent && isWebResources.test(parent)) {
        // 处理有没后缀的路径
        // 是否有通配符
        if (hasMagic(target[key])) {
          this.matchFileByRules(target[key], parent);
        }
      }
    }
  }

  matchFileByRules(rules, parent = '') {
    const files = sync(rules, {
      cwd: path.dirname(this.maniFestPath),
    });
    // console.log(files);
    files && files.length && this.traverseDeep(files, parent);
  }

  resolveInputs() {
    // 遍历解析 manifest.json
    this.traverseDeep(this.origin);
    // console.log(this.hashTable);
    return Object.entries(this.hashTable).reduce((accumulator, current) => {
      if (current[1].isEntry) {
        accumulator[current[1].keyMap] = current[1].absolutePath;
      }
      return accumulator;
    }, {});
  }
}
