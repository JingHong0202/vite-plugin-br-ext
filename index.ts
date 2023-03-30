import main from './main'
import reload from './reload'

export type BrExtOptions = {
	reload?: {
		browser?: string
		port?: number
		userDataDir?: boolean | string
	}
	// command?: string
	mode?: string
}

export default (options?: BrExtOptions) => {
	return options?.mode === 'development' && options.reload
		? [main(), reload(options)]
		: main()
}
