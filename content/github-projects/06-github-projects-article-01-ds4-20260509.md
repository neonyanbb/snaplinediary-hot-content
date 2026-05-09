# ds4：Redis作者出手，让MacBook跑起DeepSeek V4 Flash

## 导语

大模型推理正在经历一场"本地化"转向。当云端API的调用成本、延迟和隐私顾虑同时涌现，能在个人设备上运行的推理引擎就成了开发者社区的焦点。2026年5月6日，Redis创造者Salvatore Sanfilippo（antirez）在GitHub上发布了一个名为ds4的项目——一个专为DeepSeek V4 Flash打造的Metal推理引擎。上线仅3天，已收获2657颗Star。

## 这个项目是什么

ds4（ds4.c）是一个轻量级原生推理引擎，专门为DeepSeek V4 Flash模型设计。它不是通用的GGUF加载器，不是llama.cpp的封装，也不是一个框架。它的定位极其聚焦：一个模型、一个引擎、一个目标——让DeepSeek V4 Flash在Mac上以Metal GPU加速运行。

项目作者antirez是Redis的创造者，也是数据库领域最具影响力的开源开发者之一。在README中明确表示，这个项目的存在归功于llama.cpp和GGML生态，ds4借鉴了其量化格式、Metal内核和工程设计经验。

## 为什么值得关注

**KV缓存的"磁盘公民"理念。** ds4最核心的技术创新在于对KV缓存（Key-Value Cache）的重新定位。传统推理引擎将KV缓存视为纯内存对象，而ds4将其视为"一等磁盘公民"——KV缓存可以直接持久化到SSD。这意味着在128GB内存的MacBook上，通过2-bit量化（模型约81GB）加上磁盘KV缓存，可以运行百万token上下文窗口的推理。M3 Ultra + 512GB的配置下，q4量化的短prompt推理速度可达78.95 tokens/s。

**DeepSeek V4 Flash的独特优势。** antirez在README中列举了该模型的8个特点：更快的推理速度（激活参数更少）、思考长度与问题复杂度成正比（而非固定长度输出）、百万token上下文窗口、2-bit量化下仍保持工具调用可靠性、KV缓存极度压缩、英文和意大利语写作质量接近前沿模型。这些特性使得它成为本地推理的理想候选。

**Metal原生，Apple生态优先。** ds4目前仅支持Metal后端（GPU加速），CPU路径仅用于正确性验证。这种"专注一个平台做到极致"的策略，与antirez一贯的工程哲学一致——不做通用框架，而是在特定约束下做到最好。

## 它能带来什么变化

对于拥有Apple Silicon Mac的开发者和研究人员，ds4意味着可以在本地运行一个接近前沿水平的推理模型，无需云端API、无隐私泄露风险、无调用成本。128GB的MacBook Pro M3即可通过2-bit量化运行，512GB的Mac Studio则可以使用4-bit量化获得更好质量。

对于AI Agent开发者，ds4-server提供了OpenAI/Anthropic兼容的HTTP API端点，可以直接接入Claude Code、opencode、Pi等编码Agent工具链。磁盘KV缓存机制使得长对话和多轮Agent交互可以跨会话复用前缀，大幅降低重复计算成本。

对于行业而言，ds4代表了一种趋势：顶级开发者开始为特定模型定制专用推理引擎，而非等待通用框架适配。这种"一个模型一个引擎"的模式，可能成为本地AI推理的新范式。

## 快速上手

```bash
# 克隆仓库
git clone https://github.com/antirez/ds4.git
cd ds4

# 下载2-bit量化模型（需要128GB RAM）
./download_model.sh q2

# 编译
make

# 单次推理
./ds4 -p "Explain the difference between Redis lists and streams."

# 交互式对话
./ds4

# 启动API服务器
./ds4-server --ctx 100000 --kv-disk-dir /tmp/ds4-kv --kv-disk-space-mb 8192
```

GitHub仓库：https://github.com/antirez/ds4
