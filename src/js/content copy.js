alert(1);

chrome.scripting.executeScript(
  {
    target: { tabId: 1 },
    files: ['./js copy/content.js'],
  },
  () => {}
);


chrome.scripting.insertCSS(
  {
    target: { tabId: 1 },
    files: [import.meta.url("../popup/style1 copy.scss"),"popup/style1 copy.scss"],
  },
  () => {}
);