---
title: "Claude Code Plan Mode 入门：何时先计划、何时直接改"
description: "Plan Mode 不是多余点击，而是给多文件任务加可审检查点。本文对比「改一处崩一片」的盲改模式，给出 JWT 类迁移的简化案例、/plan 提示词要点，以及三条适合直接改、三条必须计划的规则，与长文《跨文件重构》互为补充。"
category: claude-code
category_label: "Claude Code"
date: 2026-05-20
slug: 04-claude-code-article-02-20260508
reading_minutes: 3
---

> **热点手记** · Claude Code · hot.snaplinediary.cn · 估读约 3 分钟 · 2026-05-20

## 老项目里的「改一处崩一片」

在 Flask 或 Django 单体仓库里改认证库，最常见的翻车链是这样的：你让 Agent 把 `auth.py` 里的 JWT 校验逻辑换掉，它照做了，但忘了测试里的 mock 对象还在用旧库的异常类型；README 里的示例代码还是老接口；CI 镜像的 `requirements.txt` 没有同步 pin 新版本。人脑容易漏，Agent 如果没有计划阶段也会漏，只是漏得更快、更安静。

Plan Mode 的核心价值不是让流程变长，而是把风险从「未知」变成「可见」。它强制 Agent 在落盘任何修改之前，先输出一份文件级清单：拟修改哪些路径、依赖与测试会受什么影响、建议执行哪些验证命令、以及明确声明不碰的目录。你逐条审完再点头，执行阶段的意外就少了一半。

## Plan Mode 在做什么

交互上，你在 Claude Code 会话里输入 `/plan`，或者用自然语言说明「先给我计划，不要执行」。Agent 会进入计划模式，返回一份结构化的文本，通常包含四类信息：

拟修改路径列表。不是笼统的「改认证模块」，而是具体到 `src/auth/validator.py`、`tests/test_auth.py`、`requirements.txt`、`README.md` 第 47 行示例。

依赖与测试影响。如果替换的是 PyJWT，计划里应该列出所有 `import jwt` 的文件，并说明测试里哪些 assert 会因为异常类型变化而失效。

建议执行的命令。比如 `pytest tests/test_auth.py -v`、`pip install python-jose[cryptography]`，以及验证 API 兼容性的 curl 命令。

明确不碰的目录。这是防止 Agent「顺手重构」的关键。计划里必须有一节「本次不修改」，列出 `legacy/`、`infra/` 等边界。

社区反馈显示，有基本测试覆盖的仓库里，使用 Plan Mode 后的返工次数明显下降。因为计划阶段暴露的遗漏，修正成本接近于零；等代码已经落盘再发现漏改，回滚和重写的成本是指数级上升的。

## 简化案例：库替换的检查表

以「把 PyJWT 换成 python-jose，保持对外 API 不变」为例，计划阶段你必须看到以下四项被逐条列出：

依赖文件：`requirements.txt` 或 `pyproject.toml` 里的 `PyJWT==2.x.x` 要换成 `python-jose[cryptography]==3.x.x`，并检查是否有子依赖冲突。

引用文件：所有 `import jwt` 和 `from jwt import` 的文件路径。不能只看 `src/`，还要扫 `scripts/`、`tools/`、文档里的内嵌代码块。

测试文件：`tests/` 下所有认证相关用例。PyJWT 抛 `jwt.ExpiredSignatureError`，python-jose 抛 `jose.exceptions.ExpiredSignatureError`，测试里的异常捕获必须同步改。

文档文件：README、API 文档、甚至 CHANGELOG 里的示例代码。Agent 经常改完源码就忘了文档，导致用户 copy 示例直接报错。

执行阶段你应盯着两个细节：diff 里是否出现无关格式化（比如把全仓库的单引号改成双引号），以及测试是否真跑过。不要信口头「已通过」，要看终端输出的 `passed` 行数。

## 三条直接改 vs 三条先 plan

有些任务确实不需要 Plan Mode，强行 `/plan` 反而拖沓。可直改的三类场景是：

单文件 typo、注释更新、日志文案调整。影响范围肉眼可见，没有跨文件副作用。

已有测试覆盖的纯函数内部实现。比如把 `date.strftime` 换成 `date.isoformat`，输入输出不变，测试 green 就是安全信号。

代码生成后你立刻肉眼 diff 的 20 行内改动。小到可以一次性看完，不需要清单。

必须先用 `/plan` 的三类场景是：

认证、支付、权限模型。任何触及安全边界的改动，即使只改一个文件，也要先计划。因为漏洞往往藏在「我以为只改了一行」里。

跨 3 个以上目录或涉及数据库迁移。目录越多，人脑越难追踪副作用；迁移类任务有不可逆步骤，顺序错一步就丢数据。

删文件、改公共 API、升级 major 版本依赖。这些都是破坏性变更，计划里必须列出所有消费者和回滚步骤。

## 计划文本里应出现的五类信息

审计划时，除了文件列表，还要强制 Agent 补全以下五类信息，缺一类就要求补 plan：

依赖版本策略。新库用 pin 还是 semver range？如果是 range，要说明最低兼容版本如何验证。

测试范围。跑全量测试还是只跑受影响包？monorepo 里 `pytest` 全仓可能 20 分钟，只跑 `packages/auth` 可能 30 秒，策略不同，风险不同。

回滚触发条件。哪类测试红就停？单元测试红、类型检查红、还是 E2E 红？触发条件越具体，执行越不犹豫。

数据迁移。有没有不可逆 SQL？如果有，计划里必须拆成「加列 / 双写 / 切读 / 删旧列」四步，Agent 不能一步跳到删列。

文档与 changelog。README、API 契约、团队 wiki 是否同步更新。漏文档的 refactor 在技术债里占一半，计划阶段就要点名。

## 与 Code Review 文化的配合

Plan Mode 不是替代 Code Review，而是让审查人把精力从「这到底改了哪些文件」转移到「业务逻辑对不对」。推荐做法是在 PR 描述里贴 Plan 摘要，格式可以是折叠块：

```markdown
<details>
<summary>Plan 摘要</summary>
- 改: src/auth/validator.py, tests/test_auth.py
- 不碰: legacy/, infra/
- 测试: pytest tests/test_auth.py -v
- 风险: 异常类型变更
</details>
```

审查人先扫计划再扫 diff，如果 diff 里出现计划外的文件，直接 request changes。这样 Agent 的「顺手重构」会被流程挡住，而不是在 review 时才被发现。

## Plan 失败后的降级

如果 Agent 两轮 plan 输出仍然含糊，不要硬上。降级的正确顺序是：

第一，缩小范围到单目录或单模块。把「重构整个认证层」拆成「先只换 validator.py」，等这步稳定后再扩范围。

第二，检查测试脚手架。如果 Agent 输出的测试命令 `pytest tests/auth` 在你的环境里根本不存在，先让人补好测试目录结构，再让 Agent 改业务代码。否则计划再漂亮也是空中楼阁。

第三，切换模型。Plan 阶段需要强模型读全库、理依赖；如果当前模型对仓库结构理解模糊，切到更强一档再试。不要在 plan 含糊时直接执行，那等于盲改。

## 局限与不适合谁

Plan 质量的上限是模型对仓库的理解。无测试、无 README、目录结构混乱的仓库，Agent 的计划也会瞎。如果团队文化是一路狂点「确认全部」，Plan Mode 退化为无意义的仪式，风险与盲改相同。

极短脚本仓库（比如 5 个文件的 Python 工具）用 Plan 反而慢。直接改、肉眼 diff、git revert 就够了。Plan Mode 的收益随仓库复杂度递增，在简单项目上边际收益是负的。

最新子命令与标志以 code.claude.com/docs 当期文档为准。不同版本的 Claude Code 对 `/plan` 的支持细节可能有差异，以你安装的 CLI `--version` 输出为准。
