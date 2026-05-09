# 时线日记（Snapline Diary）官网视觉与风格规范

本文描述当前 **snaplinediary.cn 主站及 articles 子路径** 所采用的配色、字体与界面气质，供 **hot.snaplinediary.cn** 等子域在改版时对齐品牌；并与本目录中的 `snapline-tokens.css`、`site-chrome.css` 保持一致。

---

## 1. 品牌气质（一句话）

**深色暖灰底 + 琥珀色点睛**：安静、偏高端的编辑型产品官网，强调「时间线与记忆」，避免高饱和霓虹或扁平糖果色。留白靠层级（surface / card / border）而非大块纯白。

---

## 2. 配色体系

### 2.1 背景与表面

| Token | 色值 | 用途 |
|-------|------|------|
| `--bg` | `#08070A` | 页面主背景（极深蓝黑） |
| `--bg2` | `#0E0C10` | 次级区块底（页脚、隔开的 section） |
| `--surface` | `#141119` | 卡片/输入底/导航按钮底 |
| `--card` | `#1C1820` | 更高一层浮起的面板、下拉、toast |
| `--border` | `#2A2430` | 默认分割线、描边（偏紫的灰） |

层次逻辑：`bg` → `bg2` → `surface` → `card`，亮度逐级略抬，仍控制在深色域内。

### 2.2 强调色（琥珀系）

| Token | 色值 | 用途 |
|-------|------|------|
| `--accent` | `#E8963C` | 主 CTA、链接 hover、章节 eye、活跃态 |
| `--accent2` | `#F5C26A` | 次要强调、italic 标题点缀、hover 文字变浅金 |
| `--accent3` | `#C96E1E` | 更深琥珀，用于边框 hover、装饰菱形 |

**按钮上的前景色**：主按钮填充 `--accent` 时，文字使用近黑色 `#080500`（见 `--snapline-primary-fg-on-accent`），保证对比度与「实体按键」质感。

### 2.3 文字色阶

| Token | 色值 | 用途 |
|-------|------|------|
| `--text` | `#F0EBE3` | 标题、主正文 |
| `--text2` | `#AFA49A` | 导航默认、说明段落 |
| `--text3` | `#6E6560` | 元数据、页脚弱化、uppercase 小标题 |

### 2.4 半透明装饰（常用）

与主站 inline 样式一致，已在 `snapline-tokens.css` 汇总：

- 顶栏底边：`rgba(232, 150, 60, 0.08)` → 滚动后 `0.18`
- 顶栏毛玻璃背板：`rgba(8, 7, 10, 0.88)` + `backdrop-filter: blur(24px)`
- Hero 光晕：`radial-gradient(..., rgba(232,150,60,.08), transparent)`
- 标签式 capsule 边框：`rgba(232, 150, 60, 0.22)` 等

---

## 3. 字体与排版

### 3.1 字体栈

- **标题 / 品牌名（衬线）**：`'Cormorant Garamond', 'Noto Serif SC', Georgia, serif` → `--font-serif`
- **正文 / UI（无衬线）**：`'DM Sans', 'Noto Serif SC', sans-serif` → `--font-sans`

中文由 **Noto Serif SC** 同时承担衬线段的回退与正文混排，保证中西文气质统一。

### 3.2 层级参考

- 顶栏品牌字：约 `17px`，`font-weight: 600`，`letter-spacing: 0.02em`
- 顶栏链接：约 `14px`，默认 `--text2`，hover → `--accent`
- 页脚栏目标题 `.fc-title`：`11px`、`uppercase`、`letter-spacing: 0.1em`、`--text3`
- 页脚链接：`13px`、`--text2`，hover → `--accent`
- 章节「小眼睛」标签（如 `.sec-eye` / `.list-ey`）：`10.5px` 左右、宽字距、`uppercase`、颜色多为 `--accent`

**标题 emphasis**：正文标题中常用 `<em>` 配 **italic + `--accent` 或 `--accent2`**，形成品牌辨识度。

---

## 4. 布局与形状

| Token | 值 | 用途 |
|-------|-----|------|
| `--max-w` | `1160px` | 主内容区最大宽度（与 `.nav-inner`、`.w` 一致） |
| `--radius` | `20px` | 大卡片、弹窗 |
| `--radius-sm` | `12px` | 按钮方形圆角、小面板、移动菜单项 |
| 主 CTA / 幽灵按钮 | `border-radius: 100px` | 「药丸形」主行动点 |

**顶栏**：固定高度 **68px**，`z-index: 200`；正文若在顶栏下开局，使用 `padding-top: 88px` 级别（`.chrome-page-pad`）避免遮挡。

**页脚**：`footer.site-foot` 使用 `--bg2` 上边框 `--border`，内边距约 `60px 0 40px`，顶部可有 `margin-top: 56px` 与正文区隔开。

---

## 5. 组件行为要点

### 5.1 导航

- 默认透明底 + 模糊背板；滚动后底边 amber 略加重。
- **移动端（≤900px）**：汉堡按钮打开全屏抽屉，列表顶对齐、`--bg` 近不透明 + blur。

### 5.2 链接与按钮

- 正文内链接：多为 `--accent`，hover 可比照 `article.css`（下划线 + offset）。
- 实心主按钮：`background: var(--accent)`，`color: #080500`，hover 时常配合轻微上移或阴影（主站 `btn-p` 使用阴影 `rgba(232,150,60,.32)`）。

### 5.3 语言切换

- 触发器：pill 形、`--surface` 底、`--border` 边。
- 下拉：`--card` 底、阴影 `0 16px 40px rgba(0,0,0,.5)`。

---

## 6. 动效与可访问性

- 颜色过渡：导航与链接常用 `transition: color .2s`。
- 尊重 `prefers-reduced-motion`：主站在语言切换动画等处有减仓逻辑；子域若有跑马灯或脉冲点，建议同样处理。
- 焦点态：子域自建组件时请为交互元素保留 `:focus-visible` 轮廓或与主站对比度相当的焦点环。

---

## 7. 子域名（热点站）改版建议

热点内容站若以 **阅读/栏目列表** 为主，建议在**不改变 tokens 主值**的前提下做局部强化，避免与主站「两张皮」：

1. **保持三色阶**：背景仍用 `--bg` / `--surface`，不要用纯正 `#000` 或冷蓝灰替换整套。
2. **列表卡片**：可与 `article.css` 中 `.list-card` 对齐——`surface` 底、`border` 边，hover 时边框略带 `rgba(232,150,60,.25)` 与轻上浮。
3. **栏目标签**：沿用 `.list-ser` 一类：`uppercase`、字间距、`--accent` 字色。
4. **可选微调（非必须）**：若希望热点站略「更炽」，仅可把 Hero 光晕从 `0.08` 提到 `0.1`，或给 section 顶部加极淡的 `linear-gradient(180deg, var(--bg2), var(--bg))`；**不建议**更换 `--accent` 色相，以免 App Store 物料与官网不一致。
5. **顶栏返回主站**：与子站域名并存时，顶栏或页脚保留「官网」「用法手记」「热点」互链，形成家族站点闭环。

---

## 8. 与仓库文件的对应关系

| 规范项 | 主仓库位置 |
|--------|------------|
| 完整首页样式（含 ticker、hero、section） | `index.html` 内 `<style>` |
| 手记 / 文章排版与列表卡片 | `articles/article.css` |
| 共享顶栏页脚（文章子路径） | `site-chrome.css` + `site-chrome.js` |
| 文案多语言（导航 aria 等） | `articles/site-i18n.js` |

本 bundle 将 `site-chrome.*` 复制至此，并用 `STYLE_GUIDE.md` + `snapline-tokens.css` 固化令牌，便于子域仓库单独拷贝。

---

## 9. 版权与年份

页脚文案示例：`© 2026 时线日记 (Snapline Diary). All rights reserved.` 每年可按需更新年份数字。
