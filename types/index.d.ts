export type BrExtOptions = {
	reload?: {
		browser?: string
		port?: number
	}
	command?: string
	mode?: 'development' | 'production'
}
declare const _default: (
	options?: BrExtOptions
) => import('vite').Plugin | import('vite').Plugin[]
export default _default
