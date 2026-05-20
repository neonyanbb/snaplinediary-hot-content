---
title: "DeepClaude：替换 Claude Code 模型后端以降本的路由代理"
description: "DeepClaude 通过本地代理把 Anthropic API 流量转到 DeepSeek、OpenRouter 等，保留 Claude Code 工具循环。本文说明环境变量接入、会话内 /switch 切换、成本追踪逻辑，以及质量与合规上不能指望 1:1 替代 Opus 的场景。"
category: github-projects
category_label: "GitHub 新项目速递"
date: 2026-05-20
slug: 06-github-projects-article-03-deepclaude-20260509
reading_minutes: 3
---

> **热点手记** · GitHub 新项目速递 · hot.snaplinediary.cn · 估读约 3 分钟 · 2026-05-20

## 问题：身体很强，账单也很强

Claude Code 的工具体验（读写文件、bash、子 Agent）被很多开发者认可，但 Anthropic 订阅与高额 API 对独立开发者是门槛。DeepSeek V4 Pro 等模型在公开 benchmark 上表现亮眼，且 token 单价更低。[DeepClaude](https://github.com/aattaran/deepclaude)（社区项目，曾名 cheapclaude）做的是 **透明反向代理**：保留 Claude Code 客户端，替换后端 endpoint。

## 工作原理（概念）

1. 本地代理监听（文档示例 localhost:3200）。  
2. 设置 `ANTHROPIC_BASE_URL`、`ANTHROPIC_AUTH_TOKEN` 等指向代理。  
3. 代理把请求转发到 DeepSeek / OpenRouter / Fireworks 等。  
4. 会话内可用 slash 或 flag 切回官方 Anthropic。

**「17 倍」说法**：来自公开价目表对比（Opus 输出 vs DeepSeek 输出），实际账单还受缓存命中、工具轮次、失败重试影响，务必用 `--cost` 或自建表格验证。

## 上手

```bash
export DEEPSEEK_API_KEY="sk-..."   # 勿提交到 git
chmod +x deepclaude.sh
sudo ln -s "$(pwd)/deepclaude.sh" /usr/local/bin/deepclaude
deepclaude
deepclaude --status
deepclaude --switch ds    # 示例，以仓库 README 为准
```

**实测任务**：用同一 bugfix，分别走官方后端与 DeepSeek，比较：能否通过测试、返工轮次、总 token。

## 分层推理工作流

- 80% 脚手架、文档、样板测试 → 便宜后端  
- 20% 架构/security 审查 → 切 Opus  
- 企业：可能 **禁止** 把代码发到 DeepSeek，此方案直接不适用

## 密钥与日志

代理进程常记录请求元数据。禁止 debug 日志打印完整 prompt。DeepSeek Key 与 Anthropic Key 分环境变量，勿写进 shell history（用 `.env` + direnv）。

## 质量回归套件

维护 10 个固定 coding prompt（含多文件、含测试），每次换后端跑一遍，记录通过率。价格降了但通过率掉 20%，就不值得默认切换。

## 仓库健康度怎么读

看 06-github-projects-article-03-deepclaude-20260509.md 所属项目时，建议同时打开：近 30 天 commit 频率、open issue 里 security 标签、release 是否 signed、文档里 Install 章节是否跟得上 main。Star 数反映关注度，不反映你可否明天上生产。fork 后先在自己的 GitHub Actions 里跑通示例，再谈团队推广。

## 贡献与回馈

若 POC 成功，考虑提 PR 修文档错别字或补中文 README，比只发推特更有助于项目持续维护。上游合并慢时，维护内部 fork 的 patch 分支，定期 rebase。

## 生产准入检查（通用）

- [ ] 许可证允许商用  
- [ ] 密钥不进仓库  
- [ ] 有回滚方案  
- [ ] 有 on-call  
- [ ] 数据出境合规

## 路由代理拓扑

```text
Claude Code CLI → DeepClaude 代理 → 后端（官方/本地/第三方）
```

上线前用 **同一** 标准任务对比：延迟、工具调用成功率、失败时错误是否可读。 cheaper 但常超时的后端会拖垮 Agent 循环。

## 密钥与日志

代理进程常握有多把 Key。禁止 debug 日志打印完整请求体。轮换 Key 时要同时改 Claude Code 与代理两侧配置，避免一半流量仍走旧 Key。

## 回滚开关

在环境变量保留 `USE_OFFICIAL=1` 一键切回官方端点。POC 两周后做故障演练：故意停代理，确认团队能在 15 分钟内恢复开发。

## 合规提示

第三方后端可能涉及数据驻留变化。企业法务须书面确认，不要因「能接本地模型」就默认无风险。

## 工具调用兼容性测试

让 Claude Code 执行：读文件、写临时文件、跑测试、调 MCP（若接）。对比直连官方与走代理的成功率。某一步失败就记录 HTTP 状态与响应体，发给代理维护者。

## 多后端切换策略

工作日官方、夜间本地模型降本，需自动化切换脚本。切换时清会话或提示用户，避免混用导致上下文与后端不匹配。

## 成本账本

按周记录：官方美元、本地电费摊销、工程师维护小时。本地不一定便宜，若每周花 4 小时调驱动，时薪 200 则月成本 3200 元。

## 代理层的可观测性

为代理进程加 metrics：请求延迟、错误率、上游模型标识。没有 metrics 则在故障时只能猜。Prometheus 或云监控任选，关键是 **按后端拆分**。

## 法务与数据流图

画一张图：Claude Code → 代理 → 后端 → 模型供应商。给法务标注数据驻留地。未通过前不要接客户源码仓库。

## 实操附录：代理故障切换演练

工作日高峰模拟代理宕机 10 分钟，团队按 runbook 切官方端点，记录恢复时间与未提交会话数。恢复超过 15 分钟则判定 HA 不足，生产不得依赖单代理进程。

## 实操附录：后端成本对照周

并行记录官方与本地后端各 50 次标准任务的总费用与总耗时。费用低但耗时翻倍时，ROI 仍可能为负，需写入采购幻灯片。

## 读者可执行检查

完成一次代理故障切换演练并记录恢复分钟数。超过 15 分钟则生产必须保留官方端点并行。

## 密钥轮换日历

代理与 Claude Code 两侧 Key 同周轮换，避免半边流量仍用泄露 Key。

## 发布前核对

代理切换演练记录恢复分钟数。>15 分钟则生产必须双端点并行。

## 上线门禁补充

生产流量切代理前，必须完成法务数据流签字与双端点并行演练。代理版本升级走灰度：先 5% 流量观察错误率，再全量。升级窗口避开发布高峰，并预留一键切官方端点的 runbook 链接放在 on-call 首页顶部。

## 版本记录

代理进程版本与 Claude Code CLI 版本写在同一张兼容性表，不兼容组合禁止上生产。灰度期间 on-call 手机保持畅通。

## 主题附注 1

请在验收时完成上文自查项，并把日期记在团队 wiki 的「DeepClaude：替换 Claude Code 模型后端以降本的路由代理」条目下。

## 主题附注 2

若官方 Release 变更配置字段，以当日文档为准，并在同 wiki 条目追加链接与日期。

## 主题附注 3

生产变更需指定 on-call 与回滚步骤，与本主题相关的命令以你环境实测为准。

## 局限与不适合谁

代理增加故障点与延迟；非 Anthropic 官方支持，出问题需社区自救。模型行为差异会导致 Claude Code 假设不成立（工具格式、拒绝策略）。合规与 IP 条款要法务看过。勿在代理日志里记录密钥。仓库：https://github.com/aattaran/deepclaude ，安装步骤以 README 为准。
