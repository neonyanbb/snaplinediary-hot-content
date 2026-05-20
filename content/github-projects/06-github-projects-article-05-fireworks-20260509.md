---
title: "Fireworks Tech Graph：一句话生成技术架构图的工具链"
description: "文档里的架构图若全靠手绘，更新架构时最容易过期。Fireworks 相关 Tech Graph 项目尝试从自然语言或代码结构生成出版级示意图。本文说明典型输入输出、与 Mermaid/PlantUML 的差异，以及生成图必须人工校对的场景。"
category: github-projects
category_label: "GitHub 新项目速递"
date: 2026-05-20
slug: 06-github-projects-article-05-fireworks-20260509
reading_minutes: 8
---

> **热点手记** · GitHub 新项目速递 · hot.snaplinediary.cn · 估读约 8 分钟 · 2026-05-20

## 架构图债务

评审会议要图，工程师导出一张后再也不改，三个月后图与代码分叉。LLM 擅长从 README、目录树、OpenAPI 生成第一版结构图，适合冲刺对齐，不适合当作合规交付终稿。

Fireworks 生态中的 Tech Graph 类工具（具体仓库以 Fireworks AI 官方或你引用的 GitHub 项目为准）通常接受自然语言描述或部分代码扫描，输出 SVG/PNG 或可调布局的图，强调技术出版风格而非随意框图。

## 项目做什么

典型输入：

- 自然语言描述（「三层微服务 + Postgres + Redis」）
- 或部分代码/配置扫描

典型输出：

- SVG/PNG 图片
- 可调布局的矢量图
- 组件清单与连接关系表

Fireworks Tech Graph 强调技术出版风格：统一字体、标准图例、配色符合企业模板。不是手绘风格的随意框图，而是可以放进技术白皮书或架构评审材料的正式图表。

代码扫描功能可以读取 docker-compose.yml、Kubernetes manifest、Terraform 配置，自动提取组件和依赖关系。这比手工输入更准确，但要求代码结构清晰。

## 与 Mermaid 的对比

| 方式 | 优点 | 缺点 |
|------|------|------|
| Mermaid 文本 | 可 diff、可 CI | 美观度有限 |
| Tech Graph 生成 | 省美术时间 | 黑盒，难微调 |
| 手绘 Figma | 最美 | 最贵 |

推荐流程：Mermaid 进 repo，评审用生成图打底稿，定稿再 Figma。这样既有版本控制，又有视觉质量。

Mermaid 适合日常维护，因为文本可以 diff。Tech Graph 适合快速出第一版，因为不需要手写语法。Figma 适合对外发布，因为可以精细调整。

## 上手注意

输入里写清边界（in scope / out of scope）。生成后核对：数据流方向、信任边界、公网暴露面。敏感组件名脱敏再发给云 API。把最终图版本号写进 CHANGELOG。

输入示例：

```text
生成架构图：
- 三层微服务：API Gateway、Order Service、Payment Service
- 数据库：Postgres 主从、Redis 缓存
- 消息队列：Kafka
- 排除：前端移动端、第三方物流
```

明确排除项可以减少生成图的幻觉，避免画出并不存在的组件。

生成后检查清单：

1. 所有组件是否存在于实际代码
2. 数据流方向是否与代码一致
3. 公网暴露面是否准确
4. 敏感组件名是否已脱敏

## 评审会议用法

会前 30 分钟生成草图，会中只改边界与信任域，会后工程师改 Mermaid 进 git。生成图不进生产文档目录，除非经人工签字版替换。

评审会议的标准流程：

1. 会前：用 Tech Graph 生成草图
2. 会中：讨论边界、数据流向、信任域
3. 会后：工程师根据结论更新 Mermaid 和代码
4. 下周：用同一 prompt 重新生成，diff 变化

## 可访问性与色盲

自动生成图的配色常不合格。导出前用对比度检查，或统一用公司模板主题。

建议准备一套公司标准主题：主色、辅色、警告色、背景色。生成图后套用主题，而不是用默认配色。

## 一句话生成图的验收

输入：「三层 Web + Postgres + Redis 缓存」。输出图须含：边界、数据流向、失败点标注。若图缺少关键组件，说明 prompt 太短或工具版本过旧，补约束再生成。

验收标准：

- 组件是否完整
- 数据流方向是否正确
- 外部依赖是否标注
- 失败点是否有标记

## 与架构评审结合

把生成图贴进 ADR，人工用红笔改一处错误关系，再让工具基于修订版重生成。迭代三轮仍错，说明不适合自动画图，改手绘。

ADR（Architecture Decision Record）是记录架构决策的标准格式。生成图作为 ADR 的附图，可以帮助读者快速理解上下文。

## 导出与版本管理

图文件进 Git 时，同时保存生成 prompt 与工具版本号，方便半年后复现。不要只存 PNG 无上下文。

版本管理建议：

```bash
git add docs/architecture-v1.png
git add docs/architecture-v1.prompt
git commit -m "add: 架构图 v1.2，生成工具 v0.8.1"
```

## 图与代码双向同步

架构图变更后，要求对应服务仓库 README 更新链接。图不是一次性交付物。在 PR 模板加勾选：「若改服务边界，是否更新架构图？」

双向同步是防止图码分叉的关键。代码变更触发图更新，图更新反映代码现状。

## 教学用途

新人 onboarding 用生成图讲清流量，再带读真实 docker-compose.yml 对照。图错一处当场改，培养「图服从代码」的习惯，不是代码服从图。

教学时可以用生成图做起点，但必须以代码为准。生成图错了就改图，不要改代码来迎合图。

## 工具链版本锁定

Fireworks Tech Graph 依赖的模型与模板会变。锁定版本号，升级时重新生成全套图 diff review。

版本锁定示例：

```bash
# .techgraph-version
MODEL=fireworks-ai/techgraph-v0.8.1
TEMPLATE=enterprise-default
```

## 与 C4 模型对照

一句话图适合 Context 与 Container 层草稿，Component 与 Code 层仍需人工细化。评审会上要求讲清每条箭头代表的网络协议与鉴权方式，不能只说「这里连过去」。

C4 模型四个层次：

- System Context：系统与外部用户/系统的交互
- Container：应用内部的高层次技术组件
- Component：容器内部的模块
- Code：类或接口级别

Tech Graph 擅长前两层，后两层需要人工补充。

## 存证与合规

部分行业要求架构图版本与发布版本绑定。把图 hash 写入 release notes，便于审计追溯。

```bash
sha256sum docs/architecture-v1.png >> release-notes.md
```


定期比对生成的图与历史版本，确保风格一致性。

## 局限与不适合谁

生成图可能幻觉出并不存在的微服务。受 API 费用与隐私约束，气隙环境不适用。印刷级排版仍要设计师收尾。若团队已强制 Architecture as Code（Mermaid in git），额外生成器可能是重复投资。实施前请阅读 Fireworks 与你 fork 的仓库最新 README，本文不替代官方教程。生成图不能替代人工架构评审，复杂系统的信任边界和故障模式仍需资深工程师判断。对外发图前要脱敏内部主机名和未公开产品代号。


补充：生成图的最佳实践是 prompt 里写明技术栈版本，避免工具按过时模板生成。
