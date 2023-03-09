import { describe, test, expect } from 'vitest'
import parser from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import template from '@babel/template'
import types from '@babel/types'

const input = `import BookMarkUtils from '../class/bookmark'

//  chrome.bookmarks.getTree(function (res) {
//     send('init', res);
//   });

chrome.tabs.onActivated.addListener((activeInfo:number) => {
	chrome.scripting.executeScript({
		files: ['./content/inject.ts'],
		target: { tabId: activeInfo.tabId }
	})
})
const _bookmark = new BookMarkUtils()
`

function matchDynamicFileUrl(atttName: string, code: string) {
	return new Promise(resolve => {
		const ast = parser.parse(code, {
			sourceType: 'unambiguous',
			plugins: ['typescript'],
			attachComment: false,
			tokens: false
		})
		traverse(ast, {
			MemberExpression(child) {
				if (child != atttName) return
				console.log(child)
				const args = child.parent.arguments[0].properties
				const files = args.find(item => item.key.name === 'files')
				if (files && files.value?.elements && files.value?.elements?.length) {
					resolve(files.value.elements)
					child.stop()
				}
			}
		})
	})
}

describe('match', () => {
	test('parse', async () => {
		const files = await matchDynamicFileUrl(
			'chrome.scripting.executeScript',
			input
		)
		// const o = generate(ast)
		console.log(files)
	})
})
