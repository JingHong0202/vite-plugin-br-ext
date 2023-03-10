import { describe, test, expect } from 'vitest'
import parser from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import template from '@babel/template'
import types from '@babel/types'

const input = [
	`
chrome.scripting.executeScript({
		files: ['./content/inject.ts'],
		target: { }
})
`,
	`
let files
files = [];
(function() {
files = [...files,1]
})()
chrome.scripting.executeScript({
		files,
		target: {  }
})
`,
	`
let files
let files2 = []
files = [];
(function() {
files = [...files,1]
})()
files = files2
chrome.scripting.executeScript({
		files,
		target: {  }
})
`
]

// function parseWithLintArray(node, scope) {
// 	// if (types.isIdentifier(node)) {
// 	// 	throw Error(`files: The value must array`)
// 	// }

// 	// if (!types.isArrayExpression(node)) {
// 	// 	throw Error(`files: The value must array`)
// 	// }

// 	return node
// }
// function findIdentifier(scope) {
// 	const binding = scope.getBinding('files'),
// 		node = binding.path.node,
// 		init = node.init,
// 		isConst = binding.constant

// 	if (isConst) {
// 		return parseWithLintArray(init)
// 	}

// 	if (init) {
// 		return parseWithLintArray(init)
// 	} else {
// 		const filter = binding.constantViolations.filter(
// 			path =>
// 				path.isAssignmentExpression({ operator: '=' }) &&
// 				path.get('left').isIdentifier({ name: 'files' })
// 		)
// 		const {
// 			node: { right },
// 			scope
// 		} = filter[filter.length - 1]
// 		return parseWithLintArray(right, scope)
// 	}
// 	// binding.constantViolations   expression left right
// 	// binding.referenced | referencePaths | references   expression left right
// }

// function matchDynamicFileUrl(
// 	atttName: string,
// 	code: string
// ): Promise<{ target: any[]; ast: any }> {
// 	return new Promise(resolve => {
// 		const ast = parser.parse(code, {
// 			sourceType: 'unambiguous',
// 			plugins: ['typescript'],
// 			attachComment: false,
// 			tokens: false
// 		})
// 		traverse(ast, {
// 			MemberExpression(path) {
// 				if (path != atttName) return
// 				console.log(path)
// 				const args = path.parent.arguments[0].properties
// 				const files = args.find(item => item.key.name === 'files')
// 				if (!files || !files.value) return
// 				if (
// 					types.isArrayExpression(files.value) &&
// 					files.value.elements?.length
// 				) {
// 					resolve({ target: files.value.elements, ast })
// 				} else if (
// 					types.isIdentifier(files.value) &&
// 					files.value.name === 'files'
// 				) {
// 					const findVar = findIdentifier(path.scope)
// 				}
// 				path.stop()
// 			}
// 		})
// 	})
// }

describe('match', () => {
	test('files', async () => {
		// const { target, ast } = await matchDynamicFileUrl(
		// 	'chrome.scripting.executeScript',
		// 	input[2]
		// )
		// target.forEach(item => {
		// 	if (types.isStringLiteral(item)) {
		// 	}
		// })
		// const o = generate(ast)
		// console.log(target)
	})
})
