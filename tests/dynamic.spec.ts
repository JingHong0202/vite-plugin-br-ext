import { describe, test, expect } from 'vitest'
import DynamicUtils from '../utils/dynamic-utils'
import path from 'node:path'

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
files = ['./content/inject.ts']
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
const file4 = ["./content/inject.ts"]
file3 = file4
`,
	`
chrome.scripting.executeScript({
		files: [    './example/input/scripts/content/inject.ts',  './example/input/scripts/background.ts'],
		target: { }
})
`,
	`
const files2 = ['./content/inject.ts','./content/inject.ts','./content/inject.ts']
chrome.scripting.executeScript({
		files: [    './content/inject.ts', ...files2],
		target: { }
})
`,
	`
const files3 =  ['./content/inject.ts'];
const files2 = ['./content/inject.ts',...files3]
const files = ['./content/inject.ts',...files2]
chrome.scripting.executeScript({
		files: [    ...files],
		target: { }
})
`
]

function emitFilesLint(files, code) {
	files.forEach(item => {
		if (code.indexOf(item.fileName) === -1) {
			throw Error(`Not Found in the ${item.fileName} of code`)
		}
	})
}

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

const root = path.resolve(__dirname, './example/input/scripts')
describe('normalize', () => {
	test('match', () => {
		expect(() => {
			const dynamic = new DynamicUtils({
				attrName: 'chrome.scripting.executeScript',
				code: files[0],
				root
			})
			const { code } = dynamic.generateCode()

			expect(dynamic.emitFiles).toHaveLength(1)

			emitFilesLint(dynamic.emitFiles, code)
		}).not.toThrowError()

		expect(() => {
			const dynamic = new DynamicUtils({
				attrName: 'chrome.scripting.executeScript',
				code: files[1],
				root
			})
			const { code } = dynamic.generateCode()

			expect(dynamic.emitFiles).toHaveLength(1)

			emitFilesLint(dynamic.emitFiles, code)
		}).not.toThrowError()

		// expect(
		// 	new DynamicUtils({
		// 		attrName: 'chrome.scripting.executeScript',
		// 		code: files[1]
		// 	}).init()
		// ).toMatchSnapshot()
		// expect(
		// 	new DynamicUtils({
		// 		attrName: 'chrome.scripting.executeScript',
		// 		code: files[2]
		// 	}).init()
		// ).toMatchSnapshot()
	})

	test('deep find', () => {
		expect(() => {
			const dynamic = new DynamicUtils({
				attrName: 'chrome.scripting.executeScript',
				code: files[2],
				root
			})
			const { code } = dynamic.generateCode()

			expect(dynamic.emitFiles).toHaveLength(1)

			emitFilesLint(dynamic.emitFiles, code)
		}).not.toThrowError()
	})

	// test('parse', async () => {
	// const dynamic = new DynamicUtils({
	// 	attrName: 'chrome.scripting.executeScript',
	// 	code: files[3],
	// 	root: process.cwd() + '/tests/'
	// })
	// await dynamic.init()
	// expect(dynamic.each()).toMatchSnapshot([
	// 	{
	// 		fileName: expect.any(String),
	// 		id: expect.any(String),
	// 		type: 'chunk'
	// 	},
	// 	{
	// 		fileName: expect.any(String),
	// 		id: expect.any(String),
	// 		type: 'chunk'
	// 	}
	// ])
	// })
})

describe('SpreadElement', () => {
	test('parse', async () => {
		// const dynamic = new DynamicUtils({
		// 	attrName: 'chrome.scripting.executeScript',
		// 	code: files[4],
		// 	root: process.cwd() + '/tests/'
		// })
		// await dynamic.init()
		// expect(dynamic.each()).toMatchSnapshot([
		// 	{
		// 		fileName: expect.any(String),
		// 		id: expect.any(String),
		// 		type: 'chunk'
		// 	},
		// 	{
		// 		fileName: expect.any(String),
		// 		id: expect.any(String),
		// 		type: 'chunk'
		// 	}
		// ])

		expect(() => {
			const dynamic = new DynamicUtils({
				attrName: 'chrome.scripting.executeScript',
				code: files[4],
				root
			})
			const { code } = dynamic.generateCode()

			expect(dynamic.emitFiles).toHaveLength(4)

			emitFilesLint(dynamic.emitFiles, code)

			if (
				code.includes(
					`const files2 = ['./content/inject.ts','./content/inject.ts','./content/inject.ts']`
				)
			) {
				throw Error(`files2 block should not exist`)
			}
		}).not.toThrowError()
	})

	test('deep parse', async () => {
		expect(() => {
			const dynamic = new DynamicUtils({
				attrName: 'chrome.scripting.executeScript',
				code: files[5],
				root
			})
			const { code } = dynamic.generateCode()

			expect(dynamic.emitFiles).toHaveLength(3)

			emitFilesLint(dynamic.emitFiles, code)

			if (
				code.includes(`files3`) &&
				code.includes(`files2`) &&
				code.includes(`files`)
			) {
				throw Error(`block should not exist`)
			}
		}).not.toThrowError()
	})
})
