---
title: "Claude Code Hooks 与 Subagents：给 Agent 加门禁与分工"
description: "Claude Code 的 Hooks 在 SessionStart、PreToolUse、SubagentStop 等节点执行脚本或子 Agent；Subagents 在隔离上下文里跑子任务。本文说明典型门禁场景、hooks.json 配置思路与和 MCP 的分工，附三条验收标准，避免「全自动改库无人审」。"
category: claude-code
category_label: "Claude Code"
date: 2026-05-20
slug: 04-claude-code-article-06-hooks-subagents-20260520
reading_minutes: 3
---

> **热点手记** · Claude Code · hot.snaplinediary.cn · 估读约 3 分钟 · 2026-05-20

## 扩展层在解决什么问题

当 Claude Code 能读仓库、改文件、跑 shell 时，风险从「答错」变成 **「改错且已落盘」**。官方扩展体系里，Hooks 在生命周期节点插入你的逻辑；Subagents 把大任务拆成隔离上下文的小循环；MCP 接外部系统。三者叠加，才能得到「能自治但有闸」的流程，而不是单次提示词祈祷。

文档入口：[Hooks reference](https://code.claude.com/docs/en/hooks)、[Subagents](https://code.claude.com/docs/en/sub-agents)、[Features overview](https://code.claude.com/docs/en/features-overview)。

## Hooks：常见事件与用途

| 事件（示例） | 适合做什么 |
|--------------|------------|
| SessionStart | 打印仓库规范、加载团队 checklist |
| UserPromptSubmit | 拦截含密钥格式的提交 |
| PreToolUse | 禁止 `rm -rf`、限制写路径在 `src/` |
| PostToolUse | 自动 `npm test` 某包 |
| SubagentStart / SubagentStop | 记录子任务审计日志 |

Handler 可以是 shell、HTTP、LLM 提示，或 **再启动一个 Subagent**（官方说明 Hooks 可触发子 Agent）。工程上建议：

1. PreToolUse 做 **硬拒绝**（路径、命令黑名单）。
2. PostToolUse 做 **软验证**（测试、lint），失败时把日志塞回主会话。
3. 避免在 UserPromptSubmit 里跑超过 10 秒的脚本，否则交互卡顿。

配置位置与字段以当前版本 docs 为准，升级 Claude Code 后复查 Breaking Changes。

## Subagents：何时拆、如何收束

Subagent 在独立上下文运行，向主会话返回摘要。适合：

- 扫描 `legacy/` 目录生成风险清单，但不允许直接改生产配置。
- 并行两个只读调研（依赖版本、许可证冲突），主 Agent 合并结论后再改代码。

不适合：

- 需要频繁摸同一个大文件的多轮微调（上下文来回搬运反而慢）。
- 无人审核的「子 Agent 改完就 merge」。

**实测流程建议**：主会话 `/plan` 列出文件清单 → 只读 Subagent 填表 → 人工确认 → 主会话执行写入。这样 Hooks 的 PreToolUse 仍保护主路径。

## 与 MCP、Plan Mode 的配合

| 能力 | 作用 |
|------|------|
| Plan Mode | 先计划后改，降低盲改 |
| MCP | 拉 Jira、DB、内部 API |
| Hooks | 强制测试、封禁路径 |
| Subagents | 并行调研、隔离风险 |

MCP 解决「数据从哪来」，Hooks 解决「什么能执行」，Subagents 解决「谁来做子任务」。缺 Hooks 时，Plan 再漂亮也可能一次 `git push` 翻车。

## 三条验收标准

1. **恶意探针**：故意让 Agent 写 `/etc` 或删 `node_modules`，PreToolUse 应拦截并给出明确原因。
2. **回归探针**：改 `src/foo.ts` 后 PostToolUse 触发单测，失败时会话内出现失败日志。
3. **子任务探针**：Subagent 只返回摘要，主会话历史里不应塞满子 Agent 全文 dump（否则上下文爆炸）。

## hooks.json 维护建议

把 Hooks 当代码审查：PR 里改 hooks、说明动机、附测试结果。为 PreToolUse 写单元测试（传入恶意路径，期望拒绝）。HTTP Hook 要有超时，避免 Agent 卡死在外部服务。

## Subagent 成本意识

每个 Subagent 都是一次完整上下文循环。并行三个子任务可能三倍 token。对大仓库，先让 Subagent 输出 **文件路径列表** 而非全文 dump，主 Agent 再按需读取。

## PreToolUse 示例思路（伪配置）

```json
{
  "event": "PreToolUse",
  "match": { "tool": "write", "path": "infra/**" },
  "action": "deny",
  "message": "生产基础设施禁止 Agent 直写"
}
```

上线前用三条恶意路径做回归：删 `node_modules`、写 `/etc`、改 `package-lock` 以外锁文件。

## Subagent 任务卡模板

```
目标：只读扫描 legacy/ 依赖风险
禁止：写任何文件
输出：Markdown 表（路径|风险|建议）
```

主会话只合并表格，不让子 Agent 直接 commit。

## 与 CI 双闸

Hooks 是开发机闸，CI 是最后一闸。两者测试命令必须一致，否则会出现「本地 Hook 过、CI 挂」的扯皮。

## Hook 测试矩阵

| 用例 | 期望 |
|------|------|
| 写 `../outside` | deny |
| `rm -rf` | deny |
| `npm test` 失败 | 日志回会话 |
| 合法写 `src/a.ts` | allow |

每次改 hooks.json 跑矩阵，纳入 CI（可用 dry-run 脚本）。

## Subagent 并行上限

建议同时不超过 2 个子任务，否则主会话合并摘要困难、token 爆炸。队列化第三个任务等人审前两个结果。

## 文档化 Hooks 决策

每个 deny 规则写 ADR 一句话：为何禁止、误报如何申诉。团队规模超过十人时，没有 ADR 的 Hooks 会被新人关掉。

## 实操附录：Hooks 上线 Checklist

- [ ] 恶意路径回归通过  
- [ ] PostToolUse 测试命令与 CI 一致  
- [ ] HTTP Hook 超时小于 5 秒  
- [ ] 文档 ADR 已合并  
- [ ] on-call 知道如何临时禁用 Hooks  

全部勾选才允许全员开启写权限。缺一项则仅试点两人。

## 读者可执行检查

跑通恶意路径探针一次，把拦截日志贴进 PR。探针失败则 Hooks 不得合并到 main。

## 发布前核对

恶意路径探针日志链接贴在 Hooks PR。探针未跑的合并视为无效合并。

## 会后跟进

Hooks 回归测试纳入 CI nightly，防新人误删规则。

## 版本记录

Hooks nightly 失败即 Slack 告警，指定 owner 当日修复或临时禁用相关规则并记录原因。

## 主题附注 1

请在验收时完成上文自查项，并把日期记在团队 wiki 的「Claude Code Hooks 与 Subagents：给 Agent 加门禁与分工」条目下。

## 局限与不适合谁

Hooks 要你维护脚本与失败处理，小团队若没有 CI 纪律，容易写成「永远误报」而被关掉。Subagents 增加 token 与时间成本，简单单文件 bugfix 用主会话更快。2026 年起 Agent SDK 订阅可能有独立额度（见 Anthropic 公告），预算紧的团队要先算清。若你只在 IDE 里偶尔补全、不让 Agent 跑 shell，Hooks/Subagent 体系可跳过，用 Cursor Tab 补全即可。配置细节始终以 [code.claude.com/docs](https://code.claude.com/docs) 为准。
