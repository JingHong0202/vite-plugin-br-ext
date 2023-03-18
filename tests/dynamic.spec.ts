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
`,
	`
const files2 = ['./content/inject.ts']
const files1 = ['./content/inject.ts',...files2]
chrome.scripting.executeScript({
		files: [...files1],
		target: { }
})
chrome.scripting.executeScript({
		files: [...files1],
		target: { }
})
`
]

const files2 = [
	`
chrome.scripting.insertCSS({
		files: ['./style.css'],
		target: { }
})
`,
	`
let files
files = [];
(function() {
files = ['./style.css']
})()
chrome.scripting.insertCSS({
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
chrome.scripting.insertCSS({
		files,
		target: {  }
})



file3 = [1]
const file4 = ["./style.css"]
file3 = file4
`,
	`
chrome.scripting.insertCSS({
		files: [    './example/input/scripts/content/inject.ts',  './example/input/scripts/background.ts'],
		target: { }
})
`,
	`
const files2 = ['./style.css','./style.css','./style.css']
chrome.scripting.insertCSS({
		files: [    './style.css', ...files2],
		target: { }
})
`,
	`
const files3 =  ['./style.css'];
const files2 = ['./style.css',...files3]
const files = ['./style.css',...files2]
chrome.scripting.insertCSS({
		files: [    ...files],
		target: { }
})
`,
	`
const files2 = ['./style.css']
const files1 = ['./style.css',...files2]
chrome.scripting.insertCSS({
		files: [...files1],
		target: { }
})
chrome.scripting.insertCSS({
		files: [...files1],
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

describe('JS Normalize', () => {
	const root = path.resolve(__dirname, './example/input/scripts')
	test('parse', () => {
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

	test('deep parse', () => {
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

	describe('multiple', () => {
		test('parse', async () => {
			expect(() => {
				const dynamic = new DynamicUtils({
					attrName: 'chrome.scripting.executeScript',
					code: files[6],
					root
				})
				const { code } = dynamic.generateCode()

				expect(dynamic.emitFiles).toHaveLength(4)

				emitFilesLint(dynamic.emitFiles, code)

				if (code.includes(`files1`) || code.includes(`files2`)) {
					throw Error(`files2 block should not exist`)
				}
			}).not.toThrowError()
		})
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
					code.includes(`files3`) ||
					code.includes(`files2`) ||
					code.includes(`files =`)
				) {
					throw Error(`block should not exist`)
				}
			}).not.toThrowError()
		})
	})
})

describe('Style Normalize', () => {
	const root = path.resolve(__dirname, './example/input/style')
	test('parse', () => {
		expect(() => {
			const dynamic = new DynamicUtils({
				attrName: 'chrome.scripting.insertCSS',
				code: files2[0],
				root,
				type: 'asset'
			})
			const { code } = dynamic.generateCode()

			expect(dynamic.emitFiles).toHaveLength(1)

			emitFilesLint(dynamic.emitFiles, code)
		}).not.toThrowError()

		expect(() => {
			const dynamic = new DynamicUtils({
				attrName: 'chrome.scripting.insertCSS',
				code: files2[1],
				root,
				type: 'asset'
			})
			const { code } = dynamic.generateCode()

			expect(dynamic.emitFiles).toHaveLength(1)

			emitFilesLint(dynamic.emitFiles, code)
		}).not.toThrowError()

		// expect(
		// 	new DynamicUtils({
		// 		attrName: 'chrome.scripting.insertCSS',
		// 		code: files2[1]
		// 	}).init()
		// ).toMatchSnapshot()
		// expect(
		// 	new DynamicUtils({
		// 		attrName: 'chrome.scripting.insertCSS',
		// 		code: files2[2]
		// 	}).init()
		// ).toMatchSnapshot()
	})

	test('deep parse', () => {
		expect(() => {
			const dynamic = new DynamicUtils({
				attrName: 'chrome.scripting.insertCSS',
				code: files2[2],
				root
			})
			const { code } = dynamic.generateCode()

			expect(dynamic.emitFiles).toHaveLength(1)

			emitFilesLint(dynamic.emitFiles, code)
		}).not.toThrowError()
	})

	describe('multiple', () => {
		test('parse', async () => {
			expect(() => {
				const dynamic = new DynamicUtils({
					attrName: 'chrome.scripting.insertCSS',
					code: files2[6],
					root
				})
				const { code } = dynamic.generateCode()

				expect(dynamic.emitFiles).toHaveLength(4)

				emitFilesLint(dynamic.emitFiles, code)

				if (code.includes(`files1`) || code.includes(`files2`)) {
					throw Error(`files2 block should not exist`)
				}
			}).not.toThrowError()
		})
	})

	describe('SpreadElement', () => {
		test('parse', async () => {
			// const dynamic = new DynamicUtils({
			// 	attrName: 'chrome.scripting.insertCSS',
			// 	code: files2[4],
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
					attrName: 'chrome.scripting.insertCSS',
					code: files2[4],
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
					attrName: 'chrome.scripting.insertCSS',
					code: files2[5],
					root
				})
				const { code } = dynamic.generateCode()

				expect(dynamic.emitFiles).toHaveLength(3)

				emitFilesLint(dynamic.emitFiles, code)

				if (
					code.includes(`files3`) ||
					code.includes(`files2`) ||
					code.includes(`files =`)
				) {
					throw Error(`block should not exist`)
				}
			}).not.toThrowError()
		})
	})
})
