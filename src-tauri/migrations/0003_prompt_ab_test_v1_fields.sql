ALTER TABLE prompt_ab_tests ADD COLUMN model TEXT NOT NULL DEFAULT '';
ALTER TABLE prompt_ab_tests ADD COLUMN reason TEXT NOT NULL DEFAULT '';
ALTER TABLE prompt_ab_tests ADD COLUMN task_type TEXT NOT NULL DEFAULT '';
ALTER TABLE prompt_ab_tests ADD COLUMN blind_mode INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_prompt_ab_tests_task_type
ON prompt_ab_tests(task_type, created_at DESC);
