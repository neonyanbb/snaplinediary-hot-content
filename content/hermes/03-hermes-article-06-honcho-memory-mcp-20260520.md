---
title: "Hermes Agent 接入 Honcho 记忆与 MCP：v2026.5 实测步骤"
description: "Hermes v2026.5 把 Honcho 方言记忆与 MCP 工具扩展写进主路径。本文按官方文档梳理：何时用内置 SQLite FTS、何时切 Honcho，MCP 服务器怎么挂、工具怎么过滤，以及三项可复现的自检命令。适合已装网关、想跨会话记住偏好并接外部系统的开发者。"
category: hermes
category_label: "Hermes Agent"
date: 2026-05-20
slug: 03-hermes-article-06-honcho-memory-mcp-20260520
reading_minutes: 3
---

> **热点手记** · Hermes Agent · hot.snaplinediary.cn · 估读约 3 分钟 · 2026-05-20

## 为什么 v2026.5 值得单独谈记忆与 MCP

Nous Research 在 2026 年 5 月连续发布 v2026.5.7 与 v2026.5.16（GitHub Release 标签），把「能连更多模型」扩展成「能长期记住你、能安全接外部工具」。对已经跑通 Telegram 或 CLI 的用户来说，瓶颈往往不在模型智商，而在两点：会话结束后上下文归零，以及 Agent 无法调用现有的数据库或内部 API。

Hermes 的默认方案是网关侧 SQLite + FTS5 全文检索，适合单机、零额外账号。Honcho 则是可选的记忆后端，用方言推理在每轮对话后归纳偏好与目标。MCP 则负责把外部系统以「工具」形式挂进 Agent，并支持按服务器过滤工具，避免一次暴露过多可执行能力。

v2026.5.16 还新增了 xAI Grok OAuth、本地 OpenAI 兼容代理、`x_search` 搜索工具等。它们解决的是「连哪个模型、怎么搜公开信息」，与 Honcho/MCP 正交：你可以继续用 Claude 做推理，同时用 Honcho 记偏好、用 MCP 拉工单。

## 内置记忆 vs Honcho：怎么选

| 维度 | 内置 SQLite + FTS | Honcho |
|------|-------------------|--------|
| 部署成本 | 随网关，无第三方 | 需 honcho.dev API Key |
| 检索方式 | 关键词 + 全文 | 语义 + 归纳后的「结论」 |
| 用户画像 | 依赖你自己写初始化提示 | 自动从对话推导沟通风格与目标 |
| 多实例 | 同一网关库 | 支持 peer 隔离，避免多 Bot 串记忆 |
| 离线/合规 | 数据在自建网关 | 记忆经 Honcho 云服务 |

**实测建议**：个人实验、对隐私极敏感、只有单通道 Telegram，先用内置记忆跑满一周，再评估 Honcho。团队里同一用户有「工作 Slack Bot + 私人 Telegram Bot」时，Honcho 的 peer 隔离更值得提前规划。

启用 Honcho 的典型路径：

1. 在 Hermes 配置里将 memory provider 选为 `honcho`。
2. 在 honcho.dev 申请 API Key，写入环境变量：
   ```bash
   export HONCHO_API_KEY=hk_xxxxxxxx
   ```
   不要写进要提交的 markdown 或公开仓库。
3. 重启网关，用固定探针问题验证。

切换 provider 后，已存储在 SQLite 里的历史不会自动迁移到 Honcho。如果你已有大量历史对话，需要评估迁移成本，或者接受「从今天起用 Honcho，旧数据留在 SQLite」。

## MCP 接入：从「能连」到「敢用」

官方文档将 MCP 描述为：连接 MCP Server、筛选工具、再交给 Agent 调用。实践里常见三类 Server：

- **知识类**：Notion、本地 markdown 索引、团队 wiki。
- **工程类**：GitHub Issues、Linear、自建 REST 包装。
- **数据类**：只读 SQL、Redis 监控（务必只读）。

推荐配置顺序是只挂一个只读 Server 试跑，在配置里关闭高风险 write 类工具，用一句明确任务测通，例如「列出我名下 open 的 issue 标题」。

具体配置在 `~/.hermes/mcp.json`：

```json
{
  "servers": [
    {
      "name": "github-readonly",
      "command": "npx -y @modelcontextprotocol/server-github",
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_你的Token"
      }
    },
    {
      "name": "sqlite-ro",
      "command": "npx -y @modelcontextprotocol/server-sqlite",
      "args": ["/path/to/readonly.db"]
    }
  ]
}
```

重启网关后，用 `hermes tools list` 查看已加载的工具。确认只读工具存在、写工具不存在后，再发任务给 Agent。

**工具过滤**的意义在于：模型一次看到的工具越少，误调用概率越低。不要为了追求「全能」把十个 Server 全开；先让「一个只读 Server + 三个工具」稳定一周，再扩。

## 可复现的三项自检

完成 Honcho 或 MCP 任一链路后，用下面清单自测（建议间隔 24 小时以上做第 2 项）：

1. **记忆探针**：今天告诉 Hermes「我本周主项目是 X，偏好用 TypeScript」。明天在新会话问「我主项目用的语言？」应命中 TypeScript 与项目名。
2. **跨通道探针**（若已接双平台）：在 Telegram 记一条决策，在 Slack 问「昨天关于 X 的结论」应能引用，而不是重新采访你。
3. **MCP 探针**：给一条只读任务，检查返回是否来自外部系统而非模型编造；若工具失败，回复里应出现错误信息而非幻觉列表。

若第 1 项失败，先查 `hermes gateway status` 与日志，确认 Honcho API Key 有效、网络可达。若第 3 项出现「看起来像真数据但 URL/编号不对」，优先收紧工具列表并改用更小模型做对比测试，排除模型幻觉。

## 升级注意事项

同版本 Release 提到的新增功能与 Honcho/MCP 正交，升级前建议阅读 v2026.5.16 Release Notes，在测试网关验证通过后再切生产 Token。特别是 Grok OAuth 的 scope 与现有 Claude/OpenAI 配置不同，不要直接覆盖生产配置。

升级前的检查清单：

```bash
# 1. 备份当前配置
cp ~/.hermes ~/hermes-backup-$(date +%Y%m%d) -r

# 2. 在测试 Bot 上跑新版本
HERMES_CONFIG_DIR=~/.hermes-test hermes gateway start

# 3. 执行三项自检，全部通过后再切换生产
```

## 运维中的具体问题

启用 Honcho 后，建议每月做一次 **记忆审计**：检查 Honcho 返回的用户画像是否出现错误推断，例如把一次玩笑当成长期偏好。方言推理会放大 prompt 里的噪声，背景卡要尽量客观，少发情绪化语句。

MCP Server 侧建议维护一张简单的工具登记表，至少记录 Server 名、只读或读写、负责人、上次审查日期。Agent 能力越大，登记越不能省。

如果 MCP 工具返回 401/403，先检查 Token 是否过期，而不是怀疑模型能力。GitHub Token 有 Classic 和 Fine-grained 两种，Fine-grained 需要给足 repository 权限才能读 issue。

## 局限与不适合谁

Honcho 不适合「绝对不能出网」的环境，因为记忆数据要同步到 honcho.dev。也不适合不愿维护 API Key 轮换的团队，HONCHO_API_KEY 泄露等于暴露全部用户画像。

MCP 不适合把写库、删库、发版权限一次性交给 Agent 且无人审核的流程。即使配置了只读 Server，也要定期检查 `hermes tools list` 的输出，确认没有意外加载写工具。

若你只需要偶尔问答、不跨天延续上下文，用任意云端 Chat 产品即可，不必上 Hermes 网关 + Honcho + MCP 的全套。本文步骤随官方文档迭代，实施前请以 hermes-agent.nousresearch.com/docs 为准。
