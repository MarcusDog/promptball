# PromptBall SQLite Migrations

Migrations are applied in lexical order by `src-tauri/src/lib.rs`.

Rules:

- Add a new numbered SQL file for every schema change.
- Do not edit old migrations after release.
- Keep `src-tauri/db/schema.sql` as the current schema snapshot for review.
- Every application table should include `id`, `created_at`, and `updated_at` in v1 migrations unless an older MVP table is being preserved for compatibility.
