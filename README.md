# snaplinediary-hot-content

热点站 **`hot.snaplinediary.cn`**：Markdown 源稿构建为静态 HTML，部署到 Cloudflare Pages（输出目录 **`_site`**）。

## 构建

```bash
npm ci
npm run build
```

## 配置

- **`hot-site.config.json`**：`siteOrigin`、`adsenseClient`、`articleAdSlot`、`articleAdUnitStyle`（`in-article` | `display`）、主站 CSS 外链。
- 环境变量（可选）：**`ADSENSE_ARTICLE_SLOT`**、**`ADSENSE_ARTICLE_STYLE`**（构建时优先于 JSON）。

文中广告勿重复插入全局 `adsbygoogle.js`（已由模板写入 `<head>`）。**`ads.txt`** 由构建写入 **`_site/ads.txt`**。

## 发布

推送 **`main`** 触发 Pages 构建即可。
