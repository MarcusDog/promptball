<div align="center">

<img src="assets/promptball/icons/promptball-logo.svg" alt="PromptBall Logo" width="96" />

# PromptBall

**桌面悬浮式 Prompt 训练与优化工作台**

> Build better prompts, faster — right from your desktop.

[![Platform](https://img.shields.io/badge/platform-Windows-blue?logo=windows)](https://github.com/MarcusDog/promptball/releases)
[![Tauri](https://img.shields.io/badge/desktop-Tauri%202-24C8DB?logo=tauri)](https://tauri.app)
[![React](https://img.shields.io/badge/frontend-React%2019-61DAFB?logo=react)](https://react.dev)
[![Rust](https://img.shields.io/badge/backend-Rust-orange?logo=rust)](https://www.rust-lang.org)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-65%20passing-brightgreen)](#)

</div>

---

## 什么是 PromptBall？

PromptBall 是一款面向 AI 重度用户的**本地优先**桌面应用。它以悬浮小球常驻你的桌面角落，随时召出 Prompt 工作台：写 Prompt、优化 Prompt、评估效果、管理模板、对比版本、A/B 测试——所有操作在一个原生窗口内完成，数据本地加密存储，不依赖任何云端账号。

---

## 核心特性

### 🔮 悬浮小球入口

<img src="assets/promptball/icons/floating-ball-default.svg" align="right" width="80" />

- 可拖动、贴边吸附，不遮挡工作内容
- 实时状态反馈（空闲 / 编辑中 / 优化中 / 成功 / 报错）
- 右键快捷菜单：一键打开工作台、Prompt 库、历史记录、设置
- 全局快捷键支持：`Alt+Space` 打开工作台，`Ctrl+Shift+P` 优化剪贴板内容，`Ctrl+Shift+L` 打开 Prompt 库

---

### ✍️ Prompt 工作台

<img src="assets/promptball/icons/feature-better-prompt.svg" align="right" width="80" />

- **自由模式**：直接输入，支持 Markdown 格式
- **结构化角色模式**：分字段填写 Role / Goal / Constraints / Output / Negative，自动组装成完整 Prompt
- **变量占位符**：使用 `{{变量名}}` 语法，结合 Slash 命令一键填充
- **草稿自动恢复**：意外关闭也不丢内容
- **字符 / 词数 / Token 实时估算**
- **优化前后对比视图**：一键查看改动差异

---

### ⚡ 内置 AI 优化器

<img src="assets/promptball/icons/feature-training.svg" align="right" width="80" />

- 自动识别 Prompt 任务类型（编程、写作、数据分析、学术等）
- 诊断薄弱点，给出结构化评分（0–100）
- 输出优化后 Prompt，并附改写说明与训练建议
- 支持补充信息指引，引导写出更完整的上下文
- 基于 OpenAI-compatible 接口，默认接入 DeepSeek

---

### 📚 收藏 Prompt 与模板库

<img src="assets/promptball/icons/feature-quality.svg" align="right" width="80" />

- **22 个内置模板**，覆盖 12 大使用场景（代码、学术、创作、数据、设计等）
- 每条模板附带场景说明、适用变量、推荐模型、输出示例和评估标准
- **Slash 命令**：工作台输入 `/` 即可搜索并插入模板，支持拼音检索
- 自定义收藏 Prompt，可设置分类、标签、Slash 触发词、默认参数

---

### 📊 效果评估与版本管理

- **多维评分体系**：结构完整性 / 输出质量 / 用户满意度 / 实际使用效果，加权汇总出综合效果分
- **历史趋势图**：直观展示 Prompt 效果变化曲线
- **版本管理**：每次修改自动创建新版本，支持版本 diff 对比、性能指标对比和一键回滚
- **问题标签归因**：记录"信息不足 / 输出过长 / 格式不对"等失败原因，便于针对性改进

---

### 🔬 A/B 测试

- 选择两个收藏 Prompt，输入同一段测试材料，并行调用模型
- **盲评模式**：随机打乱显示顺序，避免标签偏见
- 记录胜负、对比原因，自动更新胜率统计
- 可绑定不同模型、任务类型，量化"哪个 Prompt 更好"

---

### 🎙️ 语音输入

- 一键开始 / 停止录音
- WebView 可用时自动语音识别，否则支持手动转写编辑
- 一键口语化清理（去除停顿词、整理句式）
- 一键将转写文本结构化为完整 Prompt 并推送到工作台
- 隐私保护：默认不持久化录音和转写文本，可在设置中单独开启

---

### 🤖 多模型 Provider 管理

| Provider 类型 | 默认地址 | 说明 |
|---|---|---|
| DeepSeek | `https://api.deepseek.com` | 默认配置，开箱即用 |
| OpenAI-compatible | 自定义 | 支持任意兼容接口 |
| Ollama (本地) | `http://localhost:11434/v1` | 本地模型，完全离线 |

- 为不同任务类型绑定专属模型（优化、评估、对话……）
- 实时 Provider 测试：点击即可验证连通性
- 模型调用日志：记录每次调用的耗时与 Token 估算

---

### 🔒 隐私与安全

<img src="assets/promptball/icons/feature-better-prompt.svg" align="right" width="64" />

- **隐私模式**：开启后历史记录、提示词运行、语音记录、模型调用日志均不持久化
- **敏感信息检测**：自动识别 API Key、GitHub Token、密码、邮箱、手机号、身份证号、数据库连接串等，调用模型前主动提醒
- **导出脱敏**：数据导出时自动抹去敏感字段
- **本地数据清除**：一键清除历史、评分、语音记录、调用日志
- 所有数据本地 SQLite 存储，无需账号，无需联网（除模型调用外）

---

## 技术栈

| 层级 | 技术 | 说明 |
|---|---|---|
| 桌面框架 | **Tauri 2** | Rust 后端，最小安装包 |
| 前端框架 | **React 19 + TypeScript** | 类型安全，Vite 构建 |
| UI 系统 | **Tailwind CSS + shadcn/ui** | 原子化样式，组件可复用 |
| 状态管理 | **Zustand** | 轻量全局状态 |
| 本地存储 | **SQLite via rusqlite** | 本地优先，支持增量 migration |
| 模型接口 | **OpenAI-compatible API** | 兼容 DeepSeek / OpenAI / Ollama |

---

## 快速开始

### 环境要求

- Node.js ≥ 18
- Rust 工具链（通过 [rustup](https://rustup.rs) 安装）
- Windows：需要 Visual Studio 2022 Build Tools + C++ workload + Windows SDK

### 安装与运行

```bash
# 安装前端依赖
npm install

# 启动前端开发预览（仅 UI）
npm run dev

# 启动完整桌面应用（含 Tauri 原生层）
npm run tauri -- dev
```

### 验证与构建

```bash
# 类型检查 + 单元测试 + 前端构建
npm run check

# 仅运行测试
npm run test:run

# 生产构建
npm run build
```

> **Windows Rust 编译说明**：若 Rust 链接阶段误命中 Git 自带的 `link.exe`，建议先激活 MSVC 开发环境再执行原生检查：
> ```powershell
> cmd /c '"C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" && cargo check --manifest-path src-tauri\Cargo.toml'
> ```

---

## 配置

复制 `.env.example` 作为非敏感默认值模板。**API Key 不写入代码仓库**，在应用内"设置 → 模型"页填写以下参数：

| 参数 | 默认值 | 说明 |
|---|---|---|
| API Key | — | 你的模型 Provider 密钥 |
| Base URL | `https://api.deepseek.com` | OpenAI-compatible 接口地址 |
| Model | `deepseek-chat` | 模型名称 |
| Temperature | `0.7` | 生成随机度 |
| Max Tokens | `4096` | 单次最大输出 |

---

## 项目结构

```text
src/
├── components/        通用 UI 基础组件
├── features/
│   ├── floating-ball/   悬浮球入口与状态
│   ├── workspace/       Prompt 工作台
│   ├── favorites/       收藏 Prompt、Slash 命令、A/B 测试
│   ├── history/         历史记录
│   ├── templates/       内置模板库
│   ├── settings/        设置与 Provider 管理
│   └── voice-input/     语音输入
├── lib/               Prompt 组装、评估、Provider 解析、Tauri 桥接
├── services/          本地配置与数据可移植服务
├── store/             Zustand 全局状态
├── types/             共享 TypeScript 领域类型
└── utils/             通用工具与敏感信息处理

src-tauri/
├── db/schema.sql      SQLite 完整结构快照
├── migrations/        版本化数据库迁移脚本（0001–0007）
├── src/lib.rs         Tauri Commands、SQLite 操作、Provider 调用
└── tauri.conf.json    桌面窗口配置
```

---

## 路线图

| 版本 | 状态 | 主要内容 |
|---|---|---|
| v0.1–v0.9 | ✅ 已完成 | MVP 到隐私安全、模板库全量功能 |
| v1.0 | 🚧 进行中 | Windows 安装包、应用图标、发布元数据、数据目录文档 |
| v1.1+ | 📋 计划中 | 数据导入导出、分析仪表盘、macOS 支持 |

---

## 参与贡献

欢迎提交 Issue 和 Pull Request。开始之前请先阅读 [AGENT.md](AGENT.md) 了解工程约定，并在本地运行：

```bash
npm run check
```

确保所有测试和构建通过后再提交。

---

## 相关文档

| 文档 | 说明 |
|---|---|
| [CHANGELOG.md](CHANGELOG.md) | 每阶段详细变更记录 |
| [ROADMAP.md](ROADMAP.md) | 产品路线图 |
| [TODO.md](TODO.md) | 当前工程任务清单 |
| [AGENT.md](AGENT.md) | 工程约定与 AI 辅助开发说明 |
| [implementation_plan.md](implementation_plan.md) | 分阶段实施计划与验收记录 |

---

<div align="center">

Made with ❤️ using Tauri · React · Rust

</div>

<!-- ai-positioning:start -->
## AI / Agent / 大模型定位

- **AI 应用**：面向重度 AI 用户的本地优先桌面应用，提供 Prompt 编写、诊断、优化、模板、版本和 A/B 测试。
- **Agent**：优化 Agent 按任务类型识别问题、补齐上下文并生成可比较版本，用户始终保留最终确认权。
- **大模型（LLM）**：通过 OpenAI-compatible 接口兼容 DeepSeek、OpenAI 与 Ollama；密钥与历史数据默认本地保存。

> 本节用于说明项目与 AI 的真实关系：已实现能力按现状描述，规划能力明确标注为“后续/尚未实现”。
<!-- ai-positioning:end -->
