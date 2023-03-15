import { NodePath, Scope } from '@babel/traverse'
import types, { Node } from '@babel/types'
import { EmittedFile } from 'rollup'
import type { PluginItem } from '@babel/core'
type State = {
	target: Node[]
	ast: types.File
	path: NodePath
}
type Type = 'chunk' | 'asset'
type InitParams = {
	attrName: string
	code: string
	root?: string
	type?: Type
}
type EachParams = {
	list?: Node[]
	scopePath?: NodePath
}
export default class DynamicUtils {
	attrName: string
	code: string
	root: string
	state: State
	type: Type
	emitFiles: EmittedFile[]
	plugin: PluginItem
	constructor({ attrName, code, root, type }: InitParams)
	init(): this
	parseWithLintArray(
		node: Node,
		scope: Scope | null,
		path?: NodePath
	): {
		node: Node
		path: NodePath
	}
	findIdentifier(
		scope: Scope,
		field: string,
		path?: NodePath
	): {
		node: types.Node
		path: NodePath
	}
	each({ list, scopePath }?: EachParams): EmittedFile[]
	generateCode(): this
}
export {}
