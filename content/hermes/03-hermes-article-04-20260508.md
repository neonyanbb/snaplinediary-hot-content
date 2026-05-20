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

不要第一天同时接 Slack、Discord 和 Honcho，排错维度会爆炸。单平台跑通后再扩，这是避坑第一原则。

## 步骤一：安装并启动网关

```bash
npm install -g @nous/hermes-gateway
hermes gateway start
hermes gateway status
```

`status` 应显示进程在监听。若端口冲突，查文档中的端口环境变量，改后重启。例如：

```bash
export HERMES_PORT=4000
hermes gateway restart
```

如果 `npm install` 失败，先检查 Node 版本：`node -v`，低于 22 的请升级。国内网络若连 npm 慢，可换淘宝源或直接用 GitHub Release 的二进制包。

建议用 systemd 托管网关进程，避免终端关闭后服务停止。写一个最小化的 service 文件：

```ini
# /etc/systemd/system/hermes-gateway.service
[Unit]
Description=Hermes Gateway
After=network.target

[Service]
Type=simple
User=neon
WorkingDirectory=/home/neon
Environment=HERMES_PORT=3000
Environment=TELEGRAM_BOT_TOKEN=你的Token
ExecStart=/usr/bin/hermes gateway start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

加载并启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable hermes-gateway
sudo systemctl start hermes-gateway
sudo systemctl status hermes-gateway
```

## 步骤二：接 Telegram（P0 通道）

1. 在 BotFather 搜索 `@BotFather`，发送 `/newbot`，按提示命名。完成后复制 Token，格式类似 `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`。
2. 将 Token 写入环境变量或 systemd 配置，**勿写入 git 仓库**。
3. 本地开发若无公网 IP，用 cloudflared 隧道暴露端口：
   ```bash
   npm install -g cloudflared
   cloudflared tunnel --url http://localhost:3000
   ```
   终端会输出一个 https URL，例如 `https://abcd-123-45-67-89.ngrok-free.app`。复制该 URL，在 Hermes 配置中将 Telegram webhook 指向它。
4. 给 Bot 发 `/start` 或普通问候，确认有回复。

**实测要点**：断网重连后，同一会话 thread 应仍可继续；若每次像新用户，检查是否连错 gateway 实例，或 SQLite 数据目录是否被清空。

## 步骤三：记忆初始化（多数教程跳过的一步）

在首条有效对话发送结构化背景，例如：

```
我是后端工程师，主语言 Go，正在做订单服务重构。
偏好：结论先行，代码示例用 fenced block。
本周目标：拆分 monolith 的支付模块。
```

不要只发「你好」或「帮我写代码」。没有背景卡，模型只能用默认人设回答你，24 小时后更不可能记得项目细节。

24 小时后发送探针：「我本周目标是什么？」答不出则先修记忆，不要加 MCP。记忆探针失败的最常见原因是数据目录未持久化，比如用 Docker 时没挂卷，容器重启后 SQLite 归零。

```bash
# Docker 启动时务必挂卷
docker run -v ~/.hermes:/root/.hermes -e TELEGRAM_BOT_TOKEN=xxx nous/hermes-gateway
```

## 步骤四：可选扩展

| 扩展 | 何时加 | 参考 |
|------|--------|------|
| Honcho | 需要语义画像、多 Bot 隔离 | 配置 memory provider 为 honcho |
| MCP 只读 Server | 记忆探针已通过 | 先接一个只读源，如 GitHub Issues |
| 第二 IM 平台 | Telegram 稳定一周 | Slack 文档 |

```bash
# 安装技能
hermes skills install research-paper-summarizer
```

技能安装后立即用 **单任务** 验收，例如只给一篇 arXiv 摘要链接，检查返回是否包含作者、方法、结论三段。不要一上来就发复杂指令。

## 验收清单（打印勾选）

- [ ] `gateway status` 正常
- [ ] Telegram 双向消息
- [ ] 24h 记忆探针通过
- [ ] （可选）第二通道引用 Telegram 里的事实
- [ ] （可选）一个 skill 成功返回结构化结果

全部打勾之前，不要接生产群。很多人跳过清单直接上 Slack 工作区，结果在同事面前出丑。

## 常见问题

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| 记忆像金鱼 | 未写背景卡或 gateway 重启丢库 | 补背景；检查数据目录持久化卷 |
| 换模型后失忆 | 误以为记忆在模型侧 | 记忆在网关，换模型不应清空 |
| Slack 无响应 | Event URL 或权限 | 对照 Slack 事件订阅日志 |
| 技能失败 | 网络或版本不匹配 | 看 gateway 日志，锁定 skill 版本 |
| 隧道 URL 失效 | cloudflared 临时域名过期 | 换固定子域名或部署到 VPS |

## 生产前加固

- **进程托管**：systemd `Restart=always` 或容器健康检查，上文已给示例。
- **日志轮转**：避免磁盘被 gateway 日志打满。配置 logrotate：
  ```
  /var/log/hermes/*.log {
    daily
    rotate 7
    compress
    missingok
  }
  ```
- **Token 轮换日历**：Telegram/Slack 泄露比模型幻觉更常见。建议每 90 天轮换一次，在日历里设提醒。
- **分离测试 Bot 与生产 Bot**：测试时不要用客户群。给测试 Bot 取明显不同的名字，比如 `hermes-test-bot`。

## ngrok / 隧道使用注意

本地开发常借隧道暴露 Webhook。隧道 URL 一变，平台配置就要改。cloudflared 的临时域名每次重启都变，习惯 **固定子域名** 或开发专用 Bot，避免把生产 Slack Event URL 指到临时隧道。

固定子域名的方法：在 cloudflared 登录后，创建一个命名隧道：

```bash
cloudflared tunnel create hermes-dev
cloudflared tunnel route dns hermes-dev hermes-dev.yourdomain.com
cloudflared tunnel run hermes-dev
```

## 与 MCP 联动的顺序

记忆探针通过 → 只读 MCP → 观察一周 → 再考虑写操作工具。很多人跳步的结果是：Agent 在 Slack 里「自信地」报了不存在的 Jira 编号。

配置 MCP Server 时，先在 `~/.hermes/mcp.json` 里只注册一个只读源：

```json
{
  "servers": [
    {
      "name": "github-read",
      "command": "npx -y @modelcontextprotocol/server-github",
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx" }
    }
  ]
}
```

确认 `hermes tools list` 能看到只读工具后，再逐步添加。不要一次性暴露写权限。

## 升级前备份

复制 SQLite 数据目录与配置文件到带日期的 zip。升级失败可回滚；无备份不要追 latest main。

```bash
cd ~/.hermes && zip -r ~/backups/hermes_$(date +%Y%m%d).zip .
```

## 局限与不适合谁

本文命令随版本变化，实施前打开 [官方文档](https://hermes-agent.nousresearch.com/docs) 核对。无公网 IP 时 IM 接入要自建隧道，不适合完全不愿碰运维的用户。生产环境还需备份、监控、Token 轮换，超出入门范围。

若验证清单两项以上失败，先别采购付费模型额度，修好链路再加功能。Windows 原生支持在 v2026.5 进入 beta，若你在 Windows 上跑网关，建议先用 WSL2 验证。Docker Desktop 的卷挂载路径在 Windows 和 macOS 上有差异，备份脚本需要按平台调整。
