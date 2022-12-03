# vite-plugin-br-ext

> vite plugin 用于游览器扩展开发  
> Now Support Chrome manifest V3

## Usage

1.install

```npm
npm install vite-plugin-br-ext -D
```

2.vite.config.js

> 2.1 导入 vite 插件

```js
import bex from 'vite-plugin-br-ext';

plugins: [bex()];
```

> 2.2 设置入口文件

```js
build: {
  rollupOptions: {
    input: "manifest.json // 路径 默认 根目录/src/manifest.json",
  },
}
```

3.manifest.json

> 资源以相对路径访问即可

```json
{
  "name": "first extension",
  "version": "0.0.1",
  "manifest_version": 3,
  "description": "test extension",
  "action": {
    "default_popup": "./src/popup/popup.html",
    "default_title": "Click me"
  },
  "background": {
    "service_worker": "./src/index.js",
    "type": "module"
  },
  "web_accessible_resources": [
    {
      "resources": ["./asset/*"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

Bug  
1.当 dynamic input path 不是纯字符串而是变量的时候，无法解析文件
