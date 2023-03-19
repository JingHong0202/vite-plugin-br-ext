import BookMarkUtils from '../class/bookmark'

//  chrome.bookmarks.getTree(function (res) {
//     send('init', res);
//   });

chrome.tabs.onActivated.addListener(activeInfo => {
	chrome.scripting.insertCSS({
		files: ['../style/style-sass.scss'],
		target: { tabId: activeInfo.tabId }
	})

	chrome.scripting.insertCSS({
		files: ['../style/style-scss.sass'],
		target: { tabId: activeInfo.tabId }
	})
	chrome.scripting.insertCSS({
		files: ['../style/style.css'],
		target: { tabId: activeInfo.tabId }
	})
})
const _bookmark = new BookMarkUtils()
