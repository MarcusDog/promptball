import type { ModelProvider, ModelProviderInput, ModelProviderType, ProviderSettings, TaskModelBinding } from "../types";

export type ProviderSettingsField = keyof ProviderSettings;

export interface ProviderSettingsValidationError {
  field: ProviderSettingsField;
  message: string;
}

const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TIMEOUT = 30_000;

export const DEFAULT_MODEL_PROVIDER: ModelProvider = normalizeModelProvider(
  {
    id: "provider-deepseek-default",
    providerName: "DeepSeek",
    providerType: "deepseek",
    baseUrl: "https://api.deepseek.com",
    apiKey: "",
    modelName: "deepseek-chat",
    temperature: 0.3,
    maxTokens: 1800,
    stream: false,
    timeout: DEFAULT_TIMEOUT,
    isDefault: true,
    enabled: true,
  },
  "2026-05-06T00:00:00.000Z",
);

export function normalizeProviderSettings(
  settings: Partial<ProviderSettings>,
): ProviderSettings {
  return {
    apiKey: settings.apiKey?.trim() ?? "",
    baseUrl: normalizeBaseUrl(settings.baseUrl ?? ""),
    model: settings.model?.trim() ?? "",
    temperature: clampNumber(
      settings.temperature,
      0,
      2,
      DEFAULT_TEMPERATURE,
    ),
    maxTokens: Math.max(1, Math.floor(settings.maxTokens ?? DEFAULT_MAX_TOKENS)),
  };
}

export function validateProviderSettings(
  settings: Partial<ProviderSettings>,
): ProviderSettingsValidationError[] {
  const normalized = normalizeProviderSettings(settings);
  const errors: ProviderSettingsValidationError[] = [];

  if (!normalized.apiKey) {
    errors.push({ field: "apiKey", message: "API key is required." });
  }

  if (!normalized.baseUrl || !isHttpUrl(normalized.baseUrl)) {
    errors.push({
      field: "baseUrl",
      message: "Base URL must be a valid http(s) URL.",
    });
  }

  if (!normalized.model) {
    errors.push({ field: "model", message: "Model name is required." });
  }

  if (
    typeof settings.temperature !== "number" ||
    settings.temperature < 0 ||
    settings.temperature > 2
  ) {
    errors.push({
      field: "temperature",
      message: "Temperature must be between 0 and 2.",
    });
  }

  if (
    typeof settings.maxTokens !== "number" ||
    !Number.isFinite(settings.maxTokens) ||
    settings.maxTokens < 1
  ) {
    errors.push({
      field: "maxTokens",
      message: "Max tokens must be greater than 0.",
    });
  }

  return errors;
}

export function redactProviderSettings(
  settings: ProviderSettings,
): ProviderSettings {
  return {
    ...settings,
    apiKey: redactApiKey(settings.apiKey),
  };
}

export function redactApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.length <= 8) {
    return "*".repeat(trimmed.length);
  }

  return `${trimmed.slice(0, 2)}${"*".repeat(12)}${trimmed.slice(-4)}`;
}

export function normalizeModelProvider(input: ModelProviderInput, now = new Date().toISOString()): ModelProvider {
  const providerType: ModelProviderType = input.providerType ?? "openai-compatible";
  const modelName = input.modelName?.trim() || (providerType === "deepseek" ? "deepseek-chat" : "");

  return {
    id: input.id?.trim() || createId("provider"),
    providerName: input.providerName?.trim() || providerTypeLabel(providerType),
    providerType,
    baseUrl: normalizeProviderBaseUrl(providerType, input.baseUrl ?? ""),
    apiKey: providerType === "ollama" ? "" : input.apiKey?.trim() ?? "",
    modelName,
    temperature: clampNumber(input.temperature, 0, 2, DEFAULT_TEMPERATURE),
    maxTokens: Math.max(1, Math.floor(input.maxTokens ?? DEFAULT_MAX_TOKENS)),
    stream: input.stream ?? false,
    timeout: Math.max(1000, Math.floor(input.timeout ?? DEFAULT_TIMEOUT)),
    isDefault: input.isDefault ?? false,
    enabled: input.enabled ?? true,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
}

export function bindTaskModelProvider(taskType: string, providerId: string, now = new Date().toISOString()): TaskModelBinding {
  return {
    id: `binding-${taskType.trim().toLowerCase() || "default"}`,
    taskType: taskType.trim(),
    providerId,
    createdAt: now,
    updatedAt: now,
  };
}

export function resolveProviderForTask(
  taskType: string,
  providers: ModelProvider[],
  bindings: TaskModelBinding[],
): ModelProvider | undefined {
  const enabledProviders = providers.filter((provider) => provider.enabled);
  const binding = bindings.find((item) => item.taskType.toLowerCase() === taskType.trim().toLowerCase());
  const boundProvider = binding ? enabledProviders.find((provider) => provider.id === binding.providerId) : undefined;
  return boundProvider ?? enabledProviders.find((provider) => provider.isDefault) ?? enabledProviders[0];
}

export function markDefaultModelProvider(providers: ModelProvider[], providerId: string): ModelProvider[] {
  return providers.map((provider) => ({
    ...provider,
    isDefault: provider.id === providerId,
  }));
}

export function redactModelProvider(provider: ModelProvider): ModelProvider {
  return {
    ...provider,
    apiKey: redactApiKey(provider.apiKey),
  };
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

function normalizeProviderBaseUrl(providerType: ModelProviderType, baseUrl: string): string {
  const normalized = normalizeBaseUrl(baseUrl);
  if (normalized) {
    return normalized;
  }
  if (providerType === "ollama") {
    return "http://localhost:11434/v1";
  }
  if (providerType === "deepseek") {
    return "https://api.deepseek.com";
  }
  return "";
}

function providerTypeLabel(providerType: ModelProviderType): string {
  if (providerType === "deepseek") {
    return "DeepSeek";
  }
  if (providerType === "ollama") {
    return "Ollama";
  }
  return "OpenAI Compatible";
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function clampNumber(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
}
