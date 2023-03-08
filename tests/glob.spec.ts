import { describe, test, expect } from 'vitest'
import { ManiFest } from '../manifest'
import { InputOptions, OutputAsset } from 'rollup'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import path from 'path'
import type { RollupOutput } from 'rollup'
import { build } from 'vite'
import bex from '../index'
import vue from '@vitejs/plugin-vue'

describe('match', () => {
	test('parse', () => {
		const options: InputOptions = {
			input: resolve(__dirname, './example/glob/manifest.json')
		}
		let manifest: ManiFest = new ManiFest(options)
		expect(Object.values(manifest.hashTable)).toHaveLength(3)
		expect(() => {
			Object.values(manifest.hashTable).forEach(item => {
				if (!existsSync(item.absolutePath))
					throw Error(`${item.absolutePath} Not Found`)
			})
		}).not.toThrowError()
		expect(Object.values(manifest.inputs)).toHaveLength(2)
		console.log(manifest)
	})

	test('deep', () => {
		const options: InputOptions = {
			input: resolve(__dirname, './example/glob/manifest-deep.json')
		}
		let manifest: ManiFest = new ManiFest(options)
		expect(Object.values(manifest.hashTable)).toHaveLength(5)
		expect(() => {
			Object.values(manifest.hashTable).forEach(item => {
				if (!existsSync(item.absolutePath))
					throw Error(`${item.absolutePath} Not Found`)
			})
		}).not.toThrowError()
		expect(Object.values(manifest.inputs)).toHaveLength(4)
		console.log(manifest)
	})
})

describe('output', () => {
	test('suffix lint', async () => {
		const root = path.resolve(__dirname, './example/glob')

		const { output } = <RollupOutput>await build({
			root: root,
			base: './example/glob',
			// @ts-ignore
			plugins: [vue(), bex()],
			build: {
				rollupOptions: {
					input: `${root}/manifest-deep.json`
				}
			}
		})

		expect(() => {
			output.forEach(item => {
				if (/\.((tsx?)|([ls][eca]ss)|(styl))$/.test(item.fileName)) {
					throw Error(`${item.fileName}: suffix error`)
				}
			})
		}).not.toThrowError()
	})

	test('web_resource', async () => {
		const root = path.resolve(__dirname, './example/glob')

		const { output } = <RollupOutput>await build({
			root: root,
			base: './example/glob',
			// @ts-ignore
			plugins: [vue(), bex()],
			build: {
				rollupOptions: {
					input: `${root}/manifest-web-resource.json`
				}
			}
		})
		const manifest_output = <OutputAsset>(
			output.find(item => item.fileName === 'manifest.json')
		)
		expect(manifest_output).not.toBeUndefined()

		expect(() => {
			try {
				const json = JSON.parse(<string>manifest_output.source),
					web_resources: string[] =
						json['web_accessible_resources'][0].resources,
					contentJS: string[] = json['content_scripts'][0].js

				expect(
					contentJS.every(name =>
						output
							.filter(item => /\.jsx?$/.test(item.fileName))
							.map(item => item.fileName)
							.find(item => item === name)
					)
				).toBe(true)
				expect(json['content_scripts'][0].css).toBeUndefined()

				expect(web_resources.slice(0, 2)).toEqual([
					'web_resource/js/*',
					'web_resource/css/*'
				])
				;(['web_resource/js', 'web_resource/css'] as string[]).forEach(str => {
					const filter = output.filter(item => item.fileName.includes(str))
					filter.forEach(item => {
						if (
							!existsSync(
								path.resolve(
									path.normalize(__dirname + '/example/glob/dist/'),
									item.fileName
								)
							)
						)
							throw Error(`${item.fileName} Not Found`)
					})
				})

				expect(web_resources.slice(2)).toEqual(['css/style-1.css'])
			} catch (error) {
				throw Error(error)
			}
		}).not.toThrowError()
	})

	test('manifest format lint', async () => {
		const root = path.resolve(__dirname, './example/glob')

		const { output } = <RollupOutput>await build({
			root: root,
			base: './example/glob',
			// @ts-ignore
			plugins: [vue(), bex()],
			build: {
				rollupOptions: {
					input: `${root}/manifest-deep.json`
				}
			}
		})
		const manifest_output = <OutputAsset>(
			output.find(item => item.fileName === 'manifest.json')
		)
		expect(manifest_output).not.toBeUndefined()

		expect(() => {
			try {
				const json = JSON.parse(<string>manifest_output.source),
					contentJS: string[] = json['content_scripts'][0].js,
					contentCSS: string[] = json['content_scripts'][0].css

				expect(
					contentJS.every(name =>
						output
							.filter(item => /\.jsx?$/.test(item.fileName))
							.map(item => item.fileName)
							.find(item => item === name)
					)
				).toBe(true)
				expect(
					contentCSS.every(name =>
						output
							.filter(item => /\.css$/.test(item.fileName))
							.map(item => item.fileName)
							.find(item => item === name)
					)
				).toBe(true)
			} catch (error) {
				throw Error(error)
			}
		}).not.toThrowError()
	})
})
