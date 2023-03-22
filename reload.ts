import { Server } from 'socket.io'
import type { Plugin } from 'vite'
import {
	LaunchedChrome,
	Launcher,
	launch,
	getChromePath
} from 'chrome-launcher'
import type { BrExtOptions } from './index'
import path from 'path'
import log from './utils/logger'
import type { OutputBundle, OutputAsset, PluginContext } from 'rollup'
import fs from 'fs'

const EXCLUDED_CHROME_FLAGS = ['--disable-extensions', '--mute-audio']
const DEFAULT_CHROME_FLAGS = Launcher.defaultFlags().filter(
	flag => !EXCLUDED_CHROME_FLAGS.includes(flag)
)
const chromeFlags: string[] = [...DEFAULT_CHROME_FLAGS]

export default (options: BrExtOptions): Plugin => {
	const io = new Server(8890, {
			cors: {
				origin: '*',
				credentials: true,
				allowedHeaders: '*'
			}
		}),
		{ reload } = options

	let outDir: string,
		root: string,
		isFirst = true,
		browserInstance: LaunchedChrome

	return {
		name: 'vite-plugin-br-ext-reload',
		enforce: 'post',
		config(option) {
			outDir = option.build?.outDir ?? 'dist'
			root = option.root ?? ''
		},

		generateBundle(options, bundle) {
			insertDebugCode(this, bundle)
		},

		async closeBundle() {
			if (isFirst && reload) {
				const extensions: string[] = [
					reloadExtensions() as string,
					path.resolve(root, outDir)
				]
				chromeFlags.push(`--load-extension=${extensions.join(',')}`)
				browserInstance = await launch({
					chromeFlags,
					port: reload.port,
					ignoreDefaultFlags: true,
					chromePath: reload.browser ?? getChromePath()
				})
				browserInstance.process.once('close', () => {
					io.close()
					browserInstance.kill()
				})
				isFirst = false
			}
			if (io.emit('change')) {
				log.primary('extension reload success!', false)
			} else {
				log.error('extension reload error!')
			}
		}
	}
}

function reloadExtensions(
	extensionUrl: string = __dirname,
	maxDeep = 3
): string | undefined {
	const currentDir = fs.readdirSync(extensionUrl)
	const find = currentDir.some(url => url.includes('chrome-extension-reload'))
	if (find) {
		return path.resolve(extensionUrl, './chrome-extension-reload/app')
	} else if (maxDeep !== 0) {
		const split = extensionUrl.split(path.sep)
		if (split.length >= maxDeep)
			return reloadExtensions(
				split.slice(0, split.length - 1).join(path.sep),
				--maxDeep
			)
	}
	log.error('chrome-extension-reload Not Found!')
}

function insertDebugCode(plugin: PluginContext, bundle: OutputBundle) {
	const manifest = bundle['manifest.json'] as OutputAsset
	if (!manifest) {
		log.error('manifest.json Not exists!')
	}

	const code = `\n\r(function(){chrome.runtime.onMessageExternal.addListener((message) => {if (message && message.type === 'reload') {chrome.runtime.reload()}})})()\n\r`

	try {
		const json = JSON.parse(manifest.source as string)
		if (!json.background?.service_worker) {
			plugin.emitFile({
				type: 'asset',
				fileName: 'debugger.js',
				source: code
			})
			json.background = {
				service_worker: 'debugger.js'
			}
			manifest.source = JSON.stringify(json)
		} else {
			const asset = bundle[json.background.service_worker] as OutputAsset
			asset.source = <string>asset.source + code
		}
	} catch (error) {
		log.error(String(error))
	}
}
