import { rollup } from 'rollup';
import { dirname, join } from 'path';

export default async function mixinChunksForIIFE(plugin, chunk, bundle) {
  // 使用rollup.rollup对js进行打包为iife，由于还没生成dist需要插件根据bundle获取到当前的chunk内容
  // console.log('\n', chunk.fileName);

  const bd = await rollup({
    input: chunk.fileName,
    plugins: [replaceChunk(bundle)],
  });

  // 生成新的bundle
  const { output: outputs } = await bd.generate({
    format: 'iife'
  });
  // console.log(outputs);
  // 只能有唯一的输出
  if (outputs.length < 1) {
    throw new Error('mix content no exits.');
  } else if (outputs.length > 1) {
    throw new Error(
      'mix content script chunks error: output must contain only one chunk.'
    );
  }
  // 增加输出文件(iife格式的js文件)
  const outputChunk = outputs[0];
  // console.log(outputChunk);
  const referenceId = plugin.emitFile({
    type: 'asset',
    source: outputChunk.code,
    fileName: chunk.fileName,
  });
  // console.log(plugin.getFileName(referenceId));
  return plugin.getFileName(referenceId);
}

function replaceChunk(bundle) {
  return {
    name: 'rollup-plugin-replace-chunk',
    resolveId(source, importer) {
      try {
        if (typeof importer === 'undefined') {
          return source;
        } else {
          const dir = dirname(importer);
          const resolved = join(dir, source);
          // console.log('vf:', resolved);
          return resolved in bundle ? resolved : false;
        }
      } catch (error) {
        console.log('resolveId', error);
        return null;
      }
    },
    load(id) {
      const chunk = bundle[id];
      // console.log('\n', chunk);

      if (chunk) {
        // remove chunk from bundle

        if (
          Object.values(bundle).filter(
            c => c.type === 'chunk' && c.imports.includes(chunk.fileName)
          ).length < 1
        ) {
          delete bundle[id];
        }

        return {
          code: chunk.code || chunk.source,
          map: chunk.map,
        };
      } else {
        return null;
      }
    },
  };
}
