import { describe, test, expect } from 'vitest'
import { ManiFest } from '../manifest'
import { InputOptions } from 'rollup'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'

const InputsKeys = ['popup/main', 'scripts/background']

function eachExist(inputs: InputOptions) {
	Object.values(inputs).forEach((path: string) => {
		const isExists = existsSync(path)
		if (!isExists) throw Error(`${path} Not Exist\n\r parse path error`)
	})
}

describe('String Input', () => {
	const options: InputOptions = {
		input: resolve(__dirname, './example/input/manifest.json')
	}
	let manifest: ManiFest
	test('Not Null', () => {
		expect(() => (manifest = new ManiFest(options))).not.toThrowError()
		// @ts-ignore
		expect(manifest.inputs).not.equal({})
	})

	test('Contains', () => {
		expect(manifest.inputs).keys(InputsKeys)
		expect(() => eachExist(manifest.inputs)).not.toThrowError()
	})
})

describe('Object Input', () => {
	const options: InputOptions = {
		input: {
			'*': resolve(__dirname, './example/input/manifest.json')
		}
	}
	let manifest: ManiFest
	test('Not Null', () => {
		expect(() => (manifest = new ManiFest(options))).not.toThrowError()
		// @ts-ignore
		expect(manifest.inputs).not.equal({})
	})

	test('Contains', () => {
		expect(manifest.inputs).keys(InputsKeys)
		expect(() => eachExist(manifest.inputs)).not.toThrowError()
	})
})

describe('Array Input', () => {
	const options: InputOptions = {
		input: [resolve(__dirname, './example/input/manifest.json')]
	}
	let manifest: ManiFest
	test('Not Null', () => {
		expect(() => (manifest = new ManiFest(options))).not.toThrowError()
		// @ts-ignore
		expect(manifest.inputs).not.equal({})
	})

	test('Contains', () => {
		expect(manifest.inputs).keys(InputsKeys)
		expect(() => eachExist(manifest.inputs)).not.toThrowError()
	})
})
