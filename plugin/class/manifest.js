import path from 'path';
import fs from 'fs';
import { cwd } from 'process';
import { normalizePath } from 'vite';
import { set, get, getType } from '../utils';
import { inputsReg, isNetWorkLink, includeNumber } from '../utils/reg';

export class ManiFest {
  origin;
  result;
  // action;
  // background;
  // other;
  maniFestPath;
  // attrHashMap = {};
  resources = {};
  // rollup
  inputs = [];

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
    // this.action = this.parseAction();
    // this.background = this.parseBackground();
    // this.other = this.parseOther();
    this.inputs = this.resolveInputs();
    console.log('inputs', this.inputs);
  }

  // parseAction() {
  //   const { default_popup, ...other } = get(this.origin.action, {});

  //   return {
  //     inputs: default_popup ? path.join(cwd(), 'src', default_popup) : '',
  //     parsed: { ...other },
  //   };
  // }

  // parseBackground() {
  //   const { service_worker, ...other } = get(this.origin.background, {});

  //   return {
  //     inputs: service_worker ? path.join(cwd(), 'src', service_worker) : '',
  //     parsed: { ...other },
  //   };
  // }

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
        resource = {};
      }
    }
  }

  resolveInputs() {
    // 遍历解析 manifest.json
    this.traverseDeep(this.origin);

    return Object.entries(this.resources).reduce((accumulator, current) => {
      if (current[1].isEntry) {
        accumulator[current[1].keyMap] = current[1].absolutePath;
      }
      return accumulator;
    }, {});
  }
}
