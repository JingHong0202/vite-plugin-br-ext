import fs from 'fs';
import path from 'path';
import { cwd } from 'process';
import { normalizePath } from 'vite';
import { ManiFest } from './class/manifest';
import { isPrepCSSFile } from './utils/reg';
import { match } from './utils/permission';

export default () => {
  let maniFest;
  const rootPath = normalizePath(cwd() + path.sep);

  return {
    name: 'vite-chrome-extension',

    // config(config, { command }) {},

    // // 2. vite 独有的钩子：在解析 vite 配置后调用。使用这个钩子读取和存储最终解析的配置。当插件需要根据运行的命令做一些不同的事情时，它很有用。
    // configResolved(resolvedConfig) {},

    // // 4. vite 独有的钩子：主要用来配置开发服务器，为 dev-server (connect 应用程序) 添加自定义的中间件
    // configureServer(server) {},

    // // 18的前面. vite 独有的钩子：转换 index.html 的专用钩子。钩子接收当前的 HTML 字符串和转换上下文
    // transformIndexHtml(html) {},

    // // vite 独有的钩子: 执行自定义HMR更新，可以通过ws往客户端发送自定义的事件
    // handleHotUpdate({ file, server }) {},

    // 3. 构建阶段的通用钩子：在服务器启动时被调用：获取、操纵Rollup选项
    options: async options => {
      maniFest = new ManiFest(options);
      options.input = maniFest.inputs;

      return options;
    },
    // renderStart(outputOptions, inputOptions) {
    //   console.log(outputOptions,inputOptions);
    // },

    // 5. 构建阶段的通用钩子：在服务器启动时被调用：每次开始构建时调用
    async buildStart() {
      maniFest.handlerResources(this);
      // await maniFest.handlerResources(this);
      return null;
    },

    // // 构建阶段的通用钩子：在每个传入模块请求时被调用：创建自定义确认函数，可以用来定位第三方依赖
    // resolveId(source, importer, options) {},

    // // 构建阶段的通用钩子：在每个传入模块请求时被调用：可以自定义加载器，可用来返回自定义的内容
    // load(id) {
    //   // console.log(id);
    // },

    // // 构建阶段的通用钩子：在每个传入模块请求时被调用：在每个传入模块请求时被调用，主要是用来转换单个模块
    transform(code, id) {
      if (!id.includes('node_modules')) {
        maniFest.permission = [
          ...new Set(maniFest.permission.concat(match(code))),
        ];
      }
    },

    // // 构建阶段的通用钩子：在构建结束后被调用，此处构建只是代表所有模块转义完成
    // buildEnd() {},

    // // 输出阶段钩子通用钩子：接受输出参数
    outputOptions(options) {
      return {
        ...options,
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        entryFileNames: '[name]-[hash].js',
      };
    },
    // // 输出阶段钩子通用钩子：每次bundle.generate 和 bundle.write调用时都会被触发。
    // renderStart(outputOptions, inputOptions) {},

    // // 输出阶段钩子通用钩子：用来给chunk增加hash
    // augmentChunkHash(chunkInfo) {
    //   return "111"
    // },

    // // 输出阶段钩子通用钩子：转译单个的chunk时触发。rollup输出每一个chunk文件的时候都会调用。
    // renderChunk(code, chunk, options) {
    //   return null;
    // },

    // // 输出阶段钩子通用钩子：在调用 bundle.write 之前立即触发这个hook
    async generateBundle(options, bundle, isWrite) {
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
        }
      }
      maniFest.buildManifest(this);
    },

    // // 输出阶段钩子通用钩子：在调用 bundle.write后，所有的chunk都写入文件后，最后会调用一次 writeBundle
    // writeBundle(options, bundle) {},
    // // 通用钩子：在服务器关闭时被调用
    // closeBundle() {},
  };
};
