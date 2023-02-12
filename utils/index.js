import fs from 'fs';
import path from 'path';

function get(target, attr) {
  return typeof attr === 'string'
    ? attr.split('.').reduce((accumulator, attr, index, self) => {
        return accumulator[attr];
      }, target)
    : target[attr];
}

function set(target, attr, value) {
  return typeof attr === 'string'
    ? attr.split('.').reduce((accumulator, attr, index, self) => {
        if (self.length - 1 === index) {
          accumulator[attr] = value;
        }
        return accumulator[attr];
      }, target)
    : (target[attr] = value);
}

function getType(target) {
  return Object.prototype.toString.call(target);
}

function createUUID() {
  return Number(Math.random().toString().substr(2)).toString(36);
}

async function parsePreCSS(dependciesName, filePath) {
  let source;
  if (dependciesName === 'scss' || dependciesName === 'sass') {
    const CSSHandler = require('sass');
    const result = CSSHandler.compile(filePath, { style: 'compressed' });
    source = result.css;
  } else if (dependciesName === 'less') {
    const CSSHandler = require('less');
    const result = await CSSHandler.render(fs.readFileSync(filePath, 'utf-8'), {
      compress: true,
    });
    source = result.css;
  } else if (dependciesName === 'styl' || dependciesName === 'stylus') {
    const CSSHandler = require('stylus');
    const result = CSSHandler.render(fs.readFileSync(filePath, 'utf-8'), {
      compress: true,
    });
    source = result;
  }
  return source;
}

function deleteDirectoryStack(directory) {
  const stack = [directory];

  while (stack.length > 0) {
    let files = [],
     noFile = true,
     currentFilePath = stack[stack.length - 1]

    try {
      files = fs.readdirSync(currentFilePath);
    } catch (error) {
      console.error('Error reading directory: ', error);
      continue;
    }
    for (let i = 0; i < files.length; i++) {
      const filePath = path.join(currentFilePath, files[i]);
      if (fs.lstatSync(filePath).isDirectory()) {
        stack.push(filePath);
        noFile = false;
      } else {
        fs.unlinkSync(filePath);
      }
    }
    noFile && (fs.rmdirSync(currentFilePath), stack.pop());
  }
}

export { get, set, getType, createUUID, parsePreCSS, deleteDirectoryStack };
