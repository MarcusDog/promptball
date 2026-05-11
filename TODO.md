# PromptBall TODO

## Immediate Stage 1

- [x] Verify README/source Chinese text is valid UTF-8.
- [x] Add `npm run typecheck`, `npm run test:run`, and `npm run check`.
- [x] Introduce `src-tauri/migrations/` and `schema_migrations`.
- [x] Split `src/types/index.ts` into feature type files.
- [x] Add unified `AppError` model and user-facing error helpers.
- [x] Add frontend logger.
- [x] Add local config service boundaries.
- [x] Add sensitive info detection tests and implementation.
- [x] Add model config save/load tests.
- [x] Add data export/import conflict tests.

## Stage 1 Follow-up

- [ ] Add backend logging wrapper around Tauri commands.
- [ ] Replace direct provider settings writes with the model config service.
- [ ] Add migration `0002` to normalize legacy MVP tables with `updated_at` where safe.
- [x] Install Visual Studio C++ Build Tools and Windows SDK.
- [x] Re-run `cargo check` through the MSVC developer environment.

## Stage 2

- [x] Persist floating ball position.
- [x] Add edge snapping.
- [x] Add tray plugin and tray menu.
- [x] Add startup setting.
- [x] Add clipboard optimization shortcut.
- [x] Add prompt library shortcut.
- [x] Add floating ball status states.
- [ ] Verify native tray behavior on a machine with MSVC linker available.
- [ ] Replace startup preference placeholder with OS autostart plugin in packaging phase.

## Stage 3

- [ ] Extract `PromptEditor`.
- [x] Add Markdown editing.
- [x] Add token estimate.
- [x] Add draft autosave.
- [x] Add Goal, Constraints, Negative structured fields.
- [x] Add before/after comparison.
- [x] Add paste clipboard, clear, copy, and copy optimized-result actions.
- [ ] Extract `StructuredPromptBuilder` after Stage 4 optimizer result model stabilizes.

## Stage 4

- [x] Add system prompt files for optimizer, diagnosis, coach, evaluator, A/B judge, voice cleaner.
- [x] Add optimizer JSON parser with retry and fallback.
- [x] Add rich optimization result model and UI.
- [ ] Wire Rust provider to shared system prompt files after backend module split.
- [ ] Add evaluator-specific JSON parser when Stage 6 effect evaluation is implemented.

## Stage 5

- [x] Expand favorite prompt type fields for tags, description, preferred model, version, success rate, favorite/default flags, and last-used time.
- [x] Add 11 built-in Slash command prompts.
- [x] Add tests for default prompt merging, Slash ranking, prompt sorting, variable replacement, and default selection.
- [x] Update favorite prompt card UI with search, metadata, metrics, and default setting.
- [x] Update Slash command menu and variable fill panel copy.
- [x] Add SQLite migration for favorite prompt v1 metadata.
- [x] Track favorite prompt `last_used_at` when prompt runs are created.
- [ ] Move Slash command UI into `features/slash-command` once Stage 6 evaluation panels are split.
- [ ] Persist built-in prompt usage counts natively instead of relying on run-derived metrics.
- [x] Verify Tauri migration and favorite commands compile after MSVC linker is available.

## Stage 6

- [x] Add evaluator JSON result types and parser.
- [x] Add final-score explanation helpers.
- [x] Add recent performance metrics and degradation alerts.
- [x] Update feedback panel and prompt detail page with explainable scores.

## Stage 7

- [x] Add A/B metadata fields: model, reason, task type, and blind mode.
- [x] Add SQLite migration for A/B metadata.
- [x] Update Tauri and local fallback persistence for A/B metadata.
- [x] Add tested same-material A/B prompt input assembly.
- [x] Rework A/B UI for blind evaluation, task type, and reason capture.
- [x] Add generated Tauri app icons required for native Windows resource generation.
- [x] Verify `npm run check`.
- [x] Verify `cargo check` through the MSVC developer environment.

## Stage 8

- [x] Add tested prompt version diff helper.
- [x] Add version-level performance metrics.
- [x] Add new-version creation UI in Prompt detail.
- [x] Add save-as-default flow for new versions.
- [x] Add rollback/set-default flow for historical versions.
- [x] Sync favorite prompt content, default version id, and version number on version changes.
- [x] Add SQLite migration for prompt version management metadata and indexes.
- [x] Verify `npm run check`.
- [x] Verify `cargo check` through the MSVC developer environment.

## Stage 9

- [x] Add tested voice settings defaults.
- [x] Add tested oral transcript cleanup.
- [x] Add tested transcript-to-structured-fields helper.
- [x] Add tested privacy-preserving voice record creation.
- [x] Replace voice placeholder with recording/transcript UI.
- [x] Add voice privacy settings.
- [x] Add `voice_records` migration and schema snapshot.
- [x] Add Tauri voice record commands.
- [x] Verify `npm run check`.
- [x] Verify `cargo check` through the MSVC developer environment.

## Stage 10

- [x] Add v1 model provider types.
- [x] Add tested provider normalization and redaction.
- [x] Add default DeepSeek provider.
- [x] Add Ollama-compatible local provider defaults.
- [x] Add tested task-type provider routing.
- [x] Add provider CRUD bridge APIs.
- [x] Add provider management UI in settings.
- [x] Add task model binding UI.
- [x] Add `model_providers`, `task_model_bindings`, and `model_call_logs` migration.
- [x] Add Tauri provider commands.
- [x] Route optimizer calls through the active default provider.
- [x] Add model call logging for optimizer calls.
- [x] Verify `npm run check`.
- [x] Verify `cargo check` through the MSVC developer environment.

## Stage 11

- [x] Add privacy settings defaults and normalization.
- [x] Add privacy persistence helpers and tests.
- [x] Extend sensitive information detection with ID card detection.
- [x] Add privacy-safe export redaction.
- [x] Add Settings privacy switches.
- [x] Add local data clearing actions for history, prompt runs, feedback/eval scores, voice records, and model call logs.
- [x] Warn before model calls when sensitive content is detected.
- [x] Disable prompt history, prompt runs, voice records, and model call logs while privacy mode is enabled.
- [x] Verify `npm run check`.
- [x] Verify `cargo check` through the MSVC developer environment.

## Stage 12

- [x] Expand prompt template type fields for scenario, applicable models, variables, output example, evaluation criteria, and tags.
- [x] Add at least 20 complete built-in templates.
- [x] Cover all 12 required template categories.
- [x] Add tested template search with pinyin hints.
- [x] Add tested template-to-favorite conversion.
- [x] Add legacy custom template normalization.
- [x] Rework Template Library UI with search, rich cards, use/copy/favorite actions, and custom template creation.
- [x] Add SQLite migration for prompt template v1 fields.
- [x] Verify `npm run check`.
- [x] Verify `cargo check` through the MSVC developer environment.

## Later

- [ ] Voice recording and transcription.
- [ ] Data import/export.
- [ ] Dashboard.
- [ ] Windows packaging.
