declare const inputsReg: RegExp
declare const isNetWorkLink: () => RegExp
declare const includeNumber: () => RegExp
declare const isWebResources: RegExp
declare const isJSFile: RegExp
declare const isVueFile: RegExp
declare const isPrepCSSFile: RegExp
declare const clipReg: (tag: string) => RegExp
declare const PermissionNormalReg: (tag: string) => RegExp
declare const executeScriptReg: () => RegExp
declare const insertCSSReg: () => RegExp
declare const annotationRows: () => RegExp
declare const filesReg: () => RegExp
declare const space: RegExp
export {
	inputsReg,
	isNetWorkLink,
	includeNumber,
	isWebResources,
	isJSFile,
	isPrepCSSFile,
	clipReg,
	PermissionNormalReg,
	executeScriptReg,
	insertCSSReg,
	annotationRows,
	filesReg,
	space,
	isVueFile
}
