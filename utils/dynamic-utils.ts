import parser from '@babel/parser'
import traverse, { Binding, NodePath, Scope } from '@babel/traverse'
// import generate from '@babel/generator'
// import template from '@babel/template'
import types, {
	ArrayExpression,
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

type State = {
	target: Node[]
	ast: types.File
	path: NodePath
}

export default class DynamicUtils {
	attrName: string
	code: string
	root: string
	state!: State

	constructor(atttName: string, code: string, root: string = __dirname) {
		this.attrName = atttName
		this.code = code
		this.root = root
	}

	init(): Promise<this> {
		return new Promise(resolve => {
			const ast = parser.parse(this.code, {
				sourceType: 'unambiguous',
				plugins: ['typescript'],
				attachComment: false,
				tokens: false
			})
			traverse(ast, {
				MemberExpression: path => {
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
						resolve(this)
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
						resolve(this)
					}
					path.stop()
				}
			})
		})
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
				(<Binding>binding).path
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

	each(type: 'chunk' | 'asset', scopePath: NodePath = this.state.path) {
		return this.state.target.reduce((accumulator, item) => {
			const rawVal = <string>item.extra?.rawValue
			if (types.isStringLiteral(item)) {
				const filePath = path.normalize(path.resolve(this.root, rawVal))
				if (!fs.existsSync(filePath)) {
					log.error(`dynamic ${rawVal} Not Found`)
				}

				if (type === 'chunk') {
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
					argument.name
				)
				if (!types.isArrayExpression(node)) {
					throw Error('spreadElement must array')
				}

				accumulator.push(...this.each(type, path))
			}
			return accumulator
		}, [] as EmittedFile[])
	}
}
