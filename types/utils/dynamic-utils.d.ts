import { NodePath, Scope } from '@babel/traverse'
import types, { Node } from '@babel/types'
import { EmittedFile } from 'rollup'
type State = {
	target: Node[]
	ast: types.File
	path: NodePath
}
export default class DynamicUtils {
	attrName: string
	code: string
	root: string
	state: State
	constructor(atttName: string, code: string, root?: string)
	init(): Promise<this>
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
	each(type: 'chunk' | 'asset', scopePath?: NodePath): EmittedFile[]
}
export {}
