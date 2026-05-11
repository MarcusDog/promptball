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
