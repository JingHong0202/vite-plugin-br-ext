export type BrExtOptions = {
	reload?: {
		browser?: string
		port?: number
		userDataDir?: boolean | string
	}
	mode?: string
}
declare const _default: (
	options?: BrExtOptions
) => import('vite').Plugin | import('vite').Plugin[]
export default _default
