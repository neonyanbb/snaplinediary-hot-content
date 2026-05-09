// Build: MD -> HTML (main-site-like layout), AdSense in head + optional mid-page unit.
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

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

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
  const desc = (description || title).replace(/"/g, "&quot;");
  const leadBlock =
    leadText ?
      `<div class="art-lead"><p>${escapeMinimal(leadText)}</p></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="zh-Hans">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} · 热点 · 时线日记</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonicalUrl}">
<link rel="icon" type="image/png" href="https://snaplinediary.cn/images/sharp/favicon-32.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${cfg.cssArticle}">
<link rel="stylesheet" href="${cfg.cssChrome}">
<style>.hot-topbar{font-family:DM Sans,system-ui,sans-serif;padding:.75rem 1rem;border-bottom:1px solid rgba(0,0,0,.08);background:#fafafa;font-size:.9rem}.hot-topbar a{color:#1a3a52;text-decoration:none}.hot-topbar a:hover{text-decoration:underline}.art-ad-slot{margin:2rem 0;padding:1rem 0;border-top:1px dashed rgba(0,0,0,.12);border-bottom:1px dashed rgba(0,0,0,.12)}</style>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(cfg.adsenseClient)}"
     crossorigin="anonymous"></script>
</head>
<body class="art-lang-zh">
<header class="hot-topbar">
  <a href="https://snaplinediary.cn/">时线日记</a>
  · <a href="${cfg.siteOrigin}/">热点内容</a>
  · <a href="${cfg.siteOrigin}${crumbCategoryHref}">${escapeHtml(crumbCategory)}</a>
</header>
<article class="art-shell w chrome-page-pad">
  <nav class="art-crumb" aria-label="breadcrumb">
    <a href="https://snaplinediary.cn/">首页</a> · <a href="${cfg.siteOrigin}/">热点</a> · <a href="${cfg.siteOrigin}${crumbCategoryHref}">${escapeHtml(crumbCategory)}</a> · <span>正文</span>
  </nav>
  <h1 class="art-h1">${escapeHtml(title)}</h1>
  ${leadBlock}
  <p class="art-meta">${escapeHtml(metaLine)}</p>
  <div class="art-prose" data-prose-lang="zh">
${proseHtml}
  </div>
</article>
</body>
</html>`;
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
        const metaLine = `${data.category_label || cat} · 估读约 ${data.reading_minutes || "?"} 分钟 · ${data.date || ""}`;
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
          date: data.date || "",
        });
      }
    }
  }

  walk(CONTENT);

  articles.sort((a, b) => (a.cat + a.slug).localeCompare(b.cat + b.slug));

  const catOrder = ["hermes", "claude-code", "ai-tools", "github-projects"];
  const catLabels = {
    hermes: "Hermes Agent",
    "claude-code": "Claude Code",
    "ai-tools": "AI 工具测评",
    "github-projects": "GitHub 新项目速递",
  };

  const sharedHeadExtras = `
<link rel="icon" type="image/png" href="https://snaplinediary.cn/images/sharp/favicon-32.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<style>
.hot-topbar{font-family:DM Sans,system-ui,sans-serif;padding:.75rem 1rem;border-bottom:1px solid rgba(0,0,0,.08);background:#fafafa;font-size:.9rem}
.hot-topbar a{color:#1a3a52;text-decoration:none}.hot-topbar a:hover{text-decoration:underline}
.hot-cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(11rem,1fr));gap:.75rem;margin:1.25rem 0 2rem}
.hot-cat-card{display:block;padding:.85rem 1rem;border:1px solid rgba(0,0,0,.1);border-radius:.35rem;text-decoration:none;color:#1a3a52;font-family:DM Sans,system-ui,sans-serif;font-size:.95rem;background:#fff}
.hot-cat-card:hover{border-color:#1a3a52;background:#fafafa}
.hot-cat-card small{display:block;margin-top:.35rem;color:#666;font-size:.8rem}
.hot-index ul{padding-left:1.2rem}.hot-index a{color:#1a3a52}
</style>`;

  let indexHtml = `<!DOCTYPE html>
<html lang="zh-Hans">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>热点内容 · 时线日记</title>
<meta name="description" content="热点手记 · Hermes · Claude Code · AI 工具 · GitHub 新项目 · snaplinediary.cn">
<link rel="canonical" href="${cfg.siteOrigin}/">
<link rel="stylesheet" href="${cfg.cssArticle}">
<link rel="stylesheet" href="${cfg.cssChrome}">
${sharedHeadExtras}
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(cfg.adsenseClient)}"
     crossorigin="anonymous"></script>
</head>
<body class="art-lang-zh">
<header class="hot-topbar">
  <a href="https://snaplinediary.cn/">时线日记</a>
  · <span>热点内容</span>
</header>
<article class="art-shell w chrome-page-pad hot-index">
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
    indexHtml += `    <a class="hot-cat-card" href="/${c}/"><strong>${escapeHtml(label)}</strong><small>${group.length} 篇 · 进入目录</small></a>\n`;
  }

  indexHtml += `  </div>
  <p class="art-meta">全文列表</p>
`;

  for (const c of catOrder) {
    const group = articles.filter((a) => a.cat === c);
    if (!group.length) continue;
    indexHtml += `  <h2 class="art-h2">${escapeHtml(catLabels[c] || c)}</h2>\n  <ul>\n`;
    for (const a of group) {
      indexHtml += `    <li><a href="/${a.cat}/${a.slug}/">${escapeHtml(a.title)}</a> <small>${escapeHtml(a.date)}</small></li>\n`;
    }
    indexHtml += `  </ul>\n`;
  }

  indexHtml += `</article></body></html>`;
  fs.writeFileSync(path.join(OUT, "index.html"), indexHtml, "utf8");

  for (const c of catOrder) {
    const group = articles.filter((a) => a.cat === c);
    if (!group.length) continue;
    const label = catLabels[c] || c;
    const catCanonical = `${cfg.siteOrigin}/${c}/`;
    let catHtml = `<!DOCTYPE html>
<html lang="zh-Hans">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(label)} · 热点 · 时线日记</title>
<link rel="canonical" href="${catCanonical}">
<link rel="stylesheet" href="${cfg.cssArticle}">
<link rel="stylesheet" href="${cfg.cssChrome}">
${sharedHeadExtras}
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(cfg.adsenseClient)}"
     crossorigin="anonymous"></script>
</head>
<body class="art-lang-zh">
<header class="hot-topbar">
  <a href="https://snaplinediary.cn/">时线日记</a>
  · <a href="${cfg.siteOrigin}/">热点内容</a>
  · <span>${escapeHtml(label)}</span>
</header>
<article class="art-shell w chrome-page-pad hot-index">
  <nav class="art-crumb" aria-label="breadcrumb">
    <a href="https://snaplinediary.cn/">首页</a> · <a href="${cfg.siteOrigin}/">热点</a> · <span>${escapeHtml(label)}</span>
  </nav>
  <h1 class="art-h1">${escapeHtml(label)}</h1>
  <p class="art-meta">共 ${group.length} 篇</p>
  <ul>
`;
    for (const a of group) {
      catHtml += `    <li><a href="/${a.cat}/${a.slug}/">${escapeHtml(a.title)}</a> <small>${escapeHtml(a.date)}</small></li>\n`;
    }
    catHtml += `  </ul>
</article></body></html>`;
    fs.mkdirSync(path.join(OUT, c), { recursive: true });
    fs.writeFileSync(path.join(OUT, c, "index.html"), catHtml, "utf8");
  }

  const adsTxt = `google.com, pub-9768487950193834, DIRECT, f08c47fec0942fa0\n`;
  fs.writeFileSync(path.join(OUT, "ads.txt"), adsTxt, "utf8");

  console.log("[build] wrote", articles.length, "articles + index + ads.txt → _site/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
