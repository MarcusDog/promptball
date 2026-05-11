# PromptBall MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable Tauri 2 desktop MVP for PromptBall with a floating prompt workbench, DeepSeek-compatible optimization, SQLite persistence, templates, history, and settings.

**Architecture:** The React/Vite frontend owns interaction, mode switching, form state, previews, and Zustand state. Tauri commands own SQLite persistence, settings storage, window placement, and OpenAI-compatible chat completion calls so API keys are not hardcoded or placed in source files.

**Tech Stack:** Tauri 2, React, TypeScript, Tailwind CSS, shadcn-style source components, Zustand, SQLite via rusqlite, reqwest for OpenAI-compatible providers, Vitest for core TypeScript logic.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `components.json`
- Create: `.env.example`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/build.rs`

- [x] **Step 1: Add frontend and Tauri config files**
- [x] **Step 2: Add environment example without hardcoded API keys**

### Task 2: Core Prompt Logic With TDD

**Files:**
- Test: `src/lib/prompt.test.ts`
- Test: `src/lib/scoring.test.ts`
- Test: `src/lib/provider.test.ts`
- Create: `src/types/index.ts`
- Create: `src/lib/prompt.ts`
- Create: `src/lib/scoring.ts`
- Create: `src/lib/provider.ts`

- [ ] **Step 1: Write failing tests for structured prompt assembly, heuristic scoring, and provider response parsing**
- [ ] **Step 2: Run `npm test -- --run` and verify failures are caused by missing implementation**
- [ ] **Step 3: Implement minimal core logic**
- [ ] **Step 4: Run `npm test -- --run` and verify tests pass**

### Task 3: Tauri Backend

**Files:**
- Create: `src-tauri/db/schema.sql`
- Create: `src-tauri/src/main.rs`
- Create: `src-tauri/src/lib.rs`

- [ ] **Step 1: Add SQLite schema for settings, prompt history, and templates**
- [ ] **Step 2: Add Tauri commands for history, templates, settings, provider calls, and right-side docking**
- [ ] **Step 3: Run `cargo check --manifest-path src-tauri/Cargo.toml`**

### Task 4: React App Shell

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`
- Create: `src/store/app-store.ts`
- Create: `src/lib/tauri.ts`
- Create: `src/lib/templates.ts`
- Create: `src/components/ui/*.tsx`

- [ ] **Step 1: Add shadcn-style UI primitives and design tokens**
- [ ] **Step 2: Add Zustand app state and Tauri invoke wrapper with browser fallback**
- [ ] **Step 3: Add floating ball, always-on-top shell, and Alt+Space toggle**

### Task 5: Feature Screens

**Files:**
- Create: `src/features/workspace/PromptWorkspace.tsx`
- Create: `src/features/history/HistoryPanel.tsx`
- Create: `src/features/templates/TemplateLibrary.tsx`
- Create: `src/features/settings/SettingsPanel.tsx`

- [ ] **Step 1: Implement free, role, and voice mode UI**
- [ ] **Step 2: Implement optimize, score, copy, and save flows**
- [ ] **Step 3: Implement searchable history with favorite, delete, and copy**
- [ ] **Step 4: Implement built-in template categories and custom template save**
- [ ] **Step 5: Implement DeepSeek settings and test connection**

### Task 6: Verification

**Files:**
- Modify as needed.

- [ ] **Step 1: Run `npm test -- --run`**
- [ ] **Step 2: Run `npm run build`**
- [ ] **Step 3: Run `cargo check --manifest-path src-tauri/Cargo.toml`**
- [ ] **Step 4: Start the dev server when feasible and report the local URL**
