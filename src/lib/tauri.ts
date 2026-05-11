import { invoke } from "@tauri-apps/api/core";
import type {
  ABWinner,
  FavoritePromptInput,
  FavoritePrompt,
  OptimizerResult,
  PromptABTestRecord,
  PromptEvalScore,
  PromptFeedback,
  PromptHistoryItem,
  PromptMode,
  PromptRun,
  PromptScore,
  PromptTemplate,
  PromptVersion,
  ModelProvider,
  ModelProviderInput,
  TaskModelBinding,
  ModelCallLog,
  ProviderSettings,
  ProviderTestResult,
  AppPreferences,
  VoiceRecord,
  LocalUser,
} from "@/types";
import { normalizeAppPreferences } from "@/features/floating-ball/floating-ball";
import { markDefaultFavoritePrompt, mergeDefaultFavoritePrompts, normalizeFavoritePrompt } from "./favorites";
import { createLocalOptimizerResult } from "./provider";
import { DEFAULT_MODEL_PROVIDER, markDefaultModelProvider, normalizeModelProvider } from "@/services/model-config";
import { normalizePromptTemplate } from "./templates";

const defaultSettings: ProviderSettings = {
  apiKey: "",
  baseUrl: import.meta.env.VITE_DEFAULT_BASE_URL ?? "https://api.deepseek.com",
  model: import.meta.env.VITE_DEFAULT_MODEL ?? "deepseek-chat",
  temperature: 0.3,
  maxTokens: 1800,
};

export async function getCurrentUser(): Promise<LocalUser | null> {
  if (isTauriRuntime()) {
    return invoke<LocalUser | null>("get_current_user");
  }
  return readStorage<LocalUser | null>("promptball.currentUser", null);
}

export async function registerUser(username: string, password: string): Promise<LocalUser> {
  if (isTauriRuntime()) {
    return invoke<LocalUser>("register_user", { username, password });
  }
  const users = readStorage<Array<LocalUser & { password: string }>>("promptball.users", []);
  if (users.some((user) => user.username === username.trim())) {
    throw new Error("用户名已存在");
  }
  const now = new Date().toISOString();
  const user = { id: crypto.randomUUID(), username: username.trim(), password, createdAt: now, updatedAt: now };
  writeStorage("promptball.users", [user, ...users]);
  writeStorage("promptball.currentUser", { id: user.id, username: user.username, createdAt: user.createdAt, updatedAt: user.updatedAt });
  return { id: user.id, username: user.username, createdAt: user.createdAt, updatedAt: user.updatedAt };
}

export async function loginUser(username: string, password: string): Promise<LocalUser> {
  if (isTauriRuntime()) {
    return invoke<LocalUser>("login_user", { username, password });
  }
  const user = readStorage<Array<LocalUser & { password: string }>>("promptball.users", []).find(
    (item) => item.username === username.trim() && item.password === password,
  );
  if (!user) {
    throw new Error("用户名或密码错误");
  }
  const current = { id: user.id, username: user.username, createdAt: user.createdAt, updatedAt: user.updatedAt };
  writeStorage("promptball.currentUser", current);
  return current;
}

export async function logoutUser(): Promise<void> {
  if (isTauriRuntime()) {
    return invoke("logout_user");
  }
  localStorage.removeItem("promptball.currentUser");
}

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function getSettings(): Promise<ProviderSettings> {
  if (isTauriRuntime()) {
    return invoke<ProviderSettings>("get_settings");
  }
  return readStorage("promptball.settings", defaultSettings);
}

export async function saveSettings(settings: ProviderSettings): Promise<ProviderSettings> {
  if (isTauriRuntime()) {
    return invoke<ProviderSettings>("save_settings", { settings });
  }
  writeStorage("promptball.settings", settings);
  return settings;
}

export async function getAppPreferences(): Promise<AppPreferences> {
  if (isTauriRuntime()) {
    return normalizeAppPreferences(await invoke<AppPreferences>("get_app_preferences"));
  }
  return normalizeAppPreferences(readStorage<Partial<AppPreferences>>("promptball.appPreferences", {}));
}

export async function saveAppPreferences(preferences: AppPreferences): Promise<AppPreferences> {
  const normalized = normalizeAppPreferences(preferences);
  if (isTauriRuntime()) {
    return normalizeAppPreferences(await invoke<AppPreferences>("save_app_preferences", { preferences: normalized }));
  }
  writeStorage("promptball.appPreferences", normalized);
  return normalized;
}

export async function optimizePrompt(prompt: string): Promise<OptimizerResult> {
  if (isTauriRuntime()) {
    try {
      return await invoke<OptimizerResult>("optimize_prompt", { payload: { prompt } });
    } catch {
      return createLocalOptimizerResult(prompt);
    }
  }
  return createLocalOptimizerResult(prompt);
}

export async function runPromptDirect(systemPrompt: string, userInput: string): Promise<string> {
  if (isTauriRuntime()) {
    return invoke<string>("run_prompt_direct", { systemPrompt, userInput });
  }
  // 浏览器预览模式：返回模拟输出
  return `[浏览器预览模式] 系统 Prompt：${systemPrompt.slice(0, 60)}…\n\n用户输入：${userInput.slice(0, 60)}…`;
}

export async function testProviderConnection(): Promise<ProviderTestResult> {
  if (isTauriRuntime()) {
    return invoke<ProviderTestResult>("test_provider_connection");
  }
  const settings = await getSettings();
  return {
    ok: Boolean(settings.apiKey.trim()),
    message: settings.apiKey.trim() ? "浏览器预览模式无法直接测试后端连接，请在 Tauri 中运行。" : "请先配置 API Key。",
  };
}

export async function listModelProviders(): Promise<ModelProvider[]> {
  if (isTauriRuntime()) {
    return invoke<ModelProvider[]>("list_model_providers");
  }
  const providers = readStorage<ModelProvider[]>("promptball.modelProviders", []);
  return providers.length ? providers : [DEFAULT_MODEL_PROVIDER];
}

export async function saveModelProvider(input: ModelProviderInput): Promise<ModelProvider> {
  if (isTauriRuntime()) {
    return invoke<ModelProvider>("save_model_provider", { input: normalizeModelProvider(input) });
  }
  const provider = normalizeModelProvider(input);
  const providers = readStorage<ModelProvider[]>("promptball.modelProviders", []);
  const withoutCurrent = providers.filter((item) => item.id !== provider.id);
  const next = provider.isDefault ? markDefaultModelProvider([provider, ...withoutCurrent], provider.id) : [provider, ...withoutCurrent];
  writeStorage("promptball.modelProviders", next);
  return provider;
}

export async function deleteModelProvider(id: string): Promise<void> {
  if (isTauriRuntime()) {
    return invoke("delete_model_provider", { id });
  }
  writeStorage(
    "promptball.modelProviders",
    readStorage<ModelProvider[]>("promptball.modelProviders", []).filter((provider) => provider.id !== id),
  );
}

export async function setDefaultModelProvider(id: string): Promise<void> {
  if (isTauriRuntime()) {
    return invoke("set_default_model_provider", { id });
  }
  writeStorage("promptball.modelProviders", markDefaultModelProvider(await listModelProviders(), id));
}

export async function testModelProvider(id: string): Promise<ProviderTestResult> {
  if (isTauriRuntime()) {
    return invoke<ProviderTestResult>("test_model_provider", { id });
  }
  const provider = (await listModelProviders()).find((item) => item.id === id);
  return {
    ok: Boolean(provider?.enabled && (provider.providerType === "ollama" || provider.apiKey.trim())),
    message: provider ? "Browser preview cannot call providers directly. Run in Tauri to test the network path." : "Provider not found.",
  };
}

export async function listTaskModelBindings(): Promise<TaskModelBinding[]> {
  if (isTauriRuntime()) {
    return invoke<TaskModelBinding[]>("list_task_model_bindings");
  }
  return readStorage("promptball.taskModelBindings", []);
}

export async function saveTaskModelBinding(binding: TaskModelBinding): Promise<TaskModelBinding> {
  if (isTauriRuntime()) {
    return invoke<TaskModelBinding>("save_task_model_binding", { binding });
  }
  const bindings = readStorage<TaskModelBinding[]>("promptball.taskModelBindings", []);
  writeStorage("promptball.taskModelBindings", [binding, ...bindings.filter((item) => item.id !== binding.id)]);
  return binding;
}

export async function listModelCallLogs(): Promise<ModelCallLog[]> {
  if (isTauriRuntime()) {
    return invoke<ModelCallLog[]>("list_model_call_logs");
  }
  return readStorage("promptball.modelCallLogs", []);
}

export async function listPromptHistory(query = ""): Promise<PromptHistoryItem[]> {
  if (isTauriRuntime()) {
    return invoke<PromptHistoryItem[]>("list_prompt_history", { query });
  }
  const items = readStorage<PromptHistoryItem[]>("promptball.history", []);
  return items.filter((item) => `${item.originalPrompt} ${item.optimizedPrompt} ${item.tags.join(" ")}`.includes(query));
}

export async function savePromptHistory(input: {
  originalPrompt: string;
  optimizedPrompt: string;
  diagnosis: string;
  suggestions: string[];
  trainingTips: string[];
  score: PromptScore;
  model: string;
  mode: PromptMode;
  tags: string[];
}): Promise<PromptHistoryItem> {
  if (isTauriRuntime()) {
    return invoke<PromptHistoryItem>("save_prompt_history", { input });
  }
  const item: PromptHistoryItem = {
    id: crypto.randomUUID(),
    ...input,
    favorite: false,
    createdAt: new Date().toISOString(),
  };
  const current = readStorage<PromptHistoryItem[]>("promptball.history", []);
  writeStorage("promptball.history", [item, ...current]);
  return item;
}

export async function deletePromptHistory(id: string): Promise<void> {
  if (isTauriRuntime()) {
    return invoke("delete_prompt_history", { id });
  }
  writeStorage(
    "promptball.history",
    readStorage<PromptHistoryItem[]>("promptball.history", []).filter((item) => item.id !== id),
  );
}

export async function clearPromptHistory(): Promise<void> {
  if (isTauriRuntime()) {
    return invoke("clear_prompt_history");
  }
  writeStorage("promptball.history", []);
}

export async function toggleFavoritePrompt(id: string): Promise<void> {
  if (isTauriRuntime()) {
    return invoke("toggle_favorite_prompt", { id });
  }
  writeStorage(
    "promptball.history",
    readStorage<PromptHistoryItem[]>("promptball.history", []).map((item) =>
      item.id === id ? { ...item, favorite: !item.favorite } : item,
    ),
  );
}

export async function listCustomTemplates(): Promise<PromptTemplate[]> {
  let templates: PromptTemplate[];
  if (isTauriRuntime()) {
    templates = await invoke<PromptTemplate[]>("list_templates");
  } else {
    templates = readStorage("promptball.templates", []);
  }
  return templates.map((template) => normalizePromptTemplate(template));
}

export async function saveCustomTemplate(input: {
  title: string;
  category: string;
  description: string;
  scenario?: string;
  applicableModels?: string[];
  variables?: string[];
  content: string;
  outputExample?: string;
  evaluationCriteria?: string[];
  tags?: string[];
}): Promise<PromptTemplate> {
  if (isTauriRuntime()) {
    return invoke<PromptTemplate>("save_template", { input });
  }
  const item: PromptTemplate = {
    id: crypto.randomUUID(),
    title: input.title,
    category: input.category,
    description: input.description,
    scenario: input.scenario ?? input.description,
    applicableModels: input.applicableModels?.length ? input.applicableModels : ["deepseek-chat"],
    variables: input.variables ?? [],
    content: input.content,
    outputExample: input.outputExample ?? "",
    evaluationCriteria: input.evaluationCriteria ?? [],
    tags: input.tags ?? [],
    isBuiltin: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeStorage("promptball.templates", [item, ...readStorage<PromptTemplate[]>("promptball.templates", [])]);
  return item;
}

export async function deleteCustomTemplate(id: string): Promise<void> {
  if (isTauriRuntime()) {
    return invoke("delete_template", { id });
  }
  writeStorage(
    "promptball.templates",
    readStorage<PromptTemplate[]>("promptball.templates", []).filter((item) => item.id !== id),
  );
}

export async function dockWindowRight(): Promise<void> {
  if (isTauriRuntime()) {
    await invoke("dock_window_right");
  }
}

export async function listFavoritePrompts(): Promise<FavoritePrompt[]> {
  let prompts: FavoritePrompt[];
  if (isTauriRuntime()) {
    prompts = await invoke<FavoritePrompt[]>("list_favorite_prompts");
  } else {
    prompts = readStorage("promptball.favoritePrompts", []);
  }
  return mergeDefaultFavoritePrompts(prompts.map((prompt) => normalizeFavoritePrompt(prompt)));
}

export async function saveFavoritePrompt(input: FavoritePromptInput): Promise<FavoritePrompt> {
  const normalizedInput = normalizeFavoritePrompt(input);
  if (isTauriRuntime()) {
    return normalizeFavoritePrompt(await invoke<FavoritePrompt>("save_favorite_prompt", { input: normalizedInput }));
  }
  const now = new Date().toISOString();
  const versionId = crypto.randomUUID();
  const item = normalizeFavoritePrompt({
    ...normalizedInput,
    id: crypto.randomUUID(),
    defaultVersionId: versionId,
    createdAt: now,
    updatedAt: now,
  });
  const version: PromptVersion = {
    id: versionId,
    favoritePromptId: item.id,
    version: 1,
    content: item.content,
    note: "Initial version",
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  };
  writeStorage(
    "promptball.favoritePrompts",
    [item, ...readStorage<FavoritePrompt[]>("promptball.favoritePrompts", [])].filter((prompt) => !prompt.isBuiltin),
  );
  writeStorage("promptball.promptVersions", [version, ...readStorage<PromptVersion[]>("promptball.promptVersions", [])]);
  return item;
}

export async function updateFavoritePromptVersion(input: {
  favoritePromptId: string;
  content: string;
  note: string;
  setDefault: boolean;
}): Promise<PromptVersion> {
  if (isTauriRuntime()) {
    return invoke<PromptVersion>("update_favorite_prompt_version", { input });
  }
  const versions = readStorage<PromptVersion[]>("promptball.promptVersions", []);
  const promptVersions = versions.filter((version) => version.favoritePromptId === input.favoritePromptId);
  const nextNumber = Math.max(0, ...promptVersions.map((version) => version.version)) + 1;
  const version: PromptVersion = {
    id: crypto.randomUUID(),
    favoritePromptId: input.favoritePromptId,
    version: nextNumber,
    content: input.content,
    note: input.note,
    isDefault: input.setDefault,
    createdAt: new Date().toISOString(),
  };
  version.updatedAt = version.createdAt;
  const nextVersions = versions.map((item) =>
    input.setDefault && item.favoritePromptId === input.favoritePromptId ? { ...item, isDefault: false } : item,
  );
  writeStorage("promptball.promptVersions", [version, ...nextVersions]);
  if (input.setDefault) {
    writeStorage(
      "promptball.favoritePrompts",
      readStorage<FavoritePrompt[]>("promptball.favoritePrompts", []).map((prompt) =>
        prompt.id === input.favoritePromptId
          ? { ...prompt, content: input.content, defaultVersionId: version.id, version: version.version, updatedAt: version.createdAt }
          : prompt,
      ),
    );
  }
  return version;
}

export async function setDefaultPromptVersion(favoritePromptId: string, versionId: string): Promise<void> {
  if (isTauriRuntime()) {
    return invoke("set_default_prompt_version", { favoritePromptId, versionId });
  }
  const versions = readStorage<PromptVersion[]>("promptball.promptVersions", []);
  const selected = versions.find((version) => version.id === versionId);
  const now = new Date().toISOString();
  writeStorage(
    "promptball.promptVersions",
    versions.map((version) => ({
      ...version,
      isDefault: version.favoritePromptId === favoritePromptId && version.id === versionId,
      updatedAt: version.favoritePromptId === favoritePromptId ? now : version.updatedAt,
    })),
  );
  writeStorage(
    "promptball.favoritePrompts",
    readStorage<FavoritePrompt[]>("promptball.favoritePrompts", []).map((prompt) =>
      prompt.id === favoritePromptId && selected
        ? { ...prompt, content: selected.content, defaultVersionId: versionId, version: selected.version, updatedAt: now }
        : prompt,
    ),
  );
}

export async function deleteFavoritePrompt(id: string): Promise<void> {
  if (isTauriRuntime()) {
    return invoke("delete_favorite_prompt", { id });
  }
  writeStorage(
    "promptball.favoritePrompts",
    readStorage<FavoritePrompt[]>("promptball.favoritePrompts", []).filter((item) => item.id !== id),
  );
}

export async function setDefaultFavoritePrompt(id: string): Promise<void> {
  if (isTauriRuntime()) {
    return invoke("set_default_favorite_prompt", { id });
  }
  writeStorage(
    "promptball.favoritePrompts",
    markDefaultFavoritePrompt(readStorage<FavoritePrompt[]>("promptball.favoritePrompts", []), id),
  );
}

export async function listPromptRuns(favoritePromptId?: string): Promise<PromptRun[]> {
  if (isTauriRuntime()) {
    return invoke<PromptRun[]>("list_prompt_runs", { favoritePromptId: favoritePromptId ?? null });
  }
  const runs = readStorage<PromptRun[]>("promptball.promptRuns", []);
  return favoritePromptId ? runs.filter((run) => run.favoritePromptId === favoritePromptId) : runs;
}

export async function createPromptRun(input: {
  favoritePromptId: string;
  versionId: string;
  input: string;
  output: string;
  model: string;
}): Promise<PromptRun> {
  if (isTauriRuntime()) {
    return invoke<PromptRun>("create_prompt_run", { input });
  }
  const run: PromptRun = {
    id: crypto.randomUUID(),
    favoritePromptId: input.favoritePromptId,
    versionId: input.versionId,
    input: input.input,
    output: input.output,
    model: input.model,
    createdAt: new Date().toISOString(),
  };
  writeStorage("promptball.promptRuns", [run, ...readStorage<PromptRun[]>("promptball.promptRuns", [])]);
  writeStorage(
    "promptball.favoritePrompts",
    readStorage<FavoritePrompt[]>("promptball.favoritePrompts", []).map((prompt) =>
      prompt.id === input.favoritePromptId
        ? { ...prompt, usageCount: prompt.usageCount + 1, updatedAt: run.createdAt, lastUsedAt: run.createdAt }
        : prompt,
    ),
  );
  return run;
}

export async function clearPromptRunData(): Promise<void> {
  if (isTauriRuntime()) {
    return invoke("clear_prompt_run_data");
  }
  writeStorage("promptball.promptRuns", []);
  writeStorage("promptball.promptFeedback", []);
  writeStorage("promptball.promptEvalScores", []);
}

export async function listPromptFeedback(): Promise<PromptFeedback[]> {
  if (isTauriRuntime()) {
    return invoke<PromptFeedback[]>("list_prompt_feedback");
  }
  return readStorage("promptball.promptFeedback", []);
}

export async function savePromptFeedback(input: Omit<PromptFeedback, "id" | "createdAt">): Promise<PromptFeedback> {
  if (isTauriRuntime()) {
    return invoke<PromptFeedback>("save_prompt_feedback", { input });
  }
  const feedback: PromptFeedback = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };
  writeStorage("promptball.promptFeedback", [feedback, ...readStorage<PromptFeedback[]>("promptball.promptFeedback", [])]);
  return feedback;
}

export async function listPromptEvalScores(): Promise<PromptEvalScore[]> {
  if (isTauriRuntime()) {
    return invoke<PromptEvalScore[]>("list_prompt_eval_scores");
  }
  return readStorage("promptball.promptEvalScores", []);
}

export async function savePromptEvalScore(score: PromptEvalScore): Promise<PromptEvalScore> {
  if (isTauriRuntime()) {
    return invoke<PromptEvalScore>("save_prompt_eval_score", { score });
  }
  writeStorage("promptball.promptEvalScores", [score, ...readStorage<PromptEvalScore[]>("promptball.promptEvalScores", [])]);
  return score;
}

export async function listPromptVersions(favoritePromptId?: string): Promise<PromptVersion[]> {
  if (isTauriRuntime()) {
    return invoke<PromptVersion[]>("list_prompt_versions", { favoritePromptId: favoritePromptId ?? null });
  }
  const versions = readStorage<PromptVersion[]>("promptball.promptVersions", []);
  return favoritePromptId ? versions.filter((version) => version.favoritePromptId === favoritePromptId) : versions;
}

export async function listPromptABTests(promptId?: string): Promise<PromptABTestRecord[]> {
  if (isTauriRuntime()) {
    return invoke<PromptABTestRecord[]>("list_prompt_ab_tests", { promptId: promptId ?? null });
  }
  const records = readStorage<PromptABTestRecord[]>("promptball.promptABTests", []);
  return promptId ? records.filter((record) => record.promptAId === promptId || record.promptBId === promptId) : records;
}

export async function savePromptABTest(input: {
  promptAId: string;
  promptBId: string;
  input: string;
  outputA: string;
  outputB: string;
  model: string;
  winner: ABWinner;
  reason?: string;
  taskType?: string;
  blindMode?: boolean;
}): Promise<PromptABTestRecord> {
  if (isTauriRuntime()) {
    return invoke<PromptABTestRecord>("save_prompt_ab_test", { input });
  }
  const record: PromptABTestRecord = {
    id: crypto.randomUUID(),
    promptAId: input.promptAId,
    promptBId: input.promptBId,
    input: input.input,
    outputA: input.outputA,
    outputB: input.outputB,
    model: input.model,
    winner: input.winner,
    reason: input.reason ?? "",
    taskType: input.taskType ?? "",
    blindMode: input.blindMode ?? false,
    createdAt: new Date().toISOString(),
  };
  writeStorage("promptball.promptABTests", [record, ...readStorage<PromptABTestRecord[]>("promptball.promptABTests", [])]);
  return record;
}

export async function listVoiceRecords(): Promise<VoiceRecord[]> {
  if (isTauriRuntime()) {
    return invoke<VoiceRecord[]>("list_voice_records");
  }
  return readStorage("promptball.voiceRecords", []);
}

export async function saveVoiceRecord(record: VoiceRecord): Promise<VoiceRecord> {
  if (isTauriRuntime()) {
    return invoke<VoiceRecord>("save_voice_record", { record });
  }
  writeStorage("promptball.voiceRecords", [record, ...readStorage<VoiceRecord[]>("promptball.voiceRecords", [])]);
  return record;
}

export async function clearVoiceRecords(): Promise<void> {
  if (isTauriRuntime()) {
    return invoke("clear_voice_records");
  }
  writeStorage("promptball.voiceRecords", []);
}

export async function clearModelCallLogs(): Promise<void> {
  if (isTauriRuntime()) {
    return invoke("clear_model_call_logs");
  }
  writeStorage("promptball.modelCallLogs", []);
}
