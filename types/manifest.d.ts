import type {
	InputOptions,
	OutputAsset,
	PluginContext,
	OutputBundle
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
type PreWork = {
	[key: string]: (...args: any[]) => Promise<ResourceOutput> | ResourceOutput
}
export declare class ManiFest {
	readonly origin: any
	result: any
	maniFestPath: string
	hashTable: {
		[key: string | number]: Resource
	}
	dynamicImports: Map<string, string>
	permission: never[]
	inputs: {}
	preWork: PreWork
	constructor(options: InputOptions)
	handerPermission(code: string): void
	handlerDynamicInput(plugin: PluginContext, code: string, id: string): string
	handlerDynamicJS(plugin: PluginContext, code: string, id: string): string
	handlerDynamicCSS(plugin: PluginContext, code: string, id: string): string
	handlerCSS(
		plugin: PluginContext,
		chunk: OutputAsset,
		bundle: OutputBundle
	): Promise<string | undefined>
	handlerResources(plugin: PluginContext): void
	handlerDependencies(plugin: PluginContext, resource: Resource): void
	handlerGroup(): void
	buildManifest(plugin: PluginContext): void
	traverseDeep(target: any, parent?: string, group?: string): void
	matchFileByRules(rules: string, parent?: string): void
	resolveInputs(): {
		[key: string]: string
		[key: number]: string
	}
}
export {}
