import path from 'path'
import fs from 'fs'
import { normalizePath } from 'vite'
import { set, get, getType, createUUID, parsePreCSS, prevPath } from './utils'
import { match } from './utils/permission'
import {
	inputsReg,
	isNetWorkLink,
	includeNumber,
	isWebResources,
	isJSFile,
	isPrepCSSFile,
	executeScriptReg,
	annotationRows,
	insertCSSReg,
	filesReg
} from './utils/reg'
import { hasMagic, sync } from 'glob'
import iife from './mixin/iife'
import log from './utils/logger'
import type {
	InputOptions,
	OutputAsset,
	PluginContext,
	OutputBundle,
	EmittedFile,
	OutputChunk,
	RenderedChunk
} from 'rollup'
import type { ChunkMetadata } from 'vite'

interface ResourceOutput {
	path: string
	dependencies?: ChunkMetadata
}

interface Resource {
	isEntry: boolean
	relativePath: string
	absolutePath: string
	attrPath: string
	ext: string
	keyMap: string
	group?: string
	output?: ResourceOutput
}

interface ResourceGroup {
	attrPath: string
	group: Resource[]
}

type PreWork = {
	[key: string]: (...args: any[]) => Promise<ResourceOutput> | ResourceOutput
}

type MatchDynamic = {
	start: number
	end: number
	filesFieldStartIndex?: number
	filesFieldEndIndex?: number
	files?: {
		val: string
		type: string
	}[]
}

export class ManiFest {
	readonly origin: any
	result: any
	maniFestPath = ''
	// 存储所有输出资源 HashMap
	hashTable: { [key: string | number]: Resource } = {}
	// 存储动态导入资源
	dynamicImports = new Map()
	// 存储解析出的权限
	permission = []
	// 存储所有入口资源
	inputs = {}
	// 写入manifest之前的处理操作，作用：对个别字段输出进行单独处理
	preWork: PreWork = {
		service_worker: async (plugin, chunk, bundle) => {
			if (!this.result['background.type']) {
				return {
					path: await iife(
						<PluginContext>plugin,
						<OutputChunk>chunk,
						<OutputBundle>bundle
					)
				}
			} else {
				return { path: chunk.fileName }
			}
		},
		web_accessible_resources: async (plugin, chunk, bundle, self) => {
			if (isJSFile.test(<string>self.ext)) {
				return {
					path: await iife(
						<PluginContext>plugin,
						<OutputChunk>chunk,
						<OutputBundle>bundle
					)
				}
			} else {
				return { path: chunk.fileName }
			}
		},
		content_scripts: async (plugin, chunk, bundle, self) => {
			if (isJSFile.test(<string>self.ext)) {
				const output: ResourceOutput = {
					path: await iife(
						<PluginContext>plugin,
						<OutputChunk>chunk,
						<OutputBundle>bundle
					)
				}
				if ((<RenderedChunk>chunk).viteMetadata) {
					const dependencies = (<RenderedChunk>chunk).viteMetadata
					if (dependencies?.importedCss.size) {
						output.dependencies = dependencies
					}
				}
				return output
			} else {
				return { path: chunk.fileName }
			}
		},
		default: (plugin, chunk) => ({ path: chunk.fileName })
	}

	constructor(options: InputOptions) {
		let maniFestJson

		try {
			if (typeof options.input === 'string') {
				maniFestJson = JSON.parse(
					fs.readFileSync(options.input, {
						encoding: 'utf-8'
					})
				)
				this.maniFestPath = options.input
			} else if (typeof options.input === 'object') {
				const find = Object.values(options.input).find(item =>
					item.includes('manifest')
				)
				if (find) {
					maniFestJson = JSON.parse(
						fs.readFileSync(find, {
							encoding: 'utf-8'
						})
					)
					this.maniFestPath = find
				}
			}
			if (!maniFestJson) {
				log.error('manifest.json must')
			}
			this.origin = maniFestJson
			this.result = new Proxy(maniFestJson, {
				set: <ProxyHandler<typeof ManiFest>['set']>set,
				get: <ProxyHandler<typeof ManiFest>['get']>get
			})
			this.inputs = this.resolveInputs()
		} catch (error) {
			log.error(<string>error || 'manifest.json parse error')
		}
		log.primary('input: ' + JSON.stringify(this.inputs, null, 2))
	}

	handerPermission(code: string) {
		this.permission = [...new Set(this.permission.concat(<[]>match(code)))]
	}

	handlerDynamicInput(plugin: PluginContext, code: string, id: string) {
		// 去除注释
		code = code.replace(annotationRows(), '')
		// 处理动态JS文件
		code = this.handlerDynamicJS(plugin, code, id)
		// 处理动态CSS文件
		code = this.handlerDynamicCSS(plugin, code, id)

		return code
	}

	handlerDynamicJS(plugin: PluginContext, code: string, id: string) {
		const matchAll = this.matchDynamicFilePaths(executeScriptReg(), code)
		if (!matchAll.length) return code
		return this.handlerMatchedPaths({
			type: 'chunk',
			matchAll: matchAll as Required<MatchDynamic>[],
			code,
			plugin,
			id
		})
	}

	handlerDynamicCSS(plugin: PluginContext, code: string, id: string) {
		const matchAll = this.matchDynamicFilePaths(insertCSSReg(), code)
		if (!matchAll.length) return code
		return this.handlerMatchedPaths({
			type: 'asset',
			plugin,
			matchAll: matchAll as Required<MatchDynamic>[],
			code,
			id
		})
	}

	matchDynamicFilePaths(reg: RegExp, code: string): Required<MatchDynamic[]> {
		const reusltArr: MatchDynamic[] = []
		for (const match of code.matchAll(reg)) {
			const lastIndex = match.index! + (match[0].length - 1)
			reusltArr.push({
				start: match.index!,
				end: lastIndex
			})
		}

		return reusltArr.flatMap(item => {
			const result = ['(']

			while (result.length) {
				++item.end
				if (/[({]/.test(code[item.end])) {
					result.push(code[item.end])
				} else if (code[item.end] === ')') {
					result.splice(result.indexOf('('), 1)
				} else if (code[item.end] === '}') {
					result.splice(result.indexOf('{'), 1)
				}
			}

			const block = code.slice(item.start, item.end + 1)
			const filesField = block.match(filesReg())
			if (filesField) {
				const urlMatch = filesField[1].split(',').flatMap(i => {
					return [
						/["'](.+)["']$/g.test(i)
							? {
									val: i.replace(/["']/g, '').trim(),
									type: 'path'
							  }
							: {
									val: i,
									type: 'variable'
							  }
					]
				})
				item.filesFieldStartIndex = filesField.index! + item.start
				item.filesFieldEndIndex =
					filesField.index! + item.start + filesField[0].length
				item.files = urlMatch
				return [item]
			}
			return []
		})
	}

	handlerMatchedPaths({
		type,
		matchAll,
		code,
		plugin,
		id
	}: {
		type: 'chunk' | 'asset'
		matchAll: Required<MatchDynamic>[]
		code: string
		plugin: PluginContext
		id: string
	}) {
		let diff = 0
		for (const iterator of matchAll) {
			const newFiles = iterator.files.map(file => {
				if (file.type === 'variable') {
					return file.val
				} else if (file.type === 'path') {
					const filePath = normalizePath(
						path.resolve(path.dirname(id), file.val)
					)
					if (!fs.existsSync(filePath)) {
						log.error(`dynamic ${file.val} Not Found`)
					}

					const fileInfo = path.parse(filePath)
					let fileName: string

					if (type === 'asset') {
						fileName = `dynamic/${createUUID()}.css`
						plugin.emitFile({
							type: 'asset',
							source: fs.readFileSync(filePath, 'utf-8'),
							fileName
						})
						this.dynamicImports.set(
							fileName,
							path.relative(path.dirname(this.maniFestPath), filePath)
						)
					} else {
						fileName = `dynamic/${createUUID()}${fileInfo.ext.replace(
							isJSFile,
							'.js'
						)}`
						plugin.emitFile({
							id: filePath,
							type: 'chunk',
							fileName
						})
					}
					return normalizePath(`/${fileName}`)
				}
			})

			const replaceStr = code.slice(
					diff + iterator.filesFieldStartIndex,
					diff + iterator.filesFieldEndIndex
				),
				replaceVal = `files: ${JSON.stringify(newFiles)}`
			diff = diff + Math.max(0, replaceVal.length - replaceStr.length)
			code = code.replace(replaceStr, replaceVal)
		}

		return code
	}

	async handlerCSS(
		plugin: PluginContext,
		chunk: OutputAsset,
		bundle: OutputBundle
	) {
		let dependciesName = path.extname(chunk.fileName).slice(1),
			filePath = normalizePath(
				path.join(path.dirname(this.maniFestPath), chunk.fileName)
			)

		if (this.dynamicImports.has(chunk.fileName)) {
			const hash: string = this.dynamicImports.get(chunk.fileName)
			filePath = normalizePath(path.join(path.dirname(this.maniFestPath), hash))
			dependciesName = path.extname(hash).slice(1)
		}

		if (!fs.existsSync(filePath)) {
			log.error(`${filePath} Not Found`)
		}

		const source = await parsePreCSS(dependciesName, filePath)
		delete bundle[Object.keys(bundle).find(key => bundle[key] === chunk)!]

		const referenceId = plugin.emitFile({
			fileName: `${chunk.fileName.replace(
				path.extname(chunk.fileName),
				''
			)}-${createUUID()}.css`,
			source,
			type: 'asset'
		})

		return plugin.getFileName(referenceId)
	}

	handlerResources(plugin: PluginContext) {
		Object.values(this.hashTable)
			.flatMap(resource => {
				return !resource.isEntry
					? [
							{
								type: 'asset',
								fileName: normalizePath(
									path.relative(
										path.dirname(this.maniFestPath),
										resource.absolutePath
									)
								),
								source: fs.readFileSync(resource.absolutePath)
							}
					  ]
					: []
			})
			.forEach(item => {
				plugin.emitFile(<EmittedFile>item)
			})
	}

	handlerDependencies(plugin: PluginContext, resource: Resource) {
		const dependencies = resource.output?.dependencies
		if (!dependencies) return

		if (
			resource.attrPath.includes('content_scripts') &&
			dependencies.importedCss.size
		) {
			// 当content_scripts 包含css依赖时，自动引入
			const split = resource.attrPath.split('.'),
				targetKey = `${split.slice(0, split.length - 2).join('.')}.css`,
				newList = [...dependencies.importedCss]
			this.result[targetKey] = this.result[targetKey]
				? [...this.result[targetKey]].concat(newList)
				: newList
		}
	}

	handlerGroup() {
		const keys = Object.keys(this.hashTable),
			groupHash = <Map<string, ResourceGroup>>new Map()
		for (let index = 0; index < keys.length; index++) {
			const current = this.hashTable[keys[index]]
			if (!current.group) continue
			if (!groupHash.has(current.group)) {
				groupHash.set(current.group, {
					group: [current],
					attrPath: prevPath(current.attrPath, 1)
				})
			} else {
				groupHash.get(current.group)?.group.push(current)
			}
			delete this.hashTable[keys[index]]
		}

		if (!groupHash.size) return
		;[...groupHash].forEach(([key, resource]) => {
			const list = <[]>this.result[resource.attrPath]
			const index = list.findIndex(item => item === key)
			if (index !== -1) {
				const left = list.slice(0, index),
					right = list.slice(Math.max(index, 1))
				this.result[resource.attrPath] = [
					...left,
					...resource.group.map(item => item.output?.path || item.relativePath),
					...right
				]
			}
		})
	}

	buildManifest(plugin: PluginContext) {
		this.handlerGroup()
		Object.keys(this.hashTable).forEach(key => {
			const resource = this.hashTable[key]
			if (isWebResources.test(resource.attrPath)) return

			if (resource.isEntry || isPrepCSSFile.test(resource.ext)) {
				const parentPath = prevPath(resource.attrPath, 1)
				if (getType(this.result[parentPath]) === '[object Array]') {
					(<string[]>this.result[parentPath]).push(resource.output!.path)
				} else {
					this.result[resource.attrPath] = resource.output!.path
				}
			}
			this.handlerDependencies(plugin, resource)
		})
		this.result.permissions = this.result.permissions
			? [...new Set([...this.result.permissions, ...this.permission])]
			: this.permission

		plugin.emitFile({
			source: JSON.stringify(this.result, null, 2),
			fileName: 'manifest.json',
			type: 'asset'
		})
	}

	traverseDeep(target: any, parent?: string, group?: string) {
		for (const key in target) {
			if (!Object.hasOwnProperty.call(target, key)) continue

			const type = getType(target[key])
			let ext
			if (type === '[object Object]' || type === '[object Array]') {
				this.traverseDeep(target[key], `${parent ? `${parent}.${key}` : key}`)
			} else if (
				typeof target[key] === 'string' &&
				!isNetWorkLink().test(<string>target[key]) &&
				(ext = path.extname(<string>target[key])) &&
				!includeNumber().test(ext)
			) {
				// 处理有后缀的路径

				// 特例：处理 *.js *.html
				if (hasMagic(<string>target[key]) && parent) {
					return this.matchFileByRules(<string>target[key], parent)
				}

				const absolutePath = normalizePath(
					path.join(path.dirname(this.maniFestPath), <string>target[key])
				)

				if (!fs.existsSync(absolutePath)) {
					log.error(`${absolutePath} Not Found`)
					continue
				}

				const resource: Partial<Resource> = {}

				const keyMap = normalizePath(
					path.relative(path.dirname(this.maniFestPath), absolutePath)
				).replace(ext, '')

				if (this.hashTable[keyMap]) {
					log.error(`file ${keyMap} repeat`)
				}

				if (inputsReg.test(ext)) {
					resource.isEntry = true
				}

				resource.relativePath = target[key]
				resource.absolutePath = absolutePath
				resource.attrPath = `${parent ? `${parent}.${key}` : key}`
				resource.keyMap = keyMap
				resource.ext = ext
				group && (resource.group = group)
				this.hashTable[keyMap] = <Required<Resource>>resource
			} else if (parent) {
				// 处理有没后缀的路径
				// 是否有通配符
				if (hasMagic(<string>target[key])) {
					this.matchFileByRules(<string>target[key], parent)
				}
			}
		}
	}

	matchFileByRules(rules: string, parent = '') {
		const files = sync(rules, {
			cwd: path.dirname(this.maniFestPath),
			nodir: true
		})
		files?.length && this.traverseDeep(files, parent, rules)
	}

	resolveInputs() {
		// 遍历解析 manifest.json
		this.traverseDeep(this.origin)
		return Object.entries(this.hashTable).reduce(
			(accumulator: { [key: string | number]: string }, current) => {
				if (current[1].isEntry) {
					accumulator[current[1].keyMap] = current[1].absolutePath
				}
				return accumulator
			},
			{}
		)
	}
}
