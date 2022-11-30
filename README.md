# vite-plugin-chrome-extension
> vite plugin 用于游览器扩展开发
> Support manifest V3

Usage  

vite.config.js
```
build: {
  rollupOptions: {
    input: "manifest.json // 路径 默认 根目录/src/manifest.json",
  },
}
```

Bug   
1.当 dynamic input path 不是纯字符串而是变量的时候，无法解析文件
