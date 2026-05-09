# 时线日记 · 顶栏与页脚资源包（供 hot 子域及同源改版）

本目录为从主仓库抽出的**导航条、页脚相关源码**及**全站视觉规范**，便于 `hot.snaplinediary.cn` 等子域对齐官网气质。

## 文件清单

| 文件 | 说明 |
|------|------|
| `STYLE_GUIDE.md` | **必读**：配色、字体、圆角、组件层级、动效与子域改版建议 |
| `snapline-tokens.css` | CSS 变量 + `.w` 版心 + 可选 `body.snapline-theme` 基础 |
| `site-chrome.css` | 顶栏、页脚、`site-foot`、隐私弹窗样式、移动端抽屉菜单 |
| `site-chrome.js` | 导航滚动态、移动菜单、跳转官网锚点、`data-site-root`、隐私弹窗逻辑 |
| `fonts-head-snippet.html` | Google Fonts 引用片段 |
| `nav-fragment-reference.html` | 顶栏 HTML 参考（含跨域绝对链接示例） |
| `footer-fragment-reference.html` | 页脚 HTML 参考 |

## 集成顺序建议

1. 在页面 `<head>` 粘贴 `fonts-head-snippet.html`，再引入 `snapline-tokens.css`，最后引入 `site-chrome.css`。
2. `<body>` 可使用 class `snapline-theme`（若与子站现有样式冲突则仅引入变量文件自行写 body）。
3. 复制 `nav-fragment-reference.html` / `footer-fragment-reference.html` 结构，替换 Logo 路径与链接。
4. 若与官网**同源**且保留 `onclick="siteChromeGoTo('features')"` 等写法：需加载官网同款 `site-i18n.js`（提供 `getSnaplineStr`），`body` 设置 `data-site-root`，并引入 `site-chrome.js`。
5. 若子域为**独立静态站**：优先采用参考片段中的**绝对 URL + `href`**，可不加载 `site-chrome.js`，仅用 CSS；CTA 按钮仍建议 `border-radius: 100px` + `--accent` 填充。

## Logo 与图标

主仓路径：`images/sharp-webp/logo-68.webp`、`images/sharp/favicon-32.png`。子域可 CDN 或镜像同路径以保持统一。

## 压缩包

仓库同级目录提供 `brand-bundle-hot-subdomain.zip`（由本文件夹打包生成），便于单独发送或归档。
