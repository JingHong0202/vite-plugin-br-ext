import fs from 'fs';
import path from 'path';
import { cwd } from 'process';
import { ManiFest } from './class/manifest';

export default () => {
  let maniFest, srcDir;
  return {
    name: 'vite-plugin-test',

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

    // // 5. 构建阶段的通用钩子：在服务器启动时被调用：每次开始构建时调用
    // buildStart(options) {
    //   // let { action } = parse;
    //   // this.addWatchFile(path.join(cwd(), 'src', action.default_popup));
    // },

    // // 构建阶段的通用钩子：在每个传入模块请求时被调用：创建自定义确认函数，可以用来定位第三方依赖
    // resolveId(source, importer, options) {},

    // // 构建阶段的通用钩子：在每个传入模块请求时被调用：可以自定义加载器，可用来返回自定义的内容
    // load(id) {
    //   // console.log(id);
    // },

    // // 构建阶段的通用钩子：在每个传入模块请求时被调用：在每个传入模块请求时被调用，主要是用来转换单个模块
    // transform(code, id) {
    //   // console.log(id);
    // },

    // // 构建阶段的通用钩子：在构建结束后被调用，此处构建只是代表所有模块转义完成
    // buildEnd() {},

    // // 输出阶段钩子通用钩子：接受输出参数
    // outputOptions(options) {
    //   return {
    //     ...options,
    //     chunkFileNames: 'assets/[name].[hash].js',
    //     assetFileNames: 'assets/[name].[hash].[ext]',
    //     entryFileNames: '[name].js',
    //   };
    // },
    // // 输出阶段钩子通用钩子：每次bundle.generate 和 bundle.write调用时都会被触发。
    // renderStart(outputOptions, inputOptions) {},

    // // 输出阶段钩子通用钩子：用来给chunk增加hash
    // augmentChunkHash(chunkInfo) {},

    // // 输出阶段钩子通用钩子：转译单个的chunk时触发。rollup输出每一个chunk文件的时候都会调用。
    // renderChunk(code, chunk, options) {
    //   return null;
    // },

    // // 输出阶段钩子通用钩子：在调用 bundle.write 之前立即触发这个hook
    generateBundle(options, bundle, isWrite) {
      // Object.values(bundle).forEach(chunk => {
      //   const attrs = maniFest.attrHashMap[chunk.name].split('.');
      //   maniFest.result[attrs[0]] = maniFest[attrs[0]].parsed;
      //   // handler HTML
      //   if (
      //     chunk.facadeModuleId &&
      //     path.extname(chunk.facadeModuleId) === '.html'
      //   ) {
      //     maniFest[attrs[0]].parsed[attrs[1]] = chunk.facadeModuleId.replace(
      //       cwd() + path.sep,
      //       ''
      //     );
      //   } else {
      //     // handler JS
      //     maniFest[attrs[0]].parsed[attrs[1]] = chunk.fileName;
      //   }
      // });
      // // console.log(maniFest);
      // this.emitFile({
      //   source: JSON.stringify(maniFest.result, null, 4),
      //   fileName: 'manifest.json',
      //   type: 'asset',
      // });
    },

    // // 输出阶段钩子通用钩子：在调用 bundle.write后，所有的chunk都写入文件后，最后会调用一次 writeBundle
    writeBundle(options, bundle) {},
    // // 通用钩子：在服务器关闭时被调用
    // closeBundle() {},
  };
};
