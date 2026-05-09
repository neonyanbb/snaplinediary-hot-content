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
- **文章内嵌广告**：默认 **`articleAdUnitStyle`: `in-article`**（`data-ad-layout="in-article"` + `data-ad-format="fluid"`），插入位置为 **正文前两段 `<p>` 之后**（与 AdSense 向导建议一致）；若为「展示广告」单元，请将配置改为 **`"articleAdUnitStyle": "display"`** 或环境变量 **`ADSENSE_ARTICLE_STYLE=display`**。
- **slot**：在 **`hot-site.config.json`** 填写 **`articleAdSlot`**，或在 Cloudflare **`ADSENSE_ARTICLE_SLOT`**（优先）。未设置 slot 时仅输出 `<head>` 全局脚本。
- **勿**在文中重复粘贴整段 `adsbygoogle.js` 外链脚本，以免重复加载。

## ads.txt

构建时会写入 `_site/ads.txt`（当前发布商 ID 与仓库配置一致）。若 AdSense 控制台另有要求，以控制台为准并改 **`tools/build-articles.mjs`** 末尾写入逻辑。

## 发布

```bash
git add .
git commit -m "content: build hot articles html"
git push origin main
```
