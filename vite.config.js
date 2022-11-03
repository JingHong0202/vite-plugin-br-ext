import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import crx3 from './plugin/vite-chrome-extension';
import { join } from 'path';
import { cwd } from 'process';

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
      crx3(),
    ],
    build: {
      rollupOptions: {
        input: join(cwd(), './src/manifest.json'),
      },
    },
  };
});
