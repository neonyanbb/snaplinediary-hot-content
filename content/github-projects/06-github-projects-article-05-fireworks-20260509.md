---
title: "Fireworks Tech Graph：用一句话生成出版级技术架构图"
description: "导语 画架构图是技术工作者的'必要恶'——每个人都觉得重要，但没人喜欢干。无论是Mermaid的DSL语法、draw.io的拖拽操作，还是Figma的精细排版，从想法到一张能看的架构图，往往需要30分钟到数小时。2026年4月10日发布的Fireworks Tech Graph…"
category: github-projects
category_label: "GitHub 新项目速递"
date: 2026-05-09
slug: 06-github-projects-article-05-fireworks-20260509
reading_minutes: 3
---

> **热点手记** · GitHub 新项目速递 · hot.snaplinediary.cn · 估读约 3 分钟 · 2026-05-09

## 导语

画架构图是技术工作者的"必要恶"——每个人都觉得重要，但没人喜欢干。无论是Mermaid的DSL语法、draw.io的拖拽操作，还是Figma的精细排版，从想法到一张能看的架构图，往往需要30分钟到数小时。2026年4月10日发布的Fireworks Tech Graph试图把这个过程压缩到一句话。

## 这个项目是什么

Fireworks Tech Graph是一个自然语言到技术架构图的生成工具。用户用中文或英文描述系统架构，工具自动生成出版质量的SVG矢量图，并通过rsvg-convert导出高分辨率PNG（1920px）。它内置7种视觉风格、14种UML图类型、40+产品图标，以及AI/Agent领域的专用知识（RAG、Agentic Search、Mem0、Multi-Agent等）。

项目以Claude Code Skill为主要使用方式，通过`npx skills add`安装。上线不到一个月已收获5746颗Star。

## 为什么值得关注

**7种风格，覆盖全部场景。** 从简洁的Flat Icon（适合博客和幻灯片）到暗色Terminal风格（适合GitHub README），从工程蓝图风格到Notion Clean风格，再到Glassmorphism（适合产品演示），以及Claude和OpenAI的品牌风格——7种风格覆盖了技术文档的全部使用场景。每种风格都有独立的参考文件，定义了精确的颜色token、字体和SVG模式。

**14种UML图全覆盖。** 不仅支持常见的类图、组件图、时序图，还包括组合结构图、包图、对象图、用例图、活动图、状态机图、通信图、时序图、交互概览图、ER图等全部14种UML图类型。每种图类型都有推荐的风格搭配。

**AI/Agent领域知识内置。** 这是Fireworks区别于通用图表工具的核心竞争力。它内置了RAG Pipeline、Agentic Search、Mem0 Memory Layer、Multi-Agent Collaboration、Tool Call Flow等AI/Agent领域的标准模式。当用户说"画一个Mem0记忆架构图"，工具知道应该包含哪些组件、用什么布局、箭头代表什么语义。

**语义图形系统。** 形状和箭头都有语义含义：LLM用双边框矩形、Agent用六边形、向量数据库用环形圆柱、Graph DB用三圆簇。箭头颜色和虚线模式区分读写、控制流、异步、反馈等语义关系。这种一致性让图表不仅好看，而且"可读"。

## 它能带来什么变化

对于技术写作者和架构师，Fireworks意味着可以在几秒内生成一张可以直接放进文档或幻灯片的架构图，而不是花半小时画图。当架构需要修改时，改一句话重新生成即可。

对于AI/Agent领域从业者，内置的领域知识使得绘制专业架构图不再需要从零开始。RAG流程图、Agent协作图、记忆架构图——这些在AI领域高频出现的图表类型，现在可以用自然语言直接生成。

对于开源项目维护者，一张好的架构图可以显著提升项目的专业度和吸引力。Fireworks的GitHub README风格（Dark Terminal）直接适配暗色主题，生成的图表可以直接放进项目文档。

## 快速上手

```bash
# 安装为Claude Code Skill
npx skills add yizhiyanhua-ai/fireworks-tech-graph

# 需要rsvg-convert（PNG导出）
# macOS
brew install librsvg
# Ubuntu/Debian
sudo apt install librsvg2-bin
```

安装后，在Claude Code中直接用自然语言触发：

```
画一个RAG流程图
生成一个Mem0记忆架构图，暗色风格
画一个微服务架构图，Blueprint风格
生成一个多Agent协作图，Glassmorphism风格
```

GitHub仓库：https://github.com/yizhiyanhua-ai/fireworks-tech-graph
