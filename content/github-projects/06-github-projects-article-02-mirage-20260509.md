# Mirage：一个文件系统，统一AI Agent的所有后端

## 导语

AI Agent正在成为软件开发的新范式，但一个根本性的碎片化问题始终存在：每个外部服务——S3、Google Drive、Slack、Gmail、GitHub——都有自己的SDK、认证方式和数据模型。一个需要同时操作5个服务的Agent，就得学习5套API、处理5种错误模式、维护5个连接。2026年5月6日发布的Mirage项目试图用一种极其优雅的方式解决这个问题：把所有服务变成同一个文件系统。

## 这个项目是什么

Mirage是strukto-ai团队开发的"AI Agent统一虚拟文件系统"。它的核心理念是：将S3、Google Drive、Slack、Gmail、Redis、GitHub、Notion、MongoDB等数十种服务，统一挂载为一棵虚拟文件系统树。AI Agent用同一套Unix-like命令（`ls`、`cat`、`cp`、`grep`、`find`）操作所有后端，跨服务的管道组合就像在本地磁盘上一样自然。

项目使用TypeScript和Python双栈开发，提供SDK、CLI和daemon三种使用方式。上线3天即获得1485颗Star，Fork数86，开发活跃度极高（52次提交，最近更新在18小时前）。

## 为什么值得关注

**零学习成本的Agent工具层。** Mirage最大的创新不是技术复杂度，而是对LLM能力的精准利用。现代大模型在训练过程中接触了海量bash和文件系统操作代码，对`grep`、`cp`、`find`等命令的理解远超大多数专用SDK。Mirage直接复用这个能力——Agent不需要学习任何新API，只要会bash就能操作所有后端。

**覆盖范围极广。** 已支持的后端包括：对象存储（S3/R2/OCI/Supabase/GCS）、Google全家桶（Gmail/GDrive/GDocs/GSheets/GSlides）、项目管理（GitHub/Linear/Notion/Trello）、通讯（Slack/Discord/Telegram/Email）、数据库（Redis/MongoDB）、SSH等。这种覆盖面意味着一个Agent可以通过单一接口访问几乎所有主流服务。

**兼容主流Agent框架。** Mirage不是孤立工具，而是作为sandbox或工具层嵌入OpenAI Agents SDK、Vercel AI SDK、LangChain、Pydantic AI、CAMEL、OpenHands等主流框架。Workspace支持clone、snapshot和version，Agent运行环境可以跨机器迁移和复现。

**两层缓存机制。** 索引缓存（目录列表和元缓存）和文件缓存（对象字节）分别支持RAM和Redis后端，在减少API调用的同时保证数据一致性。

## 它能带来什么变化

对于AI Agent开发者，Mirage意味着不再需要为每个外部服务编写和维护MCP server或自定义工具。一个Workspace配置就能替代数十个SDK集成，大幅降低Agent开发复杂度。

对于企业应用，Mirage的Workspace snapshot和version能力使得Agent运行环境可以像代码一样被管理——可以回滚、可以复现、可以审计。这在合规要求严格的场景中尤为重要。

对于行业而言，Mirage代表了一种"回归本质"的设计哲学：与其发明新的抽象层，不如利用LLM已有的最强能力（bash/文件系统）。这种思路可能影响未来Agent工具设计的方向。

## 快速上手

```bash
# Python
uv add mirage-ai

# TypeScript
npm install @struktoai/mirage-node

# CLI
curl -fsSL https://strukto.ai/mirage/install.sh | sh
```

```python
from mirage import Workspace
from mirage.resource.s3 import S3Resource, S3Config
from mirage.resource.slack import SlackResource, SlackConfig

ws = Workspace({
    "/s3":    S3Resource(S3Config(bucket="my-bucket")),
    "/slack": SlackResource(SlackConfig()),
})

# 跨服务管道操作
await ws.execute("grep alert /slack/general/*.json | wc -l")
await ws.execute("cp /s3/report.csv /data/local.csv")
```

GitHub仓库：https://github.com/strukto-ai/mirage
