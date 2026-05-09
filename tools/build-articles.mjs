// Markdown → HTML for Cloudflare Pages (_site/).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content");
const OUT = path.join(ROOT, "_site");
const BRAND_DIR = path.join(ROOT, "brand-bundle-hot-subdomain");
const BRAND_ASSETS_WEB = "/assets/brand";
/** 与 nav/footer 片段 REPLACE_LOGO_PATH/logo-68.webp 对应，产物见 copyBrandAssetsToSite */
const LOGO_BASE = BRAND_ASSETS_WEB;

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

/** 正文内广告槽（顶栏改为主站 nav，见 brand-bundle） */
const HOT_CSS_ARTICLE = `
.art-ad-slot{margin:2rem 0;padding:1rem 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
/*
 * 根因：article.css 里 .w 先写 padding:0 48px，其后 .art-shell 又用 padding:48px 0 100px 整条简写覆盖，
 * 左右被写成 0，版心与顶栏 .nav-inner（左右 48px）错位约一整格 gutter，面包屑看起来像「超出边界」。
 */
article.art-shell.w{padding-left:48px;padding-right:48px}
@media(max-width:768px){article.art-shell.w{padding-left:24px;padding-right:24px}}
/* 顶栏 68px + chrome-page-pad 原先 88px 会在固定导航下留出「透明缝」，滚动时正文会闪过 */
article.art-shell.w.chrome-page-pad{padding-top:68px!important}
/* 正文排版沿用主站 article.css（720px prose + 居中）；勿再覆盖 margin/padding，否则会变成满宽左贴「不像手记页」 */
/* 详情页：路径 + 侧栏 + 正文共用与目录页相同的 1100 版心；网格勿再单独居中，否则会与路径左缘错位「看不出改过」 */
.hot-article-page .hot-article-band{
  max-width:min(1100px,var(--max-w));
  margin-left:auto;
  margin-right:auto;
  width:100%
}
/* 路径条吸附在顶栏下；与正文网格无缝衔接，避免滚动时中间漏缝 */
.hot-article-page .hot-article-band{padding-top:1.15rem}
.hot-article-page .hot-article-crumb-wrap{
  position:sticky;
  top:68px;
  z-index:120;
  margin:0!important;
  padding:.35rem 0 .65rem;
  background:var(--bg);
  border-bottom:1px solid var(--border)
}
.hot-article-page .hot-article-crumb-wrap .art-crumb{
  max-width:none!important;margin-left:0!important;margin-right:0!important;margin-bottom:0!important;padding-left:0!important;padding-right:0!important;text-align:left;line-height:1.45
}
.hot-article-page .hot-article-layout{margin-top:0;padding-top:.75rem}
/* 文章页：侧栏 + 主栏（正文柱仍为 var(--prose)） */
.hot-article-page .hot-article-layout{display:grid;grid-template-columns:minmax(11rem,13.75rem) minmax(0,var(--prose));gap:1.75rem 2.25rem;justify-content:start;align-items:start;width:100%}
.hot-article-page .hot-article-layout--no-aside{grid-template-columns:minmax(0,var(--prose))}
.hot-article-main{min-width:0}
.hot-article-aside{position:sticky;top:calc(68px + 2.75rem);margin:0;padding:0 1.25rem 1rem 0;border-right:1px solid var(--border)}
.hot-article-aside-label{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);font-weight:600;margin:0 0 .75rem;font-family:var(--font-sans),DM Sans,sans-serif}
.hot-article-aside-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px}
.hot-article-aside-list li{display:flex;flex-direction:column;gap:3px;align-items:flex-start}
.hot-article-aside-list a{font-size:13px;font-weight:400;color:var(--text2);text-decoration:none;line-height:1.45}
.hot-article-aside-list a:hover{color:var(--accent)}
.hot-article-aside-date{font-size:11px;color:var(--text3);font-variant-numeric:tabular-nums;letter-spacing:.04em}
.hot-article-aside-more{display:inline-block;margin-top:1rem;font-size:12.5px;color:var(--accent);text-decoration:none;font-weight:500}
.hot-article-aside-more:hover{text-decoration:underline}
@media(max-width:960px){
  .hot-article-page .hot-article-layout{grid-template-columns:1fr;gap:1.25rem}
  .hot-article-aside{position:static;border-right:none;border-bottom:1px solid var(--border);padding:0 0 1.15rem;margin-bottom:.35rem;order:-1}
}
`;

const HOT_CSS_INDEX = `
.hot-index{padding-bottom:4rem;padding-top:0}
/* 子域名首页 / 分类页：红框区域（路径+标题+栏目卡或列表头）吸顶，实心背景防正文透过 */
.hot-index-sticky-head{
  position:sticky;
  top:68px;
  z-index:119;
  background:var(--bg);
  border-bottom:1px solid var(--border);
  margin-bottom:1.5rem;
  padding:1rem 0 1.15rem
}
.hot-index-sticky-head-inner{
  max-width:min(1100px,var(--max-w));
  margin-left:auto;
  margin-right:auto;
  width:100%
}
.hot-index-sticky-head .hot-index-hero{
  max-width:none!important;
  margin-left:0!important;
  margin-right:0!important;
  margin-bottom:0!important;
  padding:0 0 1.25rem!important;
  border-bottom:none!important
}
.hot-index-sticky-head .hot-index-section--cats{margin-bottom:0;padding:0}
.hot-index-sticky-head .hot-section-label--sticky{margin:1.75rem 0 .35rem;padding-top:.5rem;border-top:1px solid var(--border)}
.hot-index--category .hot-index-sticky-head{padding-bottom:1rem;margin-bottom:1.35rem}
/* hero 仅在 sticky 内：宽度由 .hot-index-sticky-head-inner 约束 */
.hot-index .hot-index-hero .art-crumb{margin-bottom:.65rem}
.hot-index .hot-index-hero .art-h1{margin-bottom:.5rem}
.hot-index .hot-index-hero .art-crumb,
.hot-index .hot-index-hero .art-h1,
.hot-index .hot-index-hero .hot-index-lead{
  max-width:none!important;
  margin-left:0!important;
  margin-right:0!important;
  padding-left:0!important;
  padding-right:0!important;
  text-align:left!important
}
.hot-index .hot-index-hero .hot-index-lead{font-size:14px;line-height:1.65;color:var(--text3);font-weight:300;letter-spacing:.03em}
.hot-index-section{max-width:min(1100px,var(--max-w));margin:0 auto;padding:0}
.hot-index-section--cats{margin-bottom:.5rem}
.hot-section-label{display:block;text-align:left;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-weight:600;margin:0 0 1.25rem;font-family:var(--font-sans),DM Sans,sans-serif}
.hot-cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(14.5rem,1fr));gap:18px;margin:0 auto}
.hot-cat-card{
  position:relative;display:block;overflow:hidden;padding:26px 22px 24px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);
  text-decoration:none!important;color:inherit;font-family:var(--font-sans),DM Sans,system-ui,sans-serif;
  transition:border-color .28s ease,transform .28s ease,box-shadow .28s ease
}
.hot-cat-card::after{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--accent3),var(--accent2));transform:scaleX(0);transform-origin:left;transition:transform .3s ease}
.hot-cat-card:hover{border-color:rgba(232,150,60,.28);transform:translateY(-4px);box-shadow:0 20px 56px rgba(0,0,0,.32)}
.hot-cat-card:hover::after{transform:scaleX(1)}
.hot-cat-card strong{display:block;font-family:var(--font-serif),serif;font-size:1.12rem;font-weight:600;color:var(--text);line-height:1.35;margin-bottom:.5rem}
.hot-cat-card small{display:block;color:var(--text3);font-size:12.5px;line-height:1.5;font-weight:400}
.hot-index-block{margin-top:2.75rem;padding-top:2.25rem;border-top:1px solid var(--border)}
.hot-index-block:first-of-type{margin-top:2rem;padding-top:0;border-top:none}
.hot-index .art-h2.hot-index-cat-title{font-family:var(--font-serif);font-size:1.35rem;font-weight:500;color:var(--text);margin:0 0 1rem;letter-spacing:-.02em}
.hot-article-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.hot-article-list li{
  display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:.6rem 1.25rem;
  padding:14px 18px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);
  transition:border-color .22s ease,box-shadow .22s ease
}
.hot-article-list li:hover{border-color:rgba(232,150,60,.22);box-shadow:0 10px 36px rgba(0,0,0,.22)}
.hot-article-list a{flex:1;min-width:min(100%,14rem);color:var(--text2);text-decoration:none;font-size:15px;font-weight:300;line-height:1.55}
.hot-article-list a:hover{color:var(--accent)}
.hot-article-list small{flex-shrink:0;color:var(--text3);font-size:12px;font-weight:400;font-variant-numeric:tabular-nums;letter-spacing:.04em}
.hot-index--category .hot-index-section{padding-top:0}
`;

const PRIVACY_TOAST_SHELL = `
<div id="soon-toast" class="soon-toast" role="status" aria-live="polite"></div>
<div id="priv-pg" class="priv-pg" aria-hidden="true" style="display:none">
  <div class="priv-box" role="dialog" aria-modal="true" aria-labelledby="priv-title-h">
    <button type="button" class="priv-close" onclick="siteChromeClosePrivacy()" aria-label="关闭">×</button>
    <div id="priv-body"></div>
  </div>
</div>`;

function stripHtmlComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "").trim();
}

function readBrandFragment(filename) {
  const p = path.join(BRAND_DIR, filename);
  if (!fs.existsSync(p)) {
    throw new Error(`[build] 缺少主站品牌包文件：${p}（请解压 00-主站参考资料/brand-bundle-hot-subdomain.zip 至 brand-bundle-hot-subdomain/）`);
  }
  return fs.readFileSync(p, "utf8");
}

function brandNavHtml(cfg) {
  let html = stripHtmlComments(readBrandFragment("nav-fragment-reference.html"));
  html = html.replace(/REPLACE_LOGO_PATH/g, LOGO_BASE);
  html = html.replace(
    '<a href="https://hot.snaplinediary.cn/">热点</a>',
    `<a href="${cfg.siteOrigin}/" aria-current="page">热点</a>`,
  );
  return html;
}

function brandFooterHtml() {
  return stripHtmlComments(readBrandFragment("footer-fragment-reference.html")).replace(
    /REPLACE_LOGO_PATH/g,
    LOGO_BASE,
  );
}

function copyBrandAssetsToSite() {
  const dir = path.join(OUT, "assets", "brand");
  fs.mkdirSync(dir, { recursive: true });
  for (const f of ["site-chrome.js", "site-chrome.css", "snapline-tokens.css", "logo-68.webp"]) {
    const src = path.join(BRAND_DIR, f);
    if (!fs.existsSync(src)) {
      throw new Error(`[build] 缺少品牌资源：${src}（可将 00-主站参考资料/logo-68.webp 拷入 brand-bundle-hot-subdomain/）`);
    }
    fs.copyFileSync(src, path.join(dir, f));
  }
}

/** 全页外壳：主站 nav + footer + site-chrome.js（与 brand-bundle 一致） */
function fullPage(cfg, { title, description, canonicalUrl, mainHtml, extraCss = "" }) {
  const desc = String(description || title).replace(/"/g, "&quot;");
  const styleBlock = `${HOT_CSS_ARTICLE}${extraCss}`;
  return `<!DOCTYPE html>
<html lang="zh-Hans">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonicalUrl}">
<link rel="icon" type="image/png" href="https://snaplinediary.cn/images/sharp/favicon-32.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${BRAND_ASSETS_WEB}/snapline-tokens.css">
<link rel="stylesheet" href="${cfg.cssArticle}">
<link rel="stylesheet" href="${BRAND_ASSETS_WEB}/site-chrome.css">
<style>${styleBlock}</style>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(cfg.adsenseClient)}"
     crossorigin="anonymous"></script>
</head>
<body class="art-lang-zh snapline-theme" data-site-root=".">
${brandNavHtml(cfg)}
${mainHtml}
${brandFooterHtml()}
${PRIVACY_TOAST_SHELL}
<script src="${BRAND_ASSETS_WEB}/site-chrome.js" defer></script>
</body>
</html>`;
}

/** 用于排序：YAML Date / ISO / YYYY-MM-DD → UTC ms，无效为 0 */
function parseArticleDateMs(raw) {
  if (raw == null || raw === "") return 0;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw.getTime();
  const s = String(raw).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s]|$)/.exec(s);
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
}

/** 列表与 meta 仅展示 YYYY-MM-DD（避免 Date 被转成 GMT 长串） */
function formatArticleDate(raw) {
  const ms = parseArticleDateMs(raw);
  if (!ms) return "";
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function articlesInCategoryNewestFirst(all, cat) {
  return all
    .filter((a) => a.cat === cat)
    .sort((a, b) => b.sortMs - a.sortMs || a.slug.localeCompare(b.slug));
}

function loadConfig() {
  const p = path.join(ROOT, "hot-site.config.json");
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  const slot =
    process.env.ADSENSE_ARTICLE_SLOT?.trim() ||
    raw.articleAdSlot?.trim() ||
    "";
  const unitStyle = (
    process.env.ADSENSE_ARTICLE_STYLE?.trim() ||
    raw.articleAdUnitStyle ||
    "in-article"
  ).toLowerCase();
  return {
    adsenseClient: raw.adsenseClient || "ca-pub-9768487950193834",
    articleAdSlot: slot,
    articleAdUnitStyle: unitStyle === "display" ? "display" : "in-article",
    siteOrigin: (raw.siteOrigin || "https://hot.snaplinediary.cn").replace(/\/$/, ""),
    cssArticle: raw.mainSiteCss?.article || "https://snaplinediary.cn/articles/article.css",
    cssChrome: raw.mainSiteCss?.chrome || "https://snaplinediary.cn/site-chrome.css",
  };
}

/** 去掉文首手记块引用行，并返回可作 art-lead 的纯文本 */
function stripLeadBlockquote(markdownBody) {
  const lines = markdownBody.split(/\r?\n/);
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  let leadText = "";
  if (i < lines.length && lines[i].trimStart().startsWith(">")) {
    leadText = lines[i]
      .replace(/^>\s*/, "")
      .replace(/\*\*/g, "")
      .trim();
    i++;
    while (i < lines.length && lines[i].trim() === "") i++;
    return { leadText, body: lines.slice(i).join("\n").trimStart() };
  }
  return { leadText: "", body: markdownBody.trimStart() };
}

function buildAdSlotHtml(cfg) {
  if (!cfg.articleAdSlot) return "";
  const isDisplay = cfg.articleAdUnitStyle === "display";
  const insAttrs = isDisplay ?
      `style="display:block"
    data-ad-client="${cfg.adsenseClient}"
    data-ad-slot="${cfg.articleAdSlot}"
    data-ad-format="auto"
    data-full-width-responsive="true"`
    : `style="display:block;text-align:center;"
    data-ad-layout="in-article"
    data-ad-format="fluid"
    data-ad-client="${cfg.adsenseClient}"
    data-ad-slot="${cfg.articleAdSlot}"`;
  return `<div class="art-ad-slot" aria-label="广告">
  <ins class="adsbygoogle"
    ${insAttrs}></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>`;
}

/** Google 文章内嵌广告建议：前两段正文之后；若无足够段落则回退 */
function insertArticleAd(htmlFragment, cfg) {
  const adHtml = buildAdSlotHtml(cfg);
  if (!adHtml) return htmlFragment;

  const wrap = `<div id="art-md-root">${htmlFragment}</div>`;
  const $ = cheerio.load(wrap, { decodeEntities: false });
  const root = $("#art-md-root");
  const paragraphs = root.children("p").toArray();

  let target = null;
  if (paragraphs.length >= 2) target = paragraphs[1];
  else if (paragraphs.length === 1) target = paragraphs[0];
  else {
    const children = root.children().toArray();
    if (children.length === 0) return htmlFragment;
    const mid = Math.max(1, Math.floor(children.length / 2));
    target = children[mid - 1];
  }

  $(target).after(adHtml);
  return root.html();
}

function pageTemplate({
  title,
  description,
  metaLine,
  leadText,
  proseHtml,
  canonicalUrl,
  crumbCategory,
  crumbCategoryHref,
  cfg,
  sidebarHtml = "",
}) {
  const leadBlock =
    leadText ?
      `<div class="art-lead"><p>${escapeMinimal(leadText)}</p></div>`
    : "";

  const layoutClass =
    sidebarHtml.trim() ?
      "hot-article-layout"
    : "hot-article-layout hot-article-layout--no-aside";

  const asideBlock = sidebarHtml.trim() ? `${sidebarHtml}\n  ` : "";

  /* 路径与侧栏+正文同一 1100 版心，与热点目录页对齐 */
  const mainHtml = `<article class="art-shell w chrome-page-pad hot-article-page">
  <div class="hot-article-band">
  <div class="hot-article-crumb-wrap">
  <nav class="art-crumb" aria-label="breadcrumb">
    <a href="https://snaplinediary.cn/">首页</a> · <a href="${cfg.siteOrigin}/">热点</a> · <a href="${cfg.siteOrigin}${crumbCategoryHref}">${escapeHtml(crumbCategory)}</a> · <span>正文</span>
  </nav>
  </div>
  <div class="${layoutClass}">
  ${asideBlock}<div class="hot-article-main">
  <h1 class="art-h1">${escapeHtml(title)}</h1>
  ${leadBlock}
  <p class="art-meta">${escapeHtml(metaLine)}</p>
  <div class="art-prose" data-prose-lang="zh">
${proseHtml}
  </div>
  </div>
  </div>
  </div>
</article>`;

  return fullPage(cfg, {
    title: `${title} · 热点 · 时线日记`,
    description: description || title,
    canonicalUrl,
    mainHtml,
    extraCss: "",
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeMinimal(s) {
  return escapeHtml(s);
}

function categoryHref(cat) {
  return `/${cat}/`;
}

/** 同类目除当前篇外最近 N 篇（已按时间新→旧） */
function recentOthersInCategory(allRecords, current, limit = 4) {
  return articlesInCategoryNewestFirst(allRecords, current.cat)
    .filter((a) => a.slug !== current.slug)
    .slice(0, limit);
}

function buildRelatedSidebarHtml(current, allRecords, cfg) {
  const items = recentOthersInCategory(allRecords, current, 4);
  if (!items.length) return "";
  const lines = [
    `<aside class="hot-article-aside" aria-label="本栏最新手记">`,
    `  <p class="hot-article-aside-label">本栏最新</p>`,
    `  <ul class="hot-article-aside-list">`,
  ];
  for (const a of items) {
    lines.push(
      `    <li><a href="/${a.cat}/${a.slug}/">${escapeHtml(a.title)}</a><span class="hot-article-aside-date">${escapeHtml(a.date)}</span></li>`,
    );
  }
  lines.push(`  </ul>`);
  lines.push(
    `  <a class="hot-article-aside-more" href="${cfg.siteOrigin}${current.crumbCategoryHref}">查看全部</a>`,
  );
  lines.push(`</aside>`);
  return lines.join("\n");
}

async function main() {
  const cfg = loadConfig();
  if (!cfg.articleAdSlot) {
    console.warn(
      "[build] 未设置 articleAdSlot（可在 hot-site.config.json 或环境变量 ADSENSE_ARTICLE_SLOT 填写）；文中广告位将跳过，仅保留 <head> 全局脚本。"
    );
  }

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  copyBrandAssetsToSite();

  const articleRecords = [];

  function walkCollect(dir, baseRel = "") {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const rel = path.join(baseRel, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) walkCollect(full, rel);
      else if (name.endsWith(".md")) {
        const raw = fs.readFileSync(full, "utf8");
        const { data, content } = matter(raw);
        const { leadText, body } = stripLeadBlockquote(content);
        const htmlBody = md.render(body);
        const proseInner = insertArticleAd(htmlBody, cfg);

        const cat = data.category || path.basename(path.dirname(full));
        const slug = data.slug || path.basename(name, ".md");
        const title = data.title || slug;
        const dateDisp = formatArticleDate(data.date);
        const metaLine = `${data.category_label || cat} · 估读约 ${data.reading_minutes || "?"} 分钟 · ${dateDisp}`;
        const canonicalUrl = `${cfg.siteOrigin}/${cat}/${slug}/`;

        const crumbCat = data.category_label || cat;
        const crumbHref = categoryHref(cat);

        articleRecords.push({
          cat,
          slug,
          title,
          description: data.description,
          metaLine,
          leadText,
          proseHtml: proseInner.split("\n").map((l) => "    " + l).join("\n"),
          canonicalUrl,
          crumbCategory: crumbCat,
          crumbCategoryHref: crumbHref,
          date: dateDisp,
          sortMs: parseArticleDateMs(data.date),
        });
      }
    }
  }

  walkCollect(CONTENT);

  const articles = articleRecords.map((r) => ({
    cat: r.cat,
    slug: r.slug,
    title: r.title,
    label: r.crumbCategory,
    date: r.date,
    sortMs: r.sortMs,
  }));

  for (const r of articleRecords) {
    const sidebarHtml = buildRelatedSidebarHtml(r, articleRecords, cfg);
    const html = pageTemplate({
      title: r.title,
      description: r.description,
      metaLine: r.metaLine,
      leadText: r.leadText,
      proseHtml: r.proseHtml,
      canonicalUrl: r.canonicalUrl,
      crumbCategory: r.crumbCategory,
      crumbCategoryHref: r.crumbCategoryHref,
      cfg,
      sidebarHtml,
    });
    const outDir = path.join(OUT, r.cat, r.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");
  }

  const catOrder = ["hermes", "claude-code", "ai-tools", "github-projects"];
  const catLabels = {
    hermes: "Hermes Agent",
    "claude-code": "Claude Code",
    "ai-tools": "AI 工具测评",
    "github-projects": "GitHub 新项目速递",
  };

  let indexMain = `<article class="art-shell w chrome-page-pad hot-index">
  <div class="hot-index-sticky-head">
  <div class="hot-index-sticky-head-inner">
  <header class="hot-index-hero">
    <nav class="art-crumb" aria-label="breadcrumb">
      <a href="https://snaplinediary.cn/">首页</a> · <span>热点</span>
    </nav>
    <h1 class="art-h1">热点内容</h1>
    <p class="hot-index-lead">按栏目浏览精选手记 · hot.snaplinediary.cn</p>
  </header>
  <section class="hot-index-section hot-index-section--cats" aria-label="栏目入口">
    <div class="hot-cat-grid">
`;

  for (const c of catOrder) {
    const group = articles.filter((a) => a.cat === c);
    if (!group.length) continue;
    const label = catLabels[c] || c;
    indexMain += `      <a class="hot-cat-card" href="/${c}/"><strong>${escapeHtml(label)}</strong><small>${group.length} 篇 · 进入目录</small></a>\n`;
  }

  indexMain += `    </div>
  </section>
  <p class="hot-section-label hot-section-label--sticky">全文列表</p>
  </div>
  </div>
  <section class="hot-index-section" aria-label="全部文章">
`;

  for (const c of catOrder) {
    const group = articlesInCategoryNewestFirst(articles, c);
    if (!group.length) continue;
    indexMain += `    <div class="hot-index-block">
      <h2 class="art-h2 hot-index-cat-title">${escapeHtml(catLabels[c] || c)}</h2>
      <ul class="hot-article-list">
`;
    for (const a of group) {
      indexMain += `        <li><a href="/${a.cat}/${a.slug}/">${escapeHtml(a.title)}</a><small>${escapeHtml(a.date)}</small></li>\n`;
    }
    indexMain += `      </ul>
    </div>
`;
  }

  indexMain += `  </section>
</article>`;
  const indexHtml = fullPage(cfg, {
    title: "热点内容 · 时线日记",
    description: "热点手记 · Hermes · Claude Code · AI 工具 · GitHub 新项目 · snaplinediary.cn",
    canonicalUrl: `${cfg.siteOrigin}/`,
    mainHtml: indexMain,
    extraCss: HOT_CSS_INDEX,
  });
  fs.writeFileSync(path.join(OUT, "index.html"), indexHtml, "utf8");

  for (const c of catOrder) {
    const group = articlesInCategoryNewestFirst(articles, c);
    if (!group.length) continue;
    const label = catLabels[c] || c;
    const catCanonical = `${cfg.siteOrigin}/${c}/`;
    let catMain = `<article class="art-shell w chrome-page-pad hot-index hot-index--category">
  <div class="hot-index-sticky-head">
  <div class="hot-index-sticky-head-inner">
  <header class="hot-index-hero">
    <nav class="art-crumb" aria-label="breadcrumb">
      <a href="https://snaplinediary.cn/">首页</a> · <a href="${cfg.siteOrigin}/">热点</a> · <span>${escapeHtml(label)}</span>
    </nav>
    <h1 class="art-h1">${escapeHtml(label)}</h1>
    <p class="hot-index-lead">共 ${group.length} 篇手记</p>
  </header>
  </div>
  </div>
  <section class="hot-index-section">
    <ul class="hot-article-list">
`;
    for (const a of group) {
      catMain += `      <li><a href="/${a.cat}/${a.slug}/">${escapeHtml(a.title)}</a><small>${escapeHtml(a.date)}</small></li>\n`;
    }
    catMain += `    </ul>
  </section>
</article>`;
    const catHtml = fullPage(cfg, {
      title: `${label} · 热点 · 时线日记`,
      description: `${label} · 热点手记 · 时线日记`,
      canonicalUrl: catCanonical,
      mainHtml: catMain,
      extraCss: HOT_CSS_INDEX,
    });
    fs.mkdirSync(path.join(OUT, c), { recursive: true });
    fs.writeFileSync(path.join(OUT, c, "index.html"), catHtml, "utf8");
  }

  const pubId = cfg.adsenseClient.replace(/^ca-/, "").trim() || "pub-9768487950193834";
  fs.writeFileSync(
    path.join(OUT, "ads.txt"),
    `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`,
    "utf8",
  );

  console.log("[build] wrote", articles.length, "articles + index + ads.txt → _site/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
