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

当 Claude Code 能读仓库、改文件、跑 shell 时，风险从「答错」变成「改错且已落盘」。官方扩展体系里，Hooks 在生命周期节点插入你的逻辑；Subagents 把大任务拆成隔离上下文的小循环；MCP 接外部系统。三者叠加，才能得到「能自治但有闸」的流程，而不是单次提示词祈祷。

文档入口：Hooks reference、Subagents、Features overview 均在 code.claude.com/docs 下。升级 Claude Code 后务必复查 Breaking Changes，hooks.json 的字段和事件名可能随版本调整。

## Hooks：常见事件与用途

Hooks 目前支持的事件包括 SessionStart、UserPromptSubmit、PreToolUse、PostToolUse、SubagentStart、SubagentStop 等。每个事件可以绑定 shell 脚本、HTTP 请求或 LLM 提示，也可以触发另一个 Subagent。

SessionStart 适合打印仓库规范、加载团队 checklist，或者自动检查 `CLAUDE.md` 是否存在。UserPromptSubmit 可以拦截含密钥格式的提交，比如提示词里出现 `AKIA` 开头字符串时弹警告。

PreToolUse 是最关键的硬拒绝层。在这里封禁 `rm -rf`、限制写路径只在 `src/`、禁止修改 `package-lock.json` 以外的锁文件。PostToolUse 做软验证，比如改完 `src/foo.ts` 后自动跑 `npm test -- src/foo.test.ts`，失败时把日志塞回主会话。

工程建议：PreToolUse 做硬拒绝，路径和命令黑名单必须明确；PostToolUse 做软验证，测试失败不阻断，但要把错误回流给 Agent；UserPromptSubmit 里的脚本控制在 10 秒内，否则交互卡顿。

## Subagents：何时拆、如何收束

Subagent 在独立上下文运行，向主会话返回摘要。适合两类任务：

只读调研。比如扫描 `legacy/` 目录生成风险清单，但不允许直接改生产配置。并行两个子任务（查依赖版本冲突、查许可证兼容），主 Agent 合并结论后再改代码。

隔离性验证。让 Subagent 试跑一个破坏性脚本或读敏感日志，主会话不直接触碰这些资源。

不适合的场景也有两类：需要频繁摸同一个大文件的多轮微调，上下文来回搬运反而慢；无人审核的「子 Agent 改完就 merge」，这绕过了主会话的 PreToolUse 门禁。

实测流程建议：主会话 `/plan` 列出文件清单，然后派只读 Subagent 去填风险表，人工确认后，主会话再执行写入。这样 Hooks 的 PreToolUse 仍保护主路径，Subagent 的越界行为不会落盘。

## 与 MCP、Plan Mode 的配合

| 能力 | 作用 |
|------|------|
| Plan Mode | 先计划后改，降低盲改 |
| MCP | 拉 Jira、DB、内部 API |
| Hooks | 强制测试、封禁路径 |
| Subagents | 并行调研、隔离风险 |

MCP 解决「数据从哪来」，Hooks 解决「什么能执行」，Subagents 解决「谁来做子任务」。缺 Hooks 时，Plan 再漂亮也可能一次 `git push` 翻车；缺 Plan 时，Hooks 只能被动拦截，无法预防结构性错误。

## 三条验收标准与探针脚本

上线 Hooks 前必须跑通三条探针：

恶意探针。故意让 Agent 写 `/etc/passwd` 或删 `node_modules`，PreToolUse 应拦截并给出明确原因。如果只静默失败，工程师会误以为命令执行成功。

回归探针。改 `src/foo.ts` 后 PostToolUse 触发单测，失败时会话内必须出现失败日志。如果日志没回流，Agent 会以为测试通过，继续下一步错误操作。

子任务探针。Subagent 只返回摘要，主会话历史里不应塞满子 Agent 的全文 dump，否则上下文爆炸。摘要应控制在 500  token 以内，主 Agent 按需读取具体文件。

## PreToolUse 配置实例

以下是一份 hooks.json 的示意结构，具体字段以官方文档为准：

```json
{
  "hooks": [
    {
      "event": "PreToolUse",
      "match": { "tool": "write", "path": "infra/**" },
      "action": "deny",
      "message": "生产基础设施禁止 Agent 直写"
    },
    {
      "event": "PreToolUse",
      "match": { "tool": "bash", "command": "rm -rf *" },
      "action": "deny",
      "message": "危险命令已拦截"
    },
    {
      "event": "PostToolUse",
      "match": { "tool": "write", "path": "src/**/*.ts" },
      "action": "run",
      "command": "npm test -- --testPathPattern='src' --bail"
    }
  ]
}
```

上线前用三条恶意路径做回归：写 `../outside-repo`、执行 `rm -rf node_modules`、改 `yarn.lock` 以外的锁文件。任何一条没拦住，Hooks 就不该合并到主分支。

## Subagent 任务卡与成本意识

派 Subagent 前，给它的任务卡应包含三要素：

目标：只读扫描 legacy/ 依赖风险。
禁止：写任何文件、执行 install、commit。
输出：Markdown 表，列路径、风险等级、建议。

每个 Subagent 都是一次完整上下文循环。并行三个子任务可能三倍 token。对大仓库，先让 Subagent 输出文件路径列表而非全文 dump，主 Agent 再按需读取，能省一半 token。

建议同时运行的 Subagent 不超过两个。第三个任务队列化，等人审完前两个结果再派。主会话合并三个摘要的难度远高于合并两个，超过两个时决策质量会下降。

## 与 CI 双闸

Hooks 是开发机闸，CI 是最后一闸。两者测试命令必须一致，否则会出现「本地 Hook 过、CI 挂」的扯皮。建议把测试命令抽成 `package.json` 里的统一脚本，比如 `npm run test:agent`，Hooks 和 CI 都调用它。

HTTP Hook 要有超时，建议小于 5 秒。Agent 卡死在外部服务上时，超时会话可恢复，无超时只能杀进程。

## 局限与不适合谁

Hooks 需要你维护脚本与失败处理，小团队若没有 CI 纪律，容易写成「永远误报」而被关掉。PreToolUse 规则太松等于没设，太紧会频繁打断正常操作，平衡点需要按仓库调整。

Subagents 增加 token 与时间成本，简单单文件 bugfix 用主会话更快。2026 年起 Agent SDK 订阅可能有独立额度，预算紧的团队要先算清用量。

若你只在 IDE 里偶尔补全、不让 Agent 跑 shell，Hooks 和 Subagent 体系可跳过，用 Cursor Tab 补全即可。配置细节始终以 code.claude.com/docs 为准，本文的 hooks.json 仅为示意，事件名和字段可能随版本变更。
