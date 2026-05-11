# PromptBall v1.0 Implementation Plan

## Stage 12 Execution Update - 2026-05-07

- Expanded template types with scenario, applicable models, variables, output example, evaluation criteria, tags, and updated time.
- Added 22 complete built-in templates across all 12 required categories.
- Added tested template search with category filtering and pinyin hints.
- Added tested template-to-favorite conversion so built-in and custom templates can become Slash-callable favorite prompts.
- Added legacy custom template normalization for older locally saved templates.
- Reworked Template Library UI with search, category navigation, rich prompt cards, variable chips, model fit, evaluation criteria, output examples, use/copy/favorite actions, and richer custom template creation.
- Added SQLite migration `0007_prompt_templates_v1_fields.sql` and updated the schema snapshot.
- Updated Tauri template list/save commands for the v1 template fields.
- Verification: `npm run check` passes with 16 test files and 65 tests; production frontend build passes.
- Native verification: `cargo check --manifest-path src-tauri/Cargo.toml` passes through the MSVC developer environment.

## Stage 11 Execution Update - 2026-05-07

- Added `PrivacySettings` to app preferences with defaults for privacy mode, history persistence, model-call-log persistence, model-call warning, export redaction, and local encryption readiness.
- Added tested privacy service helpers for normalization, persistence decisions, export sanitization, and local data clearing plans.
- Expanded sensitive information detection to include Chinese ID card numbers in addition to API keys, GitHub tokens, tokens, passwords, emails, phone numbers, database URLs, and private paths.
- Added privacy-safe export bundle generation so exported prompt assets can be redacted without mutating the source data.
- Reworked Settings text and controls for desktop preferences, voice privacy, privacy mode, history/log persistence, sensitive-call warning, export redaction, and local data clearing.
- Added frontend bridge and Tauri commands to clear prompt history, prompt runs, prompt feedback/eval scores, voice records, and model call logs.
- Updated workspace optimization to warn when sensitive content is detected before sending a prompt to the configured model provider.
- Updated persistence behavior so privacy mode prevents prompt history, prompt runs, feedback entry setup, voice records, and model call logs from being saved.
- Updated Rust model call logging to respect stored privacy preferences.
- Verification: `npm run check` passes with 15 test files and 61 tests; production frontend build passes.
- Native verification: `cargo check --manifest-path src-tauri/Cargo.toml` passes through the MSVC developer environment.

## Stage 1 Execution Update - 2026-05-06

- Added npm scripts: `typecheck`, `test:run`, and `check`.
- Added tested frontend foundations: split shared TypeScript domain types, `AppError`, user-facing error messages, namespaced logger, provider settings normalization/validation/redaction, sensitive information detection/redaction, and data export/import conflict handling.
- Added SQLite migration management under `src-tauri/migrations/` with `0001_initial.sql` and a Tauri `schema_migrations` runner.
- Added `.editorconfig` with UTF-8 source editing rules.
- Verified README/plan Chinese text reads correctly as UTF-8 via Node; visible mojibake is PowerShell output encoding, not file corruption.
- Verification: `npm run check` passes with 10 test files and 25 tests.
- Remaining blocker: `cargo check --manifest-path src-tauri/Cargo.toml` still fails before app code verification because Windows resolves `link.exe` to `D:\git\Git\usr\bin\link.exe`; install Visual Studio C++ Build Tools with Windows SDK or run from a proper MSVC developer shell.

## Stage 2 Execution Update - 2026-05-06

- Added app preferences for floating ball visibility, always-on-top, edge snapping, startup preference, theme, and persisted window position.
- Added tested snap-to-edge logic and floating ball status labels.
- Added UI drag handle, floating status dot, and right-click quick menu.
- Added shortcut flows: `Alt+Space` toggles the workspace, `Ctrl+Shift+P` reads clipboard text and optimizes it, and `Ctrl+Shift+L` opens the Prompt library.
- Added Tauri tray menu wiring and close-request interception so the window hides instead of exiting.
- Verification: `npm run check` passes with 11 test files and 28 tests; Vite dev server starts.
- Native Tauri verification remains blocked by the same local linker issue before application code is checked. `cargo fmt --check` is available after installing rustfmt, but the existing Rust file is not rustfmt-formatted and would require a broad unrelated formatting change.

## Stage 3 Execution Update - 2026-05-06

- Expanded `StructuredPromptFields` with `goal`, `constraints`, and `negative`.
- Updated structured prompt assembly order to Role, Context, Goal, Task, Input, Output, Requirements, Constraints, Evaluation, Steps, Negative.
- Added `features/prompt-editor` helpers for empty-field defaults, field normalization, prompt statistics, draft snapshots, and `{{variable}}` detection.
- Added workspace draft autosave and restore, token/word/character stats, variable placeholder preview, paste clipboard, clear, copy, and copy optimized result actions.
- Reworked workspace result area into original/optimized side-by-side comparison while preserving optimization, history save, favorite prompt, Slash command, and feedback run flows.
- Verification: `npm run check` passes with 12 test files and 32 tests; Vite dev server starts.

## Stage 4 Execution Update - 2026-05-06

- Added required system prompt files under `src/features/prompt-optimizer/system-prompts/`: optimizer, diagnosis, coach, evaluator, A/B judge, and voice cleaner.
- Expanded `OptimizerResult` with `taskRecognition`, `missingInformation`, and `parseStatus`.
- Replaced provider parsing with a safer parser that strips JSON fences, returns structured fallback output on invalid JSON, and supports one retry through `parseOptimizerResponseWithRetry`.
- Updated local optimizer fallback and history restore to the full v1 result shape.
- Updated workspace result UI to show task recognition, missing information, training suggestions, parse status, and an A/B entry action.
- Verification: `npm run check` passes with 13 test files and 36 tests; Vite dev server starts.
- Remaining backend note: the Rust provider still contains its own hardcoded prompt because backend module splitting is not yet part of this stage and native verification is blocked by the local linker setup.

## Stage 5 Execution Update - 2026-05-06

- Expanded `FavoritePrompt` with v1 asset fields: `tags`, `description`, `preferredModel`, `version`, `successRate`, `isFavorite`, `isDefault`, `isBuiltin`, and `lastUsedAt`.
- Added 11 built-in Slash command prompts: `/通用优化`, `/学术润色`, `/论文作图`, `/codex开发`, `/codex修复`, `/ui设计`, `/产品经理`, `/图片生成`, `/文献分析`, `/代码解释`, and `/错误排查`.
- Added tested favorite prompt normalization, default prompt merging, Slash ranking, prompt-card sorting, variable replacement, and single-default selection logic.
- Updated the favorite prompt panel with search, tags, description, preferred model, variable preview, built-in prompt cards, direct-use metrics, and a default prompt action for user-saved prompts.
- Cleaned the workspace, Slash command menu, variable fill panel, prompt detail page, and feedback panel text for v1 daily-use flows.
- Added SQLite migration `0002_favorite_prompt_v1_fields.sql` and updated the schema snapshot for favorite prompt metadata, prompt defaults, and last-used tracking.
- Updated Tauri commands to read/write the new favorite prompt fields, track `last_used_at`, and set a default favorite prompt.
- Verification: `npm run check` passes with 13 test files and 41 tests; production frontend build passes.
- Remaining native blocker: `cargo check --manifest-path src-tauri/Cargo.toml` still fails before application Rust code because Windows resolves `link.exe` to Git's Unix-style linker instead of MSVC. Install Visual Studio C++ Build Tools + Windows SDK or run from an MSVC Developer PowerShell before native verification.

## Stage 6 Execution Update - 2026-05-06

- Added evaluator result types for AI JSON output: structure score, output quality, task fit, format, constraints, risk, final score, strengths, weaknesses, suggestions, and problem tags.
- Added evaluator JSON parsing that strips Markdown fences, validates arrays/tags, clamps scores, retries once through `parseEvaluatorResponseWithRetry`, and falls back to text when JSON is invalid.
- Added explainable final score text for the required formula: structure 0.2, output quality 0.35, user satisfaction 0.25, and real usage 0.2.
- Expanded favorite prompt metrics with recent 10-run average, score trend, problem-tag counts, and high-frequency issue detection.
- Added performance alert logic for v2 suggestions when recent scores are below 70, discarded rate is above 40%, three recent ratings are below 3, or a problem tag appears at least three times.
- Updated feedback panel to show live structure/output/satisfaction/usage score parts and final score before submit.
- Updated prompt detail page to show trend, recent average, score explanations, common problem tags, and optimization reminders.
- Verification: `npm run check` passes with 13 test files and 46 tests; production frontend build passes.
- Remaining native blocker: `cargo check --manifest-path src-tauri/Cargo.toml` is still blocked by the local Windows linker setup before application Rust code is checked.

## Stage 7 Execution Update - 2026-05-06

- Installed and configured Visual Studio 2022 Build Tools with the C++ workload and Windows SDK through `winget`, resolving the previous MSVC linker blocker.
- Added generated PromptBall application icons under `src-tauri/icons/` so Tauri Windows resource generation can complete.
- Expanded A/B test records with `model`, `reason`, `taskType`, and `blindMode`.
- Added SQLite migration `0003_prompt_ab_test_v1_fields.sql` and updated the schema snapshot for the new A/B test metadata.
- Updated Tauri A/B test commands to persist and return the new metadata fields.
- Added tested A/B prompt input assembly so both prompts receive the same test material.
- Reworked the A/B test panel with task type, blind evaluation mode, comparison reason, same-model parallel calls, and blind result labels.
- Verification: `npm run check` passes with 13 test files and 47 tests; production frontend build passes.
- Native verification: `cargo check --manifest-path src-tauri/Cargo.toml` passes when run through `vcvars64.bat`.

## Stage 8 Execution Update - 2026-05-06

- Added tested prompt version diff helpers for added lines, removed lines, unchanged lines, changed-line count, and length delta.
- Added version-level metrics aggregation so each prompt version can show usage count, average rating, average final score, direct-use rate, modified-use rate, discarded rate, and recent runs.
- Reworked Prompt detail version history with real diff summaries instead of length-only hints.
- Added a Prompt detail new-version editor that saves a new version without overwriting old content, with an option to immediately set it as the default version.
- Updated default-version rollback/set-default behavior to refresh favorite prompts and prompt versions after changes.
- Updated Tauri version commands so `favorite_prompts.version`, `default_version_id`, and `content` stay consistent when a new default version is created or an old version is restored.
- Added migration `0004_prompt_version_management.sql` for `prompt_versions.updated_at` and a version-run index.
- Verification: `npm run check` passes with 13 test files and 49 tests; production frontend build passes.
- Native verification: `cargo check --manifest-path src-tauri/Cargo.toml` passes through the MSVC developer environment.

## Stage 9 Execution Update - 2026-05-06

- Added a dedicated voice-input feature module with tested default settings, transcript cleanup, structured-field extraction, and privacy-preserving voice record creation.
- Added voice preferences under app settings: transcription mode, save audio, and save transcript. Defaults preserve privacy by not saving audio or transcript text.
- Replaced the old voice placeholder in the workspace with a real voice input panel: start/stop recording, WebView speech recognition when available, manual transcript editing, oral-text cleanup, and one-click structuring into role mode.
- Added local/Tauri voice record persistence that only stores data when the user has enabled saving in settings.
- Added SQLite migration `0005_voice_input.sql` and schema snapshot updates for `voice_records`.
- Added Tauri commands `list_voice_records` and `save_voice_record`.
- Rewrote `PromptWorkspace.tsx` to remove legacy corrupted strings and keep the workspace compile-safe while preserving free, role, Slash, optimize, score, copy, favorite, save, and A/B flows.
- Verification: `npm run check` passes with 14 test files and 53 tests; production frontend build passes.
- Native verification: `cargo check --manifest-path src-tauri/Cargo.toml` passes through the MSVC developer environment.

## Stage 10 Execution Update - 2026-05-06

- Added v1 multi-model provider types for DeepSeek, OpenAI-compatible providers, and Ollama-compatible local models.
- Added tested model-provider normalization, default DeepSeek provider, task-type bindings, enabled-provider routing, and API key redaction behavior.
- Added frontend bridge functions for listing/saving/deleting providers, setting a default provider, testing provider configuration, managing task bindings, and reading model call logs.
- Added Settings page provider management UI with provider form, provider list, default-provider action, test action, and task-type binding controls.
- Added SQLite migration `0006_model_providers.sql` for `model_providers`, `task_model_bindings`, and `model_call_logs`.
- Added Tauri commands for provider CRUD, real `/chat/completions` provider connection testing, task binding persistence, and model call log listing.
- Updated optimizer calls to use the active enabled default model provider, falling back to the legacy DeepSeek settings when no v1 provider is configured.
- Added model call logging for optimizer success and failure paths with duration and approximate token counts.
- Verification: `npm run check` passes with 14 test files and 56 tests; production frontend build passes.
- Native verification: `cargo check --manifest-path src-tauri/Cargo.toml` passes through the MSVC developer environment.

更新时间：2026-05-06

## 1. 当前项目状态

PromptBall 当前处于 MVP+ 扩展原型状态，已经具备 React/Vite 前端、Tauri 2 后端骨架、SQLite 表结构、DeepSeek/OpenAI-compatible 调用入口、工作台、历史、模板、收藏 Prompt、Slash 命令、反馈评分、A/B 测试和版本历史的初步实现。

基线验证：

- `npm test -- --run`：通过，5 个测试文件，12 个测试。
- `npm run build`：通过，前端 TypeScript 与 Vite 构建成功。
- `cargo check --manifest-path src-tauri/Cargo.toml`：失败在本机 Windows 链接器环境，当前命中 `D:\git\Git\usr\bin\link.exe`，不是 MSVC linker；需要 Visual Studio C++ Build Tools 和 Windows SDK。

当前主要目录：

```text
src/
  components/
  features/
    favorites/
    history/
    settings/
    templates/
    workspace/
  lib/
  store/
  types/
src-tauri/
  capabilities/
  db/schema.sql
  src/lib.rs
  src/main.rs
```

当前工程还不是 v1.0 结构。后续需要渐进整理为：

```text
src/
  app/
  components/
  features/
    floating-ball/
    prompt-editor/
    prompt-optimizer/
    prompt-library/
    prompt-evaluation/
    slash-command/
    voice-input/
    model-provider/
    settings/
    history/
  hooks/
  lib/
  services/
  store/
  types/
  db/
  utils/
src-tauri/
  src/
  capabilities/
  migrations/
```

## 2. 已完成功能

- Tauri 2 配置、无边框透明窗口、置顶窗口。
- React + TypeScript + Vite 前端。
- Tailwind CSS 和 shadcn/ui 风格本地组件。
- Zustand 全局状态。
- 工作台：自由模式、角色模式、语音占位模式。
- Prompt 结构化拼接和本地启发式 8 维评分。
- DeepSeek/OpenAI-compatible `/chat/completions` 调用入口。
- 设置页：API Key、Base URL、模型名、temperature、max_tokens。
- 历史记录：保存、搜索、收藏、删除、复制。
- 模板库：内置模板和自定义模板基础能力。
- 收藏 Prompt：名称、Slash 命令、分类、模型、变量、备注的基础保存。
- Slash 命令菜单：输入 `/` 弹出、模糊搜索、键盘选择、回车插入。
- 变量填写面板：支持 `{{变量名}}`。
- Prompt run、反馈、综合评分的前端和 SQLite 表雏形。
- Prompt 详情页：使用次数、平均分、使用率、版本、反馈、A/B 数据雏形。
- A/B 测试：选择两个收藏 Prompt、生成结果、记录胜负。
- 基础测试：prompt 拼接、评分、provider parse、Slash、变量、A/B、版本、综合评分、指标汇总。

## 3. 未完成功能

- 目录结构尚未按 v1.0 模块拆分。
- 缺少统一错误类型、Result 包装、用户可读错误提示和日志系统。
- 缺少数据库 migration 管理；当前是单个 `schema.sql` 在启动时执行。
- 旧表缺少统一 `id / created_at / updated_at` 规范。
- Tauri 后端命令大量使用 `serde_json::Value`，类型边界弱。
- API Key 目前保存到 SQLite settings，尚未接入系统安全存储或加密预留。
- 多模型 provider 管理未实现，只有单个 DeepSeek 设置。
- 系统托盘、开机自启、剪贴板快捷优化、持久化悬浮球位置未实现。
- Prompt 编辑器缺少 Markdown 编辑、token 估算、草稿自动保存、剪贴板粘贴、左右对比完善。
- 内置系统 prompts 尚未拆到 `src/features/prompt-optimizer/system-prompts/`。
- AI evaluator JSON parse、重试和降级未实现。
- 敏感信息检测、隐私模式、清除数据、导出脱敏未实现。
- 语音录音、转写、隐私清理未实现。
- 数据导入导出、Dashboard、统计分析未实现。
- 打包、图标、发布 checklist、自动更新预留未完成。
- README 和部分源码中文文本在 PowerShell 输出中出现乱码，需要确认文件编码和 UI 实际渲染。

## 4. 代码风险点

- `src/types/index.ts` 已经变成大而全的类型文件，继续扩展会难以维护。
- `src/lib/tauri.ts` 同时承担 Tauri API、localStorage fallback、部分业务创建逻辑，职责过重。
- `src-tauri/src/lib.rs` 聚合数据库、模型调用、窗口、所有命令，后续必须拆分。
- 部分后端命令使用 `Value` 输入输出，编译期无法保证字段完整。
- UI 组件中仍有业务逻辑，例如 run 创建、反馈触发、收藏创建。
- 单一 Zustand store 已开始膨胀，后续应分 slice 或按 feature service 管理。
- 缺少统一 async error boundary 和 toast 错误策略。
- 当前浏览器 fallback 会用本地启发式结果替代真实模型调用，可能掩盖 provider 错误。

## 5. 数据库风险点

- 当前没有 migration 版本表，不能安全升级用户已有数据。
- `schema.sql` 直接 `CREATE TABLE IF NOT EXISTS`，无法处理字段变更、索引变更、数据迁移。
- `settings`、`templates`、`prompt_history` 等旧表不满足每表都有 `id / created_at / updated_at`。
- API Key 明文存 SQLite；v1.0 至少要抽象 secret storage，后续可接 OS keychain。
- JSON 字段较多，缺少 schema version 和兼容策略。
- A/B、feedback、eval score、run、version 的外键和统计更新需要事务化。
- localStorage fallback 和 SQLite 结构可能产生行为差异，需要统一 repository 层。

## 6. UI 风险点

- 当前主界面仍是单窗口多 panel，复杂功能继续堆叠会拥挤。
- Slash 命令和变量面板可用，但尚未形成可复用 prompt editor 组件。
- Prompt 详情页缺少真正趋势图、版本 diff、版本级独立指标。
- 反馈面板轻量，但没有“稍后提醒/不再提示/批量补评”策略。
- 设置页仅 DeepSeek 单模型配置，未支持多 provider、隐私、安全、语音和快捷键。
- 悬浮球与主面板在一个 React shell 中，真实桌面交互如贴边吸附、托盘、关闭行为还未完整。
- 中文文案可能存在编码/显示风险，阶段 1 必须核验。

## 7. 模型调用风险点

- 仅支持单个 OpenAI-compatible provider 配置。
- 后端要求模型输出 JSON，但缺少 parse 失败重试和文本降级。
- `response_format` 不是所有 OpenAI-compatible 模型都支持。
- 没有请求超时、取消、重试、速率限制、调用日志和耗时统计。
- 没有 streaming 支持。
- 没有任务类型到模型的路由。
- Prompt optimizer、diagnosis、coach、evaluator、A/B judge、voice cleaner 未拆分。
- 调用模型前没有敏感信息提示和隐私模式拦截。

## 8. 分阶段开发计划

### 阶段 1：基础工程完善

目标：建立 v1.0 可维护底座，不改变现有功能行为。

任务：

- 建立目标目录骨架，但采用渐进迁移，不一次性移动全部文件。
- 拆分类型：`types/prompt.ts`、`types/provider.ts`、`types/evaluation.ts`、`types/settings.ts`、`types/db.ts`。
- 新增统一错误模型：`AppError`、`ProviderError`、`DatabaseError`、`ValidationError`。
- 新增前端日志工具和 Tauri 后端日志封装。
- 新增本地配置 service，区分 public settings、secret settings、runtime preferences。
- 建立 migration 目录：`src-tauri/migrations/0001_initial.sql` 等。
- 建立迁移执行器和 `schema_migrations` 表。
- 增加测试覆盖：模型配置保存、敏感信息检测、导入导出核心逻辑。
- 增加构建脚本：`check`、`typecheck`、`test:run`。
- 修复 README/源码中文编码显示风险。

验收标准：

- `npm install` 后可运行。
- `npm run dev` 可启动前端。
- `npm run build` 通过。
- `npm test -- --run` 通过。
- Tauri 代码在具备 MSVC/Windows SDK 的机器上可 `cargo check`。
- 不硬编码 API Key。
- 不引入明显 `any` 滥用。
- MVP 原有工作台、历史、模板、收藏、Slash、反馈流程不回退。

### 阶段 2：悬浮小球完整化

目标：让悬浮球成为真实桌面入口。

任务：

- 抽出 `features/floating-ball`。
- 持久化小球位置和贴边状态。
- 实现拖拽、贴边吸附、置顶开关。
- 加入 Tauri system tray 插件。
- 加入开机自启插件配置预留。
- 右键菜单：打开工作台、快速优化剪贴板、查看历史、设置、退出。
- 快捷键：`Alt+Space`、`Ctrl+Shift+P`、`Ctrl+Shift+L`。
- 小球状态：idle、editing、optimizing、success、error。
- 设置中支持关闭悬浮球，仅保留托盘。

验收标准：

- 小球拖动后位置重启不丢失。
- 托盘菜单可用。
- 快捷键可用。
- 主窗口关闭后应用仍可从托盘恢复。
- 设置开关生效。

### 阶段 3：Prompt 编辑器完整化

目标：形成专业 Prompt editor。

任务：

- 抽出 `PromptEditor`、`StructuredPromptBuilder`、`OptimizationResult`。
- 结构化字段补齐 Goal、Constraints、Negative。
- 增加 Markdown 编辑、字数统计、token 估算。
- 草稿自动保存和输入历史恢复。
- 一键清空、复制、粘贴剪贴板。
- 优化前后左右对比。
- 变量占位符识别和预览。

验收标准：

- 自由输入、结构化输入、语音入口都可进入同一优化流程。
- 结构化字段拼接稳定、有测试。
- 用户可复制原始、优化后和任意版本。

### 阶段 4：内置 Prompt 优化器完整化

目标：实现诊断 + 优化 + 训练。

任务：

- 创建 `src/features/prompt-optimizer/system-prompts/`。
- 新增 optimizer、diagnosis、coach、evaluator、ab-test-judge、voice-cleaner prompts。
- 统一 optimizer 输出 schema。
- 增加 JSON parse、重试一次、文本降级。
- 优化结果页显示任务识别、诊断、优化 Prompt、可补充信息、训练建议。

验收标准：

- 优化结果不是单纯改写。
- 必有诊断、评分、训练建议。
- 支持收藏、复制、重新优化、进入 A/B。

### 阶段 5：收藏 Prompt 与 Slash 命令系统

目标：形成可长期积累的 Prompt 资产库。

任务：

- 完善 favorite prompt 字段：tags、description、preferredModel、version、successRate、isFavorite、isDefault。
- 内置默认命令 11 个。
- 最近使用排序、收藏排序、评分排序。
- 标签和分类管理。
- 使用次数事务化更新。
- Slash menu 迁到 `features/slash-command`。

验收标准：

- 用户可收藏、命名、分类、设置 slash。
- 输入 `/` 可搜索和插入。
- 变量填写后生成最终 prompt。
- 使用次数自动增加。

### 阶段 6：Prompt 效果评估系统

目标：用户知道哪个 Prompt 真正好用。

任务：

- 四层评价：主观评分、真实使用状态、问题标签、AI 自动评价。
- 扩展问题标签：逻辑不清、输出太长、输出太短、不适合当前模型。
- 分类评价维度：论文、Codex、UI、图片、产品经理。
- 每个 Prompt、每个版本独立统计。
- 评分趋势和最近 10 次均值。
- 卡片排序和详情页趋势图。

验收标准：

- 每次收藏 Prompt 调用后可评分。
- 详情页显示平均分、直接可用率、修改后可用率、废弃率、趋势。
- 综合分解释清楚，不只显示数字。

### 阶段 7：A/B 测试系统

目标：可靠比较两个 Prompt。

任务：

- A/B record 增加 model、reason、taskType。
- 同模型同输入并行调用。
- 支持盲评模式。
- 详情页展示 A/B 历史和胜率。
- 可选 AI judge 辅助比较，但用户选择为最终记录。

验收标准：

- 两个输出并排展示。
- 用户可记录胜负/都可/都不可。
- Prompt 详情页显示胜率。

### 阶段 8：Prompt 版本管理

目标：Prompt 可持续进化。

任务：

- 修改时自动创建 v2/v3，不覆盖旧版本。
- 版本 diff。
- 回滚、设默认。
- 版本级评分和趋势。
- 优化提醒规则：最近 5 次均分低于 70、废弃率高于 40%、连续 3 次低于 3、标签超 3 次。
- 基于历史反馈生成新版本建议。

验收标准：

- 旧版本不丢失。
- 可以查看差异、回滚、设默认。
- 可以按版本查看效果。

### 阶段 9：语音输入完整化

目标：口述想法转成结构化 Prompt。

任务：

- 录音按钮、按住说话、开始/停止。
- 在线转写接口抽象。
- 本地转写预留。
- 转写结果编辑。
- voice-cleaner 口语化清理。
- 隐私提示和录音清理。
- 设置中控制是否保存录音/转写文本。

验收标准：

- 用户可录音、转写、编辑、优化。
- 默认不保存录音文件。

### 阶段 10：多模型管理

目标：支持 DeepSeek、OpenAI-compatible、自定义和 Ollama 预留。

任务：

- 新表 `model_providers`。
- provider CRUD、连接测试、默认模型。
- 任务类型绑定模型。
- stream、timeout、maxTokens、temperature。
- 调用日志、耗时、成本统计。

验收标准：

- 用户可新增、测试、切换 provider。
- API Key 不明文展示。
- 错误提示清晰。

### 阶段 11：隐私与安全

目标：保护论文、代码、商业想法和 API Key。

任务：

- 敏感信息检测：API Key、Token、Password、身份证、手机号、邮箱、DB 连接串、私有路径、GitHub Token。
- 隐私模式：不保存输入、输出、录音、转写。
- 数据清除：历史、日志、模型调用记录。
- 导出脱敏。
- 调用模型前数据发送提示。
- 关闭历史保存。

验收标准：

- 检测敏感信息时提醒。
- 隐私模式真实影响保存逻辑。
- 用户可清除本地数据。

### 阶段 12：模板库完整化

目标：开箱即用的高质量模板库。

任务：

- 新表或迁移 `prompt_templates`。
- 至少 20 个内置模板。
- 模板字段：名称、场景说明、适用模型、变量、完整 prompt、输出示例、评价标准。
- 搜索、收藏、复制、基于模板创建收藏 Prompt。

验收标准：

- 用户可搜索、复制、收藏模板。
- 模板能直接进入工作台。

### 阶段 13：数据导入导出

目标：Prompt 资产可备份迁移。

任务：

- 导出全部 JSON、收藏 Prompt、历史、A/B。
- 导出 Markdown 和单个 `.prompt.md`。
- 导入 JSON。
- 冲突处理：跳过、复制、覆盖需确认。
- 导出脱敏选项。

验收标准：

- 可备份和恢复。
- 导入不默认覆盖已有数据。

### 阶段 14：统计分析 Dashboard

目标：展示 Prompt 能力成长。

任务：

- Dashboard 页面。
- 总使用次数、收藏数量、平均评分、使用率、废弃率。
- 最常用、表现最好、表现下降 Prompt。
- 常见问题标签。
- 每周趋势、模型效果对比、任务类型效果对比。
- 时间范围和任务类型筛选。

验收标准：

- 数据来自真实 runs 和 feedback。
- 图表清晰，筛选有效。

### 阶段 15：打包、更新和发布准备

目标：具备真实发布能力。

任务：

- Windows 打包。
- macOS 打包预留。
- 自动更新预留。
- 应用图标、安装包名称、版本号管理。
- 崩溃日志。
- 用户数据目录说明。
- 构建文档和发布 checklist。

验收标准：

- 可生成 Windows 安装包。
- 可安装运行。
- 卸载不破坏用户数据，除非用户选择清除。
- README 和 CHANGELOG 完整。

## 9. 阶段推进规则

- 每个阶段只做该阶段范围内的最小必要改动。
- 每个阶段开始前先写/更新测试。
- 每个阶段完成必须运行：
  - `npm test -- --run`
  - `npm run build`
  - `cargo check --manifest-path src-tauri/Cargo.toml`，若本机环境仍阻塞，必须记录阻塞原因。
- 不覆盖用户数据。
- 不硬编码 API Key。
- 不把模型调用逻辑写进 UI 组件。
- 不做大规模重写；目录调整必须保证每一步可构建。

## 10. 下一步执行建议

下一步只进入阶段 1：基础工程完善。

优先顺序：

1. 修复文档/源码中文编码风险。
2. 增加 `check`、`typecheck`、`test:run` 脚本。
3. 建立 migration 目录和迁移执行设计。
4. 拆分类型文件，不改业务行为。
5. 增加统一错误和日志工具。
6. 为敏感信息检测、模型配置保存、导入导出纯逻辑先补测试。
