ALTER TABLE favorite_prompts ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';
ALTER TABLE favorite_prompts ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE favorite_prompts ADD COLUMN preferred_model TEXT NOT NULL DEFAULT '';
ALTER TABLE favorite_prompts ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE favorite_prompts ADD COLUMN success_rate REAL NOT NULL DEFAULT 0;
ALTER TABLE favorite_prompts ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 1;
ALTER TABLE favorite_prompts ADD COLUMN is_default INTEGER NOT NULL DEFAULT 0;
ALTER TABLE favorite_prompts ADD COLUMN is_builtin INTEGER NOT NULL DEFAULT 0;
ALTER TABLE favorite_prompts ADD COLUMN last_used_at TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_favorite_prompts_default
ON favorite_prompts(is_default, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_favorite_prompts_last_used
ON favorite_prompts(last_used_at DESC);
