import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import sucrase from '@rollup/plugin-sucrase';

export default {
  input: 'index.ts',
  external: ['rollup', 'vite', 'glob'],
  output: [
    {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'bex',
      sourcemap: 'inline',
      globals: {
        vite: 'vite',
        rollup: 'rollup',
        path: 'path',
        fs: 'fs',
        process: 'process',
        glob: 'glob',
        os: 'os',
        tty: 'tty'
      },
    },
  ],
  plugins: [
    resolve({ extensions: ['.js', '.ts'] }),
    sucrase({ exclude: ['node_modules/**'], transforms: ['typescript'] }),
    commonjs(),
    json(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/',
    }),
  ],
};
