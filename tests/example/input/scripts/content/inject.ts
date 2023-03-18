import MessageUtils from '../../class/message'

new MessageUtils()
// chrome.runtime.onMessage.addListener(function (
//   { type, data },
//   { id },
//   sendResponse
// ) {
//   console.log(arguments);
// });
chrome.runtime.sendMessage(
	chrome.runtime.id,
	{
		type: 'init'
	},
	response => {
		console.log(response)
	}
)

const a: string = '123123'

console.log(a)
