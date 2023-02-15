import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';

export default {
  input: 'index.js',
  external: ['rollup', 'vite'],
  output: [
    {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'bex',
      sourcemap: 'inline',
      globals: {
        vite: 'vite',
        rollup: 'rollup',
      },
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    json(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/',
    })
  ],
};
