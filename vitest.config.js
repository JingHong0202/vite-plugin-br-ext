import { defineConfig } from 'vite'

export default defineConfig({
	test: {
		// threads: false
		testTimeout: 25000
	}
})
