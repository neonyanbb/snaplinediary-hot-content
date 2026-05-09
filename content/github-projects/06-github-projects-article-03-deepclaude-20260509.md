---
title: "DeepClaude：保留Claude Code体验，成本降到1/17"
description: "导语 Claude Code是目前公认最强的自主编码Agent，但每月$200的订阅费用和用量上限让不少开发者望而却步。与此同时，DeepSeek V4 Pro在LiveCodeBench上取得了96.4%的成绩，输出token价格仅为$0.87/M——不到Anthropic的…"
category: github-projects
category_label: "GitHub 新项目速递"
date: 2026-05-05
slug: 06-github-projects-article-03-deepclaude-20260509
reading_minutes: 3
---

> **热点手记** · GitHub 新项目速递 · hot.snaplinediary.cn · 估读约 3 分钟 · 2026-05-05

## 导语

Claude Code是目前公认最强的自主编码Agent，但每月$200的订阅费用和用量上限让不少开发者望而却步。与此同时，DeepSeek V4 Pro在LiveCodeBench上取得了96.4%的成绩，输出token价格仅为$0.87/M——不到Anthropic的1/17。2026年5月3日发布的DeepClaude项目，正是瞄准了这个巨大的价格差。

## 这个项目是什么

DeepClaude（原名cheapclaude）是一个透明代理工具，它保留Claude Code的全部"身体"——工具循环、文件编辑、bash执行、git操作、子Agent生成——只替换"大脑"，将API调用从Anthropic切换到DeepSeek V4 Pro、OpenRouter或Fireworks AI等更便宜的后端。

项目使用JavaScript开发，通过设置环境变量（ANTHROPIC_BASE_URL、ANTHROPIC_AUTH_TOKEN等）实现透明替换，不需要修改Claude Code的任何代码。上线6天已获得1645颗Star，Fork数92，社区贡献活跃（11个Issues，11个PR）。

## 为什么值得关注

**17倍成本差异的真实依据。** DeepClaude的成本对比基于公开定价：Anthropic Opus输出$15/M，DeepSeek V4 Pro输出$0.87/M，相差约17倍。对于重度用户（每月25天使用），Anthropic Max计划$200/月的封顶费用，用DeepSeek仅需约$50/月。对于轻度用户，节省可达90%。

**自动上下文缓存的叠加效应。** DeepSeek支持自动上下文缓存，首次请求后系统提示和文件上下文以$0.004/M的价格缓存（对比未缓存$0.44/M），这意味着Agent多轮对话的边际成本极低。对于需要频繁交互的编码任务，实际节省可能超过17倍。

**实时切换，无需重启。** 项目集成了一个本地代理（localhost:3200），支持在会话中通过Slash命令（`/deepseek`、`/anthropic`、`/openrouter`）或CLI标志实时切换后端。开发者可以在常规任务中使用DeepSeek节省成本，遇到复杂推理时一键切回Claude Opus。

**内置成本追踪。** 代理自动追踪token用量，计算相对Anthropic定价的实际节省金额，让每一分钱的花费都清晰可见。

## 它能带来什么变化

对于个人开发者和小型团队，DeepClaude意味着可以用1/17的成本获得Claude Code的核心体验。每月$20的DeepSeek API费用替代$200的Anthropic订阅，对于预算有限的独立开发者而言是实质性的门槛降低。

对于企业用户，DeepClaude的实时切换能力提供了一种"分层推理"的工作流：80%的常规编码任务用DeepSeek完成，20%的复杂架构设计切回Claude Opus。这种混合策略可以在保证质量的同时显著控制成本。

对于行业而言，DeepClaude验证了一个趋势：AI编码Agent的"身体"（工具循环、文件操作、Agent架构）正在与"大脑"（模型）解耦。未来可能出现更多"换脑"工具，让开发者自由选择性价比最优的模型后端。

## 快速上手

```bash
# 1. 获取DeepSeek API密钥（platform.deepseek.com，充值$5）
# 2. 设置环境变量
export DEEPSEEK_API_KEY="sk-your-key-here"

# 3. 安装
chmod +x deepclaude.sh
sudo ln -s "$(pwd)/deepclaude.sh" /usr/local/bin/deepclaude

# 4. 使用
deepclaude                          # 用DeepSeek V4 Pro启动Claude Code
deepclaude --status                 # 查看可用后端
deepclaude --backend or             # 切换到OpenRouter
deepclaude --switch ds              # 会话中切换后端（无需重启）
deepclaude --cost                   # 查看价格对比
```

GitHub仓库：https://github.com/aattaran/deepclaude
