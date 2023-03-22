module.exports = {
	env: {
		node: true,
		es2022: true
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/recommended-requiring-type-checking'
	],
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	root: true,
	parserOptions: {
		project: true,
		tsconfigRootDir: __dirname,
		ecmaVersion: 'latest'
	},
	rules: {
		'@typescript-eslint/no-non-null-assertion': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-unsafe-member-access': 'off',
		'@typescript-eslint/no-unsafe-return': 'off',
		'@typescript-eslint/no-unsafe-assignment': 'off',
		'@typescript-eslint/ban-ts-comment': 'off',
		"@typescript-eslint/no-floating-promises": "off",
		'no-mixed-spaces-and-tabs': 'off',
		"@typescript-eslint/no-unsafe-call": 'off',
		"semi": "off",
    "@typescript-eslint/semi": "off"
		// '@typescript-eslint/no-floating-promises': 'off'
	}
}
