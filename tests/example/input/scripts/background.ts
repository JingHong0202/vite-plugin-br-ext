import BookMarkUtils from '../class/bookmark'

//  chrome.bookmarks.getTree(function (res) {
//     send('init', res);
//   });

chrome.tabs.onActivated.addListener(activeInfo => {
	chrome.scripting.executeScript({
		files: ['./content/inject.ts'],
		target: { tabId: activeInfo.tabId }
	})
})
const _bookmark = new BookMarkUtils()
