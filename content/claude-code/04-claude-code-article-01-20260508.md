---
title: "Claude Code 是什么：终端 Agent 与 IDE 插件的分工"
description: "Claude Code 是 Anthropic 的 Agent 式编码工具，能读仓库、改文件、跑命令并与 Slack 等集成。本文说明终端、IDE、桌面与浏览器四种入口的差异，以及和「补全型 Copilot」的本质区别，帮助判断何时从 Tab 补全升级到 Agent。"
category: claude-code
category_label: "Claude Code"
date: 2026-05-20
slug: 04-claude-code-article-01-20260508
reading_minutes: 3
---

> **热点手记** · Claude Code · hot.snaplinediary.cn · 估读约 3 分钟 · 2026-05-20

## 从补全到 Agent：范式差异

GitHub Copilot 经典模式是 **预测下一行**；Cursor 强化 **文件级上下文**；Claude Code 默认目标是 **完成一项开发任务**：读树、改多文件、执行 shell、根据测试失败迭代。官方 [Overview](https://code.claude.com/docs/en/overview) 将其描述为可集成终端、IDE、桌面与 Web 的 coding agent。

若你 80% 时间是手写 + 偶尔补全，Agent 溢价不明显；若常做跨目录重构、迁移、补测试，Agent 省的是 **协调成本**，不是打字速度。

## 四种入口怎么选

| 入口 | 适合 | 注意 |
|------|------|------|
| 终端 CLI | CI 旁路、远程 SSH、脚本化 | 熟悉 shell 的开发者 |
| IDE 集成 | 边改边看 diff | 与现有快捷键共存 |
| 桌面 App | 多项目会话、Focus 模式 | 以当期 changelog 为准 |
| Web | 轻量审查、外出办公 | 仓库访问权限 |

团队可统一 **「计划与执行在 CLI，肉眼审查在 IDE」**，减少「到底在哪个窗口改」的混乱。

## 四个能力块（2026 常见组合）

1. **Plan Mode**：先 `/plan` 再改（详见本站 Plan Mode 一文）。
2. **Model Picker**：简单任务用小模型，重构用强模型。
3. **MCP**：接 issue、文档、内部 API。
4. **Hooks / Subagents**：门禁与子任务（详见 Hooks 一文）。

不必第一天全开；顺序建议：CLI 跑通 → Plan → MCP 只读 → Hooks。

## 快速上手（最小路径）

```bash
npm install -g @anthropic-ai/claude-code
cd your-project
claude
```

首条任务选 **只读**：「列出 `src/` 下依赖 React 的文件，不要修改」。通过后再做「添加一个带测试的工具函数」类小改，建立对 diff 质量的信任。

## 文档阅读顺序（官方）

建议路径：Overview → CLI 安装 → Plan Mode → MCP → Hooks。每读完一节做一次 10 分钟练习，比一次读完忘光更有效。遇到命令找不到，先 `claude --help` 与 docs 站内搜索，版本差异以你安装的 CLI `--version` 为准。

## 团队落地时的权限边界

让 Claude Code 跑 shell 等于给实习生 root 钥匙。最低限度：专用分支、禁止直接 push main、敏感目录只读挂载。CI 里可以只允许 Agent 开 PR，由人 merge。把 `.claude` 或等价忽略文件提交进仓库，明确哪些路径永不可改（`infra/prod/`、密钥模板等）。

## 与 CI 的衔接思路

理想闭环：Agent 改代码 → PostToolUse 跑 `npm test` → 失败则继续修 → 通过后 `git push` 触发 GitHub Actions。现实里很多团队停在「本地测过」，建议至少把 **同一条测试命令** 写进 Hooks，减少「我机器上过但 CI 挂」的扯皮。

## 终端 vs IDE：团队约定示例

```text
计划与多文件执行：终端 claude
肉眼审查与单文件微调：IDE
禁止：两处同时改同一分支
```

## 权限最小集

- 分支：`agent/*` 专用前缀  
- 路径：`src/` 可写，`infra/prod/` 拒绝  
- 命令：允许 `npm test`，拒绝 `curl | sh`  

把规则写进 Hooks 示例配置旁注，新人 onboarding 时一起讲。

## 首月技能路径

周 1 只读扫树；周 2 单文件+测试；周 3 Plan 小重构；周 4 MCP 只读 issue。每周写一条「本仓库禁止 Agent 做的事」，比泛泛读 docs 更快建立肌肉记忆。

## 会话内命令习惯

固定用 `/plan` 开始大任务；用 `/compact` 或官方等价命令压缩历史（以 docs 为准）；结束会话前要求 Agent 输出「改了哪些文件、测了哪些命令」。养成习惯后，隔天接手的人能读最后一条消息续工。

## 与 Git 工作流

推荐 `agent/YYYYMMDD-任务名` 分支；禁止 `-f push`。合并前人看 diff，Agent 写 commit message 可辅助但不可自动 merge 到 main。把规则写进 `CONTRIBUTING.md`，Agent 读得到。

## 远程 SSH 场景

在跳板机上跑 Claude Code 时，确认代码目录与本地 IDE 同步策略。避免 SSH 上改了一半、本地又改一半。推荐 SSH 只读调研，写入仍在笔记本 IDE 审查后 push。

## 实操附录：四人结对上 Claude Code

两人一组，A 操作终端，B 审查 Plan 与 diff，30 分钟完成「只读扫树+单文件修测试」；角色互换再来 30 分钟。结束后全组共读 `claude --version` 与 docs 链接，确认版本一致。结对笔记写入团队 wiki，作为 onboarding 第零天必修。

## 读者可执行检查

在本机跑通只读扫树任务，并把 `claude --version` 记入团队 wiki。未跑通不要开启写权限。

## 发布前核对

`claude --version` 与团队 wiki 一致。只读扫树未通过者，本周禁止 Agent 写 `src/`。

## 会后跟进

只读扫树通过的同事，才开放 `src/` 写权限培训名额，控制第一波事故面。

## 版本记录

CLI 版本每月对齐一次，避免有人用旧命令导致文档步骤失效。对齐日在日历重复。

## 主题附注 1

请在验收时完成上文自查项，并把日期记在团队 wiki 的「Claude Code 是什么：终端 Agent 与 IDE 插件的分工」条目下。

## 主题附注 2

若官方 Release 变更配置字段，以当日文档为准，并在同 wiki 条目追加链接与日期。

## 主题附注 3

生产变更需指定 on-call 与回滚步骤，与本主题相关的命令以你环境实测为准。

## 局限与不适合谁

Claude Code 需要 Anthropic 账号与费用预算，且代码会上传云端处理（企业需协议）。不适合不愿让 Agent 跑 shell 的环境。纯前端静态页、单文件作业，Cursor Tab 可能更轻。功能名称与定价随版本更新，实施前查阅官方文档，本文不构成采购承诺。
