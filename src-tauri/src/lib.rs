use chrono::Utc;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
  fs,
  path::PathBuf,
  sync::{Mutex, OnceLock},
  time::{Duration, Instant},
};
use tauri::{
  image::Image,
  menu::MenuBuilder,
  tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
  AppHandle, Emitter, Manager, WebviewWindow, WindowEvent,
};
use uuid::Uuid;

static CURRENT_USER_ID: OnceLock<Mutex<Option<String>>> = OnceLock::new();

const MIGRATIONS: &[(&str, &str)] = &[
  (
    "0001_initial",
    include_str!("../migrations/0001_initial.sql"),
  ),
  (
    "0002_favorite_prompt_v1_fields",
    include_str!("../migrations/0002_favorite_prompt_v1_fields.sql"),
  ),
  (
    "0003_prompt_ab_test_v1_fields",
    include_str!("../migrations/0003_prompt_ab_test_v1_fields.sql"),
  ),
  (
    "0004_prompt_version_management",
    include_str!("../migrations/0004_prompt_version_management.sql"),
  ),
  (
    "0005_voice_input",
    include_str!("../migrations/0005_voice_input.sql"),
  ),
  (
    "0006_model_providers",
    include_str!("../migrations/0006_model_providers.sql"),
  ),
  (
    "0007_prompt_templates_v1_fields",
    include_str!("../migrations/0007_prompt_templates_v1_fields.sql"),
  ),
];

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderSettings {
  pub api_key: String,
  pub base_url: String,
  pub model: String,
  pub temperature: f32,
  pub max_tokens: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PromptHistoryInput {
  pub original_prompt: String,
  pub optimized_prompt: String,
  pub diagnosis: String,
  pub suggestions: Vec<String>,
  pub training_tips: Vec<String>,
  pub score: Value,
  pub model: String,
  pub mode: String,
  pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PromptHistoryItem {
  pub id: String,
  pub original_prompt: String,
  pub optimized_prompt: String,
  pub diagnosis: String,
  pub suggestions: Vec<String>,
  pub training_tips: Vec<String>,
  pub score: Value,
  pub model: String,
  pub mode: String,
  pub tags: Vec<String>,
  pub favorite: bool,
  pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PromptTemplateInput {
  pub title: String,
  pub category: String,
  pub description: String,
  #[serde(default)]
  pub scenario: String,
  #[serde(default)]
  pub applicable_models: Vec<String>,
  #[serde(default)]
  pub variables: Vec<String>,
  pub content: String,
  #[serde(default)]
  pub output_example: String,
  #[serde(default)]
  pub evaluation_criteria: Vec<String>,
  #[serde(default)]
  pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PromptTemplate {
  pub id: String,
  pub title: String,
  pub category: String,
  pub description: String,
  pub scenario: String,
  pub applicable_models: Vec<String>,
  pub variables: Vec<String>,
  pub content: String,
  pub output_example: String,
  pub evaluation_criteria: Vec<String>,
  pub tags: Vec<String>,
  pub is_builtin: bool,
  pub created_at: String,
  pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OptimizePayload {
  pub prompt: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderTestResult {
  pub ok: bool,
  pub message: String,
}

fn default_settings() -> ProviderSettings {
  ProviderSettings {
    api_key: String::new(),
    base_url: "https://api.deepseek.com".to_string(),
    model: "deepseek-chat".to_string(),
    temperature: 0.3,
    max_tokens: 1800,
  }
}

fn app_data_dir() -> Result<PathBuf, String> {
  let dir = dirs::data_local_dir()
    .ok_or_else(|| "Cannot resolve local data directory".to_string())?
    .join("PromptBall");
  fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
  Ok(dir)
}

fn safe_user_database_name(user_id: &str) -> String {
  let safe = user_id
    .chars()
    .filter(|ch| ch.is_ascii_alphanumeric() || *ch == '-' || *ch == '_')
    .collect::<String>();
  format!("promptball-user-{}.sqlite", safe)
}

fn current_user_id() -> Option<String> {
  CURRENT_USER_ID
    .get_or_init(|| Mutex::new(None))
    .lock()
    .ok()
    .and_then(|guard| guard.clone())
}

fn set_current_user_id(user_id: Option<String>) {
  if let Ok(mut guard) = CURRENT_USER_ID.get_or_init(|| Mutex::new(None)).lock() {
    *guard = user_id;
  }
}

fn database_path() -> Result<PathBuf, String> {
  let dir = app_data_dir()?;
  if let Some(user_id) = current_user_id() {
    Ok(dir.join(safe_user_database_name(&user_id)))
  } else {
    Ok(dir.join("promptball.sqlite"))
  }
}

fn auth_database_path() -> Result<PathBuf, String> {
  Ok(app_data_dir()?.join("promptball-auth.sqlite"))
}

fn open_auth_database() -> Result<Connection, String> {
  let conn = Connection::open(auth_database_path()?).map_err(|error| error.to_string())?;
  conn
    .execute_batch(
      "CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS auth_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );",
    )
    .map_err(|error| error.to_string())?;
  Ok(conn)
}

fn read_current_user_from_auth_db() -> Result<Option<Value>, String> {
  let conn = open_auth_database()?;
  let user_id = match conn.query_row("SELECT value FROM auth_state WHERE key = 'currentUserId'", [], |row| row.get::<_, String>(0)) {
    Ok(value) => value,
    Err(rusqlite::Error::QueryReturnedNoRows) => return Ok(None),
    Err(error) => return Err(error.to_string()),
  };
  let user = conn.query_row(
    "SELECT id, username, created_at, updated_at FROM users WHERE id = ?1",
    params![user_id],
    |row| {
      Ok(json!({
        "id": row.get::<_, String>(0)?,
        "username": row.get::<_, String>(1)?,
        "createdAt": row.get::<_, String>(2)?,
        "updatedAt": row.get::<_, String>(3)?,
      }))
    },
  );
  match user {
    Ok(value) => Ok(Some(value)),
    Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
    Err(error) => Err(error.to_string()),
  }
}


fn open_database() -> Result<Connection, String> {
  let conn = Connection::open(database_path()?).map_err(|error| error.to_string())?;
  run_migrations(&conn)?;
  Ok(conn)
}

fn run_migrations(conn: &Connection) -> Result<(), String> {
  conn
    .execute_batch(
      "CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      );",
    )
    .map_err(|error| error.to_string())?;

  for (version, sql) in MIGRATIONS {
    let applied: i64 = conn
      .query_row(
        "SELECT COUNT(1) FROM schema_migrations WHERE version = ?1",
        params![version],
        |row| row.get(0),
      )
      .map_err(|error| error.to_string())?;

    if applied > 0 {
      continue;
    }

    conn.execute_batch(sql).map_err(|error| error.to_string())?;
    conn
      .execute(
        "INSERT INTO schema_migrations (version, applied_at) VALUES (?1, ?2)",
        params![version, Utc::now().to_rfc3339()],
      )
      .map_err(|error| error.to_string())?;
  }

  Ok(())
}

fn read_json_vec(value: String) -> Vec<String> {
  serde_json::from_str(&value).unwrap_or_default()
}

fn read_settings_from_db(conn: &Connection) -> Result<ProviderSettings, String> {
  let mut settings = default_settings();
  let mut stmt = conn
    .prepare("SELECT key, value FROM settings")
    .map_err(|error| error.to_string())?;
  let rows = stmt
    .query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)))
    .map_err(|error| error.to_string())?;

  for row in rows {
    let (key, value) = row.map_err(|error| error.to_string())?;
    match key.as_str() {
      "apiKey" => settings.api_key = value,
      "baseUrl" => settings.base_url = value,
      "model" => settings.model = value,
      "temperature" => settings.temperature = value.parse().unwrap_or(settings.temperature),
      "maxTokens" => settings.max_tokens = value.parse().unwrap_or(settings.max_tokens),
      _ => {}
    }
  }

  Ok(settings)
}

fn read_active_provider_settings(conn: &Connection) -> Result<(String, String, ProviderSettings, bool, u64), String> {
  let provider: Result<(String, String, String, String, String, f32, u32, i64), _> = conn.query_row(
    "SELECT id, provider_type, base_url, api_key, model_name, temperature, max_tokens, timeout
     FROM model_providers
     WHERE enabled = 1
     ORDER BY is_default DESC, updated_at DESC
     LIMIT 1",
    [],
    |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?, row.get(5)?, row.get(6)?, row.get(7)?)),
  );

  match provider {
    Ok((id, provider_type, base_url, api_key, model, temperature, max_tokens, timeout)) => Ok((
      id,
      provider_type.clone(),
      ProviderSettings {
        api_key,
        base_url,
        model,
        temperature,
        max_tokens,
      },
      provider_type != "ollama",
      timeout.max(1000) as u64,
    )),
    Err(rusqlite::Error::QueryReturnedNoRows) => {
      let settings = read_settings_from_db(conn)?;
      Ok(("legacy-deepseek-settings".to_string(), "deepseek".to_string(), settings, true, 30_000u64))
    }
    Err(error) => Err(error.to_string()),
  }
}

fn parse_provider_json_content(content: &str) -> Result<Value, String> {
  if let Ok(value) = serde_json::from_str(content) {
    return Ok(value);
  }

  if let Some(fenced) = content.split("```json").nth(1).and_then(|tail| tail.split("```").next()) {
    if let Ok(value) = serde_json::from_str(fenced.trim()) {
      return Ok(value);
    }
  }

  let candidates = extract_json_object_candidates(content);
  let mut first_valid = None;
  for candidate in candidates {
    if let Ok(value) = serde_json::from_str::<Value>(&candidate) {
      if value.get("optimizedPrompt").is_some() {
        return Ok(value);
      }
      if first_valid.is_none() {
        first_valid = Some(value);
      }
    }
  }

  first_valid.ok_or_else(|| "Provider response did not include valid JSON content".to_string())
}

fn extract_json_object_candidates(content: &str) -> Vec<String> {
  let mut candidates = Vec::new();
  let mut start = None;
  let mut depth = 0usize;
  let mut in_string = false;
  let mut escaped = false;

  for (index, ch) in content.char_indices() {
    if in_string {
      if escaped {
        escaped = false;
      } else if ch == '\\' {
        escaped = true;
      } else if ch == '"' {
        in_string = false;
      }
      continue;
    }

    match ch {
      '"' if depth > 0 => in_string = true,
      '{' => {
        if depth == 0 {
          start = Some(index);
        }
        depth += 1;
      }
      '}' if depth > 0 => {
        depth -= 1;
        if depth == 0 {
          if let Some(start_index) = start.take() {
            candidates.push(content[start_index..=index].to_string());
          }
        }
      }
      _ => {}
    }
  }

  candidates
}

fn should_write_model_call_log(conn: &Connection) -> bool {
  let stored: Result<String, _> = conn.query_row(
    "SELECT value FROM settings WHERE key = 'appPreferences'",
    [],
    |row| row.get(0),
  );
  let preferences = stored
    .ok()
    .and_then(|value| serde_json::from_str::<Value>(&value).ok())
    .unwrap_or_else(default_app_preferences);
  let privacy = &preferences["privacy"];
  let privacy_mode = privacy["privacyMode"].as_bool().unwrap_or(false);
  let save_logs = privacy["saveModelCallLogs"].as_bool().unwrap_or(true);
  !privacy_mode && save_logs
}

fn write_model_call_log(
  conn: &Connection,
  provider_id: &str,
  model_name: &str,
  task_type: &str,
  duration_ms: i64,
  prompt_tokens: i64,
  completion_tokens: i64,
  ok: bool,
  error_message: &str,
) -> Result<(), String> {
  if !should_write_model_call_log(conn) {
    return Ok(());
  }
  let now = Utc::now().to_rfc3339();
  conn.execute(
    "INSERT INTO model_call_logs
     (id, provider_id, model_name, task_type, duration_ms, prompt_tokens, completion_tokens, estimated_cost, ok, error_message, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 0, ?8, ?9, ?10, ?10)",
    params![
      Uuid::new_v4().to_string(),
      provider_id,
      model_name,
      task_type,
      duration_ms,
      prompt_tokens,
      completion_tokens,
      if ok { 1 } else { 0 },
      error_message,
      now,
    ],
  ).map_err(|error| error.to_string())?;
  Ok(())
}

fn default_app_preferences() -> Value {
  json!({
    "showFloatingBall": true,
    "alwaysOnTop": true,
    "edgeSnap": true,
    "launchAtStartup": false,
    "theme": "system",
    "windowPosition": Value::Null,
    "voice": {
      "transcriptionMode": "online",
      "localTranscriptionProvider": "",
      "saveAudio": false,
      "saveTranscript": false
    },
    "privacy": {
      "privacyMode": false,
      "saveHistory": true,
      "saveModelCallLogs": true,
      "warnBeforeModelCall": true,
      "redactExports": true,
      "localEncryptionReady": false
    },
  })
}

fn show_panel(app: &AppHandle, panel: &str) {
  if let Some(window) = app.get_webview_window("main") {
    let _ = window.show();
    let _ = window.set_focus();
    let _ = window.emit("promptball-open-panel", panel);
  }
}

fn create_tray_icon() -> Image<'static> {
  let size = 32u32;
  let center = (size as f32 - 1.0) / 2.0;
  let mut rgba = Vec::with_capacity((size * size * 4) as usize);

  for y in 0..size {
    for x in 0..size {
      let dx = x as f32 - center;
      let dy = y as f32 - center;
      let distance = (dx * dx + dy * dy).sqrt();
      if distance > center {
        rgba.extend_from_slice(&[0, 0, 0, 0]);
        continue;
      }
      let highlight = ((center - distance) / center).clamp(0.0, 1.0);
      let r = (8.0 + highlight * 80.0) as u8;
      let g = (145.0 + highlight * 90.0) as u8;
      let b = (178.0 + highlight * 70.0) as u8;
      rgba.extend_from_slice(&[r, g, b, 255]);
    }
  }

  Image::new_owned(rgba, size, size)
}

fn setup_tray(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
  let menu = MenuBuilder::new(app)
    .text("open_workspace", "打开工作台")
    .text("quick_optimize_clipboard", "快速优化剪贴板")
    .separator()
    .text("open_history", "查看历史")
    .text("open_library", "打开 Prompt 库")
    .text("open_settings", "设置")
    .separator()
    .text("quit", "退出")
    .build()?;

  TrayIconBuilder::with_id("promptball")
    .icon(create_tray_icon())
    .tooltip("PromptBall")
    .menu(&menu)
    .show_menu_on_left_click(false)
    .on_menu_event(|app, event| match event.id().as_ref() {
      "open_workspace" => show_panel(app, "workspace"),
      "quick_optimize_clipboard" => {
        show_panel(app, "workspace");
        let _ = app.emit("promptball-quick-optimize-clipboard", ());
      }
      "open_history" => show_panel(app, "history"),
      "open_library" => show_panel(app, "favorites"),
      "open_settings" => show_panel(app, "settings"),
      "quit" => app.exit(0),
      _ => {}
    })
    .on_tray_icon_event(|tray, event| {
      if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
      } = event
      {
        show_panel(tray.app_handle(), "workspace");
      }
    })
    .build(app)?;

  Ok(())
}

#[tauri::command]
fn dock_window_right(window: WebviewWindow) -> Result<(), String> {
  let monitor = window
    .current_monitor()
    .map_err(|error| error.to_string())?
    .ok_or_else(|| "No monitor available".to_string())?;
  let size = window.outer_size().map_err(|error| error.to_string())?;
  let monitor_size = monitor.size();
  let monitor_position = monitor.position();
  let x = monitor_position.x + monitor_size.width as i32 - size.width as i32 - 28;
  let y = monitor_position.y + ((monitor_size.height as i32 - size.height as i32) / 2);

  window
    .set_position(tauri::PhysicalPosition { x, y })
    .map_err(|error| error.to_string())
}

#[tauri::command]
fn get_current_user() -> Result<Option<Value>, String> {
  let user = read_current_user_from_auth_db()?;
  set_current_user_id(user.as_ref().and_then(|value| value["id"].as_str().map(|id| id.to_string())));
  Ok(user)
}

#[tauri::command]
fn register_user(username: String, password: String) -> Result<Value, String> {
  let username = username.trim().to_string();
  if username.len() < 2 {
    return Err("用户名至少需要 2 个字符".to_string());
  }
  if password.len() < 4 {
    return Err("密码至少需要 4 个字符".to_string());
  }

  let conn = open_auth_database()?;
  let now = Utc::now().to_rfc3339();
  let id = Uuid::new_v4().to_string();
  conn.execute(
    "INSERT INTO users (id, username, password, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)",
    params![id, username, password, now],
  )
  .map_err(|error| {
    if error.to_string().contains("UNIQUE") {
      "用户名已存在".to_string()
    } else {
      error.to_string()
    }
  })?;
  conn.execute(
    "INSERT INTO auth_state (key, value) VALUES ('currentUserId', ?1)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    params![id],
  )
  .map_err(|error| error.to_string())?;
  set_current_user_id(Some(id.clone()));
  let _ = open_database()?;
  Ok(json!({
    "id": id,
    "username": username,
    "createdAt": now,
    "updatedAt": now,
  }))
}

#[tauri::command]
fn login_user(username: String, password: String) -> Result<Value, String> {
  let conn = open_auth_database()?;
  let user = conn
    .query_row(
      "SELECT id, username, password, created_at, updated_at FROM users WHERE username = ?1",
      params![username.trim()],
      |row| {
        Ok((
          row.get::<_, String>(0)?,
          row.get::<_, String>(1)?,
          row.get::<_, String>(2)?,
          row.get::<_, String>(3)?,
          row.get::<_, String>(4)?,
        ))
      },
    )
    .map_err(|_| "用户名或密码错误".to_string())?;
  if user.2 != password {
    return Err("用户名或密码错误".to_string());
  }
  conn.execute(
    "INSERT INTO auth_state (key, value) VALUES ('currentUserId', ?1)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    params![user.0],
  )
  .map_err(|error| error.to_string())?;
  set_current_user_id(Some(user.0.clone()));
  let _ = open_database()?;
  Ok(json!({
    "id": user.0,
    "username": user.1,
    "createdAt": user.3,
    "updatedAt": user.4,
  }))
}

#[tauri::command]
fn logout_user() -> Result<(), String> {
  let conn = open_auth_database()?;
  conn.execute("DELETE FROM auth_state WHERE key = 'currentUserId'", [])
    .map_err(|error| error.to_string())?;
  set_current_user_id(None);
  Ok(())
}
#[tauri::command]
fn get_settings() -> Result<ProviderSettings, String> {
  let conn = open_database()?;
  read_settings_from_db(&conn)
}

#[tauri::command]
fn get_app_preferences() -> Result<Value, String> {
  let conn = open_database()?;
  let stored: Result<String, _> = conn.query_row(
    "SELECT value FROM settings WHERE key = 'appPreferences'",
    [],
    |row| row.get(0),
  );
  match stored {
    Ok(value) => serde_json::from_str(&value).map_err(|error| error.to_string()),
    Err(rusqlite::Error::QueryReturnedNoRows) => Ok(default_app_preferences()),
    Err(error) => Err(error.to_string()),
  }
}

#[tauri::command]
fn save_app_preferences(preferences: Value) -> Result<Value, String> {
  let conn = open_database()?;
  let value = serde_json::to_string(&preferences).map_err(|error| error.to_string())?;
  conn
    .execute(
      "INSERT INTO settings (key, value) VALUES ('appPreferences', ?1)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      params![value],
    )
    .map_err(|error| error.to_string())?;
  Ok(preferences)
}

#[tauri::command]
fn save_settings(settings: ProviderSettings) -> Result<ProviderSettings, String> {
  let conn = open_database()?;
  let values = [
    ("apiKey", settings.api_key.clone()),
    ("baseUrl", settings.base_url.clone()),
    ("model", settings.model.clone()),
    ("temperature", settings.temperature.to_string()),
    ("maxTokens", settings.max_tokens.to_string()),
  ];

  for (key, value) in values {
    conn
      .execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
      )
      .map_err(|error| error.to_string())?;
  }

  Ok(settings)
}

#[tauri::command]
fn list_prompt_history(query: Option<String>) -> Result<Vec<PromptHistoryItem>, String> {
  let conn = open_database()?;
  let search = query.unwrap_or_default();
  let like = format!("%{}%", search);
  let mut stmt = conn
    .prepare(
      "SELECT id, original_prompt, optimized_prompt, diagnosis, suggestions, training_tips,
              score, model, mode, tags, favorite, created_at
       FROM prompt_history
       WHERE (?1 = '' OR original_prompt LIKE ?2 OR optimized_prompt LIKE ?2 OR tags LIKE ?2)
       ORDER BY favorite DESC, created_at DESC",
    )
    .map_err(|error| error.to_string())?;

  let rows = stmt
    .query_map(params![search, like], |row| {
      let score_raw: String = row.get(6)?;
      Ok(PromptHistoryItem {
        id: row.get(0)?,
        original_prompt: row.get(1)?,
        optimized_prompt: row.get(2)?,
        diagnosis: row.get(3)?,
        suggestions: read_json_vec(row.get(4)?),
        training_tips: read_json_vec(row.get(5)?),
        score: serde_json::from_str(&score_raw).unwrap_or_else(|_| json!({ "total": 0, "dimensions": [] })),
        model: row.get(7)?,
        mode: row.get(8)?,
        tags: read_json_vec(row.get(9)?),
        favorite: row.get::<_, i64>(10)? == 1,
        created_at: row.get(11)?,
      })
    })
    .map_err(|error| error.to_string())?;

  rows.collect::<Result<Vec<_>, _>>()
    .map_err(|error| error.to_string())
}

#[tauri::command]
fn save_prompt_history(input: PromptHistoryInput) -> Result<PromptHistoryItem, String> {
  let conn = open_database()?;
  let id = Uuid::new_v4().to_string();
  let created_at = Utc::now().to_rfc3339();
  let suggestions = serde_json::to_string(&input.suggestions).map_err(|error| error.to_string())?;
  let training_tips = serde_json::to_string(&input.training_tips).map_err(|error| error.to_string())?;
  let tags = serde_json::to_string(&input.tags).map_err(|error| error.to_string())?;
  let score = serde_json::to_string(&input.score).map_err(|error| error.to_string())?;

  conn
    .execute(
      "INSERT INTO prompt_history
       (id, original_prompt, optimized_prompt, diagnosis, suggestions, training_tips, score, model, mode, tags, favorite, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 0, ?11)",
      params![
        id,
        input.original_prompt,
        input.optimized_prompt,
        input.diagnosis,
        suggestions,
        training_tips,
        score,
        input.model,
        input.mode,
        tags,
        created_at
      ],
    )
    .map_err(|error| error.to_string())?;

  Ok(PromptHistoryItem {
    id,
    original_prompt: input.original_prompt,
    optimized_prompt: input.optimized_prompt,
    diagnosis: input.diagnosis,
    suggestions: input.suggestions,
    training_tips: input.training_tips,
    score: input.score,
    model: input.model,
    mode: input.mode,
    tags: input.tags,
    favorite: false,
    created_at,
  })
}

#[tauri::command]
fn delete_prompt_history(id: String) -> Result<(), String> {
  let conn = open_database()?;
  conn
    .execute("DELETE FROM prompt_history WHERE id = ?1", params![id])
    .map_err(|error| error.to_string())?;
  Ok(())
}

#[tauri::command]
fn clear_prompt_history() -> Result<(), String> {
  let conn = open_database()?;
  conn
    .execute("DELETE FROM prompt_history", [])
    .map_err(|error| error.to_string())?;
  Ok(())
}

#[tauri::command]
fn toggle_favorite_prompt(id: String) -> Result<(), String> {
  let conn = open_database()?;
  conn
    .execute(
      "UPDATE prompt_history SET favorite = CASE favorite WHEN 1 THEN 0 ELSE 1 END WHERE id = ?1",
      params![id],
    )
    .map_err(|error| error.to_string())?;
  Ok(())
}

#[tauri::command]
fn list_templates() -> Result<Vec<PromptTemplate>, String> {
  let conn = open_database()?;
  let mut stmt = conn
    .prepare(
      "SELECT id, title, category, description, content, is_builtin, created_at
              , scenario, applicable_models, variables, output_example, evaluation_criteria, tags, updated_at
       FROM templates
       ORDER BY is_builtin DESC, created_at DESC",
    )
    .map_err(|error| error.to_string())?;

  let rows = stmt
    .query_map([], |row| {
      Ok(PromptTemplate {
        id: row.get(0)?,
        title: row.get(1)?,
        category: row.get(2)?,
        description: row.get(3)?,
        content: row.get(4)?,
        is_builtin: row.get::<_, i64>(5)? == 1,
        created_at: row.get(6)?,
        scenario: row.get::<_, String>(7)?,
        applicable_models: read_json_vec(row.get(8)?),
        variables: read_json_vec(row.get(9)?),
        output_example: row.get(10)?,
        evaluation_criteria: read_json_vec(row.get(11)?),
        tags: read_json_vec(row.get(12)?),
        updated_at: row.get(13)?,
      })
    })
    .map_err(|error| error.to_string())?;

  rows.collect::<Result<Vec<_>, _>>()
    .map_err(|error| error.to_string())
}

#[tauri::command]
fn save_template(input: PromptTemplateInput) -> Result<PromptTemplate, String> {
  let conn = open_database()?;
  let id = Uuid::new_v4().to_string();
  let created_at = Utc::now().to_rfc3339();
  let applicable_models = serde_json::to_string(&input.applicable_models).map_err(|error| error.to_string())?;
  let variables = serde_json::to_string(&input.variables).map_err(|error| error.to_string())?;
  let evaluation_criteria = serde_json::to_string(&input.evaluation_criteria).map_err(|error| error.to_string())?;
  let tags = serde_json::to_string(&input.tags).map_err(|error| error.to_string())?;

  conn
    .execute(
      "INSERT INTO templates
       (id, title, category, description, scenario, applicable_models, variables, content, output_example, evaluation_criteria, tags, is_builtin, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 0, ?12, ?12)",
      params![
        id,
        input.title,
        input.category,
        input.description,
        input.scenario,
        applicable_models,
        variables,
        input.content,
        input.output_example,
        evaluation_criteria,
        tags,
        created_at
      ],
    )
    .map_err(|error| error.to_string())?;

  Ok(PromptTemplate {
    id,
    title: input.title,
    category: input.category,
    description: input.description,
    scenario: input.scenario,
    applicable_models: input.applicable_models,
    variables: input.variables,
    content: input.content,
    output_example: input.output_example,
    evaluation_criteria: input.evaluation_criteria,
    tags: input.tags,
    is_builtin: false,
    created_at: created_at.clone(),
    updated_at: created_at,
  })
}

#[tauri::command]
fn delete_template(id: String) -> Result<(), String> {
  let conn = open_database()?;
  conn
    .execute("DELETE FROM templates WHERE id = ?1 AND is_builtin = 0", params![id])
    .map_err(|error| error.to_string())?;
  Ok(())
}

fn value_string(input: &Value, key: &str) -> String {
  input[key].as_str().unwrap_or_default().to_string()
}

fn value_vec(input: &Value, key: &str) -> Vec<String> {
  if let Some(items) = input[key].as_array() {
    return items
      .iter()
      .filter_map(|item| item.as_str().map(|value| value.trim().to_string()))
      .filter(|value| !value.is_empty())
      .collect();
  }
  input[key]
    .as_str()
    .map(|value| {
      value
        .split(|character| character == ',' || character == '，' || character == ' ')
        .map(|item| item.trim().to_string())
        .filter(|item| !item.is_empty())
        .collect()
    })
    .unwrap_or_default()
}

#[tauri::command]
fn list_favorite_prompts() -> Result<Vec<Value>, String> {
  let conn = open_database()?;
  let mut stmt = conn
    .prepare(
      "SELECT id, name, slash_command, category, model, content, variables, note, score,
              usage_count, average_rating, direct_use_rate, modified_use_rate, discarded_rate,
              default_version_id, created_at, updated_at, tags, description, preferred_model,
              version, success_rate, is_favorite, is_default, is_builtin, last_used_at
       FROM favorite_prompts
       ORDER BY is_default DESC, last_used_at DESC, updated_at DESC",
    )
    .map_err(|error| error.to_string())?;
  let rows = stmt
    .query_map([], |row| {
      let model: String = row.get(4)?;
      let preferred_model: String = row.get(19)?;
      let effective_preferred_model = if preferred_model.is_empty() {
        model.clone()
      } else {
        preferred_model
      };

      Ok(json!({
        "id": row.get::<_, String>(0)?,
        "name": row.get::<_, String>(1)?,
        "slashCommand": row.get::<_, String>(2)?,
        "category": row.get::<_, String>(3)?,
        "model": model,
        "preferredModel": effective_preferred_model,
        "content": row.get::<_, String>(5)?,
        "variables": read_json_vec(row.get(6)?),
        "note": row.get::<_, String>(7)?,
        "score": row.get::<_, f64>(8)?,
        "usageCount": row.get::<_, i64>(9)?,
        "averageRating": row.get::<_, f64>(10)?,
        "directUseRate": row.get::<_, f64>(11)?,
        "modifiedUseRate": row.get::<_, f64>(12)?,
        "discardedRate": row.get::<_, f64>(13)?,
        "defaultVersionId": row.get::<_, String>(14)?,
        "createdAt": row.get::<_, String>(15)?,
        "updatedAt": row.get::<_, String>(16)?,
        "tags": read_json_vec(row.get(17)?),
        "description": row.get::<_, String>(18)?,
        "version": row.get::<_, i64>(20)?,
        "successRate": row.get::<_, f64>(21)?,
        "isFavorite": row.get::<_, i64>(22)? == 1,
        "isDefault": row.get::<_, i64>(23)? == 1,
        "isBuiltin": row.get::<_, i64>(24)? == 1,
        "lastUsedAt": row.get::<_, String>(25)?,
      }))
    })
    .map_err(|error| error.to_string())?;
  rows.collect::<Result<Vec<_>, _>>().map_err(|error| error.to_string())
}

#[tauri::command]
fn save_favorite_prompt(input: Value) -> Result<Value, String> {
  let conn = open_database()?;
  let id = Uuid::new_v4().to_string();
  let version_id = Uuid::new_v4().to_string();
  let now = Utc::now().to_rfc3339();
  let slash = value_string(&input, "slashCommand");
  let slash_command = if slash.starts_with('/') { slash } else { format!("/{}", slash) };
  let variables = serde_json::to_string(&value_vec(&input, "variables")).map_err(|error| error.to_string())?;
  let tags = serde_json::to_string(&value_vec(&input, "tags")).map_err(|error| error.to_string())?;
  let model = value_string(&input, "model");
  let preferred_model = {
    let preferred = value_string(&input, "preferredModel");
    if preferred.is_empty() { model.clone() } else { preferred }
  };

  conn.execute(
    "INSERT INTO favorite_prompts
     (id, name, slash_command, category, tags, description, model, preferred_model, content, variables, note,
      version, score, usage_count, success_rate, average_rating, direct_use_rate, modified_use_rate, discarded_rate,
      default_version_id, is_favorite, is_default, is_builtin, created_at, updated_at, last_used_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 1, 0, 0, 0, 0, 0, 0, 0, ?12, 1, ?13, 0, ?14, ?14, '')",
    params![
      id,
      value_string(&input, "name"),
      slash_command,
      value_string(&input, "category"),
      tags,
      value_string(&input, "description"),
      model,
      preferred_model,
      value_string(&input, "content"),
      variables,
      value_string(&input, "note"),
      version_id,
      if input["isDefault"].as_bool().unwrap_or(false) { 1 } else { 0 },
      now
    ],
  ).map_err(|error| error.to_string())?;

  conn.execute(
    "INSERT INTO prompt_versions (id, favorite_prompt_id, version, content, note, is_default, created_at)
     VALUES (?1, ?2, 1, ?3, 'Initial version', 1, ?4)",
    params![version_id, id, value_string(&input, "content"), now],
  ).map_err(|error| error.to_string())?;

  Ok(json!({
    "id": id,
    "name": value_string(&input, "name"),
    "slashCommand": slash_command,
    "category": value_string(&input, "category"),
    "tags": value_vec(&input, "tags"),
    "description": value_string(&input, "description"),
    "model": value_string(&input, "model"),
    "preferredModel": preferred_model,
    "content": value_string(&input, "content"),
    "variables": value_vec(&input, "variables"),
    "note": value_string(&input, "note"),
    "version": 1,
    "score": 0,
    "usageCount": 0,
    "successRate": 0,
    "averageRating": 0,
    "directUseRate": 0,
    "modifiedUseRate": 0,
    "discardedRate": 0,
    "defaultVersionId": version_id,
    "isFavorite": true,
    "isDefault": input["isDefault"].as_bool().unwrap_or(false),
    "createdAt": now,
    "updatedAt": now,
    "lastUsedAt": ""
  }))
}

#[tauri::command]
fn delete_favorite_prompt(id: String) -> Result<(), String> {
  let conn = open_database()?;
  conn.execute("DELETE FROM favorite_prompts WHERE id = ?1", params![id])
    .map_err(|error| error.to_string())?;
  Ok(())
}

#[tauri::command]
fn set_default_favorite_prompt(id: String) -> Result<(), String> {
  let conn = open_database()?;
  let now = Utc::now().to_rfc3339();
  conn.execute("UPDATE favorite_prompts SET is_default = 0", [])
    .map_err(|error| error.to_string())?;
  conn.execute(
    "UPDATE favorite_prompts SET is_default = 1, updated_at = ?1 WHERE id = ?2",
    params![now, id],
  ).map_err(|error| error.to_string())?;
  Ok(())
}

#[tauri::command]
fn list_prompt_versions(favorite_prompt_id: Option<String>) -> Result<Vec<Value>, String> {
  let conn = open_database()?;
  let filter = favorite_prompt_id.unwrap_or_default();
  let mut stmt = conn.prepare(
    "SELECT id, favorite_prompt_id, version, content, note, is_default, created_at, updated_at
     FROM prompt_versions
     WHERE (?1 = '' OR favorite_prompt_id = ?1)
     ORDER BY version DESC",
  ).map_err(|error| error.to_string())?;
  let rows = stmt.query_map(params![filter], |row| {
    Ok(json!({
      "id": row.get::<_, String>(0)?,
      "favoritePromptId": row.get::<_, String>(1)?,
      "version": row.get::<_, i64>(2)?,
      "content": row.get::<_, String>(3)?,
      "note": row.get::<_, String>(4)?,
      "isDefault": row.get::<_, i64>(5)? == 1,
      "createdAt": row.get::<_, String>(6)?,
      "updatedAt": row.get::<_, String>(7)?,
    }))
  }).map_err(|error| error.to_string())?;
  rows.collect::<Result<Vec<_>, _>>().map_err(|error| error.to_string())
}

#[tauri::command]
fn update_favorite_prompt_version(input: Value) -> Result<Value, String> {
  let conn = open_database()?;
  let id = Uuid::new_v4().to_string();
  let favorite_id = value_string(&input, "favoritePromptId");
  let now = Utc::now().to_rfc3339();
  let next_version: i64 = conn.query_row(
    "SELECT COALESCE(MAX(version), 0) + 1 FROM prompt_versions WHERE favorite_prompt_id = ?1",
    params![favorite_id],
    |row| row.get(0),
  ).map_err(|error| error.to_string())?;
  let set_default = input["setDefault"].as_bool().unwrap_or(false);
  if set_default {
    conn.execute("UPDATE prompt_versions SET is_default = 0, updated_at = ?1 WHERE favorite_prompt_id = ?2", params![now, favorite_id])
      .map_err(|error| error.to_string())?;
  }
  conn.execute(
    "INSERT INTO prompt_versions (id, favorite_prompt_id, version, content, note, is_default, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)",
    params![id, favorite_id, next_version, value_string(&input, "content"), value_string(&input, "note"), if set_default { 1 } else { 0 }, now],
  ).map_err(|error| error.to_string())?;
  if set_default {
    conn.execute(
      "UPDATE favorite_prompts SET content = ?1, default_version_id = ?2, version = ?3, updated_at = ?4 WHERE id = ?5",
      params![value_string(&input, "content"), id, next_version, now, value_string(&input, "favoritePromptId")],
    ).map_err(|error| error.to_string())?;
  }
  Ok(json!({
    "id": id,
    "favoritePromptId": value_string(&input, "favoritePromptId"),
    "version": next_version,
    "content": value_string(&input, "content"),
    "note": value_string(&input, "note"),
    "isDefault": set_default,
    "createdAt": now,
    "updatedAt": now
  }))
}

#[tauri::command]
fn set_default_prompt_version(favorite_prompt_id: String, version_id: String) -> Result<(), String> {
  let conn = open_database()?;
  let now = Utc::now().to_rfc3339();
  conn.execute("UPDATE prompt_versions SET is_default = 0, updated_at = ?1 WHERE favorite_prompt_id = ?2", params![now, favorite_prompt_id])
    .map_err(|error| error.to_string())?;
  let (content, version): (String, i64) = conn.query_row(
    "SELECT content, version FROM prompt_versions WHERE id = ?1",
    params![version_id],
    |row| Ok((row.get(0)?, row.get(1)?)),
  ).map_err(|error| error.to_string())?;
  conn.execute("UPDATE prompt_versions SET is_default = 1, updated_at = ?1 WHERE id = ?2", params![now, version_id])
    .map_err(|error| error.to_string())?;
  conn.execute(
    "UPDATE favorite_prompts SET content = ?1, default_version_id = ?2, version = ?3, updated_at = ?4 WHERE id = ?5",
    params![content, version_id, version, now, favorite_prompt_id],
  ).map_err(|error| error.to_string())?;
  Ok(())
}

#[tauri::command]
fn list_prompt_runs(favorite_prompt_id: Option<String>) -> Result<Vec<Value>, String> {
  let conn = open_database()?;
  let filter = favorite_prompt_id.unwrap_or_default();
  let mut stmt = conn.prepare(
    "SELECT id, favorite_prompt_id, version_id, input, output, model, created_at
     FROM prompt_runs WHERE (?1 = '' OR favorite_prompt_id = ?1) ORDER BY created_at DESC",
  ).map_err(|error| error.to_string())?;
  let rows = stmt.query_map(params![filter], |row| {
    Ok(json!({
      "id": row.get::<_, String>(0)?,
      "favoritePromptId": row.get::<_, String>(1)?,
      "versionId": row.get::<_, String>(2)?,
      "input": row.get::<_, String>(3)?,
      "output": row.get::<_, String>(4)?,
      "model": row.get::<_, String>(5)?,
      "createdAt": row.get::<_, String>(6)?,
    }))
  }).map_err(|error| error.to_string())?;
  rows.collect::<Result<Vec<_>, _>>().map_err(|error| error.to_string())
}

#[tauri::command]
fn clear_prompt_run_data() -> Result<(), String> {
  let conn = open_database()?;
  conn
    .execute("DELETE FROM prompt_eval_scores", [])
    .map_err(|error| error.to_string())?;
  conn
    .execute("DELETE FROM prompt_feedback", [])
    .map_err(|error| error.to_string())?;
  conn
    .execute("DELETE FROM prompt_runs", [])
    .map_err(|error| error.to_string())?;
  Ok(())
}

#[tauri::command]
fn create_prompt_run(input: Value) -> Result<Value, String> {
  let conn = open_database()?;
  let id = Uuid::new_v4().to_string();
  let now = Utc::now().to_rfc3339();
  conn.execute(
    "INSERT INTO prompt_runs (id, favorite_prompt_id, version_id, input, output, model, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
    params![id, value_string(&input, "favoritePromptId"), value_string(&input, "versionId"), value_string(&input, "input"), value_string(&input, "output"), value_string(&input, "model"), now],
  ).map_err(|error| error.to_string())?;
  conn.execute(
    "UPDATE favorite_prompts SET usage_count = usage_count + 1, updated_at = ?1, last_used_at = ?1 WHERE id = ?2",
    params![now, value_string(&input, "favoritePromptId")],
  ).map_err(|error| error.to_string())?;
  Ok(json!({
    "id": id,
    "favoritePromptId": value_string(&input, "favoritePromptId"),
    "versionId": value_string(&input, "versionId"),
    "input": value_string(&input, "input"),
    "output": value_string(&input, "output"),
    "model": value_string(&input, "model"),
    "createdAt": now
  }))
}

#[tauri::command]
fn list_prompt_feedback() -> Result<Vec<Value>, String> {
  let conn = open_database()?;
  let mut stmt = conn.prepare("SELECT id, run_id, rating, usage_result, problem_tags, note, created_at FROM prompt_feedback ORDER BY created_at DESC")
    .map_err(|error| error.to_string())?;
  let rows = stmt.query_map([], |row| {
    Ok(json!({
      "id": row.get::<_, String>(0)?,
      "runId": row.get::<_, String>(1)?,
      "rating": row.get::<_, i64>(2)?,
      "usageResult": row.get::<_, String>(3)?,
      "problemTags": read_json_vec(row.get(4)?),
      "note": row.get::<_, String>(5)?,
      "createdAt": row.get::<_, String>(6)?,
    }))
  }).map_err(|error| error.to_string())?;
  rows.collect::<Result<Vec<_>, _>>().map_err(|error| error.to_string())
}

#[tauri::command]
fn save_prompt_feedback(input: Value) -> Result<Value, String> {
  let conn = open_database()?;
  let id = Uuid::new_v4().to_string();
  let now = Utc::now().to_rfc3339();
  let tags = serde_json::to_string(&value_vec(&input, "problemTags")).map_err(|error| error.to_string())?;
  conn.execute(
    "INSERT INTO prompt_feedback (id, run_id, rating, usage_result, problem_tags, note, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
    params![id, value_string(&input, "runId"), input["rating"].as_i64().unwrap_or(3), value_string(&input, "usageResult"), tags, value_string(&input, "note"), now],
  ).map_err(|error| error.to_string())?;
  Ok(json!({
    "id": id,
    "runId": value_string(&input, "runId"),
    "rating": input["rating"].as_i64().unwrap_or(3),
    "usageResult": value_string(&input, "usageResult"),
    "problemTags": value_vec(&input, "problemTags"),
    "note": value_string(&input, "note"),
    "createdAt": now
  }))
}

#[tauri::command]
fn list_prompt_eval_scores() -> Result<Vec<Value>, String> {
  let conn = open_database()?;
  let mut stmt = conn.prepare(
    "SELECT id, run_id, structure_score, output_quality_score, user_satisfaction_score,
            real_usage_score, final_score, explanation, created_at
     FROM prompt_eval_scores ORDER BY created_at DESC",
  ).map_err(|error| error.to_string())?;
  let rows = stmt.query_map([], |row| {
    Ok(json!({
      "id": row.get::<_, String>(0)?,
      "runId": row.get::<_, String>(1)?,
      "structureScore": row.get::<_, f64>(2)?,
      "outputQualityScore": row.get::<_, f64>(3)?,
      "userSatisfactionScore": row.get::<_, f64>(4)?,
      "realUsageScore": row.get::<_, f64>(5)?,
      "finalScore": row.get::<_, f64>(6)?,
      "explanation": read_json_vec(row.get(7)?),
      "createdAt": row.get::<_, String>(8)?,
    }))
  }).map_err(|error| error.to_string())?;
  rows.collect::<Result<Vec<_>, _>>().map_err(|error| error.to_string())
}

#[tauri::command]
fn save_prompt_eval_score(score: Value) -> Result<Value, String> {
  let conn = open_database()?;
  let id = value_string(&score, "id");
  let explanation = serde_json::to_string(&value_vec(&score, "explanation")).map_err(|error| error.to_string())?;
  conn.execute(
    "INSERT INTO prompt_eval_scores
     (id, run_id, structure_score, output_quality_score, user_satisfaction_score, real_usage_score, final_score, explanation, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
    params![
      id,
      value_string(&score, "runId"),
      score["structureScore"].as_f64().unwrap_or(0.0),
      score["outputQualityScore"].as_f64().unwrap_or(0.0),
      score["userSatisfactionScore"].as_f64().unwrap_or(0.0),
      score["realUsageScore"].as_f64().unwrap_or(0.0),
      score["finalScore"].as_f64().unwrap_or(0.0),
      explanation,
      value_string(&score, "createdAt")
    ],
  ).map_err(|error| error.to_string())?;
  Ok(score)
}

#[tauri::command]
fn list_prompt_ab_tests(prompt_id: Option<String>) -> Result<Vec<Value>, String> {
  let conn = open_database()?;
  let filter = prompt_id.unwrap_or_default();
  let mut stmt = conn.prepare(
    "SELECT id, prompt_a_id, prompt_b_id, input, output_a, output_b, winner, created_at,
            model, reason, task_type, blind_mode
     FROM prompt_ab_tests
     WHERE (?1 = '' OR prompt_a_id = ?1 OR prompt_b_id = ?1)
     ORDER BY created_at DESC",
  ).map_err(|error| error.to_string())?;
  let rows = stmt.query_map(params![filter], |row| {
    Ok(json!({
      "id": row.get::<_, String>(0)?,
      "promptAId": row.get::<_, String>(1)?,
      "promptBId": row.get::<_, String>(2)?,
      "input": row.get::<_, String>(3)?,
      "outputA": row.get::<_, String>(4)?,
      "outputB": row.get::<_, String>(5)?,
      "winner": row.get::<_, String>(6)?,
      "createdAt": row.get::<_, String>(7)?,
      "model": row.get::<_, String>(8)?,
      "reason": row.get::<_, String>(9)?,
      "taskType": row.get::<_, String>(10)?,
      "blindMode": row.get::<_, i64>(11)? == 1,
    }))
  }).map_err(|error| error.to_string())?;
  rows.collect::<Result<Vec<_>, _>>().map_err(|error| error.to_string())
}

#[tauri::command]
fn save_prompt_ab_test(input: Value) -> Result<Value, String> {
  let conn = open_database()?;
  let id = Uuid::new_v4().to_string();
  let now = Utc::now().to_rfc3339();
  conn.execute(
    "INSERT INTO prompt_ab_tests (id, prompt_a_id, prompt_b_id, input, output_a, output_b, model, winner, reason, task_type, blind_mode, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
    params![
      id,
      value_string(&input, "promptAId"),
      value_string(&input, "promptBId"),
      value_string(&input, "input"),
      value_string(&input, "outputA"),
      value_string(&input, "outputB"),
      value_string(&input, "model"),
      value_string(&input, "winner"),
      value_string(&input, "reason"),
      value_string(&input, "taskType"),
      if input["blindMode"].as_bool().unwrap_or(false) { 1 } else { 0 },
      now
    ],
  ).map_err(|error| error.to_string())?;
  Ok(json!({
    "id": id,
    "promptAId": value_string(&input, "promptAId"),
    "promptBId": value_string(&input, "promptBId"),
    "input": value_string(&input, "input"),
    "outputA": value_string(&input, "outputA"),
    "outputB": value_string(&input, "outputB"),
    "model": value_string(&input, "model"),
    "winner": value_string(&input, "winner"),
    "reason": value_string(&input, "reason"),
    "taskType": value_string(&input, "taskType"),
    "blindMode": input["blindMode"].as_bool().unwrap_or(false),
    "createdAt": now
  }))
}

#[tauri::command]
fn list_voice_records() -> Result<Vec<Value>, String> {
  let conn = open_database()?;
  let mut stmt = conn.prepare(
    "SELECT id, transcript, cleaned_text, audio_path, duration_ms, transcription_mode, created_at, updated_at
     FROM voice_records
     ORDER BY created_at DESC",
  ).map_err(|error| error.to_string())?;
  let rows = stmt.query_map([], |row| {
    Ok(json!({
      "id": row.get::<_, String>(0)?,
      "transcript": row.get::<_, String>(1)?,
      "cleanedText": row.get::<_, String>(2)?,
      "audioPath": row.get::<_, String>(3)?,
      "durationMs": row.get::<_, i64>(4)?,
      "transcriptionMode": row.get::<_, String>(5)?,
      "createdAt": row.get::<_, String>(6)?,
      "updatedAt": row.get::<_, String>(7)?,
    }))
  }).map_err(|error| error.to_string())?;
  rows.collect::<Result<Vec<_>, _>>().map_err(|error| error.to_string())
}

#[tauri::command]
fn save_voice_record(record: Value) -> Result<Value, String> {
  let conn = open_database()?;
  conn.execute(
    "INSERT INTO voice_records
     (id, transcript, cleaned_text, audio_path, duration_ms, transcription_mode, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
    params![
      value_string(&record, "id"),
      value_string(&record, "transcript"),
      value_string(&record, "cleanedText"),
      value_string(&record, "audioPath"),
      record["durationMs"].as_i64().unwrap_or(0),
      value_string(&record, "transcriptionMode"),
      value_string(&record, "createdAt"),
      value_string(&record, "updatedAt"),
    ],
  ).map_err(|error| error.to_string())?;
  Ok(record)
}

#[tauri::command]
fn clear_voice_records() -> Result<(), String> {
  let conn = open_database()?;
  conn
    .execute("DELETE FROM voice_records", [])
    .map_err(|error| error.to_string())?;
  Ok(())
}

fn model_provider_json(row: &rusqlite::Row<'_>) -> rusqlite::Result<Value> {
  Ok(json!({
    "id": row.get::<_, String>(0)?,
    "providerName": row.get::<_, String>(1)?,
    "providerType": row.get::<_, String>(2)?,
    "baseUrl": row.get::<_, String>(3)?,
    "apiKey": row.get::<_, String>(4)?,
    "modelName": row.get::<_, String>(5)?,
    "temperature": row.get::<_, f64>(6)?,
    "maxTokens": row.get::<_, i64>(7)?,
    "stream": row.get::<_, i64>(8)? == 1,
    "timeout": row.get::<_, i64>(9)?,
    "isDefault": row.get::<_, i64>(10)? == 1,
    "enabled": row.get::<_, i64>(11)? == 1,
    "createdAt": row.get::<_, String>(12)?,
    "updatedAt": row.get::<_, String>(13)?,
  }))
}

#[tauri::command]
fn list_model_providers() -> Result<Vec<Value>, String> {
  let conn = open_database()?;
  let mut stmt = conn.prepare(
    "SELECT id, provider_name, provider_type, base_url, api_key, model_name, temperature, max_tokens,
            stream, timeout, is_default, enabled, created_at, updated_at
     FROM model_providers
     ORDER BY is_default DESC, updated_at DESC",
  ).map_err(|error| error.to_string())?;
  let rows = stmt.query_map([], model_provider_json).map_err(|error| error.to_string())?;
  let providers = rows.collect::<Result<Vec<_>, _>>().map_err(|error| error.to_string())?;
  if providers.is_empty() {
    Ok(vec![json!({
      "id": "provider-deepseek-default",
      "providerName": "DeepSeek",
      "providerType": "deepseek",
      "baseUrl": "https://api.deepseek.com",
      "apiKey": "",
      "modelName": "deepseek-chat",
      "temperature": 0.3,
      "maxTokens": 1800,
      "stream": false,
      "timeout": 30000,
      "isDefault": true,
      "enabled": true,
      "createdAt": "2026-05-06T00:00:00.000Z",
      "updatedAt": "2026-05-06T00:00:00.000Z"
    })])
  } else {
    Ok(providers)
  }
}

#[tauri::command]
fn save_model_provider(input: Value) -> Result<Value, String> {
  let conn = open_database()?;
  let now = Utc::now().to_rfc3339();
  let id = value_string(&input, "id");
  let provider_id = if id.is_empty() { Uuid::new_v4().to_string() } else { id };
  let is_default = input["isDefault"].as_bool().unwrap_or(false);
  if is_default {
    conn.execute("UPDATE model_providers SET is_default = 0, updated_at = ?1", params![now])
      .map_err(|error| error.to_string())?;
  }
  conn.execute(
    "INSERT INTO model_providers
     (id, provider_name, provider_type, base_url, api_key, model_name, temperature, max_tokens,
      stream, timeout, is_default, enabled, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?13)
     ON CONFLICT(id) DO UPDATE SET
      provider_name = excluded.provider_name,
      provider_type = excluded.provider_type,
      base_url = excluded.base_url,
      api_key = excluded.api_key,
      model_name = excluded.model_name,
      temperature = excluded.temperature,
      max_tokens = excluded.max_tokens,
      stream = excluded.stream,
      timeout = excluded.timeout,
      is_default = excluded.is_default,
      enabled = excluded.enabled,
      updated_at = excluded.updated_at",
    params![
      provider_id,
      value_string(&input, "providerName"),
      value_string(&input, "providerType"),
      value_string(&input, "baseUrl"),
      value_string(&input, "apiKey"),
      value_string(&input, "modelName"),
      input["temperature"].as_f64().unwrap_or(0.7),
      input["maxTokens"].as_i64().unwrap_or(4096),
      if input["stream"].as_bool().unwrap_or(false) { 1 } else { 0 },
      input["timeout"].as_i64().unwrap_or(30000),
      if is_default { 1 } else { 0 },
      if input["enabled"].as_bool().unwrap_or(true) { 1 } else { 0 },
      now,
    ],
  ).map_err(|error| error.to_string())?;
  let mut providers = list_model_providers()?;
  providers.retain(|provider| provider["id"].as_str() == Some(provider_id.as_str()));
  providers.into_iter().next().ok_or_else(|| "Provider was not saved".to_string())
}

#[tauri::command]
fn delete_model_provider(id: String) -> Result<(), String> {
  let conn = open_database()?;
  conn.execute("DELETE FROM model_providers WHERE id = ?1", params![id])
    .map_err(|error| error.to_string())?;
  Ok(())
}

#[tauri::command]
fn set_default_model_provider(id: String) -> Result<(), String> {
  let conn = open_database()?;
  let now = Utc::now().to_rfc3339();
  conn.execute("UPDATE model_providers SET is_default = CASE WHEN id = ?1 THEN 1 ELSE 0 END, updated_at = ?2", params![id, now])
    .map_err(|error| error.to_string())?;
  Ok(())
}

#[tauri::command]
async fn test_model_provider(id: String) -> Result<ProviderTestResult, String> {
  let provider = list_model_providers()?.into_iter().find(|provider| provider["id"].as_str() == Some(id.as_str()));
  let Some(provider) = provider else {
    return Ok(ProviderTestResult { ok: false, message: "Provider not found".to_string() });
  };
  let provider_type = provider["providerType"].as_str().unwrap_or("");
  let api_key = provider["apiKey"].as_str().unwrap_or("");
  if provider_type != "ollama" && api_key.trim().is_empty() {
    return Ok(ProviderTestResult { ok: false, message: "API Key is required".to_string() });
  }
  let base_url = provider["baseUrl"].as_str().unwrap_or("");
  let endpoint = resolve_chat_endpoint(provider_type, base_url);
  let timeout_ms = provider["timeout"].as_u64().unwrap_or(30000).max(1000);
  let body = json!({
    "model": provider["modelName"].as_str().unwrap_or(""),
    "temperature": provider["temperature"].as_f64().unwrap_or(0.3),
    "max_tokens": 32,
    "messages": [
      { "role": "user", "content": "Return OK for a PromptBall connection test." }
    ]
  });
  match call_chat_completions(&endpoint, api_key, &body, timeout_ms).await {
    Ok(_) => Ok(ProviderTestResult {
      ok: true,
      message: "连接成功".to_string(),
    }),
    Err(message) => Ok(ProviderTestResult {
      ok: false,
      message,
    }),
  }
}

#[tauri::command]
fn list_task_model_bindings() -> Result<Vec<Value>, String> {
  let conn = open_database()?;
  let mut stmt = conn.prepare(
    "SELECT id, task_type, provider_id, created_at, updated_at
     FROM task_model_bindings
     ORDER BY task_type ASC",
  ).map_err(|error| error.to_string())?;
  let rows = stmt.query_map([], |row| {
    Ok(json!({
      "id": row.get::<_, String>(0)?,
      "taskType": row.get::<_, String>(1)?,
      "providerId": row.get::<_, String>(2)?,
      "createdAt": row.get::<_, String>(3)?,
      "updatedAt": row.get::<_, String>(4)?,
    }))
  }).map_err(|error| error.to_string())?;
  rows.collect::<Result<Vec<_>, _>>().map_err(|error| error.to_string())
}

#[tauri::command]
fn save_task_model_binding(binding: Value) -> Result<Value, String> {
  let conn = open_database()?;
  let now = Utc::now().to_rfc3339();
  let id = value_string(&binding, "id");
  let binding_id = if id.is_empty() { Uuid::new_v4().to_string() } else { id };
  conn.execute(
    "INSERT INTO task_model_bindings (id, task_type, provider_id, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?4)
     ON CONFLICT(task_type) DO UPDATE SET provider_id = excluded.provider_id, updated_at = excluded.updated_at",
    params![binding_id, value_string(&binding, "taskType"), value_string(&binding, "providerId"), now],
  ).map_err(|error| error.to_string())?;
  Ok(json!({
    "id": binding_id,
    "taskType": value_string(&binding, "taskType"),
    "providerId": value_string(&binding, "providerId"),
    "createdAt": now,
    "updatedAt": now
  }))
}

#[tauri::command]
fn list_model_call_logs() -> Result<Vec<Value>, String> {
  let conn = open_database()?;
  let mut stmt = conn.prepare(
    "SELECT id, provider_id, model_name, task_type, duration_ms, prompt_tokens, completion_tokens,
            estimated_cost, ok, error_message, created_at, updated_at
     FROM model_call_logs
     ORDER BY created_at DESC
     LIMIT 100",
  ).map_err(|error| error.to_string())?;
  let rows = stmt.query_map([], |row| {
    Ok(json!({
      "id": row.get::<_, String>(0)?,
      "providerId": row.get::<_, String>(1)?,
      "modelName": row.get::<_, String>(2)?,
      "taskType": row.get::<_, String>(3)?,
      "durationMs": row.get::<_, i64>(4)?,
      "promptTokens": row.get::<_, i64>(5)?,
      "completionTokens": row.get::<_, i64>(6)?,
      "estimatedCost": row.get::<_, f64>(7)?,
      "ok": row.get::<_, i64>(8)? == 1,
      "errorMessage": row.get::<_, String>(9)?,
      "createdAt": row.get::<_, String>(10)?,
      "updatedAt": row.get::<_, String>(11)?,
    }))
  }).map_err(|error| error.to_string())?;
  rows.collect::<Result<Vec<_>, _>>().map_err(|error| error.to_string())
}

#[tauri::command]
fn clear_model_call_logs() -> Result<(), String> {
  let conn = open_database()?;
  conn
    .execute("DELETE FROM model_call_logs", [])
    .map_err(|error| error.to_string())?;
  Ok(())
}

// ──────────────────────────────────────────────
// 共享 HTTP 调用辅助函数
// ──────────────────────────────────────────────

/// 根据 provider_type 和 base_url 解析 chat completions 端点
fn resolve_chat_endpoint(provider_type: &str, base_url: &str) -> String {
  let base = base_url.trim_end_matches('/');
  if provider_type == "ollama" && !base.ends_with("/v1") {
    format!("{}/v1/chat/completions", base)
  } else {
    format!("{}/chat/completions", base)
  }
}

/// 是否支持 response_format: json_object（Ollama 本地模型通常不支持）
fn supports_response_format_json(provider_type: &str) -> bool {
  provider_type != "ollama"
}

/// 发送 chat completions 请求，返回 content 字符串
async fn call_chat_completions(
  endpoint: &str,
  api_key: &str,
  body: &Value,
  timeout_ms: u64,
) -> Result<String, String> {
  let client = reqwest::Client::builder()
    .timeout(Duration::from_millis(timeout_ms))
    .build()
    .map_err(|error| error.to_string())?;

  let mut request = client.post(endpoint).json(body);
  if !api_key.trim().is_empty() {
    request = request.bearer_auth(api_key);
  }

  let response = request.send().await.map_err(|error| error.to_string())?;

  if !response.status().is_success() {
    let status = response.status();
    let body_text = response.text().await.unwrap_or_default();
    let message = if body_text.is_empty() {
      format!("Provider HTTP {}", status)
    } else {
      // 截断超长 body 避免 toast 溢出
      let truncated = if body_text.len() > 300 { &body_text[..300] } else { &body_text };
      format!("Provider HTTP {}: {}", status, truncated)
    };
    return Err(message);
  }

  let value: Value = response.json().await.map_err(|error| error.to_string())?;
  value["choices"][0]["message"]["content"]
    .as_str()
    .ok_or_else(|| "响应中未找到 message.content 字段，请检查模型名称是否正确".to_string())
    .map(|s| s.to_string())
}

#[tauri::command]
async fn optimize_prompt(payload: OptimizePayload) -> Result<Value, String> {
  let conn = open_database()?;
  let (provider_id, provider_type, settings, requires_api_key, timeout_ms) = read_active_provider_settings(&conn)?;
  let started_at = Instant::now();
  let prompt_tokens = (payload.prompt.chars().count() as i64 / 4).max(1);

  if requires_api_key && settings.api_key.trim().is_empty() {
    let _ = write_model_call_log(&conn, &provider_id, &settings.model, "optimizer", 0, prompt_tokens, 0, false, "API Key is not configured");
    return Err("未配置 API Key，请在设置中添加模型供应商并填写 API Key".to_string());
  }

  let endpoint = resolve_chat_endpoint(&provider_type, &settings.base_url);

  // 构建请求体，Ollama 等本地模型可能不支持 response_format
  let mut body_map = serde_json::Map::new();
  body_map.insert("model".to_string(), json!(settings.model));
  body_map.insert("temperature".to_string(), json!(settings.temperature));
  body_map.insert("max_tokens".to_string(), json!(settings.max_tokens));
  if supports_response_format_json(&provider_type) {
    body_map.insert("response_format".to_string(), json!({ "type": "json_object" }));
  }
  body_map.insert("messages".to_string(), json!([
    {
      "role": "system",
      "content": "你是 PromptBall 专属的 Prompt 工程师，深度理解提示词架构、认知科学和 AI 行为模式。你的职责是将用户草稿 Prompt 重构为具备工业级质量的可执行 Prompt，而非简单润色。\n\n【诊断维度】\n- 意图识别：任务类型（创作/分析/代码/对话/搜索/转换/教学/评估）、目标受众、使用场景、期望产物\n- 结构缺失：角色定义、背景上下文、目标层级、执行步骤、输出格式、质量标准、约束边界\n- 歧义排查：模糊词汇（如"简短""详细""专业"无量化定义）、隐含假设、未定义术语、逻辑漏洞\n- 反模式识别：指令过载、矛盾约束、无法客观验证的标准、潜在提示注入风险\n\n【优化七原则】\n1. 角色锚定：精确定义 AI 身份和专业背景（如"你是拥有10年 Python 经验的高级后端工程师"）\n2. 上下文注入：提供受众背景、使用平台、已知数据约束、领域知识边界\n3. 任务分解：复杂任务用编号步骤拆解，避免单一模糊大指令，关键步骤加「输出检查点」\n4. 输出规范：明确格式（Markdown/JSON/表格/代码块）、长度范围、语气风格、示例结构\n5. 质量卡点：给出可量化的自检标准（如"每个要点必须有至少一个具体例子或数据支撑"）\n6. 负向约束：明确禁止项（如"不得编造数据""不得使用行话"），防止不需要的输出模式\n7. 思维激活：对推理型任务加入"先列出分析框架再给出结论"或 Chain-of-Thought 引导\n\n【保留原则】\n- 严格保留用户核心意图，不添加用户未提及的业务假设或扩写虚构信息\n- 用【可替换：说明】标注需要用户填写的动态变量\n- 保持语言风格与用户输入一致（中文输入返回中文优化版本）\n- 若原始 Prompt 已很完善，只做最小化精确补充，不强制过度结构化\n\n【评分维度说明】\n- 意图清晰度（0-100）：Prompt 是否准确无歧义地传达用户真实意图\n- 结构完整性（0-100）：角色/目标/背景/步骤/输出格式/约束是否齐备\n- 可执行性（0-100）：AI 是否能无歧义理解并完成任务，无须追问\n- 输出可控性（0-100）：格式和质量标准是否可预期，结果是否稳定可复现\n- 鲁棒性（0-100）：边缘情况、歧义输入和反模式是否被充分处理\n\n必须返回合法 JSON，不得有任何前缀文字、代码块标记或 markdown。"
    },
    {
      "role": "user",
      "content": format!(
        "请分析并优化以下 Prompt，严格返回 JSON（字段含义：taskRecognition=任务类型识别, diagnosis=问题诊断, optimizedPrompt=优化后Prompt全文, missingInformation=缺失信息列表, suggestions=改进建议, trainingTips=进阶使用技巧, score.total=综合分0-100, score.dimensions=各维度评分）：\n{{\"taskRecognition\": string, \"diagnosis\": string, \"optimizedPrompt\": string, \"missingInformation\": string[], \"suggestions\": string[], \"trainingTips\": string[], \"score\": {{\"total\": number, \"dimensions\": [{{\"label\": string, \"score\": number, \"suggestion\": string}}]}}}}\n\n原始 Prompt：\n{}",
        payload.prompt
      )
    }
  ]));
  let body = Value::Object(body_map);

  let content = match call_chat_completions(&endpoint, &settings.api_key, &body, timeout_ms).await {
    Ok(c) => c,
    Err(message) => {
      let _ = write_model_call_log(&conn, &provider_id, &settings.model, "optimizer", started_at.elapsed().as_millis() as i64, prompt_tokens, 0, false, &message);
      return Err(message);
    }
  };

  let parsed = parse_provider_json_content(&content)?;
  let completion_tokens = (content.chars().count() as i64 / 4).max(1);
  let _ = write_model_call_log(&conn, &provider_id, &settings.model, "optimizer", started_at.elapsed().as_millis() as i64, prompt_tokens, completion_tokens, true, "");
  Ok(parsed)
}

/// 直接用 system_prompt + user_input 调用当前激活的模型，返回原始回复文本。
/// 用于 A/B 测试：两个不同的 Prompt 对同一份测试材料各自生成真实输出，供人工对比。
#[tauri::command]
async fn run_prompt_direct(system_prompt: String, user_input: String) -> Result<String, String> {
  let conn = open_database()?;
  let (provider_id, provider_type, settings, requires_api_key, timeout_ms) = read_active_provider_settings(&conn)?;
  let started_at = Instant::now();
  let prompt_tokens = ((system_prompt.chars().count() + user_input.chars().count()) as i64 / 4).max(1);

  if requires_api_key && settings.api_key.trim().is_empty() {
    let _ = write_model_call_log(&conn, &provider_id, &settings.model, "ab_test", 0, prompt_tokens, 0, false, "API Key is not configured");
    return Err("未配置 API Key，请在设置中添加模型供应商并填写 API Key".to_string());
  }

  let endpoint = resolve_chat_endpoint(&provider_type, &settings.base_url);

  let mut body_map = serde_json::Map::new();
  body_map.insert("model".to_string(), json!(settings.model));
  body_map.insert("temperature".to_string(), json!(settings.temperature));
  body_map.insert("max_tokens".to_string(), json!(settings.max_tokens));
  body_map.insert("messages".to_string(), json!([
    { "role": "system", "content": system_prompt },
    { "role": "user", "content": user_input }
  ]));
  let body = Value::Object(body_map);

  let content = match call_chat_completions(&endpoint, &settings.api_key, &body, timeout_ms).await {
    Ok(c) => c,
    Err(message) => {
      let _ = write_model_call_log(&conn, &provider_id, &settings.model, "ab_test", started_at.elapsed().as_millis() as i64, prompt_tokens, 0, false, &message);
      return Err(message);
    }
  };
  let completion_tokens = (content.chars().count() as i64 / 4).max(1);
  let _ = write_model_call_log(&conn, &provider_id, &settings.model, "ab_test", started_at.elapsed().as_millis() as i64, prompt_tokens, completion_tokens, true, "");
  Ok(content)
}

#[tauri::command]
async fn test_provider_connection() -> Result<ProviderTestResult, String> {
  let result = optimize_prompt(OptimizePayload {
    prompt: "请返回一个最小 JSON，用于测试 PromptBall DeepSeek 连接。".to_string(),
  })
  .await;

  match result {
    Ok(_) => Ok(ProviderTestResult {
      ok: true,
      message: "连接成功".to_string(),
    }),
    Err(error) => Ok(ProviderTestResult {
      ok: false,
      message: error,
    }),
  }
}

pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .on_window_event(|window, event| {
      if let WindowEvent::CloseRequested { api, .. } = event {
        api.prevent_close();
        let _ = window.hide();
      }
    })
    .setup(|app| {
      let _ = open_database();
      let _ = setup_tray(app);
      if let Some(window) = app.get_webview_window("main") {
        let _ = dock_window_right(window);
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      dock_window_right,
      get_current_user,
      register_user,
      login_user,
      logout_user,
      get_settings,
      save_settings,
      get_app_preferences,
      save_app_preferences,
      list_prompt_history,
      save_prompt_history,
      delete_prompt_history,
      clear_prompt_history,
      toggle_favorite_prompt,
      list_templates,
      save_template,
      delete_template,
      list_favorite_prompts,
      save_favorite_prompt,
      delete_favorite_prompt,
      set_default_favorite_prompt,
      list_prompt_versions,
      update_favorite_prompt_version,
      set_default_prompt_version,
      list_prompt_runs,
      clear_prompt_run_data,
      create_prompt_run,
      list_prompt_feedback,
      save_prompt_feedback,
      list_prompt_eval_scores,
      save_prompt_eval_score,
      list_prompt_ab_tests,
      save_prompt_ab_test,
      list_voice_records,
      save_voice_record,
      clear_voice_records,
      list_model_providers,
      save_model_provider,
      delete_model_provider,
      set_default_model_provider,
      test_model_provider,
      list_task_model_bindings,
      save_task_model_binding,
      list_model_call_logs,
      clear_model_call_logs,
      optimize_prompt,
      run_prompt_direct,
      test_provider_connection
    ])
    .run(tauri::generate_context!())
    .expect("error while running PromptBall");
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn parses_json_from_fenced_block_after_think_prefix() {
    let content = "<think>{not json}</think>\n```json\n{\"optimizedPrompt\":\"from fence\",\"score\":{\"total\":91}}\n```";
    let parsed = parse_provider_json_content(content).expect("fenced JSON should parse");

    assert_eq!(parsed["optimizedPrompt"], "from fence");
    assert_eq!(parsed["score"]["total"], 91);
  }
}
