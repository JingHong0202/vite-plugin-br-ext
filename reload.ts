import { Server } from 'socket.io'
import type { Plugin } from 'vite'

export default (): Plugin => {
	const io = new Server(8890, {
		cors: {
			origin: '*',
			credentials: true,
			allowedHeaders: '*'
		}
	})
	return {
		name: 'vite-plugin-br-ext-reload',
		enforce: 'post',
		closeBundle() {
			io.emit('change')
		}
	}
}
