# PromptBall Agent Guide

## Mission

PromptBall is a desktop floating Prompt training and optimization workbench. The goal is a daily-use product, not a demo page.

## Engineering Rules

- Do not rewrite the project from scratch.
- Inspect current code before changing files.
- Keep MVP features working.
- Implement one stage at a time from `implementation_plan.md`.
- Every new feature needs TypeScript types, persistence/schema consideration, error handling, and basic tests.
- Do not hardcode API keys, model secrets, user content, or privacy-sensitive defaults.
- Do not put provider calls directly inside React components.
- Do not put all business logic into Zustand.
- Prefer feature services and typed repositories for new modules.
- Preserve local user data; migrations must be additive and reversible where practical.

## Verification

Run before claiming a stage is complete:

```bash
npm test -- --run
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
```

Known local blocker: this Windows environment currently resolves `link.exe` to Git's `D:\git\Git\usr\bin\link.exe`, so Rust/Tauri checks fail until Visual Studio C++ Build Tools and Windows SDK are installed and PATH is corrected.

## Current Architecture Notes

- Frontend: React + TypeScript + Vite.
- Styling: Tailwind CSS and shadcn-style local components.
- State: Zustand in `src/store/app-store.ts`.
- Desktop: Tauri 2.
- Database: SQLite via `rusqlite`.
- Provider: OpenAI-compatible chat completions, default DeepSeek.

## Safe Change Strategy

1. Add tests for pure logic first.
2. Add or update types.
3. Add service/repository functions.
4. Add UI wiring.
5. Run verification.
6. Update docs and changelog.

## Files To Treat Carefully

- `src-tauri/db/schema.sql`: current schema source; migration system not yet introduced.
- `src-tauri/src/lib.rs`: currently overloaded with commands, DB, provider calls.
- `src/lib/tauri.ts`: currently mixes Tauri bridge and browser fallback.
- `src/types/index.ts`: current type monolith; split gradually.
- `src/store/app-store.ts`: current global store; avoid further uncontrolled growth.
