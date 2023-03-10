import chalk from 'chalk'
declare const _default: {
	error: (msg: string, space?: boolean) => never
	warning: (msg: string, space?: boolean) => void
	primary: (msg: string, space?: boolean) => void
	logger: (msg: string, isSpace?: boolean | undefined) => void
	packageName: string
	desc: chalk.Chalk
}
export default _default
