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

```ts
import bex from 'vite-plugin-br-ext'

/**
 * 插件自动重载需主动开启
 * tips： 需要配合 vite build -w --mode development
 */

type BrExtOptions = {
	reload?: {
		browser?: string  // browser file local url
		port?: number  // browser port
	}
	mode?: string  // development open debug| production close debug
}

plugins: [bex(options: BrExtOptions)]
```

> 2.2 设置入口文件

```ts
build: {
	rollupOptions: {
		input: 'manifest.json' // 路径 默认 根目录/src/manifest.json,
	}
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

> Support content_scripts Usage Vue

```json
"content_scripts": [
    {
      "matches": ["<all_urls>"],
      "run_at": "document_start",
      "js": ["main.js"]
    }
]
```

> main.js

```js
import { createApp } from 'vue'
import App from './App.vue'
createApp(App).mount(document.documentElement)
```
