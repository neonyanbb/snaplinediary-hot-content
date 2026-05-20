---
title: "Claude Code Plan Mode：跨文件重构从计划到验收"
description: "Plan Mode 让 Agent 先出可审计划再改仓库，适合 JWT 迁移、模块拆分等触点多文件任务。本文用 Flask 迁移示例说明 /plan 流程、与直接执行的对比、模型切换省成本技巧，以及计划通过前的四条人工检查项。"
category: claude-code
category_label: "Claude Code"
date: 2026-05-20
slug: 04-claude-code-article-07-plan-mode-refactor-20260520
reading_minutes: 3
---

> **热点手记** · Claude Code · hot.snaplinediary.cn · 估读约 3 分钟 · 2026-05-20

## 为什么「直接改」在老项目上容易翻车

遗留仓库里，改一处 import 可能牵动测试夹具、CI 配置与文档。传统补全工具按行猜，缺少全局依赖图。Claude Code 的 Plan Mode 把流程切成五段：理解仓库、输出分步计划、人确认、执行、跑测试。社区对比普遍把「多文件加可审计划」列为 CLI Agent 的主场优势。

盲改的典型翻车路径是：Agent 改了 `src/auth.py` 里的 JWT 库引用，测试因为异常类型变化而红，但 Agent 没读到测试文件，以为任务完成。Plan Mode 在落盘前强制输出文件级清单，把这类遗漏暴露在零成本阶段。

## 标准工作流与安装

终端里确保已安装：

```bash
npm install -g @anthropic-ai/claude-code
cd your-repo
claude
```

进入会话后，不要用自然语言直接要求修改。先进入计划模式：

```
/plan 将 JWT 校验从 PyJWT 迁到 python-jose，保持 API 兼容，更新测试与 README
```

Agent 会返回一份结构化计划。人工审核时逐条检查四点：是否列出所有触达文件（含测试、配置）；是否包含回滚策略（feature flag 或分支说明）；是否标明验证命令（pytest、npm test）；是否有「不改动」边界（例如 legacy/ 只读）。

确认后再让 Agent 执行。执行中可随时打断调整，比一次性长提示词可控。如果测试红，让 Agent 读失败日志再改，而不是你手动贴栈跟踪。

## 案例：Flask JWT 迁移的完整阶段

以具体仓库结构为例，假设项目含 `app/auth/`、`tests/`、`requirements.txt`、`README.md`。Plan 输出应包含以下阶段：

扫描阶段。Agent 找所有 `jwt` 和 `PyJWT` 引用，包括 `app/auth/validator.py`、`tests/test_auth.py`、`scripts/generate_token.py`。你应检查有无漏网文件，比如 `docs/` 里的内嵌代码块。

计划阶段。分步列出：先改 `app/auth/validator.py` 的 import 和异常捕获；再改 `tests/test_auth.py` 的 assert 异常类型；然后更新 `requirements.txt` 的依赖；最后改 `README.md` 的示例代码。你应核对 `requirements.txt` 里的版本号策略，是 pin 还是 range。

执行阶段。Agent 按顺序改代码、装依赖。你应盯着 diff 行数，如果突然出现 200 行无关格式化，立即打断。

验证阶段。跑 `pytest tests/test_auth.py -v`。你应看终端输出的 passed 数量，不要信 Agent 的口头总结。如果红，把日志贴回会话继续修。

配合 Hooks 在 PostToolUse 自动跑测试，可形成本地闭环。Hooks 配置见本站《Hooks 与 Subagents》一文。

## Plan Mode vs 直接执行

| 方式 | 优点 | 缺点 |
|------|------|------|
| Plan Mode | 可审、可停、适合 5 个以上文件 | 多一轮交互 |
| 直接执行 | 快，适合 typo | 易漏文件或过度修改 |
| IDE 内联改 | 视觉 diff 舒服 | 弱于跨目录编排 |

经验法则：3 个文件以内且你盯着 diff，可直接改；认证、支付、迁移类任务一律先 plan。直接执行在简单任务上省时间，但在复杂任务上的返工成本远高于 plan 的额外交互。

## 模型与成本切换

Plan 阶段建议用较强模型读全库、理依赖。执行阶段若步骤机械，比如批量改 import 路径，可切换更小模型省额度。不要在 plan 未完成时就用最便宜模型，容易漏依赖或误判影响范围。

切换方式以当期文档为准，可能是 `/model` 子命令或界面下拉菜单。记录一周账单，对比「全强模型」和「Plan 强、执行弱」两种策略的总成本。不要凭感觉省，数据说了算。

## 迁移类任务的额外检查

数据库迁移、特性开关、双写阶段要在 plan 里单独成段。执行顺序必须是：加列、双写、切读、删旧列。Agent 若一步跳到删列，必须人工叫停。

特性开关类迁移要标明开关名、默认值、回滚方式。Plan 里没提 feature flag 的迁移，默认视为不可上线。

## 文档与测试同步

计划里应点名 `README`、`docs/api/`、契约测试（pact）是否要改。漏文档的 refactor 在技术债里占一半，plan 阶段就要点名，而不是等 review 时才补。

如果项目有 OpenAPI 契约或 GraphQL schema，plan 里必须列出生成命令，比如 `make generate-api-docs`。Agent 改了接口却忘了重新生成文档，是常见的 plan 遗漏点。

## 跨文件重构六步

第一步，用 `/plan` 列受影响文件与测试。第二步，人审 Plan，勾选范围，缺信息就要求补。第三步，可选派只读 Subagent 补风险表。第四步，主会话按 Plan 改代码。第五步，PostToolUse 跑全量测试。第六步，PR 附 Plan 摘要。

跳过第二步等于盲改。跳过第五步等于把 QA 扔给同事。六步不是形式主义，是防止大爆炸合并的最低防线。

## 验收标准

重构 PR 必须满足四条：测试全绿；diff 文件集合是 Plan 集合的子集，超出要解释；无新增 `@ts-ignore` 式掩盖，除非 Plan 允许；性能敏感路径有前后对比数据，哪怕只是本地 `ab` 或 `time` 的粗略值。

## 回滚预案与分 PR 策略

重构 PR 必须可一键 revert。如果涉及数据库迁移，Agent 不适合一次改 schema 加业务逻辑，必须拆成多个 PR。推荐顺序：PR1 仅移动文件不改逻辑，测试仍绿；PR2 改接口；PR3 删废弃代码。Agent 一次做完往往难以 review，Plan 阶段就拆好，人工分天合并。

回滚触发条件要写进 Plan：哪类测试红就 revert，哪类告警升 P2。条件越具体，执行越不犹豫。

## 局限与不适合谁

Plan 不是形式主义：若你从不读计划、一路确认，风险与盲改相同。超大 monorepo 仍受上下文长度限制，要配合 `.claudeignore` 或子目录分会话。没有测试的仓库，Plan 再细也难自动验收，应先补最小测试或手工 checklist。

Claude Code 需订阅与网络，国内团队要评估合规。命令与标志以 code.claude.com/docs 为准，不同版本的 `/plan` 支持细节可能有差异。本文基于 2026 年 5 月社区实测，不构成实施承诺。
