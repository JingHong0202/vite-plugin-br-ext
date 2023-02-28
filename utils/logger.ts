import chalk from 'chalk'
import packageJSON from '../package.json' assert { type: 'json' }

const _log = (msg: string, isSpace?: boolean) =>
	console.log(isSpace ? `\n${msg}\n` : msg)

export default {
	error: (msg: string, space = true) => {
		_log(chalk.red.bold(msg), space)
		throw Error(msg)
	},
	warning: (msg: string, space = true) => _log(chalk.yellow.bold(msg), space),
	primary: (msg: string, space = true) => _log(chalk.blue.bold(msg), space),
	logger: _log,
	packageName: chalk.blueBright.bold(
		`${packageJSON.name} ${packageJSON.version}:`
	),
	desc: chalk.greenBright.bold
}
