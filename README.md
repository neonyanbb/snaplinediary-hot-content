# snaplinediary-hot-content

**Git 根目录**：`05-探索区/03-发布区（github）/02-提交发布`

## 构建

源稿：`content/**/*.md`（由 `01-准发布区` 合并而来）。

```bash
npm install
npm run build
```

产物：`_site/`（Cloudflare Pages **Output directory** = `_site`）。

## 排版与广告

- HTML 使用主站 **`article.css`**、**`site-chrome.css`** 外链（与 `snaplinediary.cn/articles` 一致），正文容器类名为 **`art-shell` / `art-prose`** 等。
- **全局 AdSense 脚本**（你提供的 `adsbygoogle.js?client=…`）注入在每篇文章 **`<head>`**。
- **正文中部展示广告**：需在 **`hot-site.config.json`** 填写 **`articleAdSlot`**（AdSense → 广告 → 按广告单元 → 新建「展示广告」→ 复制 **`data-ad-slot`** 数字串），或在 Cloudflare Pages 环境变量 **`ADSENSE_ARTICLE_SLOT`** 中设置；二者构建时 **优先读环境变量**。未设置 slot 时 **仅保留 `<head>` 脚本**，文中块不输出（避免无效占位）。
- **勿**在文中重复粘贴整段 `adsbygoogle.js` 外链脚本，以免重复加载。

## ads.txt

构建时会写入 `_site/ads.txt`（当前发布商 ID 与仓库配置一致）。若 AdSense 控制台另有要求，以控制台为准并改 **`tools/build-articles.mjs`** 末尾写入逻辑。

## 发布

```bash
git add .
git commit -m "content: build hot articles html"
git push origin main
```
