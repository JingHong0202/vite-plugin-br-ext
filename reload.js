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
  let pingTimer = null;
  await server.listen();
  return {
    name: 'vite-plugin-br-ext-reload',
    enforce: 'post',
    generateBundle(options, bundle) {
      const manifestJSON = JSON.parse(bundle['manifest.json'].source);
      const code = `

(function() {

// ----------------
// websocket reload
// ----------------
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
      } else {
        console.log(new Date())
      }
    } catch (error) {
      console.log(error);
    }
  }
};

// -----------------
// ping service_worker
// -----------------
  const INTERNAL_STAYALIVE_PORT = "CT_Internal_port_alive"
  var __debug_alivePort = null;

  const __debug_seconds = 1000;
  var __debug_lastCall = Date.now();
  var __debug_isFirstStart = true;
  var __debug_timer = 4*__debug_seconds;
  // -------------------------------------------------------
  var __debug_wakeup = setInterval(__debug_highlander, __debug_timer);
  // -------------------------------------------------------
      
  async function __debug_highlander() {

      const now = Date.now();
      const age = now - __debug_lastCall;
      
      console.log(\`(DEBUG __debug_highlander) ------------- time elapsed from first start: \$\{__debug_convert_no_date(
        age
      )\}\`)
      if (__debug_alivePort == null) {
          __debug_alivePort = chrome.runtime.connect({name:INTERNAL_STAYALIVE_PORT})

          __debug_alivePort.onDisconnect.addListener( (p) => {
              if (chrome.runtime.lastError){
                  console.log("(DEBUG __debug_highlander) Expected disconnect (on error). SW should be still running.");
              } else {
                  console.log("(DEBUG __debug_highlander): port disconnected");
              }

              __debug_alivePort = null;
          });
      }

      if (__debug_alivePort) {
                      
          __debug_alivePort.postMessage({content: "ping"});
          
          if (chrome.runtime.lastError) {                              
              console.log(\`(DEBUG __debug_highlander): postMessage error: \$\{
                chrome.runtime.lastError.message
              \}\`)                
          } else {                               
              console.log(\`(DEBUG __debug_highlander): "ping" sent through \$\{
                __debug_alivePort.name
              \} port\`)
          }            
      }         
      //__debug_lastCall = Date.now();
      if (__debug_isFirstStart) {
          __debug_isFirstStart = false;
          clearInterval(__debug_wakeup);
          __debug_timer = 270*__debug_seconds;
          __debug_wakeup = setInterval(__debug_highlander, __debug_timer);
      }        
  }

  function __debug_convert_no_date(long) {
      var dt = new Date(long).toISOString()
      return dt.slice(-13, -5) // HH:MM:SS only
  }
})()
`;
      if (manifestJSON.background && manifestJSON.background.service_worker) {
        const background = bundle[manifestJSON.background.service_worker];
        if (background) {
          if (manifestJSON.background.type !== 'module') {
            const split = background.source.split(/\r\n|[\r\n\u2028\u2029]/u);
            split.splice(split.length - 3, 0, code);
            bundle[manifestJSON.background.service_worker].source =
              split.join('\n');
          } else {
            bundle[manifestJSON.background.service_worker].code += code;
          }
        }
      } else {
        const referenceId = this.emitFile({
          type: 'asset',
          source: code,
          fileName: 'development.js',
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

      pingTimer && clearInterval(pingTimer);
      pingTimer = setInterval(() => {
        server.ws.send({ type: 'br-ext:ping' });
      }, 10000);
    },
  };
};
