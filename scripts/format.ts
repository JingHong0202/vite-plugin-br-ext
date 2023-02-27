import { spawn } from 'node:child_process'
import log from '../utils/logger'
import inquirer from 'inquirer'
import { space } from '../utils/reg'

// console.log(process.argv)

execScript('npx', ['prettier', '--check', '.'])
	.then(() => {
		inquirer
			.prompt([
				{
					type: 'confirm',
					message: 'Format or not?',
					name: 'is'
				}
			])
			.then(async ({ is }) => {
				if (is) {
					await execScript('npx', ['prettier', '--write', '.'])
				}
			})
			.catch(err => {
				log.error(<string>err)
			})
	})
	.catch(err => {
		throw Error(<string>err)
	})

function execScript(command: string, options: string[]): Promise<void> {
	return new Promise((resolve, reject) => {
		const child = spawn(
			/^win/.test(process.platform) ? command + '.cmd' : command,
			options
		)

		child.stdout.on('data', (data: string) => {
			log.primary(`${data}`.replace(space, ''), false)
		})

		child.stderr.on('data', (data: string) => {
			log.warning(`${data}`.replace(space, ''), false)
		})

		child.on('close', code => {
			if (code === 1) {
				resolve()
			} else if (code !== 0 && code !== 1) {
				reject(code)
			}
		})
		child.on('error', (err: string) => {
			reject(err)
		})
	})
}
