import { describe, test, expect } from 'vitest'
import { build } from 'vite'
import path from 'path'
import bex from '../index'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import type { OutputAsset, RollupOutput } from 'rollup'

describe('Chrome V3 Normalize Lint', () => {
	const root = path.resolve(__dirname, './example/input')

	test('build', async () => {
		const { output } = <RollupOutput>await build({
			root: root,
			base: './example/input',
			// @ts-ignore
			plugins: [vue(), bex()],
			build: {
				rollupOptions: {
					input: `${root}/manifest.json`
				}
			}
		})
		expect(output).toHaveLength(6)
		expect(() => {
			const manifest_output = output.find(
				item => item.fileName === 'manifest.json'
			)
			const dynamic = output.filter(item => item.fileName.includes('dynamic'))
			if (!manifest_output) throw Error('Not Found manifest.json')
			if (dynamic.length !== 2) throw Error('Not Found dynamic file')
			try {
				// @ts-ignore
				const json = JSON.parse(manifest_output.source)
				//检查各文件是否存在、manifest 里路径是否匹配
				const lintFileList = {
					background: output.find(
						item => item.fileName === json.background.service_worker
					),
					content_scripts_js: output.find(
						item => item.fileName === json.content_scripts[0].js[0]
					),
					content_scripts_css: output.find(
						item => item.fileName === json.content_scripts[0].css[0]
					)
				}
				Object.keys(lintFileList).forEach(key => {
					if (!lintFileList[key]) {
						throw Error(`manifest.json: Not Found ${key} File`)
					}
					if (
						!fs.existsSync(
							path.normalize(`${root}/dist/${lintFileList[key].fileName}`)
						)
					) {
						throw Error(`Not Found ${key} File`)
					}
				})
				// 检查权限提取是否正确
				expect(json.permissions)
					.include('tabs')
					.include('bookmarks')
					.include('scripting')
			} catch (error) {
				throw Error(error)
			}
		}).not.toThrowError()
	})
})

describe('precss lint', () => {
	const root = path.resolve(__dirname, './example/input')

	test('build', async () => {
		const { output } = <RollupOutput>await build({
			root: root,
			base: './example/input',
			// @ts-ignore
			plugins: [vue(), bex()],
			build: {
				rollupOptions: {
					input: `${root}/manifest-precss.json`
				}
			}
		})
		const css = <OutputAsset[]>(
			output.filter(file => file.fileName.endsWith('.css'))
		)
		expect(css.length).toMatchSnapshot()

		css.forEach(file => expect(file.source).toMatchSnapshot())
	})
})

// describe('reload Lint', () => {
// 	const root = path.resolve(__dirname, './example/input')

// 	test('build', async () => {
// 		const { output } = <RollupOutput>await build({
// 			root: root,
// 			base: './example/input',
// 			// @ts-ignore
// 			plugins: [
// 				vue(),
// 				bex({
// 					mode: 'development',
// 					reload: {
// 						browser:
// 							'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
// 					}
// 				})
// 			],
// 			build: {
// 				rollupOptions: {
// 					input: `${root}/manifest.json`
// 				}
// 			}
// 		})
// 		expect(output).toHaveLength(6)
// 		expect(() => {
// 			const manifest_output = output.find(
// 				item => item.fileName === 'manifest.json'
// 			)
// 			const dynamic = output.filter(item => item.fileName.includes('dynamic'))
// 			if (!manifest_output) throw Error('Not Found manifest.json')
// 			if (dynamic.length !== 2) throw Error('Not Found dynamic file')
// 			try {
// 				// @ts-ignore
// 				const json = JSON.parse(manifest_output.source)
// 				//检查各文件是否存在、manifest 里路径是否匹配
// 				const lintFileList = {
// 					background: output.find(
// 						item => item.fileName === json.background.service_worker
// 					),
// 					content_scripts_js: output.find(
// 						item => item.fileName === json.content_scripts[0].js[0]
// 					),
// 					content_scripts_css: output.find(
// 						item => item.fileName === json.content_scripts[0].css[0]
// 					)
// 				}
// 				Object.keys(lintFileList).forEach(key => {
// 					if (!lintFileList[key]) {
// 						throw Error(`manifest.json: Not Found ${key} File`)
// 					}
// 					if (
// 						!fs.existsSync(
// 							path.normalize(`${root}/dist/${lintFileList[key].fileName}`)
// 						)
// 					) {
// 						throw Error(`Not Found ${key} File`)
// 					}
// 				})
// 				// 检查权限提取是否正确
// 				expect(json.permissions)
// 					.include('tabs')
// 					.include('bookmarks')
// 					.include('scripting')
// 			} catch (error) {
// 				throw Error(error)
// 			}
// 		}).not.toThrowError()
// 	})
// })
