const inputsReg = /\.((html)|(((j)|(t))s)x?)/;
const isNetWorkLink = /(https?:)?\/\//g;
const includeNumber = /\d/g;
const isWebResources = /web_accessible_resources\.\d{1,}\.resources/;
const isJSFile = /\.((j)|(t))sx?/;
const isPrepCSSFile = /\.(([ls][eca]ss)|(styl))/;

const clipReg = tag =>
  new RegExp(
    `document[\\s\\n]*\.[\\s\\n]*execCommand[\\s\\n]*\\([\\s\\n]*['"][\\s\\n]*${tag}[\\s\\n]*['"][\\s\n]*\\)`
  );

export {
  inputsReg,
  isNetWorkLink,
  includeNumber,
  isWebResources,
  isJSFile,
  isPrepCSSFile,
  clipReg,
};
