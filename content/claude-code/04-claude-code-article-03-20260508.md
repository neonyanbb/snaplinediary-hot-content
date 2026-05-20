---
title: "半年试六款 AI 编程工具后：我留 Claude Code 的原因"
description: "从 Copilot 补全到 IDE Agent 再到终端 Claude Code，淘汰顺序反映真实瓶颈：全局依赖与可验证执行，而非谁 Tab 更快。本文记录两轮淘汰理由、留下 Claude Code 的三项能力，以及仍用 Cursor 的场景，避免非黑即白的工具站队。"
category: claude-code
category_label: "Claude Code"
date: 2026-05-20
slug: 04-claude-code-article-03-20260508
reading_minutes: 3
---

> **热点手记** · Claude Code · hot.snaplinediary.cn · 估读约 3 分钟 · 2026-05-20

## 实验设定

时间跨度约半年，覆盖两个主要项目：一个是 Python/TypeScript 混合单体仓库，另一个是个人开源项目的 issue 清理。每月固定选一项标准任务，任务来自真实 sprint，不是 toy repo。典型标准任务包括：给遗留模块补单元测试并修 lint、把旧接口从 callbacks 改成 async/await、在 CI 里加类型检查门控。

记录字段固定为七列：工具名、安装或配置耗时、任务完成分钟数、返工次数、是否实际跑过测试、当月是否愿意付费、月末是否仍安装在主力机器上。半年后回头看，最常留下的不是评分最高的，而是最省协调时间的。

## 第一轮淘汰：纯补全型工具

Copilot 和类似补全工具在「已知下一行写什么」时极快。写 React 组件时，它能猜出 `useState` 的初始值；写 Python 时，它能补全列表推导式。但在标准任务里，补全型工具需要我手动定位文件、复制错误信息、再贴回 chat，整体时间没有降多少。

举个例子：给 legacy 模块补测试时，我需要先找到该模块的依赖树，确认哪些函数有副作用需要 mock，再写测试。Copilot 能补单行 assert，但找不到「哪些文件该改」。淘汰理由很明确：补全不解决协调问题，只在打字层面加速。

## 第二轮淘汰：单文件 IDE Agent

Cursor 的 Agent 模式和 VS Code 的 Copilot Agent 在单文件或单目录场景表现不错。但遇到 `packages/` 多包仓库时，计划常漏测试包或 CI 配置。返工集中在「第二次才改对路径」：Agent 改了 `packages/core/src/auth.ts`，但忘了 `packages/api/tests/integration/auth.spec.ts` 里的接口契约。

这不是工具缺陷，而是架构复杂度问题。多包仓库的依赖关系跨目录，IDE 的默认上下文往往只加载当前工作区。Cursor 的 @ 符号可以手动加文件，但人要记得加哪些。淘汰理由：单文件 Agent 的上下文天花板太低，大重构时人成了「文件搬运工」。

保留 Cursor 用于边写边看 diff、UI 微调、Tab 补全。这不是失败，而是按任务分型。

## 留下 Claude Code 的三点

第一点：终端里自然跑测试。Claude Code 的会话环境就是 shell，失败日志直接进上下文，Agent 可以接着读报错修代码。Cursor 里跑测试需要切到 IDE 终端，再把日志贴回 chat，多一次复制粘贴，上下文容易断。

第二点：Plan Mode 可审。大改前有文件清单，配合人工看 diff，社区里多文件 JWT 迁移的案例反馈显示，有计划时返工次数明显下降。这不是心理安慰，而是把遗漏暴露在零成本阶段。

第三点：MCP 与 Hooks 的上限。MCP 可以接内部 issue 系统、Jira、文档库；Hooks 可以在 PreToolUse 封禁路径、在 PostToolUse 自动跑测试。这两层叠加后，Claude Code 从「个人助手」变成「有门禁的团队工具」。Cursor 的 project rules 是文本约束，执行层没有等价钩子。

## 决策框架

按任务特征选工具，而不是按品牌站队：

单行或单文件、你在屏幕前盯着改：Cursor / IDE Tab 补全最快。Agent 的启动和计划 overhead 在这里是浪费。

3 个以上文件、要跑测试验证：Claude Code + Plan Mode。跨文件协调是它的主场。

只要问答、不改仓库代码：普通 Chat（Claude web、ChatGPT）就够了，不需要装 CLI。

需要跨会话记长期背景：Hermes 等网关或自建 memory 层。Claude Code 的会话上下文有长度上限，长期记忆不是它的设计目标。

## 实测记录模板

如果你也想做半年对比，建议用这张表，不要空转印象流：

| 工具 | 安装耗时 | 标准任务分钟 | 返工次数 | 跑过测试 | 愿付费 | 半年后仍安装 |
|------|----------|--------------|----------|----------|--------|--------------|
| Copilot | | | | | | |
| Cursor | | | | | | |
| Claude Code | | | | | | |

标准任务必须来自真实工作，不是 LeetCode 或 toy demo。返工次数定义：Agent 输出后，你发现逻辑错误、漏文件、或测试没跑过，需要重新 prompt 的次数。

## 何时回退到纯 IDE

如果连续两周 Agent 改库引入的 bug 多于你自己手写的，说明流程有问题。可能的原因有三：测试太薄，Agent 改完没有自动化验证；计划太宽，Agent 顺手重构了无关模块；模型太激进，在不确定时选了错误实现。

这时候回退到 Cursor 手写加偶尔 Agent 不是失败，而是校准节奏。先用纯 IDE 把测试补厚、把目录结构理清楚，再重新开 Agent 会话。工具是手段，代码质量是目的。

## 迁移残留风险

从 Cursor 迁出时，检查这三项：未提交的 Agent 分支是否还在 `.cursor/` 目录里；`.cursorrules` 文件里的规则是否已翻译成 `CLAUDE.md` 的项目说明；之前配置的 MCP Server 端口是否与 Claude Code 的冲突。花半天做清理，比带着双工具并行跑一个月便宜。并行时最容易出的问题是：Cursor 的 Agent 改了文件 A，Claude Code 的会话还按旧版本做计划，导致覆盖冲突。

## 局限与不适合谁

「半年六款」的样本仍是一个人的技术栈，前端、iOS、Android 的排序可能不同。Claude Code 有订阅成本，学生或个人开发者如果预算紧，可以先用开源 Cline 加自备 API key。Cline 在终端 Agent 的能力上接近 Claude Code，但社区生态和官方迭代速度有差距。

如果公司政策禁止云端代码分析，任何云 Agent 都不适用，包括 Claude Code、Copilot、Cursor 的云端模式。这时候只能用本地模型加 Ollama 或 LM Studio，但能力会掉一档。

请用你的标准任务自测，不要照搬本文结论。工具选型没有通用答案，只有具体任务的具体匹配。
