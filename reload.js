import path from 'path';
import { cwd } from 'process';
import { normalizePath, createServer } from 'vite';

export default async () => {
  const rootPath = normalizePath(cwd() + path.sep);
  const server = await createServer({
    configFile: false,
    root: rootPath,
    server: {
      port: 1337,
    },
  });
  await server.listen();
  return {
    name: 'vite-plugin-br-ext-reload',
    enforce: 'post',
    generateBundle(options, bundle) {
      const manifestJSON = JSON.parse(bundle['manifest.json'].source);
      const code = `
 const __debuger_socket = new WebSocket('${server.httpServer._connectionKey.replace(
   '4:',
   'ws://'
 )}', 'vite-hmr');
__debuger_socket.onmessage = payload => {
  if (payload && payload.data) {
    try {
      const { type } = JSON.parse(payload.data);
      if (type === 'br-ext:reload') {
          chrome.runtime.reload();
      }
    } catch (error) {
      console.log(error);
    }
  }
};`;
      if (manifestJSON.background && manifestJSON.background.service_worker) {
        const background = bundle[manifestJSON.background.service_worker];
        if (background) {
          const split = background.source.split(/\r\n|[\r\n\u2028\u2029]/u);
          split.splice(split.length - 3, 0, code);
          bundle[manifestJSON.background.service_worker].source =
            split.join('\n');
        }
      } else {
        const referenceId = this.emitFile({
          type: 'asset',
          source: `
(function () {
  'use strict';
    ${code}
})();
          
        `,
          fileName: 'debugger.js',
        });
        manifestJSON.background = {
          service_worker: this.getFileName(referenceId),
        };
        bundle['manifest.json'].source = JSON.stringify(manifestJSON, null, 2);
      }
    },
    closeBundle() {
      // server.printUrls();
      server.ws.send({ type: 'br-ext:reload' });
    },
  };
};
