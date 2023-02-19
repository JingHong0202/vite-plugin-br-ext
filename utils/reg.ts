const inputsReg = /\.((html)|(((j)|(t))s)x?)/;
const isNetWorkLink = () => /(https?:)?\/\//g;
const includeNumber = () => /\d/g;
const isWebResources = /web_accessible_resources\.\d{1,}\.resources/;
const isJSFile = /\.((j)|(t))sx?/;
const isPrepCSSFile = /\.(([ls][eca]ss)|(styl))/;

const clipReg = (tag: string) =>
  new RegExp(
    `document[\\s\\n]*\.[\\s\\n]*execCommand[\\s\\n]*\\([\\s\\n]*['"][\\s\\n]*${tag}[\\s\\n]*['"][\\s\n]*\\)`
  );

const PermissionNormalReg = (tag: string) => {
  let split = tag.split('.');
  if (split.length > 1) {
    return new RegExp(
      `chrome[\\s\\n]*\\.${split
        .map(item => `[\\s\\n]*${item}[\\s\\n]*`)
        .join('.')}`
    );
  } else {
    return new RegExp(`chrome[\\s\\n]*\\.[\\s\\n]*${tag}`);
  }
};

const executeScriptReg = () =>
  /chrome[\s\n]*\.[\s\n]*scripting[\s\n]*\.[\s\n]*executeScript\(/gm;

const insertCSSReg = () =>
  /chrome[\s\n]*\.[\s\n]*scripting[\s\n]*\.[\s\n]*insertCSS\(/gm;

const annotationRows = () =>
  /((?:^|\n|\r)\s*\/\*[\s\S]*?\*\/\s*(?:\r|\n|$))|(?:^|\n|\r)\s*\/\/.*(?:\r|\n|$)/gm;

const filesReg = () => /files[\s\n]*:[\s\n]*\[([\"\']?.*[\"\']?,?)*\]/;

export {
  inputsReg,
  isNetWorkLink,
  includeNumber,
  isWebResources,
  isJSFile,
  isPrepCSSFile,
  clipReg,
  PermissionNormalReg,
  executeScriptReg,
  insertCSSReg,
  annotationRows,
  filesReg,
};
