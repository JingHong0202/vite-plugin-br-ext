import path from 'path';
import { cwd } from 'process';
import { normalizePath } from 'vite';
import { ManiFest } from './class/manifest';
import { isPrepCSSFile } from './utils/reg';

export default () => {
  let maniFest;
  const rootPath = normalizePath(cwd() + path.sep);

  return {
    name: 'vite-chrome-extension',

    options: async options => {
      maniFest = new ManiFest(options);
      options.input = maniFest.inputs;
      return options;
    },

    // 5. 构建阶段的通用钩子：在服务器启动时被调用：每次开始构建时调用
    async buildStart() {
      maniFest.handlerResources(this);
      // await maniFest.handlerResources(this);
      return null;
    },

    // // 构建阶段的通用钩子：在每个传入模块请求时被调用：在每个传入模块请求时被调用，主要是用来转换单个模块
    async transform(code, id) {
      if (!id.includes('node_modules')) {
        const newCode = await maniFest.handlerDynamicInput(this, code, id);
        return newCode;
      }
    },

    // // 输出阶段钩子通用钩子：接受输出参数
    outputOptions(options) {
      return {
        ...options,
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        entryFileNames: '[name]-[hash].js',
      };
    },

    // // 输出阶段钩子通用钩子：在调用 bundle.write 之前立即触发这个hook
    async generateBundle(options, bundle, isWrite) {
      // console.log(bundle);
      for (const chunk of Object.values(bundle)) {
        const resource =
          maniFest.hashTable[(chunk.name || chunk.fileName)?.split('.')[0]];
        // handler HTML
        if (
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
          resource.output = {
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
            path: await maniFest.handlerCSS(this, chunk, bundle),
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
