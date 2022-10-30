import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import test from './plugin/test';
import { resolve } from 'path';
// import Inspect from 'vite-plugin-inspect';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // console.log(command,mode, IS_PROD);
  return {
    plugins: [
      // Inspect({ outputDir: '.vite-inspect' ,build: true}),
      // vueJsx({ optimize: true, transformOn: true }),
      vue(),
      // legacy({
      //   targets: ['defaults', 'not IE 11'],
      // }),
      test(),
    ],
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'src/manifest.json'),
      },
    },
  };
});
