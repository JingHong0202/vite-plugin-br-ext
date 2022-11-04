const inputsReg = /\.((html)|(((j)|(t))s)x?)/;
const isNetWorkLink = /(https?:)?\/\//g;
const includeNumber = /\d/g;
const isWebResources = /web_accessible_resources\.\d{1,}\.resources/;
const isJSFile = /\.((j)|(t))sx?/;
const isPrepCSSFile = /\.(([ls][eca]ss)|(styl))/;

export {
  inputsReg,
  isNetWorkLink,
  includeNumber,
  isWebResources,
  isJSFile,
  isPrepCSSFile,
};
