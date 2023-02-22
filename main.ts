import path from 'path';
import fs from 'fs';
import { cwd } from 'node:process';
import { normalizePath, Plugin } from 'vite';
import { ManiFest } from './manifest';
import { isPrepCSSFile } from './utils/reg';
import { deleteDirectoryStack } from './utils';
import { InputOptions, OutputAsset } from 'rollup';
import { getType } from './utils';
import log from './utils/logger';

export default (): Plugin => {
  let maniFest: ManiFest;

  const rootPath = normalizePath(cwd() + path.sep);

  return {
    name: 'vite-plugin-br-ext',
    config(config) {
      log.logger('\n' + log.packageName + log.desc(' start') + '\n');
      const input = config.build?.rollupOptions?.input;
      const setDefaultVal = () => {
        config.build!.rollupOptions = {
          input: path.join(cwd(), './src/manifest.json'),
        };
      };
      if (!input) {
        log.error('input must have');
        return;
      }
      // has manifest.json?
      if (
        (getType(input!) === '[object Array]' &&
          !Object.values(input!).includes('manifest.json')) ||
        (getType(input!) === '[object String]' &&
          !(<string>input).includes('manifest.json'))
      ) {
        setDefaultVal();
      }

      // clear outDir
      const outDir = config.build?.outDir || 'dist';
      if (fs.existsSync(rootPath + outDir)) {
        deleteDirectoryStack(rootPath + outDir);
      }
    },

    options(options) {
      maniFest = new ManiFest(<InputOptions>options);
      options.input = maniFest.inputs;
      return options;
    },

    async buildStart() {
      this.addWatchFile(maniFest.maniFestPath);
      maniFest.handlerResources(this);
    },

    async transform(code, id) {
      if (!id.includes('node_modules')) {
        return (await maniFest.handlerDynamicInput(this, code, id)) as string;
      }
      return code;
    },

    outputOptions(options) {
      return {
        ...options,
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]',
        entryFileNames: '[name]-[hash].js',
        compact: true,
      };
    },

    async generateBundle(options, bundle, isWrite) {
      for (const chunk of Object.values(bundle)) {
        const resource =
          maniFest.hashTable[(chunk.name || chunk.fileName)?.split('.')[0]];
        // handler HTML
        if (
          chunk.type === 'chunk' &&
          chunk.facadeModuleId &&
          path.extname(chunk.facadeModuleId) === '.html'
        ) {
          resource.output = {
            path: chunk.facadeModuleId.replace(rootPath, ''),
          };
        } else if (resource && resource.isEntry) {
          // handler JS
          const path = resource.attrPath.split('.');
          const preWorkName = path.find(current => maniFest.preWork[current]);
          resource.output = <typeof resource.output>{
            path: preWorkName
              ? await maniFest.preWork[preWorkName](
                  this,
                  chunk,
                  bundle,
                  resource
                )
              : chunk.fileName,
          };
        } else if (isPrepCSSFile.test(path.extname(chunk.fileName))) {
          // handler CSS
          resource.output = {
            path: await maniFest.handlerCSS(this, chunk as OutputAsset, bundle),
          };
        } else if (
          chunk.type === 'chunk' &&
          chunk.fileName &&
          chunk.fileName.startsWith(normalizePath('dynamic/'))
        ) {
          // handler dynamicInputJSFile
          await maniFest.preWork.toIIFE(this, chunk, bundle);
        } else if (
          chunk.type === 'asset' &&
          chunk.fileName &&
          chunk.fileName.startsWith(normalizePath('dynamic/')) &&
          maniFest.dynamicImports.has(chunk.fileName)
        ) {
          // handler dynamicInputCSSFile
          // chunk.fileName = maniFest.dynamicImports.get(chunk.fileName);
          await maniFest.handlerCSS(this, chunk, bundle);
        }

        // other
        if (chunk.type === 'chunk') {
          // 提取权限
          if (chunk.code) maniFest.handerPermission(chunk.code);
        }
      }
      maniFest.buildManifest(this);
    },
  };
};
