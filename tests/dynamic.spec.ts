import { describe, test, expect } from 'vitest'
import DynamicUtils from '../utils/dynamic-utils'

const files = [
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
let files;
let files2 = ["1",1]
files = [];
(function() {
files = [...files,1]
})()
files = files2
let file3 = [1,1,1]
files2 = file3
chrome.scripting.executeScript({
		files,
		target: {  }
})



file3 = [1]
const file4 = ["4"]
file3 = file4
`,
	`
chrome.scripting.executeScript({
		files: [    './example/input/scripts/content/inject.ts',  './example/input/scripts/background.ts'],
		target: { }
})
`,
	`
const files = ['./example/input/scripts/background.ts']
chrome.scripting.executeScript({
		files: [    './example/input/scripts/content/inject.ts', ...files],
		target: { }
})
`,
	`
const file3 =  ['./example/input/scripts/content/inject.ts'];
const files2 = ['./example/input/scripts/content/inject.ts',...file3]
const files = ['./example/input/scripts/background.ts',...files2]
chrome.scripting.executeScript({
		files: [    ...files],
		target: { }
})
`
]

// function parseWithLintArray(node, scope?, path?) {
// 	if (types.isIdentifier(node)) {
// 		return findIdentifier(scope, node.name, path)
// 	}

// 	if (!types.isArrayExpression(node)) {
// 		throw Error(`files: The value must array`)
// 	}

// 	return { node, path }
// }
// function findIdentifier(scope, field?: string, path?) {
// 	const binding = scope.getBinding(field),
// 		node = binding.path.node,
// 		init = node.init,
// 		isConst = binding.constant,
// 		constantViolations = binding.constantViolations.filter(
// 			path =>
// 				path.isAssignmentExpression({ operator: '=' }) &&
// 				path.get('left').isIdentifier({ name: field })
// 		)

// 	if (isConst && init) {
// 		return parseWithLintArray(init, null, binding.path)
// 	}

// 	if (constantViolations.length) {
// 		const {
// 			node: { right },
// 			scope
// 		} = constantViolations[constantViolations.length - 1]
// 		return parseWithLintArray(right, scope, binding.path)
// 	} else {
// 		if (init) {
// 			return parseWithLintArray(init, null, path)
// 		}
// 	}
// 	// binding.constantViolations   expression left right
// 	// binding.referenced | referencePaths | references   expression left right
// }

// function matchDynamicFileUrl(
// 	atttName: string,
// 	code: string
// ): Promise<{ target: any[]; ast: any; path: any }> {
// 	return new Promise(resolve => {
// 		const ast = parser.parse(code, {
// 			sourceType: 'unambiguous',
// 			plugins: ['typescript'],
// 			attachComment: false,
// 			tokens: false
// 		})
// 		traverse(ast, {
// 			MemberExpression(path) {
// 				if (String(path) != atttName) return
// 				const args = path.parent.arguments[0].properties
// 				const files = args.find(item => item.key.name === 'files')
// 				if (!files || !files.value) return
// 				if (
// 					types.isArrayExpression(files.value) &&
// 					files.value.elements?.length
// 				) {
// 					resolve({ target: files.value.elements, ast, path })
// 				} else if (
// 					types.isIdentifier(files.value) &&
// 					files.value.name === 'files'
// 				) {
// 					const identifier = findIdentifier(path.scope, 'files', path)
// 					resolve({
// 						target: identifier.node.elements,
// 						ast,
// 						path: identifier.path
// 					})
// 				}
// 				path.stop()
// 			}
// 		})
// 	})
// }

// // function parseSpreadElement(scope, field?: string, type: 'chunk' | 'asset') {
// // node.elements.map(item => {
// // 	const res = {}
// // 	if (type === 'chunk') {
// // 			const fileInfo = path.parse(filePath)
// // 			const fileName = `dynamic/${createUUID()}${fileInfo.ext.replace(
// // 				isJSFile,
// // 				'.js'
// // 			)}`
// // 			accumulator.push({
// // 				id: filePath,
// // 				type: 'chunk',
// // 				fileName
// // 			})
// // 		} else {
// // 			const fileName = `dynamic/${createUUID()}.css`
// // 			accumulator.push({
// // 				type: 'asset',
// // 				source: fs.readFileSync(filePath, 'utf-8'),
// // 				fileName
// // 			})
// // 			// this.dynamicImports.set(
// // 			// 	fileName,
// // 			// 	path.relative(path.dirname(this.maniFestPath), filePath)
// // 			// )
// // 		}
// // })
// // }

// function each(list: any[], type: 'chunk' | 'asset', scopePath?: any) {
// 	return list.reduce((accumulator, item) => {
// 		const rawVal = <string>item.extra?.rawValue
// 		if (types.isStringLiteral(item)) {
// 			const filePath = path.normalize(path.resolve(__dirname, rawVal))
// 			if (!fs.existsSync(filePath)) {
// 				log.error(`dynamic ${rawVal} Not Found`)
// 			}

// 			if (type === 'chunk') {
// 				const fileInfo = path.parse(filePath)
// 				const fileName = `dynamic/${createUUID()}${fileInfo.ext.replace(
// 					isJSFile,
// 					'.js'
// 				)}`
// 				accumulator.push({
// 					id: filePath,
// 					type: 'chunk',
// 					fileName
// 				})
// 			} else {
// 				const fileName = `dynamic/${createUUID()}.css`
// 				accumulator.push({
// 					type: 'asset',
// 					source: fs.readFileSync(filePath, 'utf-8'),
// 					fileName
// 				})
// 				// this.dynamicImports.set(
// 				// 	fileName,
// 				// 	path.relative(path.dirname(this.maniFestPath), filePath)
// 				// )
// 			}
// 		} else if (types.isSpreadElement(item)) {
// 			const { node, path } = findIdentifier(
// 				scopePath.scope,
// 				(<any>item.argument).name,
// 				type
// 			)
// 			if (!types.isArrayExpression(node)) {
// 				throw Error('spreadElement must array')
// 			}

// 			accumulator.push(...each(node.elements, type, path))
// 		}
// 		return accumulator
// 	}, [])
// }

describe('normalize', () => {
	test('match', async () => {
		await expect(
			(
				await new DynamicUtils({
					attrName: 'chrome.scripting.executeScript',
					code: files[0]
				}).init()
			).state.target
		).toMatchSnapshot()

		await expect(
			(
				await new DynamicUtils({
					attrName: 'chrome.scripting.executeScript',
					code: files[1]
				}).init()
			).state.target
		).toMatchSnapshot()

		await expect(
			(
				await new DynamicUtils({
					attrName: 'chrome.scripting.executeScript',
					code: files[2]
				}).init()
			).state.target
		).toMatchSnapshot()
	})

	test('parse', async () => {
		const dynamic = new DynamicUtils({
			attrName: 'chrome.scripting.executeScript',
			code: files[3],
			root: process.cwd() + '/tests/'
		})
		await dynamic.init()
		expect(dynamic.each()).toMatchSnapshot([
			{
				fileName: expect.any(String),
				id: expect.any(String),
				type: 'chunk'
			},
			{
				fileName: expect.any(String),
				id: expect.any(String),
				type: 'chunk'
			}
		])
	})
})

describe('SpreadElement', () => {
	test('parse', async () => {
		const dynamic = new DynamicUtils({
			attrName: 'chrome.scripting.executeScript',
			code: files[4],
			root: process.cwd() + '/tests/'
		})
		await dynamic.init()

		expect(dynamic.each()).toMatchSnapshot([
			{
				fileName: expect.any(String),
				id: expect.any(String),
				type: 'chunk'
			},
			{
				fileName: expect.any(String),
				id: expect.any(String),
				type: 'chunk'
			}
		])
	})

	test('deep parse', async () => {
		const dynamic = new DynamicUtils({
			attrName: 'chrome.scripting.executeScript',
			code: files[5],
			root: process.cwd() + '/tests/'
		})
		await dynamic.init()
		expect(dynamic.each()).toMatchSnapshot([
			{
				fileName: expect.any(String),
				id: expect.any(String),
				type: 'chunk'
			},
			{
				fileName: expect.any(String),
				id: expect.any(String),
				type: 'chunk'
			},
			{
				fileName: expect.any(String),
				id: expect.any(String),
				type: 'chunk'
			}
		])
	})
})
