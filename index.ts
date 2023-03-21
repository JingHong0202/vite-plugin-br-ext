import main from './main'
import reload from './reload'

export type BrExtOptions = {
	reload?: {
		browser?: string
		port?: number
	}
	command?: string
	mode?: 'development' | 'production'
}

export default (options?: BrExtOptions) => {
	return options?.mode === 'development' && options.reload
		? [main(), reload(options)]
		: main()
}
