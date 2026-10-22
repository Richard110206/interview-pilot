# 贡献指南

感谢关注映答（Yingda）！欢迎通过 Issue 与 Pull Request 参与贡献。

## 开发环境

参考 [README · 快速开始](README.md#-快速开始复现指南) 完成本地启动，确认前端 5173 / 后端 8002 正常后再开始开发。

## 分支规范

仓库采用 `main` 单稳定分支 + 短生命周期特性分支的模型：

- `main`：始终可运行、可演示。禁止直接推送，只接受经过自测的合并。
- 新工作一律从 `main` 切出，命名 `type/scope-description`：

| 前缀 | 用途 | 示例 |
|---|---|---|
| `feat/` | 新功能 | `feat/question-bank-rag` |
| `fix/` | 缺陷修复 | `fix/model-options-parsing` |
| `docs/` | 文档变更 | `docs/readme-badges` |
| `refactor/` | 不改行为的重构 | `refactor/interview-state-machine` |
| `test/` | 测试补充 | `test/rag-index-rebuild` |
| `chore/` | 构建、依赖、杂务 | `chore/upgrade-langchain4j` |

规则：全小写，单词用 `-` 分隔，scope 与描述之间也用 `-`；一个分支只做一件事。

## 提交信息

遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)：

```
feat(question-bank): 支持按岗位联网扩充真题
fix(frontend): 修复模型选项下拉解析为 NaN
docs: 补充复现指南常见问题
```

## 提交前检查

```bash
# 后端（backend/）
./mvnw -pl admin -am test

# 前端（frontend/）
npm run lint && npm run typecheck && npm test && npm run build
```

## 安全红线

- **任何真实 API Key、密码、令牌不得进入版本库**；配置一律走 `.local/runtime.env`（已 gitignore），模板见 `deploy/runtime.env.example`；
- 不提交 `node_modules/`、`target/`、`dist/`、日志与本地数据。

## 许可

提交即表示同意贡献内容以 MIT License 随本仓库发布（上游 AI-Meeting 的 MIT 声明保留）。
