import path from 'path'
import fs from 'fs'
import { cwd } from 'node:process'
import { normalizePath } from 'vite'
import { ManiFest } from './manifest'
import { isJSFile, isPrepCSSFile, isVueFile } from './utils/reg'
import { deleteDirectoryStack } from './utils'
import { getType } from './utils'
import iife from './mixin/iife'
import log from './utils/logger'
import type { Plugin } from 'vite'
// import type { BrExtOptions } from './index'

export default (): Plugin => {
	let maniFest: ManiFest
	const rootPath = normalizePath(cwd() + path.sep)
	return {
		name: 'vite-plugin-br-ext',
		config(config) {
			log.logger('\n' + log.packageName + log.desc(' start....') + '\n')
			const input = config.build?.rollupOptions?.input
			if (!input) {
				log.error('input must have')
				return
			}
			// has manifest.json?
			if (
				(getType(input) === '[object Array]' &&
					!Object.values(input).includes('manifest')) ||
				(getType(input) === '[object String]' &&
					!(<string>input).includes('manifest'))
			) {
				config.build!.rollupOptions = {
					input: path.join(cwd(), './src/manifest.json')
				}
			}

			// clear outDir
			const outDir = config.build?.outDir || 'dist'
			if (fs.existsSync((config.root || rootPath) + outDir)) {
				deleteDirectoryStack((config.root || rootPath) + outDir)
			}
		},

		options(options) {
			maniFest = new ManiFest(options)
			options.input = maniFest.inputs
			return options
		},

		buildStart() {
			this.addWatchFile(maniFest.maniFestPath)
			maniFest.handlerResources(this)
		},

		transform(code, id) {
			if (
				!id.includes('node_modules') &&
				(isJSFile.test(id) || isVueFile.test(id))
			) {
				return maniFest.handlerDynamicInput(this, code, id)
			}
			return code
		},

		outputOptions(options) {
			return {
				...options,
				chunkFileNames: '[name]-[hash].js',
				assetFileNames: '[name]-[hash].[ext]',
				entryFileNames: '[name]-[hash].js',
				compact: true
			}
		},
		async generateBundle(options, bundle) {
			for (const chunk of Object.values(bundle)) {
				const resource =
					maniFest.hashTable[(chunk.name || chunk.fileName)?.split('.')[0]]

				if (chunk.type === 'chunk') {
					if (
						chunk.facadeModuleId &&
						path.extname(chunk.facadeModuleId) === '.html'
					) {
						// handler HTML
						resource.output = {
							path: chunk.facadeModuleId.replace(rootPath, '')
						}
					} else if (resource?.isEntry) {
						// handler JS
						const path = resource.attrPath.split('.')
						const preWorkName = path.find(current => maniFest.preWork[current])
						resource.output = await maniFest.preWork[preWorkName || 'default'](
							this,
							chunk,
							bundle,
							resource
						)
					} else if (chunk.fileName?.startsWith(normalizePath('dynamic/'))) {
						// handler dynamicInputJSFile
						if (isJSFile.test(chunk.fileName)) {
							await iife(this, chunk, bundle)
						}
					}
					if (chunk.code) maniFest.handerPermission(chunk.code)
				} else if (chunk.type === 'asset') {
					if (isPrepCSSFile.test(path.extname(chunk.fileName))) {
						// handler CSS
						resource.output = {
							path: (await maniFest.handlerCSS(this, chunk, bundle)) as string
						}
					} else if (
						chunk.fileName?.startsWith(normalizePath('dynamic/')) &&
						maniFest.dynamicImports.has(chunk.fileName)
					) {
						// handler dynamicInputCSSFile
						if (
							isPrepCSSFile.test(maniFest.dynamicImports.get(chunk.fileName)!)
						) {
							await maniFest.handlerCSS(this, chunk, bundle)
						}
					}
				}
			}
			maniFest.buildManifest(this)
		}
	}
}
