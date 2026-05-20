---
title: "Nanobot：轻量开源 Agent 与多渠道 MCP 实践要点"
description: "HKUDS 的 Nanobot 以低资源占用支持 Discord、Slack、Teams 等与 MCP，适合想本地或私有化跑 Agent 的团队。本文说明与 Hermes、OpenHands 的差异、v0.1.5 路线上的模型与渠道更新，以及上线前的安全清单。"
category: github-projects
category_label: "GitHub 新项目速递"
date: 2026-05-20
slug: 06-github-projects-article-07-nanobot-local-agent-20260520
reading_minutes: 3
---

> **热点手记** · GitHub 新项目速递 · hot.snaplinediary.cn · 估读约 3 分钟 · 2026-05-20

## 项目定位

[Nanobot](https://github.com/HKUDS/Nanobot)（HKUDS）在 2026 年 GitHub 热榜中常被与「超轻量 Agent」并列：相比 OpenHands 的全套软件工程平台，Nanobot 更强调 **小 footprint + 多渠道聊天 + MCP 扩展**。公开页面 star 数高、迭代快（如 v0.1.5.post3 提及 DeepSeek-V4、多 LLM provider、Discord/Slack/Teams/Feishu 等，以 Releases 为准）。

适合：**已有 IM 工作流，想挂一个可自托管的 Agent**，而不是一上来就 full SWE 沙箱。

## 与 Hermes、OpenHands 怎么分

| 产品 | 重心 |
|------|------|
| Hermes (Nous) | 网关记忆 + 成长型助手 + Skills |
| OpenHands | 改代码、SWE 任务、沙箱 |
| Nanobot | 轻量、多渠道、MCP |

若你要 **Telegram 记笔记 + 长期记忆**，Hermes 文档更完整；若你要 **Slack 里接 MCP 查库**，Nanobot 值得试；若你要 **自动修 issue**，OpenHands 更合适。

## 部署注意（通用）

1. **密钥**：Bot Token、LLM API 放环境变量。  
2. **权限**：Bot 只读频道先行，写权限确认后再开。  
3. **MCP**：先只读 Server，防 Agent 误写生产库。  
4. **模型路由**：多 provider 时要设默认与 failover，避免静默失败。

```bash
git clone https://github.com/HKUDS/Nanobot.git
# Follow README for install (paths vary by release)
```

## 实测建议

- **探针 1**：固定问题「今天星期几」测通 LLM。  
- **探针 2**：MCP 只读 SQL `SELECT 1`。  
- **探针 3**：24h 后问「昨天给你的项目名是什么」测记忆配置。

未过探针不要接客户群。

## 仓库健康度怎么读

看 06-github-projects-article-07-nanobot-local-agent-20260520.md 所属项目时，建议同时打开：近 30 天 commit 频率、open issue 里 security 标签、release 是否 signed、文档里 Install 章节是否跟得上 main。Star 数反映关注度，不反映你可否明天上生产。fork 后先在自己的 GitHub Actions 里跑通示例，再谈团队推广。

## 贡献与回馈

若 POC 成功，考虑提 PR 修文档错别字或补中文 README，比只发推特更有助于项目持续维护。上游合并慢时，维护内部 fork 的 patch 分支，定期 rebase。

## 生产准入检查（通用）

- [ ] 许可证允许商用  
- [ ] 密钥不进仓库  
- [ ] 有回滚方案  
- [ ] 有 on-call  
- [ ] 数据出境合规

## 与 Hermes 选型对照（简表）

| 需求 | Nanobot | Hermes |
|------|---------|--------|
| 文档成熟度 | 随版本 | 较完整 |
| 记忆/成长叙事 | 轻量 | 强 |
| 软件工程沙箱 | 非主业 | 非主业 |
| 自托管 | 是 | 是 |

先 POC 一个通道，通过探针再扩。

## 升级策略

跟踪 GitHub Release，在 staging Bot 验证后再升生产。Breaking change 常出现在 MCP 适配器或渠道 SDK。

## 轻量 Agent 适合谁

笔记本、边缘设备、只想接 1～2 个 MCP 的开发者。不适合：要高可用、多租户、复杂审计的大厂平台团队。

## 本地模型搭配

Nanobot + 本地 OpenAI 兼容端点时，先测 **工具调用 JSON 是否稳定**。小模型常格式错误，表现为 Agent 循环空转。可保留云端模型作 fallback。

## 多渠道 MCP 顺序

1. 只读 GitHub  
2. 只读日历或文档  
3. 再考虑写操作  

每步 24 小时探针，失败不叠加下一 Server。

## 资源占用

监控 CPU/RAM 常驻；树莓派类设备要设并发上限。长时间挂 Telegram 可能吃满单核，需 cgroup 限制。

## 与 Hermes 网关对比

| 维度 | Nanobot | Hermes |
|------|---------|--------|
| 定位 | 轻量本地 | 多 IM 网关 |
| 运维 | 低 | 中 |
| 记忆 | 依配置 | 内置强 |

可 Nanobot 做边缘采集，Hermes 做中心记忆，但不要两网关写同一 SQLite 文件。

## 升级与回滚

轻量项目也要打 tag。升级前 `pip freeze` 或 lockfile 存档。回滚脚本放同目录，一分钟切回上一版。

## 社区支持预期

小项目 issue 响应慢，生产依赖要准备内部 fork 维护者，不要赌作者 24h 回复。

## 边缘部署检查

树莓派或工控机部署时，测断电恢复：进程是否自启、MCP 连接是否重连、日志是否落盘。边缘场景最怕 silent fail。

## 与手机端联动

若接 Telegram，注意消息大小限制与文件上传路径。大日志不要直接贴群，改贴对象存储链接。

## 实操附录：边缘 48 小时烤机

连续运行 IM 转发与只读 MCP，记录 CPU、内存、断线次数。烤机失败不得上生产群。通过后再评估写权限 MCP。

## 实操附录：与中心网关分工文档

一页纸写清：Nanobot 做什么、Hermes 做什么、数据谁持久化、故障找谁。未文档化前禁止双网关并行上线。

## 读者可执行检查

完成 48 小时烤机记录 CPU/断线。烤机失败不得接生产 Telegram 群。

## 文档化分工

填写 Nanobot 与中心网关分工一页纸，未上传 wiki 前禁止双网关并行。

## 发布前核对

48h 烤机 CSV 已上传。分工一页纸链接在 on-call 首页。

## 上线门禁补充

烤机通过后，写清「最大并发消息数」与「超限降级文案」，贴到 Bot 设置旁。边缘断电重启后 5 分钟内必须自动恢复 MCP，否则 pager。分工一页纸更新时，同步改 on-call 路由，避免 Nanobot 故障找不到 Hermes 负责人。

## 版本记录

烤机 CSV 与分工一页纸放在 on-call 同目录。边缘重启后 5 分钟内 MCP 须自恢复，否则 pager。超限并发时 Bot 回复降级文案，避免模型费用尖峰。Nanobot 版本升级前复制配置目录，升级失败可回滚。

## 主题附注 1

请在验收时完成上文自查项，并把日期记在团队 wiki 的「Nanobot：轻量开源 Agent 与多渠道 MCP 实践要点」条目下。

## 主题附注 2

若官方 Release 变更配置字段，以当日文档为准，并在同 wiki 条目追加链接与日期。

## 主题附注 3

生产变更需指定 on-call 与回滚步骤，与本主题相关的命令以你环境实测为准。

## 主题附注 4

密钥与 Token 只放环境变量，禁止写进将同步到热站的 markdown 仓库。

## 主题附注 5

季度复核时请用同一标准任务重测，避免凭印象续订或退订。

## 主题附注 6

「Nanobot：轻量开源 Agent 与多渠道 MCP 实践要点」相关 POC 结论请附实测数据截图链接，口头结论不作采购依据。

## 主题附注 7

「Nanobot：轻量开源 Agent 与多渠道 MCP 实践要点」若涉及第三方 SaaS，管理员批准截图应存档备查。

## 主题附注 8

「Nanobot：轻量开源 Agent 与多渠道 MCP 实践要点」试点扩大前，安全与法务签字不可省略。

## 附记

请保存烤机 CSV。

## 局限与不适合谁

轻量意味着复杂 SWE 工作流（多阶段 CI、大型 monorepo 重构）不是主业。文档与 API 随版本变，生产要用固定 release tag。社区项目无商业 SLA，故障需自担。若团队零 DevOps，优先 SaaS 而非自架 Nanobot。仓库：https://github.com/HKUDS/Nanobot
