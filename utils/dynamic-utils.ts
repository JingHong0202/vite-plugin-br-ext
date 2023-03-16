import parser from '@babel/parser'
import { NodePath, Scope } from '@babel/traverse'
import core from '@babel/core'
import types, {
	ArrayExpression,
	// CallExpression,
	Identifier,
	Node,
	ObjectExpression,
	ObjectProperty,
	OptionalCallExpression,
	VariableDeclarator
} from '@babel/types'
import { createUUID } from '../utils'
import { isJSFile } from '../utils/reg'
import log from '../utils/logger'
import fs from 'fs'
import path from 'path'
import { EmittedFile } from 'rollup'
import type { PluginItem } from '@babel/core'
// import { objectExpression } from '@babel/types'
// import generate from '@babel/generator'
// import typescript from '@rollup/plugin-typescript'

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
	state!: State
	type: Type
	emitFiles!: EmittedFile[]
	plugin!: PluginItem

	constructor({
		attrName,
		code,
		root = __dirname,
		type = 'chunk'
	}: InitParams) {
		this.attrName = attrName
		this.code = code
		this.root = root
		this.type = type

		this.init()
	}

	init() {
		const ast = parser.parse(this.code, {
			sourceType: 'unambiguous',
			plugins: ['typescript'],
			attachComment: false,
			tokens: false
		})
		this.plugin = {
			visitor: {
				MemberExpression: {
					enter: (path: NodePath) => {
						if (String(path) != this.attrName) return
						const args = (<ObjectExpression>(
							(<OptionalCallExpression>path.parent).arguments[0]
						)).properties
						const files = (<ObjectProperty[]>args).find(
							item => (<Identifier>item.key).name === 'files'
						)
						if (!files || !files.value) return
						if (
							types.isArrayExpression(files.value) &&
							files.value.elements?.length
						) {
							this.state = { target: <Node[]>files.value.elements, ast, path }
							this.emitFiles = this.each()
							files.value.elements = this.emitFiles.map(file =>
								types.stringLiteral(file.fileName!)
							)
						} else if (
							types.isIdentifier(files.value) &&
							files.value.name === 'files'
						) {
							const identifier = this.findIdentifier(path.scope, 'files', path)
							this.state = {
								target: <Node[]>(<ArrayExpression>identifier.node).elements,
								ast,
								path: identifier.path
							}
							this.emitFiles = this.each()
							if (
								identifier.path.isAssignmentExpression({ operator: '=' }) &&
								identifier.path.get('right').isArrayExpression()
							) {
								;(<ArrayExpression>identifier.path.node.right).elements =
									this.emitFiles.map(file =>
										types.stringLiteral(file.fileName!)
									)
							}
						}
						// path.stop()
					}
				}
			}
		}
		return this
	}

	parseWithLintArray(
		node: Node,
		scope: Scope | null,
		path?: NodePath
	): { node: Node; path: NodePath } {
		if (types.isIdentifier(node)) {
			return this.findIdentifier(<Scope>scope, node.name, path)
		}

		if (!types.isArrayExpression(node) || !path) {
			throw Error(`files: The value must array`)
		}

		return { node, path }
	}
	findIdentifier(scope: Scope, field: string, path?: NodePath) {
		const binding = scope.getBinding(field),
			node = binding?.path.node,
			init = (<VariableDeclarator>node).init,
			isConst = binding?.constant,
			constantViolations = binding?.constantViolations.filter(
				path =>
					path.isAssignmentExpression({ operator: '=' }) &&
					path.get('left').isIdentifier({ name: field })
			)

		if (isConst && init) {
			return this.parseWithLintArray(init, null, binding.path)
		}

		if (constantViolations?.length) {
			const {
				// @ts-ignore
				node: { right },
				scope
			} = constantViolations[constantViolations.length - 1]
			return this.parseWithLintArray(
				<Node>right,
				scope,
				constantViolations[constantViolations.length - 1]
			)
		} else {
			if (init) {
				return this.parseWithLintArray(init, null, path)
			}
		}
		throw Error(`files: The value Not Found`)
		// binding.constantViolations   expression left right
		// binding.referenced | referencePaths | references   expression left right
	}

	each({
		list = this.state.target,
		scopePath = this.state.path
	}: EachParams = {}) {
		return list.reduce((accumulator, item) => {
			const rawVal = <string>item.extra?.rawValue
			if (types.isStringLiteral(item)) {
				const filePath = path.normalize(path.resolve(this.root, rawVal))
				if (!fs.existsSync(filePath)) {
					log.error(`dynamic ${rawVal} Not Found`)
				}

				if (this.type === 'chunk') {
					const fileInfo = path.parse(filePath)
					const fileName = `dynamic/${createUUID()}${fileInfo.ext.replace(
						isJSFile,
						'.js'
					)}`
					accumulator.push({
						id: filePath,
						type: 'chunk',
						fileName
					})
				} else {
					const fileName = `dynamic/${createUUID()}.css`
					accumulator.push({
						type: 'asset',
						source: fs.readFileSync(filePath, 'utf-8'),
						fileName
					})
					// this.dynamicImports.set(
					// 	fileName,
					// 	path.relative(path.dirname(this.maniFestPath), filePath)
					// )
				}
			} else if (types.isSpreadElement(item)) {
				const argument = item.argument as Identifier
				const { node, path } = this.findIdentifier(
					scopePath.scope,
					argument.name,
					scopePath
				)
				if (!types.isArrayExpression(node)) {
					throw Error('spreadElement must array')
				}

				accumulator.push(
					...this.each({ list: <Node[]>node.elements, scopePath: path })
				)
				// this.state.path = path
			}
			return accumulator
		}, [] as EmittedFile[])
	}

	// replace() {}

	generateCode() {
		return core.transformSync(this.code, {
			plugins: [this.plugin]
		})!
	}
}
