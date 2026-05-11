# PromptBall Phase 1 UI and Portability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Phase 1 by simplifying the floating ball, wiring real settings and evaluation views, and adding Prompt JSON import/export.

**Architecture:** Keep the current React/Tauri architecture and avoid backend schema changes. Use existing Zustand store slices and Tauri bridge APIs, add one focused import/export service boundary, and replace prototype-only UI branches with real data-driven components.

**Tech Stack:** React 19, TypeScript, Vite, Zustand, Tauri 2 bridge APIs, Vitest, Tailwind CSS.

---

## File Structure

- Modify `src/components/layout/FloatingShell.tsx`: remove the glow layer and separate drag handle from collapsed mode while keeping ball click, drag, keyboard, and context menu behavior.
- Modify `src/store/app-store.ts`: add `modelCallLogs` and `setModelCallLogs` to app state.
- Modify `src/App.tsx`: load `listModelCallLogs()` at startup and refresh logs after quick optimization.
- Modify `src/features/desktop/PromptBallDesktop.tsx`: render real `SettingsPanel`, add a data-driven dashboard, and add library import/export buttons.
- Modify `src/services/data-portability.ts`: add bundle parsing and duplicate import preparation helpers.
- Modify `src/services/data-portability.test.ts`: cover invalid bundles and duplicate import behavior.
- Existing APIs used from `src/lib/tauri.ts`: `listModelCallLogs`, `listFavoritePrompts`, `saveFavoritePrompt`, `listPromptRuns`, `listPromptFeedback`, `listPromptEvalScores`, `listPromptVersions`, `listPromptABTests`.

## Task 1: Add Import Bundle Helpers

**Files:**
- Modify: `src/services/data-portability.ts`
- Test: `src/services/data-portability.test.ts`

- [ ] **Step 1: Write failing tests for parsing and duplicate import preparation**

Add these imports in `src/services/data-portability.test.ts`:

```ts
import {
  createExportBundle,
  createPrivacySafeExportBundle,
  parseExportBundle,
  prepareDuplicateFavoritePromptImport,
  resolveImportConflicts,
  type ImportConflictStrategy,
} from "./data-portability";
```

Add these tests inside the existing `describe("data portability", () => { ... })` block:

```ts
it("rejects malformed import bundles", () => {
  expect(() => parseExportBundle("not json")).toThrow("Import file is not valid JSON");
  expect(() => parseExportBundle(JSON.stringify({ schemaVersion: 2, app: "PromptBall", data: {} }))).toThrow(
    "Unsupported PromptBall import schema",
  );
  expect(() => parseExportBundle(JSON.stringify({ schemaVersion: 1, app: "Other", data: {} }))).toThrow(
    "File is not a PromptBall export",
  );
});

it("parses valid export bundles", () => {
  const bundle = createExportBundle({
    favoritePrompts: [basePrompt],
    promptRuns: [],
    promptFeedback: [],
    promptEvalScores: [],
    promptVersions: [],
    promptAbTests: [],
  });

  expect(parseExportBundle(JSON.stringify(bundle))).toEqual(bundle);
});

it("prepares duplicate favorite prompt imports without overwriting existing prompts", () => {
  const prepared = prepareDuplicateFavoritePromptImport({
    existingPrompts: [basePrompt],
    bundle: createExportBundle({
      favoritePrompts: [{ ...basePrompt, name: "Imported prompt" }],
      promptRuns: [],
      promptFeedback: [],
      promptEvalScores: [],
      promptVersions: [],
      promptAbTests: [],
    }),
    idFactory: (id) => `${id}-imported`,
  });

  expect(prepared.prompts).toHaveLength(1);
  expect(prepared.prompts[0].id).toBe("prompt-1-imported");
  expect(prepared.prompts[0].slashCommand).toBe("/polish-2");
  expect(prepared.summary.duplicated).toBe(1);
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- --run src/services/data-portability.test.ts
```

Expected: fails because `parseExportBundle` and `prepareDuplicateFavoritePromptImport` are not exported.

- [ ] **Step 3: Implement minimal import helpers**

Add to `src/services/data-portability.ts` after `createPrivacySafeExportBundle`:

```ts
export function parseExportBundle(raw: string): ExportBundle {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Import file is not valid JSON");
  }

  if (!isRecord(parsed)) {
    throw new Error("Import file is not a valid PromptBall bundle");
  }

  if (parsed.app !== "PromptBall") {
    throw new Error("File is not a PromptBall export");
  }

  if (parsed.schemaVersion !== 1) {
    throw new Error("Unsupported PromptBall import schema");
  }

  if (!isRecord(parsed.data)) {
    throw new Error("Import file is missing PromptBall data");
  }

  return {
    schemaVersion: 1,
    exportedAt: typeof parsed.exportedAt === "string" ? parsed.exportedAt : new Date().toISOString(),
    app: "PromptBall",
    data: {
      favoritePrompts: readArray(parsed.data.favoritePrompts),
      promptRuns: readArray(parsed.data.promptRuns),
      promptFeedback: readArray(parsed.data.promptFeedback),
      promptEvalScores: readArray(parsed.data.promptEvalScores),
      promptVersions: readArray(parsed.data.promptVersions),
      promptAbTests: readArray(parsed.data.promptAbTests),
    },
  };
}

export function prepareDuplicateFavoritePromptImport({
  existingPrompts,
  bundle,
  idFactory,
}: {
  existingPrompts: FavoritePrompt[];
  bundle: ExportBundle;
  idFactory?: (id: string) => string;
}): { prompts: FavoritePrompt[]; summary: ImportConflictResult["summary"] } {
  const resolved = resolveImportConflicts({
    existing: { favoritePrompts: existingPrompts },
    incoming: { favoritePrompts: bundle.data.favoritePrompts },
    strategy: "duplicate",
    idFactory,
  });
  const existingIds = new Set(existingPrompts.map((prompt) => prompt.id));

  return {
    prompts: resolved.favoritePrompts.filter((prompt) => !existingIds.has(prompt.id)),
    summary: resolved.summary,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
```

- [ ] **Step 4: Run test to verify pass**

Run:

```bash
npm test -- --run src/services/data-portability.test.ts
```

Expected: all `data portability` tests pass.

- [ ] **Step 5: Checkpoint**

If committing is authorized, run:

```bash
git add src/services/data-portability.ts src/services/data-portability.test.ts
git commit -m "feat: add PromptBall import bundle helpers"
```

If committing is not authorized, skip this checkpoint and continue.

## Task 2: Add Model Call Logs to App State

**Files:**
- Modify: `src/store/app-store.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Update store imports and state shape**

In `src/store/app-store.ts`, add `ModelCallLog` to the type import list:

```ts
  ModelCallLog,
```

Add state fields to `interface AppState` after `promptABTests: PromptABTestRecord[];`:

```ts
  modelCallLogs: ModelCallLog[];
```

Add the setter after `setPromptABTests: (records: PromptABTestRecord[]) => void;`:

```ts
  setModelCallLogs: (logs: ModelCallLog[]) => void;
```

Add initial state after `promptABTests: [],`:

```ts
  modelCallLogs: [],
```

Add setter implementation after `setPromptABTests: (promptABTests) => set({ promptABTests }),`:

```ts
  setModelCallLogs: (modelCallLogs) => set({ modelCallLogs }),
```

- [ ] **Step 2: Load model call logs at startup**

In `src/App.tsx`, add `listModelCallLogs` to imports from `@/lib/tauri`:

```ts
  listModelCallLogs,
```

Add `setModelCallLogs` to the store destructuring after `setPromptABTests`:

```ts
    setModelCallLogs,
```

Add startup load after `void listPromptABTests().then(setPromptABTests);`:

```ts
    void listModelCallLogs().then(setModelCallLogs);
```

Add `setModelCallLogs` to the dependency array.

- [ ] **Step 3: Refresh logs after quick optimize**

In `quickOptimizeClipboard`, after `setResult(next);`, add:

```ts
      setModelCallLogs(await listModelCallLogs());
```

- [ ] **Step 4: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: TypeScript passes or only reports unrelated pre-existing errors.

- [ ] **Step 5: Checkpoint**

If committing is authorized, run:

```bash
git add src/store/app-store.ts src/App.tsx
git commit -m "feat: load model call logs into app state"
```

If committing is not authorized, skip this checkpoint and continue.

## Task 3: Simplify Collapsed Floating Ball

**Files:**
- Modify: `src/components/layout/FloatingShell.tsx`

- [ ] **Step 1: Remove unused imports**

In `src/components/layout/FloatingShell.tsx`, remove `Grip` from imports and remove the `floatingGlow` import:

```ts
import { useRef, useState, type ReactNode } from "react";
```

Keep:

```ts
import floatingBallActive from "../../../assets/promptball/icons/floating-ball-active.svg";
import floatingBallDefault from "../../../assets/promptball/icons/floating-ball-default.svg";
import floatingBallHover from "../../../assets/promptball/icons/floating-ball-hover.svg";
```

- [ ] **Step 2: Replace collapsed ball JSX**

In the collapsed branch, replace the `appPreferences.showFloatingBall && (...)` block with:

```tsx
      {appPreferences.showFloatingBall && (
        <button
          type="button"
          onMouseDown={(event) => {
            if (event.button !== 0) {
              return;
            }
            void startManualDrag(event, true);
          }}
          onContextMenu={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setContextMenu({ x: event.clientX, y: event.clientY });
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggleExpanded();
            }
          }}
          className={cn(
            "group relative flex size-[66px] cursor-grab items-center justify-center rounded-full text-white drop-shadow-[0_14px_32px_rgba(37,99,235,.35)] transition duration-200 hover:scale-[1.06] hover:drop-shadow-[0_18px_40px_rgba(37,99,235,.46)] active:cursor-grabbing",
            floatingBallStatus === "optimizing" && "animate-pulse",
          )}
          aria-label={`PromptBall ${statusLabel}`}
          title={`PromptBall - ${statusLabel}`}
        >
          <img src={ballAsset} alt="" className="size-[66px] group-hover:hidden" />
          <img src={floatingBallHover} alt="" className="hidden size-[66px] group-hover:block" />
          <span
            className={cn(
              "absolute right-1 top-1 size-3 rounded-full border border-white shadow-[0_1px_5px_rgba(15,23,42,.18)]",
              floatingBallStatus === "idle" && "bg-slate-300",
              floatingBallStatus === "editing" && "bg-amber-400",
              floatingBallStatus === "optimizing" && "bg-cyan-300",
              floatingBallStatus === "success" && "bg-emerald-400",
              floatingBallStatus === "error" && "bg-red-400",
            )}
          />
        </button>
      )}
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: TypeScript passes or only reports unrelated pre-existing errors.

- [ ] **Step 4: Checkpoint**

If committing is authorized, run:

```bash
git add src/components/layout/FloatingShell.tsx
git commit -m "fix: simplify collapsed floating ball"
```

If committing is not authorized, skip this checkpoint and continue.

## Task 4: Replace Prototype Settings View with Real SettingsPanel

**Files:**
- Modify: `src/features/desktop/PromptBallDesktop.tsx`

- [ ] **Step 1: Import SettingsPanel**

Add this import near the other feature imports:

```ts
import { SettingsPanel } from "@/features/settings/SettingsPanel";
```

- [ ] **Step 2: Render SettingsPanel in settings view**

Replace this branch in `PromptBallDesktop`:

```tsx
        {view === "settings" && (
          <SettingsPage
            activeTab={settingsTab}
            onTabChange={setSettingsTab}
            model={settings?.model ?? "deepseek-v3"}
            hasApiKey={Boolean(settings?.apiKey)}
          />
        )}
```

With:

```tsx
        {view === "settings" && <SettingsPanel />}
```

- [ ] **Step 3: Remove settings-only local state and dead prototype code**

Remove these state declarations from `PromptBallDesktop`:

```ts
  const [settingsTab, setSettingsTab] = useState("通用设置");
```

Remove the entire `SettingsPage`, `FormLine`, `SelectLike`, `SettingsToggle`, `Toggle`, and `settingsIcon` function definitions from `src/features/desktop/PromptBallDesktop.tsx`.

Remove now-unused imports from `lucide-react`: `Box`, `Clipboard`, `Code2`, `Eye` only if no remaining code uses them. Keep any icon still used by other components in the file.

- [ ] **Step 4: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: TypeScript reports no unused imports or missing identifiers.

- [ ] **Step 5: Checkpoint**

If committing is authorized, run:

```bash
git add src/features/desktop/PromptBallDesktop.tsx
git commit -m "fix: use real settings panel in desktop shell"
```

If committing is not authorized, skip this checkpoint and continue.

## Task 5: Add Real Dashboard Sections

**Files:**
- Modify: `src/features/desktop/PromptBallDesktop.tsx`

- [ ] **Step 1: Pass real data to EvaluationDashboard**

In `PromptBallDesktop`, add `modelCallLogs` to the store destructuring after `promptEvalScores`:

```ts
    modelCallLogs,
```

Replace the dashboard branch:

```tsx
        {view === "dashboard" && <EvaluationDashboard qualityScore={qualityScore} directRate={directRate} usageCount={usageCount} />}
```

With:

```tsx
        {view === "dashboard" && (
          <EvaluationDashboard
            qualityScore={qualityScore}
            directRate={directRate}
            usageCount={usageCount}
            favoritePrompts={favoritePrompts}
            promptRuns={promptRuns}
            promptFeedback={promptFeedback}
            promptEvalScores={promptEvalScores}
            promptABTests={useAppStore.getState().promptABTests}
            modelCallLogs={modelCallLogs}
          />
        )}
```

- [ ] **Step 2: Update EvaluationDashboard props**

Replace the function signature:

```ts
function EvaluationDashboard({ qualityScore, directRate, usageCount }: { qualityScore: number; directRate: number; usageCount: number }) {
```

With:

```ts
function EvaluationDashboard({
  qualityScore,
  directRate,
  usageCount,
  favoritePrompts,
  promptRuns,
  promptFeedback,
  promptEvalScores,
  promptABTests,
  modelCallLogs,
}: {
  qualityScore: number;
  directRate: number;
  usageCount: number;
  favoritePrompts: FavoritePrompt[];
  promptRuns: import("@/types").PromptRun[];
  promptFeedback: import("@/types").PromptFeedback[];
  promptEvalScores: import("@/types").PromptEvalScore[];
  promptABTests: import("@/types").PromptABTestRecord[];
  modelCallLogs: import("@/types").ModelCallLog[];
}) {
```

- [ ] **Step 3: Replace dashboard content area with section switch**

Inside `EvaluationDashboard`, replace the `<div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-5 p-5">...</div>` after the left nav with:

```tsx
      <div className="min-h-0 p-5">
        {section === "概览" && (
          <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-5">
            <div className="grid grid-cols-4 gap-4">
              {metrics.map((item) => (
                <MetricCard key={item.title} {...item} />
              ))}
            </div>
            <div className="grid min-h-0 grid-cols-[1.2fr_1fr_260px] gap-4">
              <ChartCard usageCount={usageCount} />
              <DonutCard />
              <RankingCard />
            </div>
          </div>
        )}
        {section === "评分记录" && <ScoreRecords scores={promptEvalScores} runs={promptRuns} feedback={promptFeedback} />}
        {section === "对比历史" && <ABHistory records={promptABTests} prompts={favoritePrompts} />}
        {section === "模型表现" && <ModelPerformance logs={modelCallLogs} />}
        {section === "Prompt 统计" && <PromptStats prompts={favoritePrompts} />}
        {(section === "团队评估" || section === "回收站") && <LocalOnlyEmptyState title={section} />}
      </div>
```

- [ ] **Step 4: Add data section components before `MetricCard`**

Add these components above `function MetricCard`:

```tsx
function ScoreRecords({
  scores,
  runs,
  feedback,
}: {
  scores: import("@/types").PromptEvalScore[];
  runs: import("@/types").PromptRun[];
  feedback: import("@/types").PromptFeedback[];
}) {
  const runById = new Map(runs.map((run) => [run.id, run]));
  const feedbackByRun = new Map(feedback.map((item) => [item.runId, item]));

  if (scores.length === 0) {
    return <EmptyPanel title="暂无评分记录" description="完成 Prompt 运行并提交反馈后，这里会显示真实评分。" />;
  }

  return (
    <div className="h-full overflow-auto rounded-xl border border-[#E5E7EB] bg-white p-4">
      <div className="mb-4 text-lg font-bold">评分记录</div>
      <div className="space-y-3">
        {scores.map((score) => {
          const run = runById.get(score.runId);
          const itemFeedback = feedbackByRun.get(score.runId);
          return (
            <div key={score.id} className="rounded-lg border border-[#E5E7EB] p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <strong>综合 {score.finalScore}</strong>
                <span className="text-xs text-[#64748B]">{new Date(score.createdAt).toLocaleString()}</span>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-[#64748B]">
                <span>结构 {score.structureScore}</span>
                <span>输出 {score.outputQualityScore}</span>
                <span>满意 {score.userSatisfactionScore}</span>
                <span>使用 {score.realUsageScore}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-[#64748B]">{run?.output || "未找到对应运行记录"}</p>
              {itemFeedback && <p className="mt-2 text-xs text-[#2563EB]">反馈：{itemFeedback.rating}/5 · {itemFeedback.usageResult}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ABHistory({ records, prompts }: { records: import("@/types").PromptABTestRecord[]; prompts: FavoritePrompt[] }) {
  const promptById = new Map(prompts.map((prompt) => [prompt.id, prompt.name]));

  if (records.length === 0) {
    return <EmptyPanel title="暂无 A/B 对比历史" description="在 A/B 测试中保存结果后，这里会显示真实对比记录。" />;
  }

  return (
    <div className="h-full overflow-auto rounded-xl border border-[#E5E7EB] bg-white p-4">
      <div className="mb-4 text-lg font-bold">对比历史</div>
      <div className="space-y-3">
        {records.map((record) => (
          <div key={record.id} className="rounded-lg border border-[#E5E7EB] p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <strong>{winnerLabel(record.winner)}</strong>
              <span className="text-xs text-[#64748B]">{new Date(record.createdAt).toLocaleString()}</span>
            </div>
            <div className="mt-2 text-xs text-[#64748B]">
              A：{promptById.get(record.promptAId) ?? record.promptAId} / B：{promptById.get(record.promptBId) ?? record.promptBId}
            </div>
            <p className="mt-2 line-clamp-2 text-[#64748B]">{record.reason || "未填写原因"}</p>
            <div className="mt-2 text-xs text-[#2563EB]">{record.taskType || "未分类"} · {record.model}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModelPerformance({ logs }: { logs: import("@/types").ModelCallLog[] }) {
  if (logs.length === 0) {
    return <EmptyPanel title="暂无模型调用日志" description="模型调用日志开启后，优化请求会在这里显示耗时、token 和错误信息。" />;
  }

  return (
    <div className="h-full overflow-auto rounded-xl border border-[#E5E7EB] bg-white p-4">
      <div className="mb-4 text-lg font-bold">模型表现</div>
      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="rounded-lg border border-[#E5E7EB] p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <strong>{log.modelName}</strong>
              <StatusBadge label={log.ok ? "成功" : "失败"} tone={log.ok ? "success" : "neutral"} />
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-[#64748B]">
              <span>{log.taskType}</span>
              <span>{log.durationMs}ms</span>
              <span>输入 {log.promptTokens}</span>
              <span>输出 {log.completionTokens}</span>
            </div>
            {log.errorMessage && <p className="mt-2 text-xs text-[#EF4444]">{log.errorMessage}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function PromptStats({ prompts }: { prompts: FavoritePrompt[] }) {
  if (prompts.length === 0) {
    return <EmptyPanel title="暂无 Prompt 统计" description="保存收藏 Prompt 后，这里会显示使用次数和效果指标。" />;
  }

  return (
    <div className="h-full overflow-auto rounded-xl border border-[#E5E7EB] bg-white p-4">
      <div className="mb-4 text-lg font-bold">Prompt 统计</div>
      <div className="space-y-3">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="rounded-lg border border-[#E5E7EB] p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <strong>{prompt.name}</strong>
              <span className="font-mono text-[#16A34A]">{Math.round(prompt.score || 0)}</span>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-[#64748B]">
              <span>使用 {prompt.usageCount}</span>
              <span>直用 {Math.round(prompt.directUseRate * 100)}%</span>
              <span>修改 {Math.round(prompt.modifiedUseRate * 100)}%</span>
              <span>废弃 {Math.round(prompt.discardedRate * 100)}%</span>
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-[#64748B]">{prompt.description || prompt.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LocalOnlyEmptyState({ title }: { title: string }) {
  return <EmptyPanel title={`${title}暂未启用`} description="本地单机版第一期不启用该模块，后续本地用户和 Prompt 广场阶段会继续完善。" />;
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-center">
      <div>
        <div className="text-lg font-bold text-[#334155]">{title}</div>
        <p className="mt-2 max-w-md text-sm leading-6 text-[#64748B]">{description}</p>
      </div>
    </div>
  );
}

function winnerLabel(winner: import("@/types").ABWinner) {
  if (winner === "a") {
    return "A 胜出";
  }
  if (winner === "b") {
    return "B 胜出";
  }
  if (winner === "both") {
    return "都可以";
  }
  return "都不好";
}
```

- [ ] **Step 5: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: TypeScript passes or identifies import cleanup needed.

- [ ] **Step 6: Checkpoint**

If committing is authorized, run:

```bash
git add src/features/desktop/PromptBallDesktop.tsx
git commit -m "feat: show real dashboard data"
```

If committing is not authorized, skip this checkpoint and continue.

## Task 6: Add Prompt Import and Export UI

**Files:**
- Modify: `src/features/desktop/PromptBallDesktop.tsx`

- [ ] **Step 1: Add data portability imports**

Add imports near the existing service imports:

```ts
import {
  createExportBundle,
  createPrivacySafeExportBundle,
  parseExportBundle,
  prepareDuplicateFavoritePromptImport,
} from "@/services/data-portability";
```

Add these Tauri bridge imports to the existing `@/lib/tauri` import:

```ts
  listPromptABTests,
  listPromptEvalScores,
  listPromptFeedback,
  listPromptRuns,
  listPromptVersions,
```

- [ ] **Step 2: Add store values and handlers in PromptBallDesktop**

In `PromptBallDesktop`, add these values to the store destructuring:

```ts
    promptVersions,
    promptABTests,
    appPreferences,
    setPromptRuns,
    setPromptFeedback,
    setPromptEvalScores,
    setPromptVersions,
    setPromptABTests,
```

Add these functions before `return (`:

```ts
  function handleExportPrompts() {
    try {
      const data = {
        favoritePrompts,
        promptRuns,
        promptFeedback,
        promptEvalScores,
        promptVersions,
        promptAbTests: promptABTests,
      };
      const bundle = appPreferences.privacy.redactExports
        ? createPrivacySafeExportBundle(data, appPreferences.privacy)
        : createExportBundle(data);
      downloadJson("promptball-prompts.json", bundle);
      toast.success("Prompt 数据已导出");
    } catch (error) {
      toast.error("导出失败", { description: error instanceof Error ? error.message : String(error) });
    }
  }

  async function handleImportPrompts(file: File) {
    try {
      const bundle = parseExportBundle(await file.text());
      const prepared = prepareDuplicateFavoritePromptImport({ existingPrompts: favoritePrompts, bundle });
      for (const prompt of prepared.prompts) {
        await saveFavoritePrompt({
          ...prompt,
          isBuiltin: false,
          isDefault: false,
        });
      }
      setFavoritePrompts(await listFavoritePrompts());
      setPromptRuns(await listPromptRuns());
      setPromptFeedback(await listPromptFeedback());
      setPromptEvalScores(await listPromptEvalScores());
      setPromptVersions(await listPromptVersions());
      setPromptABTests(await listPromptABTests());
      toast.success("Prompt 数据已导入", {
        description: `新增 ${prepared.summary.added}，复制 ${prepared.summary.duplicated}，跳过 ${prepared.summary.skipped}`,
      });
    } catch (error) {
      toast.error("导入失败", { description: error instanceof Error ? error.message : String(error) });
    }
  }
```

- [ ] **Step 3: Pass handlers to PromptLibrary**

Replace the library branch:

```tsx
        {view === "library" && <PromptLibrary tab={libraryTab} onTabChange={setLibraryTab} prompts={promptCards} onApplyPrompt={applyPromptCard} />}
```

With:

```tsx
        {view === "library" && (
          <PromptLibrary
            tab={libraryTab}
            onTabChange={setLibraryTab}
            prompts={promptCards}
            onApplyPrompt={applyPromptCard}
            onExportPrompts={handleExportPrompts}
            onImportPrompts={(file) => void handleImportPrompts(file)}
          />
        )}
```

- [ ] **Step 4: Update PromptLibrary props and add buttons**

Update `PromptLibrary` props:

```ts
function PromptLibrary({
  tab,
  onTabChange,
  prompts,
  onApplyPrompt,
  onExportPrompts,
  onImportPrompts,
}: {
  tab: string;
  onTabChange: (tab: string) => void;
  prompts: Array<{ id: string; name: string; description: string; score: number; usageCount: number; isFavorite: boolean }>;
  onApplyPrompt: (content: string) => void;
  onExportPrompts: () => void;
  onImportPrompts: (file: File) => void;
}) {
```

In the top action row inside `PromptLibrary`, after the sort button, add:

```tsx
          <Button className="h-10" variant="outline" onClick={onExportPrompts}>
            <Save className="size-4" />
            导出
          </Button>
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-accent hover:text-accent-foreground">
            <SquarePlus className="size-4" />
            导入
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) {
                  onImportPrompts(file);
                }
              }}
            />
          </label>
```

- [ ] **Step 5: Add download helper near bottom of file**

Add before `compactNumber`:

```ts
function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 6: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: TypeScript passes or identifies import cleanup needed.

- [ ] **Step 7: Checkpoint**

If committing is authorized, run:

```bash
git add src/features/desktop/PromptBallDesktop.tsx
git commit -m "feat: add Prompt JSON import export"
```

If committing is not authorized, skip this checkpoint and continue.

## Task 7: Final Verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run frontend checks**

Run:

```bash
npm run typecheck
npm test -- --run
npm run build
```

Expected: all commands pass.

- [ ] **Step 2: Run UI smoke check**

Run:

```bash
npm run dev
```

Expected: Vite starts at `http://localhost:1420`.

Open the app in a browser and verify:

1. Collapsed shell shows one floating ball plus the status dot.
2. Settings navigation renders the real settings panel.
3. Dashboard tabs switch between overview, score records, A/B history, model performance, Prompt stats, and empty states.
4. Export downloads `promptball-prompts.json`.
5. Importing the exported JSON shows a success toast and refreshes the library.

- [ ] **Step 3: Check working tree**

Run:

```bash
git status --short
```

Expected: only intended files are changed.

- [ ] **Step 4: Final checkpoint**

If committing is authorized, run:

```bash
git add docs/superpowers/specs/2026-05-10-promptball-phase1-ui-portability-design.md docs/superpowers/plans/2026-05-10-promptball-phase1-ui-portability.md src/components/layout/FloatingShell.tsx src/store/app-store.ts src/App.tsx src/features/desktop/PromptBallDesktop.tsx src/services/data-portability.ts src/services/data-portability.test.ts
git commit -m "feat: complete PromptBall phase 1 UI portability"
```

If committing is not authorized, leave changes uncommitted and report the verification evidence.

## Self-Review

- Spec coverage: floating ball, real settings, real dashboard data, model logs, JSON export, JSON import, duplicate conflict handling, and verification are covered.
- Placeholder scan: no TBD/TODO placeholders are present.
- Type consistency: names match existing types: `FavoritePrompt`, `PromptRun`, `PromptFeedback`, `PromptEvalScore`, `PromptABTestRecord`, `ModelCallLog`, and existing Tauri bridge functions.
