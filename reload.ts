import { Server } from 'socket.io'

export default () => {
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
