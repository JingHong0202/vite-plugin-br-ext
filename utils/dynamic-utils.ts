import core from '@babel/core'
import types, {
	ArrayExpression,
	Expression,
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
import type { Scope } from '@babel/traverse'
import type { PluginItem, NodePath } from '@babel/core'
// import parser from '@babel/parser'
// import { objectExpression } from '@babel/types'
// import generate from '@babel/generator'
// import typescript from '@rollup/plugin-typescript'

// type State = {
// 	target: Node[]
// 	ast: types.File
// 	path: NodePath
// }

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
	// state!: State
	type: Type
	emitFiles: EmittedFile[] = []
	plugin!: PluginItem
	field: string
	tasks: any[] = []

	constructor({
		attrName,
		code,
		root = __dirname,
		type = 'chunk',
		field = 'files'
	}: InitParams) {
		this.attrName = attrName
		this.code = code
		this.root = root
		this.type = type
		this.field = field
		this.init()
	}

	init() {
		// const ast = parser.parse(this.code, {
		// 	sourceType: 'unambiguous',
		// 	plugins: ['typescript'],
		// 	attachComment: false,
		// 	tokens: false
		// })
		this.plugin = {
			name: 'babel-plugin-dynamic-process',
			visitor: {
				Program: {
					exit: () => {
						this.tasks.forEach(task => task.path[task.actions]())
					}
				},
				MemberExpression: {
					enter: (path: NodePath) => {
						if (String(path) != this.attrName) return
						const args = (<ObjectExpression>(
							(<OptionalCallExpression>path.parent).arguments[0]
						)).properties
						const files = (<ObjectProperty[]>args).find(
							item => (<Identifier>item.key).name === this.field
						)
						if (!files || !files.value) return
						if (
							types.isArrayExpression(files.value) &&
							files.value.elements?.length
						) {
							this.emitFiles = [
								...this.emitFiles,
								...this.each({
									list: <Node[]>files.value.elements,
									scopePath: path
								})
							]
							files.value.elements = this.emitFiles.map(file =>
								types.stringLiteral(file.fileName!)
							)
						} else if (
							types.isIdentifier(files.value) &&
							files.value.name === this.field
						) {
							const identifier = this.findIdentifier(
								path.scope,
								this.field,
								path
							)
							this.emitFiles = [
								...this.emitFiles,
								...this.each({
									list: <Node[]>(<ArrayExpression>identifier.node).elements,
									scopePath: identifier.path
								})
							]
							if (
								identifier.path.isAssignmentExpression({ operator: '=' }) &&
								identifier.path.get('right').isArrayExpression()
							) {
								;(<ArrayExpression>identifier.path.node.right).elements =
									this.emitFiles.map(file =>
										types.stringLiteral(file.fileName!)
									)
							} else if (
								identifier.path.isVariableDeclarator() &&
								types.isArrayExpression(<Expression>identifier.path.node.init)
							) {
								;(<ArrayExpression>identifier.path.node.init).elements =
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
			throw Error(`${this.field}: The value must array`)
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
		throw Error(`${this.field}: The value Not Found`)
		// binding.constantViolations   expression left right
		// binding.referenced | referencePaths | references   expression left right
	}

	each({ list, scopePath }: EachParams) {
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
						fileName,
						// @ts-ignore
						path: filePath
					})
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
				if (!this.tasks.find(task => task.path == path)) {
					// path?.remove()
					this.tasks.push({ path, actions: 'remove' })
				}
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
