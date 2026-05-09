---
title: "CodeBurn：让AI编程的每一分钱都花得明白"
description: "导语 当AI编程工具从'尝鲜'变成'日常'，一个被长期忽视的问题浮出水面：钱花在了哪里？一个开发者可能同时使用Claude Code、Cursor、Codex、Gemini CLI等多个工具，每个月的AI账单可能高达数百美元，但几乎没有人能说清楚——哪些任务花了多少钱、哪些to…"
category: github-projects
category_label: "GitHub 新项目速递"
date: 2026-05-07
slug: 06-github-projects-article-04-codeburn-20260509
reading_minutes: 3
---

> **热点手记** · GitHub 新项目速递 · hot.snaplinediary.cn · 估读约 3 分钟 · 2026-05-07

## 导语

当AI编程工具从"尝鲜"变成"日常"，一个被长期忽视的问题浮出水面：钱花在了哪里？一个开发者可能同时使用Claude Code、Cursor、Codex、Gemini CLI等多个工具，每个月的AI账单可能高达数百美元，但几乎没有人能说清楚——哪些任务花了多少钱、哪些token被浪费了、哪些工具性价比最高。2026年4月13日发布的CodeBurn，正是为了解决这个"黑箱"问题。

## 这个项目是什么

CodeBurn是一个本地运行的AI编程成本追踪工具，支持18种主流AI编程工具——包括Claude Code、Cursor、Codex（OpenAI）、Gemini CLI、GitHub Copilot、OpenCode、OpenClaw、Kiro、Pi等。它直接读取这些工具存储在本地的会话数据，使用LiteLLM定价数据库对每次API调用进行定价，提供TUI仪表盘、macOS菜单栏应用、CSV/JSON导出等功能。

项目使用TypeScript开发（Node.js），通过npm安装或Homebrew安装。上线不到一个月已收获5889颗Star，是5个项目中热度最高的。

## 为什么值得关注

**覆盖面最广的成本追踪。** CodeBurn支持18种AI编程工具，远超同类产品（如ccusage仅支持Claude Code，CodexBar仅支持Codex）。它自动检测本地安装了哪些工具，读取各自的会话数据格式——Claude Code的JSONL、Cursor的SQLite、Codex的rollout日志、Gemini CLI的JSON会话文件——统一归一化后进行成本分析。

**13种任务分类，全确定性分析。** CodeBurn将每次AI交互自动分类为13种任务类型：编码、调试、功能开发、重构、测试、探索、规划、委派、Git操作、构建部署、头脑风暴、对话、通用。分类完全基于工具使用模式和关键词，不调用任何LLM，保证结果可复现。

**Optimize：自动发现浪费。** 这是CodeBurn最有价值的功能之一。它会扫描会话数据和`~/.claude/`配置，自动发现10类浪费模式：跨会话重复读取的文件、低读写比（编辑前不读取导致重试）、未使用的MCP server、幽灵Agent和技能、膨胀的CLAUDE.md文件、缓存创建开销等。每个发现都附带预估节省金额和可直接执行的修复命令。

**Yield：关联git commit评估真实产出。** CodeBurn可以将AI会话与git commit按时间戳关联，区分"有效产出"（commit进入main分支）、"被回滚"和"被放弃"三类。这让开发者第一次能量化AI编程的真实ROI。

## 它能带来什么变化

对于个人开发者，CodeBurn提供了一个完整的"AI编程财务仪表盘"——每天花了多少钱、哪个工具最贵、哪类任务性价比最低、哪些配置改动能省钱。这种透明度本身就是价值。

对于团队管理者，CodeBurn的JSON API和CSV导出功能可以集成到团队成本管控流程中。按项目、按人员、按工具的多维度分析，让AI预算分配有据可依。

对于行业而言，CodeBurn代表了一种"AI可观测性"的新品类。正如APM工具改变了软件性能管理的方式，AI成本追踪工具可能成为AI编程时代的标配基础设施。

## 快速上手

```bash
# 安装
npm install -g codeburn

# 或
brew tap getagentseal/codeburn
brew install codeburn

# 交互式仪表盘（默认显示最近7天）
codeburn

# 今日概览
codeburn today

# 成本优化建议
codeburn optimize

# 模型对比
codeburn compare

# 导出CSV
codeburn export

# macOS菜单栏
codeburn menubar
```

GitHub仓库：https://github.com/getagentseal/codeburn
