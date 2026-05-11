# Changelog

## Unreleased

### Stage 1 Engineering

- Added `typecheck`, `test:run`, and `check` npm scripts.
- Added frontend `AppError` classes and a small namespaced logger.
- Added model provider configuration normalization, validation, and API key redaction helpers.
- Added sensitive information detection and redaction utilities.
- Added versioned JSON export bundle and import conflict resolution helpers.
- Added SQLite migration directory with `0001_initial.sql` and a `schema_migrations` runner in Tauri startup.
- Split shared TypeScript types into prompt, provider, and evaluation domain files while preserving the `@/types` entrypoint.
- Added `.editorconfig` to lock UTF-8 source editing.
- Expanded tests from 12 to 25 total tests.

### Stage 2 Desktop Entry

- Added floating ball preferences for visibility, always-on-top, edge snapping, startup preference, theme, and persisted window position.
- Added tested floating window snap logic and status labels.
- Added floating ball status states for idle, editing, optimizing, success, and error.
- Added a drag handle and right-click menu to the floating ball.
- Added shortcuts for `Alt+Space`, `Ctrl+Shift+P`, and `Ctrl+Shift+L`.
- Added Tauri tray menu wiring for workspace, clipboard optimization, history, prompt library, settings, and quit.
- Added close-request handling so the main window hides instead of exiting.

### Stage 3 Prompt Editor

- Expanded structured role mode with Goal, Constraints, and Negative fields.
- Added prompt editor helpers for structured-field normalization, draft snapshots, token/word/character estimates, and variable placeholder detection.
- Added autosaved prompt drafts with restore-on-open behavior.
- Added paste clipboard, clear, copy, and copy-optimized-result actions in the workspace.
- Added Markdown-capable free input hints, variable placeholder display, and before/after prompt comparison.
- Expanded tests from 28 to 32 total tests.

### Stage 4 Prompt Optimizer

- Added built-in system prompt files for optimizer, diagnosis, coach, evaluator, A/B judge, and voice cleaner.
- Expanded optimizer result contract with task recognition, missing information, and parse status.
- Added provider response parsing with JSON fence stripping, invalid JSON fallback, and one retry helper.
- Updated local optimizer fallback to produce the full v1 result shape.
- Expanded workspace results with task recognition, missing information, training suggestions, parse status, and A/B entry.
- Expanded tests from 32 to 36 total tests.

### Stage 5 Favorite Prompts And Slash Commands

- Expanded favorite prompt metadata with tags, description, preferred model, version, success rate, favorite/default flags, built-in marker, and last-used time.
- Added 11 built-in Slash command prompts for common optimization, academic writing, thesis figures, Codex development/fixes, UI design, product work, image prompts, literature analysis, code explanation, and debugging.
- Added prompt normalization, default prompt merging, slash ranking, card sorting, and single-default selection helpers with tests.
- Updated favorite prompt UI with search, tags, description, preferred model, variable preview, default setting, and clearer metrics.
- Updated Slash command menu, variable fill panel, feedback panel, prompt detail page, and workspace copy for daily-use v1 flows.
- Added SQLite migration `0002_favorite_prompt_v1_fields.sql` and updated Tauri favorite prompt commands for the new metadata and last-used tracking.
- Expanded tests from 36 to 41 total tests.

### Stage 6 Prompt Effect Evaluation

- Added AI evaluator result types and parser for the required JSON shape.
- Added evaluator parse fallback and one retry path for invalid JSON.
- Added explainable final score output for structure, output quality, user satisfaction, and real usage weights.
- Expanded favorite prompt metrics with recent average score, score trend, problem tag counts, and degradation alerts.
- Updated prompt feedback to preview final score before submission.
- Updated prompt detail to show score explanations, recent performance, common problem tags, and version-improvement reminders.
- Expanded tests from 41 to 46 total tests.

### Stage 7 A/B Testing

- Expanded A/B test records with model, task type, blind mode, and user reason metadata.
- Added SQLite migration `0003_prompt_ab_test_v1_fields.sql` and updated the schema snapshot.
- Updated Tauri A/B commands and local fallback storage for the new metadata.
- Added same-material A/B prompt assembly with test coverage.
- Reworked the A/B test panel with blind evaluation labels, task type input, comparison reason, same-model parallel calls, and clearer winner recording.
- Added generated Tauri app icons required by Windows resource generation.
- Installed and verified Visual Studio 2022 Build Tools with the C++ workload and Windows SDK for local Tauri checks.
- Expanded tests from 46 to 47 total tests.

### Stage 8 Prompt Version Management

- Added prompt version diff helpers with tests for added lines, removed lines, unchanged lines, changed-line count, and length delta.
- Added version-level performance metrics with tests.
- Reworked Prompt detail version history to show version metrics and real diff summaries.
- Added a new-version editor in Prompt detail with save-only and save-as-default flows.
- Updated frontend and Tauri default-version flows so restored versions update prompt content, default version id, and version number consistently.
- Added SQLite migration `0004_prompt_version_management.sql` for version `updated_at` metadata and run-by-version indexing.
- Expanded tests from 47 to 49 total tests.

### Stage 9 Voice Input

- Added a tested voice input module for default settings, transcript cleanup, structured prompt extraction, and privacy-preserving voice record creation.
- Added a real voice input workspace panel with start/stop recording, WebView speech recognition when available, manual transcript editing, cleanup, and one-click structuring into role mode.
- Added voice privacy settings for transcription mode, saving audio, and saving transcript text.
- Added SQLite migration `0005_voice_input.sql` and Tauri commands for voice record persistence.
- Rewrote the workspace component to remove legacy corrupted strings while preserving existing workspace flows.
- Expanded tests from 49 to 53 total tests.

### Stage 10 Multi-Model Management

- Added v1 model provider types for DeepSeek, OpenAI-compatible providers, and Ollama-compatible local models.
- Added tested provider normalization, default DeepSeek provider, task-type routing, enabled-provider fallback, and redaction behavior.
- Added frontend bridge APIs for provider CRUD, default-provider selection, provider testing, task bindings, and model call logs.
- Added model provider management UI in Settings.
- Added SQLite migration `0006_model_providers.sql` for `model_providers`, `task_model_bindings`, and `model_call_logs`.
- Added Tauri commands for provider management, real `/chat/completions` provider testing, and task binding persistence.
- Updated optimizer calls to use the active default provider, falling back to legacy DeepSeek settings if no v1 provider exists.
- Added model call logging for optimizer success and failure paths.
- Expanded tests from 53 to 56 total tests.

### Stage 11 Privacy And Security

- Added privacy settings for privacy mode, history persistence, model call log persistence, model-call warning, export redaction, and local encryption readiness.
- Added tested privacy helpers for persistence decisions, export redaction, and local data clearing plans.
- Expanded sensitive information detection with Chinese ID card detection.
- Added privacy-safe export bundle generation that redacts favorite prompts, prompt runs, prompt versions, feedback notes, and A/B test records.
- Added Settings privacy controls and a local data clearing action for history, prompt runs, feedback/eval scores, voice records, and model call logs.
- Updated workspace optimization to warn before sending sensitive content to the configured model provider.
- Updated privacy mode behavior so prompt history, prompt runs, feedback entry setup, voice records, and model call logs are not persisted.
- Added Tauri commands for clearing prompt history, prompt run data, voice records, and model call logs.
- Expanded tests from 56 to 61 total tests.

### Stage 12 Template Library

- Expanded `PromptTemplate` with scenario, applicable models, variables, output example, evaluation criteria, tags, and updated time.
- Added 22 complete built-in templates across 12 v1 categories: general, academic, thesis figures, Codex development, Codex fixes, UI design, product management, image generation, literature analysis, code explanation, debugging, and data analysis.
- Added tested template search with category filtering and pinyin hints.
- Added tested template-to-favorite conversion so templates can be saved as Slash-callable favorite prompts.
- Added legacy custom template normalization for older locally saved templates.
- Reworked the Template Library UI with search, categories, template variables, model fit, evaluation criteria, output examples, use/copy/favorite actions, and richer custom template creation.
- Added SQLite migration `0007_prompt_templates_v1_fields.sql` and updated Tauri template list/save commands for v1 fields.
- Expanded tests from 61 to 65 total tests.

### Planning

- Added v1.0 implementation plan and staged roadmap.
- Added agent guide and TODO tracking.
- Documented current test/build/native baseline.

### Current Baseline

- `npm run check` passes with 14 test files and 56 tests.
- Frontend production build passes with `npm run build`.
- Tauri Rust check passes through the Visual Studio Build Tools developer environment.

## 0.1.0 MVP

### Added

- Tauri 2 + React + TypeScript project scaffold.
- Floating PromptBall shell.
- Prompt workspace with free, role, and voice placeholder modes.
- Local heuristic prompt scoring.
- DeepSeek/OpenAI-compatible settings and provider call path.
- History, templates, favorite prompts, Slash commands, feedback, A/B testing, and prompt version prototype.
- SQLite schema for MVP and prompt evaluation prototype.
