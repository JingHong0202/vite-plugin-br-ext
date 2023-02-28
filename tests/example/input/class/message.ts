export default class MessageUtils {
	constructor() {
		chrome.runtime.onMessage.addListener(this.onMessage.bind(this))
	}

	async init(child) {
		this.tree = await child.getTree({ sync: true })
	}

	send(type, data) {
		chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
			tabs.forEach(tab => {
				chrome.tabs.sendMessage(tab.id, {
					type,
					data
				})
			})
		})
	}

	onMessage({ type }, sender, sendResponse) {
		switch (type) {
			case 'init':
				sendResponse(this.tree)
				break
			default:
				console.log(arguments)
		}
	}
}
