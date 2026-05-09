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
`;

const HOT_CSS_INDEX = `
.hot-index > p.art-meta{text-transform:none;letter-spacing:.04em}
.hot-cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(12rem,1fr));gap:22px;margin:1.25rem auto 2rem;max-width:1100px}
.hot-cat-card{
  display:block;padding:22px 20px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);
  text-decoration:none!important;color:inherit;font-family:var(--font-sans),DM Sans,system-ui,sans-serif;font-size:.95rem;
  transition:border-color .28s ease,transform .28s ease,box-shadow .28s ease
}
.hot-cat-card:hover{border-color:rgba(232,150,60,.25);transform:translateY(-3px);box-shadow:0 16px 48px rgba(0,0,0,.35)}
.hot-cat-card strong{display:block;color:var(--text);font-weight:600;font-family:var(--font-serif),serif;margin-bottom:.35rem}
.hot-cat-card small{display:block;color:var(--text3);font-size:12px;line-height:1.45}
.hot-index .art-h2{font-family:var(--font-serif);font-size:1.45rem;font-weight:500;color:var(--text);margin:2rem 0 .75rem}
.hot-index ul{margin:.5em 0 1.25em;padding-left:1.25rem;color:var(--text2);font-size:15px;font-weight:300}
.hot-index li{margin:.4em 0}
.hot-index li a{color:var(--accent);text-decoration:none}
.hot-index li a:hover{color:var(--accent2);text-decoration:underline;text-underline-offset:3px}
.hot-index li small{color:var(--text3);font-size:12px;font-weight:400;margin-left:.35rem}
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
}) {
  const leadBlock =
    leadText ?
      `<div class="art-lead"><p>${escapeMinimal(leadText)}</p></div>`
    : "";

  const mainHtml = `<article class="art-shell w chrome-page-pad">
  <nav class="art-crumb" aria-label="breadcrumb">
    <a href="https://snaplinediary.cn/">首页</a> · <a href="${cfg.siteOrigin}/">热点</a> · <a href="${cfg.siteOrigin}${crumbCategoryHref}">${escapeHtml(crumbCategory)}</a> · <span>正文</span>
  </nav>
  <h1 class="art-h1">${escapeHtml(title)}</h1>
  ${leadBlock}
  <p class="art-meta">${escapeHtml(metaLine)}</p>
  <div class="art-prose" data-prose-lang="zh">
${proseHtml}
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

  const articles = [];

  function walk(dir, baseRel = "") {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const rel = path.join(baseRel, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) walk(full, rel);
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

        const html = pageTemplate({
          title,
          description: data.description,
          metaLine,
          leadText,
          proseHtml: proseInner.split("\n").map((l) => "    " + l).join("\n"),
          canonicalUrl,
          crumbCategory: crumbCat,
          crumbCategoryHref: crumbHref,
          cfg,
        });

        const outDir = path.join(OUT, cat, slug);
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");

        articles.push({
          cat,
          slug,
          title,
          label: crumbCat,
          date: dateDisp,
          sortMs: parseArticleDateMs(data.date),
        });
      }
    }
  }

  walk(CONTENT);

  const catOrder = ["hermes", "claude-code", "ai-tools", "github-projects"];
  const catLabels = {
    hermes: "Hermes Agent",
    "claude-code": "Claude Code",
    "ai-tools": "AI 工具测评",
    "github-projects": "GitHub 新项目速递",
  };

  let indexMain = `<article class="art-shell w chrome-page-pad hot-index">
  <nav class="art-crumb" aria-label="breadcrumb">
    <a href="https://snaplinediary.cn/">首页</a> · <span>热点</span>
  </nav>
  <h1 class="art-h1">热点内容</h1>
  <p class="art-meta">按栏目浏览 · hot.snaplinediary.cn</p>
  <div class="hot-cat-grid" aria-label="热点分类">
`;

  for (const c of catOrder) {
    const group = articles.filter((a) => a.cat === c);
    if (!group.length) continue;
    const label = catLabels[c] || c;
    indexMain += `    <a class="hot-cat-card" href="/${c}/"><strong>${escapeHtml(label)}</strong><small>${group.length} 篇 · 进入目录</small></a>\n`;
  }

  indexMain += `  </div>
  <p class="art-meta">全文列表</p>
`;

  for (const c of catOrder) {
    const group = articlesInCategoryNewestFirst(articles, c);
    if (!group.length) continue;
    indexMain += `  <h2 class="art-h2">${escapeHtml(catLabels[c] || c)}</h2>\n  <ul>\n`;
    for (const a of group) {
      indexMain += `    <li><a href="/${a.cat}/${a.slug}/">${escapeHtml(a.title)}</a> <small>${escapeHtml(a.date)}</small></li>\n`;
    }
    indexMain += `  </ul>\n`;
  }

  indexMain += `</article>`;
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
    let catMain = `<article class="art-shell w chrome-page-pad hot-index">
  <nav class="art-crumb" aria-label="breadcrumb">
    <a href="https://snaplinediary.cn/">首页</a> · <a href="${cfg.siteOrigin}/">热点</a> · <span>${escapeHtml(label)}</span>
  </nav>
  <h1 class="art-h1">${escapeHtml(label)}</h1>
  <p class="art-meta">共 ${group.length} 篇</p>
  <ul>
`;
    for (const a of group) {
      catMain += `    <li><a href="/${a.cat}/${a.slug}/">${escapeHtml(a.title)}</a> <small>${escapeHtml(a.date)}</small></li>\n`;
    }
    catMain += `  </ul>
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
