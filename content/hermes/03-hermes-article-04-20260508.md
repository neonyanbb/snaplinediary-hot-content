---
title: "Hermes Agent 上手指南 2026：安装、记忆初始化与排错"
description: "从 npm 安装网关到 Telegram 首通道、记忆初始化与跨平台探针，本文给出可勾选的操作清单与常见问题表。针对 v2026.5 用户，强调先单平台跑通再扩 MCP，避免三天弃坑。适合已决定试用 Hermes、需要一步一步验收的人。"
category: hermes
category_label: "Hermes Agent"
date: 2026-05-20
slug: 03-hermes-article-04-20260508
reading_minutes: 3
---

> **热点手记** · Hermes Agent · hot.snaplinediary.cn · 估读约 3 分钟 · 2026-05-20

## 准备：环境与预期

- Node.js 22+（以当前 README 要求为准）
- 一个 Telegram Bot Token（BotFather）
- 15 分钟 uninterrupted 时间，只做 **一个** 通道

不要第一天同时接 Slack、Discord 和 Honcho，排错维度会爆炸。

## 步骤一：安装并启动网关

```bash
npm install -g @nous/hermes-gateway
hermes gateway start
hermes gateway status
```

`status` 应显示进程在监听。若端口冲突，查文档中的端口环境变量，改后重启。

## 步骤二：接 Telegram（P0 通道）

1. 在 BotFather 创建 Bot，复制 Token 到环境变量（勿写入 git）。
2. 按官方文档把 Telegram 适配器指向你的 gateway URL（本地开发常用 ngrok 或 cloudflared 隧道）。
3. 给 Bot 发 `/start` 或普通问候，确认有回复。

**实测**：断网重连后，同一会话 thread 应仍可继续；若每次像新用户，检查是否连错 gateway 实例。

## 步骤三：记忆初始化（多数教程跳过的一步）

在首条有效对话发送结构化背景，例如：

```
我是后端工程师，主语言 Go，正在做订单服务重构。
偏好：结论先行，代码示例用 fenced block。
本周目标：拆分 monolith 的支付模块。
```

24 小时后发送探针：「我本周目标是什么？」答不出则先修记忆，不要加 MCP。

## 步骤四：可选扩展

| 扩展 | 何时加 | 参考 |
|------|--------|------|
| Honcho | 需要语义画像、多 Bot 隔离 | 见本站 Honcho+MCP 一文 |
| MCP 只读 Server | 记忆探针已通过 | 先接一个只读源 |
| 第二 IM 平台 | Telegram 稳定一周 | Slack 文档 |

```bash
hermes skill install <skill-name>
```

技能安装后立即用 **单任务** 验收，例如只给一篇 arXiv 摘要。

## 验收清单（打印勾选）

- [ ] `gateway status` 正常
- [ ] Telegram 双向消息
- [ ] 24h 记忆探针通过
- [ ] （可选）第二通道引用 Telegram 里的事实
- [ ] （可选）一个 skill 成功返回结构化结果

## 常见问题

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| 记忆像金鱼 | 未写背景卡或 gateway 重启丢库 | 补背景；检查数据目录持久化卷 |
| 换模型后失忆 | 误以为记忆在模型侧 | 记忆在网关，换模型不应清空 |
| Slack 无响应 | Event URL 或权限 | 对照 Slack 事件订阅日志 |
| 技能失败 | 网络或版本不匹配 | 看 gateway 日志，锁定 skill 版本 |

## 生产前加固（超出入门但常被忽略）

- **进程托管**：systemd `Restart=always` 或容器健康检查。  
- **日志轮转**：避免磁盘被 gateway 日志打满。  
- **Token 轮换日历**：Telegram/Slack 泄露比模型幻觉更常见。  
- **分离测试 Bot 与生产 Bot**：测试时不要用客户群。

## ngrok / 隧道使用注意

本地开发常借隧道暴露 Webhook。隧道 URL 一变，平台配置就要改。习惯 **固定子域名** 或开发专用 Bot，避免把生产 Slack Event URL 指到临时隧道。

## 与 MCP 联动的顺序（复习）

记忆探针通过 → 只读 MCP → 观察一周 → 再考虑写操作工具。很多人跳步的结果是：Agent 在 Slack 里「自信地」报了不存在的 Jira 编号。

## 常见安装错误截图级描述

**错误 1**：`gateway status` 显示未运行，但 Telegram 仍能发消息（其实连到旧进程）。处理：kill 全部 hermes 进程后单实例启动。

**错误 2**：隧道 URL 过期导致 Slack 事件 404。处理：固定隧道或部署到稳定 VPS。

**错误 3**：技能安装成功但命令不存在。处理：查技能是否注册到当前 gateway 版本，重启网关。

## 培训新成员的 30 分钟课纲

0-5 分：什么是网关记忆  
5-15 分：装 Telegram + 背景卡  
15-25 分：24h 探针演示  
25-30 分：讲清什么不能聊（机密）

## 安装后 30 分钟冒烟

| 分钟 | 动作 |
|------|------|
| 0-10 | 装依赖、起网关 |
| 10-15 | 单通道收发 |
| 15-20 | 写背景卡 |
| 20-25 | 发 [KB] 探针句 |
| 25-30 | `gateway status` 与日志无 ERROR |

冒烟不过，不要接第二平台。

## 常见报错对照

| 日志关键词 | 处理 |
|------------|------|
| token invalid | 重配 Bot Token |
| webhook timeout | 检查反向代理 |
| db locked | 停重复进程 |

## 升级前备份

复制 SQLite 数据目录与配置文件到带日期的 zip。升级失败可回滚；无备份不要追 latest main。

## 双机热备思路（进阶）

主网关 VPS + 备机定时同步数据目录。切换时 DNS 或 Bot webhook 指向备机。个人用户可省略；小团队客户群建议做。

## 日志级别调优

排障时临时开 DEBUG，结束后恢复 INFO，避免磁盘打满。把切换命令写进 runbook，半夜 on-call 可照抄。

## 实操附录：安装验收签字

安装人、复核人各签：冒烟清单通过、备份路径已知、Token 表已填。无签字不上生产群。

## 读者可执行检查

安装验收双人签字扫描件存盘，无签字不上生产群。

## 发布前核对

安装验收双人签字在案，缺则按未安装。

## 会后跟进

签字扫描件路径写入 on-call，缺件按未安装处理。

## 版本记录

2026-05-20 版。

## 主题附注 1

请在验收时完成上文自查项，并把日期记在团队 wiki 的「Hermes Agent 上手指南 2026：安装、记忆初始化与排错」条目下。

## 局限与不适合谁

本文命令随版本变化，实施前打开 [官方文档](https://hermes-agent.nousresearch.com/docs) 核对。无公网 IP 时 IM 接入要自建隧道，不适合完全不愿碰运维的用户。生产环境还需备份、监控、Token 轮换，超出入门范围。若验证清单两项以上失败，先别采购付费模型额度，修好链路再加功能。
