import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import sucrase from '@rollup/plugin-sucrase';

export default {
  input: 'index.ts',
  external: ['rollup', 'vite'],
  output: [
    {
      file: 'dist/index.mjs',
      format: 'es',
      name: 'bex',
      sourcemap: 'inline',
      globals: {
        vite: 'vite',
        rollup: 'rollup',
        path: 'path',
        fs: 'fs',
        process: 'process',
        os: 'os',
        tty: 'tty',
      },
    },
     {
      file: 'dist/index.cjs',
      format: 'cjs',
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
        tty: 'tty',
      },
    },
  ],
  plugins: [
    json(),
    resolve({
      extensions: ['.js', '.ts'],
      exportConditions: ['node'], // add node option here,
      preferBuiltins: false,
    }),
    sucrase({ exclude: ['node_modules/**'], transforms: ['typescript'] }),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/',
    }),
  ],
};
