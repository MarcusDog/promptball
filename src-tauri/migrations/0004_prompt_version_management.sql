ALTER TABLE prompt_versions ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';

UPDATE prompt_versions
SET updated_at = created_at
WHERE updated_at = '';

CREATE INDEX IF NOT EXISTS idx_prompt_runs_version
ON prompt_runs(version_id, created_at DESC);
