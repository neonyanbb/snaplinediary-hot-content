---
title: "Nanobot：轻量开源 Agent 与多渠道 MCP 实践要点"
description: "HKUDS 的 Nanobot 以低资源占用支持 Discord、Slack、Teams 等与 MCP，适合想本地或私有化跑 Agent 的团队。本文说明与 Hermes、OpenHands 的差异、v0.1.5 路线上的模型与渠道更新，以及上线前的安全清单。"
category: github-projects
category_label: "GitHub 新项目速递"
date: 2026-05-20
slug: 06-github-projects-article-07-nanobot-local-agent-20260520
reading_minutes: 8
---

> **热点手记** · GitHub 新项目速递 · hot.snaplinediary.cn · 估读约 8 分钟 · 2026-05-20

## 项目定位

Nanobot（github.com/HKUDS/Nanobot，HKUDS）在 2026 年 GitHub 热榜中常被与「超轻量 Agent」并列：相比 OpenHands 的全套软件工程平台，Nanobot 更强调小 footprint 加多渠道聊天加 MCP 扩展。公开页面 star 数高、迭代快（如 v0.1.5.post3 提及 DeepSeek-V4、多 LLM provider、Discord/Slack/Teams/Feishu 等，以 Releases 为准）。

适合：已有 IM 工作流，想挂一个可自托管的 Agent，而不是一上来就 full SWE 沙箱。

Nanobot 的设计哲学是「够用就好」。它不提供复杂的沙箱编排，也不追求 SWE-bench 分数，而是专注于让开发者用最少的资源在聊天渠道里跑起一个有工具调用能力的 Agent。

## 与 Hermes、OpenHands 怎么分

| 产品 | 重心 |
|------|------|
| Hermes (Nous) | 网关记忆 + 成长型助手 + Skills |
| OpenHands | 改代码、SWE 任务、沙箱 |
| Nanobot | 轻量、多渠道、MCP |

若你要 Telegram 记笔记加长期记忆，Hermes 文档更完整；若你要 Slack 里接 MCP 查库，Nanobot 值得试；若你要自动修 issue，OpenHands 更合适。

Hermes 更像一个「成长型伙伴」，强调长期记忆和叙事连贯性。Nanobot 更像一个「工具型助手」，强调即时响应和工具调用。两者的使用场景有明显区分。

## 部署注意

密钥：Bot Token、LLM API 放环境变量。

权限：Bot 只读频道先行，写权限确认后再开。

MCP：先只读 Server，防 Agent 误写生产库。

模型路由：多 provider 时要设默认与 failover，避免静默失败。

```bash
git clone https://github.com/HKUDS/Nanobot.git
# Follow README for install (paths vary by release)
```

环境变量示例：

```bash
export DISCORD_TOKEN="..."
export SLACK_TOKEN="..."
export OPENAI_API_KEY="..."
export DEFAULT_MODEL="gpt-4o"
export FALLBACK_MODEL="deepseek-chat"
```

配置分层建议：基础配置放 .env，渠道特定配置放 env 文件按渠道命名，如 .env.discord、.env.slack。这样切换渠道时只需要改加载的文件。

## 实测建议

探针 1：固定问题「今天星期几」测通 LLM。

探针 2：MCP 只读 SQL SELECT 1。

探针 3：24h 后问「昨天给你的项目名是什么」测记忆配置。

未过探针不要接客户群。

探针设计思路：探针 1 验证 LLM 连接正常；探针 2 验证 MCP 工具链可用；探针 3 验证记忆持久化生效。三个探针覆盖了 Agent 最核心的三个能力：推理、工具、记忆。

如果探针 2 失败，常见原因是 MCP Server 的 JSON Schema 与模型输出不匹配。小模型的 tool call 格式经常出错，表现为 Agent 输出看起来像 JSON 但实际上格式不对。这时候需要换更大的模型或调整 prompt。

## 与 Hermes 选型对照

| 需求 | Nanobot | Hermes |
|------|---------|--------|
| 文档成熟度 | 随版本 | 较完整 |
| 记忆/成长叙事 | 轻量 | 强 |
| 软件工程沙箱 | 非主业 | 非主业 |
| 自托管 | 是 | 是 |

先 POC 一个通道，通过探针再扩。

## 升级策略

跟踪 GitHub Release，在 staging Bot 验证后再升生产。Breaking change 常出现在 MCP 适配器或渠道 SDK。

升级检查清单：

1. 读 Release Notes
2. 在 staging 环境部署
3. 跑探针 1-3
4. 观察 24 小时无异常
5. 升级生产

不要跳过 staging 直接升级生产。Nanobot 的迭代速度快，意味着 breaking change 的可能性也高。

## 本地模型搭配

Nanobot 加本地 OpenAI 兼容端点时，先测工具调用 JSON 是否稳定。小模型常格式错误，表现为 Agent 循环空转。可保留云端模型作 fallback。

本地模型配置示例：

```bash
export LOCAL_API_BASE="http://localhost:8000/v1"
export LOCAL_MODEL="llama-3-70b"
```

本地模型的优势是隐私和成本，劣势是工具调用稳定性。建议对简单查询走本地模型，对复杂工具调用走云端模型。路由规则可以按 prompt 长度或是否包含 tool call 来判断。

## 多渠道 MCP 顺序

只读 GitHub -> 只读日历或文档 -> 再考虑写操作。每步 24 小时探针，失败不叠加下一 Server。

顺序设计的核心原则是：先验证读能力，再验证写能力。写操作的破坏面更大，需要更充分的测试。GitHub 只读可以查 issue 和代码，日历只读可以查会议安排，这些都是低风险高价值的场景。

## 资源占用

监控 CPU/RAM 常驻；树莓派类设备要设并发上限。长时间挂 Telegram 可能吃满单核，需 cgroup 限制。

资源限制示例：

```bash
systemctl set-property nanobot.service CPUQuota=80% MemoryLimit=512M
```

在树莓派 4B 上实测，单个渠道的 Nanobot 进程常驻内存约 150MB，CPU 空闲时接近 0%。但当有大量消息涌入时，CPU 可能飙高。设置并发上限可以避免消息风暴导致系统卡顿。

## 与中心网关对比

| 维度 | Nanobot | Hermes |
|------|---------|--------|
| 定位 | 轻量本地 | 多 IM 网关 |
| 运维 | 低 | 中 |
| 记忆 | 依配置 | 内置强 |

可 Nanobot 做边缘采集，Hermes 做中心记忆，但不要两网关写同一 SQLite 文件。

混合架构示例：Nanobot 部署在各个项目组的聊天频道，负责日常问答和工具调用；Hermes 部署在中心节点，负责长期记忆汇总和跨项目知识检索。数据流向是单向的：Nanobot -> Hermes，避免循环同步。

## 升级与回滚

轻量项目也要打 tag。升级前 pip freeze 或 lockfile 存档。回滚脚本放同目录，一分钟切回上一版。

```bash
#!/bin/bash
# rollback.sh
git checkout v0.1.4
pip install -r requirements.txt
systemctl restart nanobot
```

回滚演练应该每季度做一次。很多团队只在出问题时才想起回滚，那时候可能已经找不到上一版的依赖了。

## 社区支持预期

小项目 issue 响应慢，生产依赖要准备内部 fork 维护者，不要赌作者 24h 回复。

HKUDS 是学术组织，维护节奏可能受学期和论文周期影响。不要把学术项目的实验性功能当生产保障。

## 边缘部署检查

树莓派或工控机部署时，测断电恢复：进程是否自启、MCP 连接是否重连、日志是否落盘。边缘场景最怕 silent fail。

断电恢复检查清单：

1. 拔电源重启
2. 检查进程是否自启
3. 检查 MCP 连接状态
4. 检查最近日志是否完整

边缘部署建议用 systemd 管理进程，配置 Restart=always。日志输出到本地文件，不要只依赖 stdout，因为容器重启后 stdout 日志会丢失。

## 与手机端联动

若接 Telegram，注意消息大小限制与文件上传路径。大日志不要直接贴群，改贴对象存储链接。

Telegram 消息限制：单条 4096 字符。超大输出要拆分成多条或改为文件上传。

手机端交互设计：Bot 的回复要简洁，避免在手机上产生大量滚动。复杂输出用「查看详情」按钮链接到完整报告。

## 局限与不适合谁

轻量意味着复杂 SWE 工作流（多阶段 CI、大型 monorepo 重构）不是主业。文档与 API 随版本变，生产要用固定 release tag。社区项目无商业 SLA，故障需自担。若团队零 DevOps，优先 SaaS 而非自架 Nanobot。多租户和复杂权限不是 Nanobot 的设计目标，需要企业级管控的场景请评估其他方案。仓库：https://github.com/HKUDS/Nanobot
