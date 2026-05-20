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

遗留仓库里，改一处 import 可能牵动测试夹具、CI 配置与文档。传统补全工具按行猜，缺少 **全局依赖图**。Claude Code 的 Plan Mode 把流程切成：理解仓库 → 输出分步计划 → 人确认 → 执行 → 跑测试。2026 年社区对比（如 [Claude Code vs Cursor](https://claudecodeguides.com/claude-code-vs-cursor-definitive-comparison-2026/)）普遍把「多文件 + 可审计划」列为 CLI Agent 的主场。

## 标准工作流

```bash
npm install -g @anthropic-ai/claude-code
cd your-repo
claude
```

在会话中：

```
/plan 将 JWT 校验从 PyJWT 迁到 python-jose，保持 API 兼容，更新测试与 README
```

**人工审核计划时看四点**：

1. 是否列出 **所有** 触达文件（含测试、配置）？
2. 是否包含 **回滚策略**（feature flag 或分支说明）？
3. 是否标明 **验证命令**（`pytest`、`npm test`）？
4. 是否有「不改动」边界（例如 `legacy/` 只读）？

确认后再让 Agent 执行。执行中可随时打断调整，比一次性长提示词可控。

## 案例结构：Flask JWT 迁移（示意）

| 阶段 | Agent 动作 | 你应检查 |
|------|------------|----------|
| 扫描 | 找 `jwt`/`PyJWT` 引用 | 有无漏网脚本 |
| 计划 | 分步改 auth 模块、测试、依赖 | `requirements.txt` 版本 |
| 执行 | 改代码、装依赖 | diff 行数是否异常 |
| 验证 | 跑 pytest | 失败是否自动继续修 |

若测试红，让 Agent **读失败日志再改**，而不是手动贴栈（除非网络受限）。配合 Hooks 在 PostToolUse 自动跑测试，可形成闭环（见本站 Hooks 一文）。

## Plan Mode vs 直接执行

| 方式 | 优点 | 缺点 |
|------|------|------|
| Plan Mode | 可审、可停、适合 5+ 文件 | 多一轮交互 |
| 直接执行 | 快，适合 typo | 易漏文件或过度修改 |
| IDE 内联改 | 视觉 diff 舒服 | 弱于跨目录编排 |

经验法则：**3 文件以内且你盯着 diff** 可直接改；**认证/支付/迁移** 一律先 plan。

## 模型与成本

Plan 阶段可用较强模型读全库；执行阶段若步骤机械，可切换更小模型（`/model` 或 Model Picker，以文档为准）省额度。不要在 plan 未完成时就用最便宜模型，容易漏依赖。

## 迁移类任务的额外检查

数据库迁移、特性开关、双写阶段要在 plan 里单独成段。执行顺序往往是：加列 → 双写 → 切读 → 删旧列。Agent 若一步跳到删列，必须人工叫停。

## 文档与测试同步

计划里应点名 `README`、`docs/api/`、契约测试（pact）是否要改。漏文档的 refactor 在技术债里占一半，plan 阶段就要点名。

## 跨文件重构六步

1. `/plan` 列受影响文件与测试  
2. 人审 Plan，勾选范围  
3. 只读 Subagent 补风险表（可选）  
4. 主会话按 Plan 改代码  
5. PostToolUse 跑全量测试  
6. PR 附 Plan 摘要  

跳过 2 等于盲改。跳过 5 等于把 QA 扔给同事。

## 验收标准

- 测试全绿  
- diff 文件集合 ⊆ Plan 集合  
- 无新增 `@ts-ignore` 式掩盖（除非 Plan 允许）  
- 性能敏感路径有前后对比数据  

## 回滚预案

重构 PR 必须可一键 revert；数据库迁移类要分 PR，Agent 不适合一次改 schema+业务逻辑。

## 大重构的分 PR 策略

PR1：仅移动文件不改逻辑（测试仍绿）。PR2：改接口。PR3：删废弃代码。Agent 一次做完往往难以 review。Plan 阶段就拆 PR，人工分天合并。

## 性能回归探针

重构前后对关键 API 跑 `ab` 或 k6  smoke（若项目有）。Agent 不擅长隐式性能退化，人要盯 P95 延迟。

## 遗留代码 smell 清单

Plan 阶段列出：上帝类、循环依赖、无测试模块。重构顺序先解依赖再动刀，Agent 与人类架构师共用此清单，避免「先改 50 文件再发现编不过」。

## 实操附录：重构 PR 三联

PR1 只移动；PR2 只改接口；PR3 只删废弃。每 PR 附 Plan 摘要与测试截图。Review 时若 diff 超出 Plan，要求作者解释或关闭 PR。三联通过后才允许下一模块重构，防止「大爆炸式」合并。

## 读者可执行检查

下一次重构必须拆成至少两个 PR，并在描述里链接 Plan 摘要。单 PR 跨十文件默认拒绝 review。

## 发布前核对

下一次重构 PR 描述必须链 Plan 且文件数 ≤Plan 列表。超出则 review 直接 request changes。

## 会后跟进

重构三联标签（move/interface/cleanup）强制打在 PR 上，方便统计 Agent 重构风格。

## 版本记录

重构 PR 若未链 Plan，reviewer 使用模板回复要求补链，不手动长篇解释。

## 主题附注 1

请在验收时完成上文自查项，并把日期记在团队 wiki 的「Claude Code Plan Mode：跨文件重构从计划到验收」条目下。

## 主题附注 2

若官方 Release 变更配置字段，以当日文档为准，并在同 wiki 条目追加链接与日期。

## 主题附注 3

生产变更需指定 on-call 与回滚步骤，与本主题相关的命令以你环境实测为准。

## 局限与不适合谁

Plan 不是形式主义：若你从不读计划、一路确认，风险与盲改相同。超大 monorepo 仍受上下文限制，要配合 `.claude` 忽略规则或子目录分会话。没有测试的仓库，Plan 再细也难自动验收，应先补最小测试或手工 checklist。Claude Code 需订阅与网络，国内团队要评估合规。命令与标志以 [code.claude.com/docs](https://code.claude.com/docs) 为准。
