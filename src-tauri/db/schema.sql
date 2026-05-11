CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS prompt_history (
  id TEXT PRIMARY KEY,
  original_prompt TEXT NOT NULL,
  optimized_prompt TEXT NOT NULL,
  diagnosis TEXT NOT NULL DEFAULT '',
  suggestions TEXT NOT NULL DEFAULT '[]',
  training_tips TEXT NOT NULL DEFAULT '[]',
  score TEXT NOT NULL,
  model TEXT NOT NULL,
  mode TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  favorite INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prompt_history_created_at
ON prompt_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompt_history_favorite
ON prompt_history(favorite);

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  scenario TEXT NOT NULL DEFAULT '',
  applicable_models TEXT NOT NULL DEFAULT '[]',
  variables TEXT NOT NULL DEFAULT '[]',
  content TEXT NOT NULL,
  output_example TEXT NOT NULL DEFAULT '',
  evaluation_criteria TEXT NOT NULL DEFAULT '[]',
  tags TEXT NOT NULL DEFAULT '[]',
  is_builtin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_templates_category
ON templates(category);

CREATE TABLE IF NOT EXISTS favorite_prompts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slash_command TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  description TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL,
  preferred_model TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  variables TEXT NOT NULL DEFAULT '[]',
  note TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  score REAL NOT NULL DEFAULT 0,
  usage_count INTEGER NOT NULL DEFAULT 0,
  success_rate REAL NOT NULL DEFAULT 0,
  average_rating REAL NOT NULL DEFAULT 0,
  direct_use_rate REAL NOT NULL DEFAULT 0,
  modified_use_rate REAL NOT NULL DEFAULT 0,
  discarded_rate REAL NOT NULL DEFAULT 0,
  default_version_id TEXT NOT NULL DEFAULT '',
  is_favorite INTEGER NOT NULL DEFAULT 1,
  is_default INTEGER NOT NULL DEFAULT 0,
  is_builtin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_used_at TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_favorite_prompts_slash_command
ON favorite_prompts(slash_command);

CREATE INDEX IF NOT EXISTS idx_favorite_prompts_category
ON favorite_prompts(category);

CREATE INDEX IF NOT EXISTS idx_favorite_prompts_default
ON favorite_prompts(is_default, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_favorite_prompts_last_used
ON favorite_prompts(last_used_at DESC);

CREATE TABLE IF NOT EXISTS prompt_runs (
  id TEXT PRIMARY KEY,
  favorite_prompt_id TEXT NOT NULL,
  version_id TEXT NOT NULL,
  input TEXT NOT NULL,
  output TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(favorite_prompt_id) REFERENCES favorite_prompts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prompt_runs_favorite
ON prompt_runs(favorite_prompt_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompt_runs_version
ON prompt_runs(version_id, created_at DESC);

CREATE TABLE IF NOT EXISTS prompt_feedback (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  usage_result TEXT NOT NULL,
  problem_tags TEXT NOT NULL DEFAULT '[]',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY(run_id) REFERENCES prompt_runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prompt_feedback_run
ON prompt_feedback(run_id);

CREATE TABLE IF NOT EXISTS prompt_eval_scores (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  structure_score REAL NOT NULL,
  output_quality_score REAL NOT NULL,
  user_satisfaction_score REAL NOT NULL,
  real_usage_score REAL NOT NULL,
  final_score REAL NOT NULL,
  explanation TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  FOREIGN KEY(run_id) REFERENCES prompt_runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prompt_eval_scores_run
ON prompt_eval_scores(run_id);

CREATE TABLE IF NOT EXISTS prompt_versions (
  id TEXT PRIMARY KEY,
  favorite_prompt_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT '',
  FOREIGN KEY(favorite_prompt_id) REFERENCES favorite_prompts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prompt_versions_favorite
ON prompt_versions(favorite_prompt_id, version DESC);

CREATE TABLE IF NOT EXISTS prompt_ab_tests (
  id TEXT PRIMARY KEY,
  prompt_a_id TEXT NOT NULL,
  prompt_b_id TEXT NOT NULL,
  input TEXT NOT NULL,
  output_a TEXT NOT NULL,
  output_b TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT '',
  winner TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  task_type TEXT NOT NULL DEFAULT '',
  blind_mode INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prompt_ab_tests_pair
ON prompt_ab_tests(prompt_a_id, prompt_b_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompt_ab_tests_task_type
ON prompt_ab_tests(task_type, created_at DESC);

CREATE TABLE IF NOT EXISTS voice_records (
  id TEXT PRIMARY KEY,
  transcript TEXT NOT NULL DEFAULT '',
  cleaned_text TEXT NOT NULL DEFAULT '',
  audio_path TEXT NOT NULL DEFAULT '',
  duration_ms INTEGER NOT NULL DEFAULT 0,
  transcription_mode TEXT NOT NULL DEFAULT 'online',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_voice_records_created_at
ON voice_records(created_at DESC);

CREATE TABLE IF NOT EXISTS model_providers (
  id TEXT PRIMARY KEY,
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  base_url TEXT NOT NULL,
  api_key TEXT NOT NULL DEFAULT '',
  model_name TEXT NOT NULL,
  temperature REAL NOT NULL DEFAULT 0.7,
  max_tokens INTEGER NOT NULL DEFAULT 4096,
  stream INTEGER NOT NULL DEFAULT 0,
  timeout INTEGER NOT NULL DEFAULT 30000,
  is_default INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_model_providers_default
ON model_providers(is_default, enabled);

CREATE TABLE IF NOT EXISTS task_model_bindings (
  id TEXT PRIMARY KEY,
  task_type TEXT NOT NULL UNIQUE,
  provider_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_task_model_bindings_task
ON task_model_bindings(task_type);

CREATE TABLE IF NOT EXISTS model_call_logs (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  task_type TEXT NOT NULL DEFAULT '',
  duration_ms INTEGER NOT NULL DEFAULT 0,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_cost REAL NOT NULL DEFAULT 0,
  ok INTEGER NOT NULL DEFAULT 0,
  error_message TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_model_call_logs_provider
ON model_call_logs(provider_id, created_at DESC);
