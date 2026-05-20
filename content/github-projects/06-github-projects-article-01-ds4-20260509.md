---
title: "ds4：antirez 的 DeepSeek V4 Flash Metal 推理引擎实测要点"
description: "Redis 作者 antirez 发布 ds4.c，专为 DeepSeek V4 Flash 在 Apple Silicon 上做 Metal 加速，并把 KV cache 当作可落盘的一等公民。本文说明 q2/q4 量化、百万 token 上下文思路、ds4-server OpenAI 兼容 API，以及 128GB Mac 以下的硬件门槛。"
category: github-projects
category_label: "GitHub 新项目速递"
date: 2026-05-20
slug: 06-github-projects-article-01-ds4-20260509
reading_minutes: 8
---

> **热点手记** · GitHub 新项目速递 · hot.snaplinediary.cn · 估读约 8 分钟 · 2026-05-20

## 背景：本地推理为什么又热

云端 API 在成本、延迟与隐私上的压力，让 2026 年出现一批「一个模型 + 一个引擎」的专用项目，而不是等通用框架慢慢适配。ds4（github.com/antirez/ds4）由 Redis 创造者 Salvatore Sanfilippo 发布，目标极其聚焦：在 Mac 上用 Metal 跑 DeepSeek V4 Flash，并探索磁盘级 KV cache。

这个项目不是 hobby toy。antirez 在 README 里明确写了设计取舍：代码路径要短、 Metal 内核要 hand-tuned、 KV cache 要当成可持久化的一等公民。对于需要在本地跑大模型长上下文的开发者，这是一个值得严肃评估的选项。

## 技术要点

### 专用绑定而非通用框架

ds4 不是又一个 GGUF 通用加载器。它绑定 DeepSeek V4 Flash 的推理路径，借鉴 llama.cpp/GGML 的量化与 Metal 经验，但代码路径更短、更专。好处是：针对 V4 Flash 的 MoE 结构、 MLA 注意力、 MTP 多 token 预测都做了特化。坏处是：换模型要换引擎，不像 llama.cpp 那样一个二进制跑多种 GGUF。

代码结构也反映了这种专注。核心是一个约数千行的 C 文件 ds4.c，加上 Metal shader 与量化工具脚本。没有复杂的插件系统，没有跨平台抽象层。读懂 ds4.c 的推理循环，比读懂 llama.cpp 的 graph 调度容易一个数量级。

### KV cache 落盘机制

传统实现把 KV 当纯内存对象，上下文一长就吃满 RAM。ds4 允许 KV 持久化到 SSD。配合 2-bit 量化，模型权重约 81GB 量级，128GB 统一内存的 Mac 上可以把上下文推到百万 token 级别。

具体机制是：forward 过程中 KV tensors 可以选择落盘，而不是常驻 GPU/统一内存。下次续写时从磁盘加载所需 slice。这引入了磁盘 IO 延迟，但换取了上下文长度的大幅扩展。README 提到在 M3 Ultra 512GB 机器上做过验证，M3 Max 128GB 也可以跑，只是 tok/s 会下降。

实际使用时，落盘目录需要高速 SSD。NVMe 外置盘比内置慢但可扩展。需要监控目录增长：一个长会话的 KV 可能占几十 GB。

### ds4-server 的 OpenAI 兼容层

ds4 附带 ds4-server，提供 OpenAI/Anthropic 兼容 HTTP 端点。本地模型可以接到 Claude Code、opencode、Continue 等 Agent 工具。

server 支持前缀 KV 复用。多轮对话中，前缀部分的 KV 不需要重新计算，降低后续轮次的延迟和算力消耗。这对 Agent 循环特别有用：系统提示 + 工具描述通常是固定前缀，每轮只增量计算用户新输入。

### 量化格式与磁盘规划

DeepSeek V4 Flash 的量化档不同，磁盘与内存需求差数倍。ds4 支持 q2 和 q4，README 对 128GB 机器的建议是 q2。下载前建议自己建一张表记录：格式、文件大小、加载时间、首 token 延迟。不要在生产直接追最新量化帖。

量化脚本在仓库里，可以自己从原始权重生成。这给了灵活性，也意味着你需要验证生成后的 checksum。

## 上手步骤

从源码编译：

```bash
git clone https://github.com/antirez/ds4.git
cd ds4
make
```

下载模型权重：

```bash
./download_model.sh q2   # 约 81GB，需大内存
```

单次推理测试：

```bash
./ds4 -p "Explain Redis streams vs lists in 200 words."
```

这会验证 Metal 是否正常调用。第一次编译时确认 Xcode Command Line Tools 已安装，macOS 版本满足 README 要求。

启动兼容 server：

```bash
./ds4-server --ctx 100000 \
  --kv-disk-dir /Volumes/External/ds4-kv \
  --kv-disk-space-mb 8192
```

客户端调用示例：

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ds4",
    "messages": [{"role": "user", "content": "hello"}]
  }'
```

实测建议分三步：先 make 与单次 -p 推理，确认 Metal 正常；再开 server，用 curl 打兼容 API；最后才接生产 Agent。不要一上来就把 ds4-server 塞进 Claude Code 的配置。

## 实测性能参考

社区在 M3 Ultra 512GB 机型上报告过数十 tok/s 的生成速度，M3 Max 128GB 上 q2 量化可以做到可用级别。具体数字波动很大，取决于上下文长度、是否启用 KV 落盘、磁盘速度。

建议自己跑 benchmark：固定 prompt、固定生成长度、用 time 命令测 wall-clock。记录三项数字：加载时间、首 token 延迟、平均 tok/s。不同 macOS 版本和 Metal 驱动会有差异，不要外推别人的数字。

128GB 以下机型，比如 M3 Pro 36GB 或 M2 Air 16GB，q2 可能加载失败或频繁 swap。这些机器更适合 q4 或更短上下文实验，不要强求百万 token。

## 与 Claude API、llama.cpp 对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| Claude API | 零运维、质量稳 | 费用、数据出境、延迟不可控 |
| llama.cpp 通用 | 多模型、社区大、跨平台 | V4 Flash 优化可能滞后，MoE 支持慢 |
| ds4 | V4 Flash 专用优化、磁盘 KV、Metal hand-tuned | 仅 Apple Silicon 为主，换模型需换引擎 |

选型逻辑：如果你确定要跑 DeepSeek V4 Flash，且主力机器是 Mac，ds4 比通用框架值得试。如果模型会频繁切换，或者团队有 Linux GPU 集群，llama.cpp 或 vLLM 更灵活。

## Metal 环境自检与内存规划

确认 Metal 可用：

```bash
system_profiler SPDisplaysDataType | grep "Metal"
```

128GB 统一内存机型与 16GB 笔记本体验差一个数量级。POC 前对照 README 硬件表，不要借同事机器跑通就在生产下单。

内存规划建议：模型权重 81GB（q2）+ 系统与缓存预留 + KV 磁盘缓冲。128GB 机器上不要同时开 Chrome 几十个标签再跑 ds4。ds4 是内存饥饿型应用，需要独占资源。

## KV disk 监控与磁盘管理

为 kv-disk-dir 所在卷设磁盘告警，建议 80% 阈值。长会话 KV 增长可能几天吃满 SSD。

清理脚本示例：

```bash
#!/bin/bash
# 每周清理试验 KV 目录
find /Volumes/External/ds4-kv -name "*.tmp" -mtime +7 -delete
df -h /Volumes/External
```

生产用独立卷，不要把 KV 落盘放到系统盘。系统盘满了会导致 macOS 不稳定。

## 与 Ollama 并存

若本机已跑 Ollama，注意端口与 GPU 内存争用。Ollama 默认占 11434，ds4-server 默认占 8080，端口不冲突，但统一内存是共享的。

建议分时运行：白天 Ollama 实验，夜间 ds4 批推理。同时跑可能触发 Metal OOM，日志里表现为莫名 hang。如果必须同时跑，给 Ollama 限制并发或换小模型。

## antirez 项目风格与维护预期

ds4 偏研究与黑客精神，文档更新节奏随作者兴趣波动。生产依赖要 fork 并锁定 commit，自行跑 CI。不要把「作者名气」当 SLA。

升级前阅读 commit message，特别是触及 Metal 内核或量化格式的变更。antirez 的提交风格直接，破坏性变更不会特别标注，需要自己 diff。

## 局限与不适合谁

没有 128GB 级内存的机器，q2 路线可能不现实，请读 README 硬件表。非 Mac 或不愿用 Metal 的用户目前不合适。专用引擎随模型版本演进，DeepSeek 发布 V5 时 ds4 可能需要重写适配。生产 SLA 需自运维，antirez 项目偏研究与黑客精神，不是云厂商托管服务。法律与许可证请读仓库 LICENSE，商用前自行评估。若团队需要多模型切换或跨平台部署，llama.cpp 或 vLLM 更合适。
