declare const _default: {
	error: (msg: string, space?: boolean) => void
	warning: (msg: string, space?: boolean) => void
	primary: (msg: string, space?: boolean) => void
	logger: (msg: string, isSpace?: boolean | undefined) => void
	packageName: string
	desc: import('chalk').ChalkInstance
}
export default _default
