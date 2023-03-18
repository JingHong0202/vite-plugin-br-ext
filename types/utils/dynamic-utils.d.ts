import core from '@babel/core'
import types, { Node } from '@babel/types'
import { EmittedFile } from 'rollup'
import type { Scope } from '@babel/traverse'
import type { PluginItem, NodePath } from '@babel/core'
type Type = 'chunk' | 'asset'
type InitParams = {
	attrName: string
	code: string
	root?: string
	type?: Type
	field?: string
}
type EachParams = {
	list: Node[]
	scopePath: NodePath
}
export default class DynamicUtils {
	attrName: string
	code: string
	root: string
	type: Type
	emitFiles: EmittedFile[]
	plugin: PluginItem
	field: string
	tasks: any[]
	constructor({ attrName, code, root, type, field }: InitParams)
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
		path: core.NodePath<core.types.Node>
	}
	each({ list, scopePath }: EachParams): EmittedFile[]
	generateCode(): core.BabelFileResult
}
export {}
