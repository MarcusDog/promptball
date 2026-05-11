# PromptBall Favorites Evaluation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add favorite prompts with Slash command invocation, prompt run feedback/evaluation, prompt detail analytics, A/B testing, and version management.

**Architecture:** Domain logic lives in focused TypeScript modules with Vitest coverage. React features use the existing Zustand and Tauri bridge pattern, with browser localStorage fallback matching the Tauri command shapes. SQLite schema is expanded with the requested tables and Tauri commands provide persistence for desktop mode.

**Tech Stack:** React, TypeScript, Zustand, Tailwind/shadcn-style components, Vitest, Tauri 2, SQLite.

---

### Task 1: Tested Domain Logic

**Files:**
- Create: `src/lib/favorites.test.ts`
- Create: `src/lib/evaluation.test.ts`
- Create: `src/lib/favorites.ts`
- Create: `src/lib/evaluation.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Write tests for Slash matching and variable extraction/insertion**
- [ ] **Step 2: Write tests for final score calculation and prompt detail metrics**
- [ ] **Step 3: Write tests for A/B win-rate and version default/rollback behavior**
- [ ] **Step 4: Run `npm test -- --run` and verify new tests fail because modules are missing**
- [ ] **Step 5: Implement minimal logic and rerun tests**

### Task 2: Persistence

**Files:**
- Modify: `src-tauri/db/schema.sql`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src/lib/tauri.ts`

- [ ] **Step 1: Add requested tables: favorite_prompts, prompt_runs, prompt_feedback, prompt_eval_scores, prompt_versions, prompt_ab_tests**
- [ ] **Step 2: Add Tauri commands and localStorage fallback for CRUD and analytics**
- [ ] **Step 3: Preserve API keys in settings only, never in source**

### Task 3: UI

**Files:**
- Create: `src/features/favorites/FavoritePromptsPanel.tsx`
- Create: `src/features/favorites/SlashCommandMenu.tsx`
- Create: `src/features/favorites/VariableFillPanel.tsx`
- Create: `src/features/favorites/PromptFeedbackPanel.tsx`
- Create: `src/features/favorites/PromptDetailPanel.tsx`
- Create: `src/features/favorites/ABTestPanel.tsx`
- Modify: `src/components/layout/FloatingShell.tsx`
- Modify: `src/features/workspace/PromptWorkspace.tsx`
- Modify: `src/store/app-store.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add Favorites navigation and prompt card list**
- [ ] **Step 2: Add "收藏为命令" flow from optimized result**
- [ ] **Step 3: Add Slash command menu to prompt inputs**
- [ ] **Step 4: Add variable fill panel before insertion when variables exist**
- [ ] **Step 5: Create prompt runs when favorite prompts are optimized**
- [ ] **Step 6: Add unobtrusive feedback panel and save feedback/eval scores**
- [ ] **Step 7: Add prompt detail page with metrics, recent runs, versions, feedback, A/B records**
- [ ] **Step 8: Add A/B test workflow**

### Task 4: Verification

**Files:**
- Modify as needed.

- [ ] **Step 1: Run `npm test -- --run`**
- [ ] **Step 2: Run `npm run build`**
- [ ] **Step 3: Attempt `cargo check --manifest-path src-tauri/Cargo.toml` and record local linker status**
