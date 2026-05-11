export interface ProviderSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface ProviderTestResult {
  ok: boolean;
  message: string;
}

export type ModelProviderType = "deepseek" | "openai-compatible" | "ollama";

export interface ModelProvider {
  id: string;
  providerName: string;
  providerType: ModelProviderType;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  stream: boolean;
  timeout: number;
  isDefault: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ModelProviderInput = Partial<ModelProvider> & {
  providerName?: string;
  providerType?: ModelProviderType;
};

export interface TaskModelBinding {
  id: string;
  taskType: string;
  providerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModelCallLog {
  id: string;
  providerId: string;
  modelName: string;
  taskType: string;
  durationMs: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCost: number;
  ok: boolean;
  errorMessage: string;
  createdAt: string;
  updatedAt: string;
}
