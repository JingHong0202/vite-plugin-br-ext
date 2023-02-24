import fs from 'fs'
import path from 'path'
import log from './logger'

function get(target: any, attr: string | number) {
  return typeof attr === 'string'
    ? attr.split('.').reduce((accumulator, attr) => {
        return accumulator[attr]
      }, target)
    : target[attr]
}

function set(target: any, attr: string | number, value: any) {
  return typeof attr === 'string'
    ? attr.split('.').reduce((accumulator, attr, index, self) => {
        if (self.length - 1 === index) {
          accumulator[attr] = value
        }
        return accumulator[attr]
      }, target)
    : (target[attr] = value)
}

function getType<T>(target: T) {
  return Object.prototype.toString.call(target)
}

function createUUID() {
  return Number(Math.random().toString().substr(2)).toString(36)
}
async function parsePreCSS(dependciesName: string, filePath: string) {
  /* eslint-disable */
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
  /* eslint-enable */
}

function deleteDirectoryStack(directory: string) {
  const stack = [directory]

  while (stack.length > 0) {
    let files = [],
      noFile = true
    const currentFilePath = stack[stack.length - 1]

    try {
      files = fs.readdirSync(currentFilePath)
    } catch (error) {
      log.error('Error reading directory: ' + String(error))
      continue
    }
    for (let i = 0; i < files.length; i++) {
      const filePath = path.join(currentFilePath, files[i])
      if (fs.lstatSync(filePath).isDirectory()) {
        stack.push(filePath)
        noFile = false
      } else {
        fs.unlinkSync(filePath)
      }
    }
    noFile && (fs.rmdirSync(currentFilePath), stack.pop())
  }
}

export { get, set, getType, createUUID, parsePreCSS, deleteDirectoryStack }
