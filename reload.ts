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
		async closeBundle() {
			if (isFirst && reload) {
				const extensions: string[] = [
					path.resolve(__dirname, './chrome-extension-auto-reload/app'),
					path.resolve(root, outDir)
				]
				chromeFlags.push(`--load-extension=${extensions.join(',')}`)
				browserInstance = await launch({
					chromeFlags,
					ignoreDefaultFlags: true,
					chromePath: reload.browser ?? getChromePath()
				})
				browserInstance.process.once('close', () => {
					io.close()
					browserInstance.kill()
				})

				isFirst = false
			}
			io.emit('change')
		}
	}
}
