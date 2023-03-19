import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { babel } from '@rollup/plugin-babel'
import sucrase from '@rollup/plugin-sucrase'
import packageJSON from './package.json' assert { type: 'json' }

export default {
	input: 'index.ts',
	external: [
		'rollup',
		'vite',
		'path',
		'fs',
		'process',
		'os',
		'tty',
		'node:tty',
		'node:process',
		'node:os',
		'util',
		'events',
		'assert',
		'zlib',
		'url',
		'http',
		'crypto',
		'https',
		'stream',
		'tls',
		'querystring',
		'net',
		'timers',
		'sass',
		'less',
		'stylus'
	].concat(Object.keys(packageJSON.dependencies)),
	output: [
		{
			file: 'dist/index.mjs',
			format: 'es',
			name: 'bex',
			sourcemap: 'inline'
		},
		{
			file: 'dist/index.cjs',
			format: 'cjs',
			name: 'bex',
			sourcemap: 'inline'
		}
	],
	plugins: [
		json(),
		resolve({
			extensions: ['.js', '.ts'],
			exportConditions: ['node'], // add node option here,
			preferBuiltins: false
		}),
		sucrase({
			exclude: ['node_modules/**'],
			transforms: ['typescript']
		}),
		commonjs(),
		babel({
			babelHelpers: 'bundled',
			exclude: 'node_modules/'
		})
	]
}
