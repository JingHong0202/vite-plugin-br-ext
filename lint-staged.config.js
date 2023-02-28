import { ESLint } from 'eslint'

const removeIgnoredFiles = async files => {
	const eslint = new ESLint()
	const isIgnored = await Promise.all(
		files.map(file => {
			return eslint.isPathIgnored(file)
		})
	)
	const filteredFiles = files.filter((_, i) => !isIgnored[i])
	return filteredFiles.join(' ')
}

export default {
	'*.{ts,tsx,js,jsx}': async files => {
		const filesToLint = await removeIgnoredFiles(files)
		return [`eslint --max-warnings=0 ${filesToLint}`]
	},
	'**/*': files => {
		return [`prettier --write --ignore-unknown ${files.join(' ')}`]
	}
}

// "lint-staged": {
// 		"*!(*example*)*.ts": [
// 			"eslint --fix --max-warnings=0"
// 		],
// 		"**/*": [
// 			"prettier --write --ignore-unknown"
// 		]
// 	}
