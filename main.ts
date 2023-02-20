import path from 'path';
import fs from 'fs';
import { cwd } from 'process';
import { normalizePath,Plugin } from 'vite';
import { ManiFest } from './manifest';
import { isPrepCSSFile } from './utils/reg';
import { deleteDirectoryStack } from './utils';
import { InputOptions, OutputAsset } from 'rollup';

export default (): Plugin => {
  let maniFest: ManiFest;

  const rootPath = normalizePath(cwd() + path.sep);

  return {
    name: 'vite-plugin-br-ext',

    config(config) {
      // default
      if (
        config.build?.rollupOptions?.input !== 'manifest.json' ||
        !Object.values(config.build?.rollupOptions?.input!).includes(
          'manifest.json'
        )
      ) {
        config.build = {
          rollupOptions: { input: path.join(cwd(), './src/manifest.json') },
        };
        // console.log(config);
      }

      const outDir = config.build.outDir || 'dist';
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
      // console.log(bundle);
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
          // console.log(chunk.facadeModuleId, normalizePath(cwd()));
        } else if (resource && resource.isEntry) {
          // handler JS
          const path = resource.attrPath.split('.');
          const preWorkName = path.find(current => maniFest.preWork[current]);
          // console.log(maniFest.preWork[preWorkName]);
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
