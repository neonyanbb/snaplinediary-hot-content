# snaplinediary-hot-content

> **本地路径**：本仓库即 **`05-探索区/03-发布区（github）/02-提交发布`**（Git 根目录；在此执行 `git` / `npm run build` / `git push`）。

热点内容站点源码：**Markdown 编写 → Eleventy 构建为 HTML → Cloudflare Pages** 发布至 `https://hot.snaplinediary.cn`。

详细步骤见探索区文档：`02-实施阶段-v1.0-20260508/100-热站实施操作手册-v1.0-20260509.md`。发布纪律见：`03-发布区（github）/01-准发布区/00-准发布区工作规则.md`。

## 本地开发

```bash
npm install
npm run serve
```

浏览器访问终端提示的本地地址（一般为 `http://localhost:8080`）。

## 构建

```bash
npm run build
```

产物输出目录：`_site/`（Cloudflare Pages **Output directory** 填 `_site`）。

## 从探索区同步终稿

在实施阶段目录完成 `03-final/*.md` 后：

```bash
./scripts/sync-from-explore.sh
npm run build
```

## 广告环境变量（可选）

构建时注入 AdSense（与 Cloudflare Pages Environment variables 名称一致）：

| 变量 | 说明 |
|------|------|
| `ADSENSE_CLIENT_ID` | `ca-pub-xxxxxxxx`（不要省略前缀） |
| `ADSENSE_SLOT_TOP` | 页首（正文前）展示广告单元 slot |
| `ADSENSE_SLOT_BOTTOM` | 正文结束后展示广告单元 slot |

本地测试示例：

```bash
export ADSENSE_CLIENT_ID="ca-pub-xxxxxxxx"
export ADSENSE_SLOT_TOP="1234567890"
export ADSENSE_SLOT_BOTTOM="0987654321"
npm run build
```

未设置时站点仍可构建，仅不输出广告位 HTML。

## 静态根文件

将 `ads.txt`、Google 验证用 `google*.html` 放在 `static/`，构建后会复制到站点根路径。
