# PromptBall Phase 1 UI and Portability Design

## Scope

This phase focuses on three deliverables:

1. Make the collapsed desktop entry show only the floating ball.
2. Replace prototype-only settings and dashboard interactions with real data-driven views.
3. Add Prompt data import and export.

Local users, per-user databases, and the local Prompt plaza are intentionally deferred to the next phase.

## Current Context

PromptBall is a React, Vite, Tauri, and SQLite desktop app. The current expanded desktop shell lives mainly in `src/features/desktop/PromptBallDesktop.tsx`. Some sections in that shell are high-fidelity prototypes: several settings and dashboard controls only update local component state or show toast messages. Real settings already exist in `src/features/settings/SettingsPanel.tsx`, and data portability helpers already exist in `src/services/data-portability.ts`.

The collapsed shell is implemented in `src/components/layout/FloatingShell.tsx`. It currently renders the ball, a glow layer, a right-bottom drag button, and a status dot.

## Floating Ball

Collapsed mode should render only a single round PromptBall button plus the existing status dot. The glow image and separate drag handle are removed because they can be perceived as unknown extra objects.

The ball itself remains the interaction target:

- Click toggles the expanded workbench.
- Press and drag moves the window.
- Right-click opens the context menu.
- Keyboard Enter or Space toggles the workbench.

The status dot remains in this phase because it communicates app state without adding a separate object. If the user still considers it visual clutter, it can be removed in a follow-up.

## Settings

The desktop shell settings view should stop using the prototype `SettingsPage` implementation. Instead, the settings view should render the existing `SettingsPanel`, which already persists and tests real settings.

This gives the top-level Settings navigation real behavior for:

- DeepSeek settings.
- Multi-provider model configuration.
- Task-to-model binding.
- Floating ball display.
- Always-on-top behavior.
- Edge snapping.
- Theme switching.
- Voice privacy settings.
- Privacy mode and export redaction.
- Local privacy data clearing.

No login or registration UI is added in this phase. User functionality belongs to the next phase so it can be designed around local account isolation instead of a placeholder form.

## Evaluation Dashboard

The dashboard keeps its current visual direction, but tab changes must show actual content instead of only toast notifications.

Dashboard sections:

- Overview: existing score cards, trend visualization, issue distribution, and ranking-style summary.
- Score records: list `promptEvalScores`, linked to prompt runs and feedback when available.
- A/B history: list `promptABTests` with prompt names, winner, task type, reason, and creation time.
- Model performance: list `modelCallLogs` including provider/model, task type, latency, token estimates, success state, and error message.
- Prompt statistics: list favorite prompts with usage count, score, direct-use rate, modified-use rate, discarded rate, and last-used time.
- Team evaluation and recycle bin: show a local-edition empty state explaining that the feature is not enabled in this phase.

The app store should add `modelCallLogs` and a setter. App startup should load logs through `listModelCallLogs` so the dashboard can render them.

## Prompt Import and Export

The prompt library area should expose two actions near the top of the library view:

- Export Prompt data.
- Import Prompt data.

Export produces a JSON file named `promptball-prompts.json`. It uses the existing `ExportBundle` structure from `src/services/data-portability.ts` and includes:

- Favorite prompts.
- Prompt versions.
- Prompt runs.
- Prompt feedback.
- Prompt evaluation scores.
- Prompt A/B tests.

When `appPreferences.privacy.redactExports` is enabled, export uses `createPrivacySafeExportBundle`. Otherwise, it uses `createExportBundle`.

Import accepts the same JSON bundle shape. Conflict handling defaults to `duplicate` so existing prompts are not overwritten. Imported favorite prompts are persisted through existing save APIs, and the app refreshes prompts and related statistics after import.

For this phase, file selection and download use browser-native APIs:

- `<input type="file">` for import.
- `Blob`, `URL.createObjectURL`, and a temporary anchor for export.

No Tauri file dialog plugin is added in this phase.

## Data Flow

Startup:

1. Load settings, preferences, history, templates, favorites, runs, feedback, eval scores, versions, A/B tests, and model call logs.
2. Store data in Zustand.
3. Render dashboard and settings from store-backed data.

Export:

1. Collect prompt-related data from Zustand.
2. Create an export bundle.
3. Apply privacy redaction when configured.
4. Download JSON.

Import:

1. User selects a JSON file.
2. Parse and validate the basic bundle shape.
3. Resolve prompt conflicts with duplicate behavior.
4. Save imported prompts through existing prompt APIs.
5. Refresh affected store slices.
6. Show import summary.

## Error Handling

- Empty or invalid import files show a toast error and do not change data.
- Unsupported schema versions show a toast error and do not change data.
- Import save failures surface a toast error; already-saved items are left intact.
- Export failures show a toast error.
- Dashboard empty states explain when there is no data instead of rendering fake results.

## Testing and Verification

Implementation should include or update tests for pure import/export behavior where practical, building on the existing `data-portability.test.ts` coverage.

Before claiming completion, run:

```bash
npm run typecheck
npm test -- --run
npm run build
```

For UI verification, run the Vite dev server and check:

1. Collapsed mode shows only the floating ball and state dot.
2. Settings navigation opens the real settings panel.
3. Dashboard tabs switch to meaningful content or explicit empty states.
4. Export downloads a JSON file.
5. Import accepts a valid exported JSON file and refreshes the library.
