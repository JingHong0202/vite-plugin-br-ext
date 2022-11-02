import path from 'path';
import fs from 'fs';
import { cwd } from 'process';
import { normalizePath } from 'vite';
import { set, get, getType } from '../utils';
import { inputsReg, isNetWorkLink, includeNumber } from '../utils/reg';
import iife from '../mixin/iife';

export class ManiFest {
  origin;
  result;
  maniFestPath;

  // rollup
  resources = {};
  inputs = [];
  preWork = {
    service_worker: async (plugin, chunk, bundle) => {
      if (!this.result['background.type']) {
        return (await iife(plugin, chunk, bundle));
      } else {
        return chunk.fileName;
      }
    },
  };

  constructor(options) {
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
    console.log('inputs', this.inputs);
  }

  buildManifest(plugin) {
    Object.keys(this.resources).forEach(key => {
      const resource = this.resources[key];
      // console.log(resource);
      if (resource.isEntry) {
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
        (ext = path.extname(target[key])) &&
        !includeNumber.test(ext) &&
        !isNetWorkLink.test(target[key])
      ) {
        const absolutePath = normalizePath(
          path.join(cwd(), 'src', target[key])
        );
        if (!fs.existsSync(absolutePath)) {
          console.log('\x1B[1m', `${absolutePath} Not Found`);
          continue;
        }

        let resource = {};
        const keyMap = normalizePath(
          path.relative(path.dirname(this.maniFestPath), absolutePath)
        );
        if (this.resources[keyMap]) {
          throw Error(`file ${keyMap} repeat`);
        }
        if (inputsReg.test(ext)) {
          resource.isEntry = true;
        }
        
        resource.relativePath = target[key];
        resource.absolutePath = absolutePath;
        resource.attrPath = `${parent}.${key}`;
        resource.keyMap = keyMap;
        this.resources[keyMap] = resource;
      }
    }
  }

  resolveInputs() {
    // 遍历解析 manifest.json
    this.traverseDeep(this.origin);
    console.log(this.resources);
    return Object.entries(this.resources).reduce((accumulator, current) => {
      if (current[1].isEntry) {
        accumulator[current[1].keyMap] = current[1].absolutePath;
      }
      return accumulator;
    }, {});
  }
}
