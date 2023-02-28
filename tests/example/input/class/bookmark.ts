import MessageUtils from './message'

export default class BookMarkUtils extends MessageUtils {
	constructor() {
		// init step

		/**
		 *  only title and url changes trigger this.
		 */
		chrome.bookmarks.onChanged.addListener(() => {
			this.getTree({ type: 'changed' })
		})

		chrome.bookmarks.onCreated.addListener(() => {
			this.getTree({ type: 'created' })
		})
		chrome.bookmarks.onMoved.addListener(() => {
			this.getTree({ type: 'move' })
		})
		chrome.bookmarks.onRemoved.addListener(() => {
			this.getTree({ type: 'remove' })
		})
		chrome.bookmarks.onImportEnded.addListener(() => {
			this.getTree({ type: 'importended' })
		})
		super().init(this)
	}

	getTree({ type, sync }) {
		if (!sync) {
			chrome.bookmarks.getTree(res => {
				this.send(type, res)
			})
		} else {
			return new Promise((resolve, reject) => {
				chrome.bookmarks.getTree(res => {
					;(res && resolve(res)) || reject('getTree sync error')
				})
			})
		}
	}
}
