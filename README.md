# 贾维斯 / PromptBall

贾维斯是一个基于 Tauri 2 的桌面悬浮式 Prompt 工作台，面向日常高频使用场景，覆盖 Prompt 编写、优化、模板复用、效果评估、A/B 测试与多模型调用管理。项目当前以前端 React + TypeScript 和桌面端 Rust + Tauri 为核心，目标是提供一个本地优先、可持续迭代的 Prompt 训练与生产工具。

## 当前能力

- 悬浮小球入口，支持拖动、贴边、置顶和快捷打开工作台。
- Prompt 编辑与优化，支持自由编辑、结构化输入、前后对比和训练建议。
- 收藏 Prompt、Slash 命令、模板库和变量化复用。
- Prompt 效果评估、历史记录、版本管理和 A/B 测试。
- DeepSeek、OpenAI-compatible、Ollama-compatible 等多模型 Provider 管理。
- 语音输入与隐私控制，本地数据默认优先考虑最小化保存。

## 技术栈

- 桌面框架：Tauri 2
- 前端：React、TypeScript、Vite
- 状态管理：Zustand
- UI：Tailwind CSS + 本地 shadcn 风格组件
- 本地存储：SQLite + rusqlite
- 模型接口：OpenAI-compatible Chat Completions

## 本地开发

安装依赖：

```bash
npm install
```

启动前端开发环境：

```bash
npm run dev
```

启动 Tauri 桌面应用：

```bash
npm run tauri -- dev
```

执行检查：

```bash
npm run check
```

构建前端产物：

```bash
npm run build
```

## 环境说明

项目在 Windows 环境下开发，Tauri 原生编译依赖 Visual Studio Build Tools、C++ workload 和 Windows SDK。若 PowerShell 中 Rust 链接阶段误命中 Git 自带的 `link.exe`，建议先切换到 MSVC 开发环境后再执行原生检查。

## 项目结构

```text
src/
  components/   通用 UI 组件
  features/     业务功能模块
  lib/          Prompt、评估、Provider 与桥接逻辑
  services/     本地配置与数据服务
  store/        Zustand 状态管理
  types/        共享类型定义
  utils/        通用工具与敏感信息处理
src-tauri/
  db/           SQLite 结构定义
  migrations/   数据迁移脚本
  src/          Tauri Rust 侧实现
```

## 配置

仓库不保存敏感密钥。复制 `.env.example` 仅作为非敏感默认值参考，实际 API Key、Base URL、模型名等信息通过应用设置页录入。

## 文档

- implementation_plan.md：阶段实施计划与验收记录
- ROADMAP.md：产品路线图
- TODO.md：当前任务清单
- CHANGELOG.md：变更记录
- AGENT.md：工程约定与维护说明
