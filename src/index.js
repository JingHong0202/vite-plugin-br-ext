
console.log(1);

chrome.bookmarks.create(
  { 'title': 'Extension bookmarks'},
  function(newFolder) {
    console.log("added folder: " + newFolder.title);
  },
);

