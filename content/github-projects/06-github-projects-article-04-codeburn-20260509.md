---
title: "CodeBurn：看清 AI 编程每次调用的 token 与美元"
description: "多 Agent、多模型并行时，账单像黑盒。CodeBurn 类项目聚焦用量可视化与预算告警，帮助团队在 Claude Code、Cursor 等混用时代摊成本。本文说明典型功能、与云厂商账单的区别，以及仍需人做的配额策略。"
category: github-projects
category_label: "GitHub 新项目速递"
date: 2026-05-20
slug: 06-github-projects-article-04-codeburn-20260509
reading_minutes: 8
---

> **热点手记** · GitHub 新项目速递 · hot.snaplinediary.cn · 估读约 8 分钟 · 2026-05-20

## 为什么需要专用观测

GitHub Copilot、Claude Code、Cursor、Cline API 各出一张发票，工程师个人垫付再报销，财务很难归因到仓库、项目或客户。CodeBurn（以你跟踪的 GitHub 仓库为准，实施前打开 README 核对功能）代表一类开发者向 cost observability 工具：在终端或 IDE 旁记录每次调用的 model、token、估算美元。

它的价值不是替代厂商账单，而是把费用从「月底惊吓」变成「实时可见」。当某天费用突然翻倍时，你能立刻知道是哪位开发者在跑大规模重构，而不是等到月底对账才发现。

## 典型能力

| 能力 | 价值 |
|------|------|
| 按日/周聚合 | 发现「某天 refactor 爆量」 |
| 按模型拆分 | 看 Opus 是否被滥用 |
| 预算阈值告警 | 超额前邮件/Slack |
| 与代理并存 | 配 DeepClaude 看节省是否真实 |

核心思路是：在 Agent 调用链路上插入一个轻量拦截层，记录 input/output tokens，再乘上费率表得出估算美元。费率表需要手动维护，因为官方价格会调整。

拦截层实现方式有多种：HTTP 代理中间件、SDK wrapper、sidecar 容器。选择哪种取决于你的部署架构。sidecar 模式适合 Kubernetes，SDK wrapper 适合本地开发。

## 使用建议

先统一出口：团队尽量通过固定代理或公司 API Key，否则数据散。然后设基线：记录一周「正常开发」美元数。大改前预估：Plan Mode 多轮可能 5～10x token。最后对照厂商账单：工具估算有误差，月末以 OpenAI/Anthropic 发票为准。

统一出口的配置示例：

```bash
# 团队共享代理
export OPENAI_API_BASE="https://proxy.company.com/v1"
export ANTHROPIC_BASE_URL="https://proxy.company.com/anthropic"
```

所有流量走代理后，CodeBurn 只需要在代理层做拦截，不需要在每个工程师本机安装。集中式部署降低维护成本。

## 与 FinOps 平台区别

云厂商 Cost Explorer 看的是 VM 与托管服务；CodeBurn 类看的是 LLM API 细粒度。两者互补，不能互相替代。

FinOps 平台通常按资源维度聚合（EC2、S3、RDS），看不到单次 API 调用的 token 数。CodeBurn 补上了这一层空白。理想的月度报告应该把云账单和 AI 账单并列，看增速是否匹配。

## 团队分摊模型

按仓库 label、按客户项目、按工程师组，三种分摊方式选一种坚持。否则 CodeBurn 只有总数，财务仍无法入账。

推荐做法：在 Agent 调用时带上 X-Project-ID header，CodeBurn 按 header 聚合。月末直接出项目维度的费用报表。

```bash
curl https://proxy.company.com/v1/chat/completions \
  -H "X-Project-ID: alpha" \
  -H "Authorization: Bearer $KEY" \
  -d '{"model": "gpt-4o", "messages": [...]}'
```

## 与预算流程挂钩

季度初给每个组 token 预算，月中 80% 告警，月末硬停（技术手段 + 流程）。工具只提供信号，纪律在人。

硬停实现：代理层拦截，当项目累计 token 超过预算时返回 429 Too Many Requests。不要只靠邮件告警，因为开发者会忽略邮件。

预算分配示例：

| 团队 | 季度预算 | 日均上限 |
|------|----------|----------|
| 前端 | $500 | $5.5 |
| 后端 | $800 | $8.8 |
| 数据 | $1200 | $13.2 |

## 接入观测点

每次 Agent 调用的 input/output tokens、按模型拆分的美元估算、按仓库/开发者标签聚合，这三项是必备观测点。

第一周只看 P95 单次调用成本，找 outliers，而不是看日均。outliers 通常意味着：误开最大模型、死循环 Agent、超大文件一次性提交。

outlier 排查清单：

1. 检查是否选错了模型档（如用 Opus 改注释）
2. 检查是否有递归调用（Agent 调 Agent）
3. 检查上下文是否过长（把整个仓库塞进 prompt）

## 与预算告警联动

当单日费用超过基线 2 倍，自动 Slack 通知并暂停 Background Agent 队列。CodeBurn 的价值在及时刹车，不在年终报表。

Slack 告警文案示例：

```text
【CodeBurn 告警】项目 alpha 今日 Agent 费用 $45，超出基线 2.3 倍。
已暂停后台队列，请联系 Tech Lead 确认后恢复。
```

## 团队看板建议

| 列 | 用途 |
|----|------|
| 开发者 | 谁在用 Agent |
| 任务类型 | refactor vs typo |
| $/任务 | 找贵任务 |

贵任务若 ROI 为负，改流程或改模型档，不要只骂开发者。

## 按任务类型分摊

给每次 Agent 会话打标签：refactor、bugfix、docs。月末看哪类最贵。若 refactor 均价是 bugfix 五倍，说明应用 Plan 缩范围或拆 PR，而不是加预算。

标签要在 Agent 启动时主动声明，不要事后猜测。Claude Code 可以在启动命令里加 --tag refactor。

## 与额度系统联动

GitHub Copilot、Claude、OpenAI 各自有额度。CodeBurn 汇总后设「总闸门」：全公司 Agent 日费用超 X 则 Slack 告警，避免多账号分散超标。

总闸门需要统一出口才能实施。如果工程师用个人 Key 绕过，CodeBurn 看不到，这个缺口要从流程上堵。定期审计 API Key 分配，发现私用立即回收。

## 负责人制度

每个仓库指定 Agent 费用 owner，超支先找 owner 谈流程，而不是一刀切禁工具。

owner 的职责：审核异常费用、优化 Agent 使用方式、月末签字确认账单。不是替费用背锅，而是负责治理。

## 异常检测

对「单次会话费用」设 Z-score 告警，抓异常循环或误开最大模型。比月底总额告警更早。

Z-score 超过 3 的会话自动标记，次日晨会 review。异常模式包括：反复 retry、上下文爆炸、模型档选错。

## 局限与不适合谁

无法阻止工程师用个人 Key 绕过。估算价随官方降价会变，需更新费率表。若团队只用固定 $20 订阅且无 API，价值有限。开源工具无 SLA，关键财务仍以官方账单为准。CodeBurn 是观测工具，不是预算控制系统，真正的成本控制靠流程和纪律。部署需要统一出口，分散的个人账号难以覆盖。没有平台工程师的小团队，搭建代理层可能成本高于收益。费率表维护是持续工作，不是一次性配置。个人开发者若用量小，直接用厂商账单即可，无需额外工具。工具本身的部署和运维也需要成本，要纳入总成本计算。本文不替代官方文档，仅供参考。请直接查阅你所用 CodeBurn 仓库的安装文档与隐私说明，本文不绑定某一固定 GitHub URL。


补充说明：CodeBurn 的部署形态取决于团队规模。小团队用单节点代理即可，大团队需要考虑高可用和持久化存储。
