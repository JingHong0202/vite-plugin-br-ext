import path from 'path';
import fs from 'fs';
import { cwd } from 'process';
import { normalizePath } from 'vite';
import { get } from '../utils';

const inputsReg = /(\.html)|(\.((js)|(ts))x?)/g;

export class ManiFest {
  origin;
  result;
  action;
  background;
  other;
  maniFestPath;
  attrHashMap = {};
  resources = {
    js: [],
    css: [],
    html: [],
    other: [],
  };
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
    this.result = maniFestJson;
    // this.action = this.parseAction();
    // this.background = this.parseBackground();
    // this.other = this.parseOther();
    this.inputs = this.resolveInputs();
    console.log('inputs', this.inputs);
  }

  parseAction() {
    const { default_popup, ...other } = get(this.origin.action, {});

    return {
      inputs: default_popup ? path.join(cwd(), 'src', default_popup) : '',
      parsed: { ...other },
    };
  }

  parseBackground() {
    const { service_worker, ...other } = get(this.origin.background, {});

    return {
      inputs: service_worker ? path.join(cwd(), 'src', service_worker) : '',
      parsed: { ...other },
    };
  }

  parseOther() {
    // this.other = {} = this.origin
  }

  traverseDeep(target, parent) {
    for (const key in target) {
      if (!Object.hasOwnProperty.call(target, key)) continue;

      const type = Object.prototype.toString.call(target[key]);
      if (type === '[object Object]' || type === '[object Array]') {
        this.traverseDeep(target[key], `${parent ? `${parent}.${key}` : key}`);
      } else if (typeof target[key] === 'string') {
        const ext = path.extname(target[key]);
        if (ext && inputsReg.test(ext)) {
          // this.resources[ext.slice(1)]?.push({
          //   filePath: target[key], // 文件路径
          //   path: parent, // manifest.js 属性路径
          // });

          this.inputs.push({
            val: path.join(cwd(), 'src', target[key]),
            tag: parent,
          });
        }
      }
    }
  }

  resolveInputs() {
    // 遍历解析 manifest.json
    this.traverseDeep(this.origin);

    // console.log(this.resources);

    // if (this.action.inputs) {
    //   result.push({tag: 'action.default_popup', val: this.action.inputs});
    // }

    // if (this.background.inputs) {
    //   result.push({tag: 'background.service_worker', val: this.background.inputs});
    // }
    // // console.log(result);
    let result = this.inputs.reduce((accumulator, current) => {
      const key = normalizePath(
        path.relative(path.dirname(this.maniFestPath), current.val)
      );
      //  path
      //     .relative(path.dirname(this.maniFestPath), options.input[0])
      //     .split('.')
      //     .slice(0, 1)
      //     .join('.')

      if (accumulator[key]) {
        throw Error(`file ${current.val} 重复`);
      }
      accumulator[key] = normalizePath(current.val);
      this.attrHashMap[key] = current.tag;
      return accumulator;
    }, {});
    return result;
  }
}
