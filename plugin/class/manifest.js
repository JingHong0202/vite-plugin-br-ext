import path from 'path';
import fs from 'fs';
import { cwd } from 'process';
import { normalizePath } from 'vite';
import { set, get, getType } from '../utils';
import {
  inputsReg,
  isNetWorkLink,
  includeNumber,
  isWebResources,
  isJSFile,
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
      }
      return chunk.fileName;
    },
    content_scripts: async (plugin, chunk, bundle, self) => {
      if (isJSFile.test(self.ext)) {
        return await iife(plugin, chunk, bundle);
      }
      return chunk.fileName;
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
        // console.log(item.fileName);
        plugin.emitFile(item);
      });
  }

  buildManifest(plugin) {
    Object.keys(this.hashTable).forEach(key => {
      const resource = this.hashTable[key];
      if (resource.isEntry && !isWebResources.test(resource.attrPath)) {
        this.result[resource.attrPath] = resource.output.path;
      }
    });
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
        );
        if (this.hashTable[keyMap]) {
          throw Error(`file ${keyMap} repeat`);
        }
        if (inputsReg.test(ext)) {
          resource.isEntry = true;
        }

        resource.relativePath = target[key];
        resource.absolutePath = absolutePath;
        resource.attrPath = `${parent}.${key}`;
        resource.keyMap = keyMap;
        resource.ext = ext;
        this.hashTable[keyMap] = resource;
      } else if (parent && isWebResources.test(parent)) {
        // 处理有没后缀的路径
        // 是否有通配符
        if (hasMagic(target[key])) {
          this.matchFileByRules(target[key]);
        }
      }
    }
  }

  matchFileByRules(rules, parent) {
    const files = sync(rules, {
      cwd: path.dirname(this.maniFestPath),
    });
    console.log(files);
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
