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
  return {
    adsenseClient: raw.adsenseClient || "ca-pub-9768487950193834",
    articleAdSlot: slot,
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

function insertMidArticleAd(htmlFragment, cfg) {
  const wrap = `<div id="art-md-root">${htmlFragment}</div>`;
  const $ = cheerio.load(wrap, { decodeEntities: false });
  const root = $("#art-md-root");
  const children = root.children().toArray();
  if (children.length === 0) return htmlFragment;

  const mid = Math.max(1, Math.floor(children.length / 2));
  const target = children[mid - 1];

  const adHtml =
    cfg.articleAdSlot &&
    `<div class="art-ad-slot" aria-label="广告">
  <ins class="adsbygoogle"
    style="display:block"
    data-ad-client="${cfg.adsenseClient}"
    data-ad-slot="${cfg.articleAdSlot}"
    data-ad-format="auto"
    data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>`;

  if (adHtml) {
    $(target).after(adHtml);
  }

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
        const proseInner = insertMidArticleAd(htmlBody, cfg);

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

  let indexHtml = `<!DOCTYPE html>
<html lang="zh-Hans">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>热点内容 · 时线日记</title>
<link rel="stylesheet" href="${cfg.cssArticle}">
<link rel="stylesheet" href="${cfg.cssChrome}">
<style>.hot-index{max-width:42rem;margin:2rem auto;padding:0 1.25rem;font-family:'Noto Serif SC',serif}.hot-index h1{font-size:1.35rem}.hot-index ul{padding-left:1.2rem}.hot-index a{color:#1a3a52}</style>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${cfg.adsenseClient}"
     crossorigin="anonymous"></script>
</head>
<body class="art-lang-zh">
<article class="art-shell w chrome-page-pad hot-index">
<h1 class="art-h1">热点内容</h1>
<p class="art-meta">snaplinediary.cn · hot</p>
`;

  for (const c of catOrder) {
    const group = articles.filter((a) => a.cat === c);
    if (!group.length) continue;
    indexHtml += `<h2>${escapeHtml(catLabels[c] || c)}</h2>\n<ul>\n`;
    for (const a of group) {
      indexHtml += `<li><a href="/${a.cat}/${a.slug}/">${escapeHtml(a.title)}</a> <small>${escapeHtml(a.date)}</small></li>\n`;
    }
    indexHtml += `</ul>\n`;
  }

  indexHtml += `</article></body></html>`;
  fs.writeFileSync(path.join(OUT, "index.html"), indexHtml, "utf8");

  const adsTxt = `google.com, pub-9768487950193834, DIRECT, f08c47fec0942fa0\n`;
  fs.writeFileSync(path.join(OUT, "ads.txt"), adsTxt, "utf8");

  console.log("[build] wrote", articles.length, "articles + index + ads.txt → _site/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
