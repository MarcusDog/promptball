import { describe, expect, it } from "vitest";

import {
  DEFAULT_MODEL_PROVIDER,
  bindTaskModelProvider,
  normalizeModelProvider,
  normalizeProviderSettings,
  resolveProviderForTask,
  redactProviderSettings,
  validateProviderSettings,
} from "./model-config";

describe("model provider configuration", () => {
  it("normalizes OpenAI-compatible provider settings", () => {
    const settings = normalizeProviderSettings({
      apiKey: "  sk-test-key  ",
      baseUrl: " https://api.deepseek.com/ ",
      model: " deepseek-chat ",
      temperature: 2,
      maxTokens: 0,
    });

    expect(settings.apiKey).toBe("sk-test-key");
    expect(settings.baseUrl).toBe("https://api.deepseek.com");
    expect(settings.model).toBe("deepseek-chat");
    expect(settings.temperature).toBe(2);
    expect(settings.maxTokens).toBe(1);
  });

  it("returns actionable validation errors for incomplete settings", () => {
    const errors = validateProviderSettings({
      apiKey: "",
      baseUrl: "not-a-url",
      model: "",
      temperature: -1,
      maxTokens: 0,
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "apiKey" }),
        expect.objectContaining({ field: "baseUrl" }),
        expect.objectContaining({ field: "model" }),
        expect.objectContaining({ field: "temperature" }),
        expect.objectContaining({ field: "maxTokens" }),
      ]),
    );
  });

  it("redacts API keys for display", () => {
    const redacted = redactProviderSettings({
      apiKey: "sk-1234567890abcdef",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-chat",
      temperature: 0.7,
      maxTokens: 4096,
    });

    expect(redacted.apiKey).toBe("sk************cdef");
  });

  it("normalizes v1 model providers for OpenAI-compatible and Ollama targets", () => {
    const provider = normalizeModelProvider({
      providerName: " Custom ",
      providerType: "openai-compatible",
      baseUrl: " https://api.example.com/v1/ ",
      apiKey: " sk-custom ",
      modelName: " model-a ",
      temperature: 3,
      maxTokens: 0,
      stream: true,
      timeout: 500,
      isDefault: true,
      enabled: true,
    }, "2026-05-06T00:00:00.000Z");
    const ollama = normalizeModelProvider({
      providerName: "Ollama",
      providerType: "ollama",
      baseUrl: "",
      apiKey: "",
      modelName: "llama3.1",
    }, "2026-05-06T00:00:00.000Z");

    expect(provider).toMatchObject({
      providerName: "Custom",
      baseUrl: "https://api.example.com/v1",
      apiKey: "sk-custom",
      modelName: "model-a",
      temperature: 2,
      maxTokens: 1,
      timeout: 1000,
      isDefault: true,
      enabled: true,
    });
    expect(ollama).toMatchObject({
      providerType: "ollama",
      baseUrl: "http://localhost:11434/v1",
      apiKey: "",
    });
  });

  it("ships DeepSeek as the default provider", () => {
    expect(DEFAULT_MODEL_PROVIDER).toMatchObject({
      providerName: "DeepSeek",
      providerType: "deepseek",
      baseUrl: "https://api.deepseek.com",
      modelName: "deepseek-chat",
      isDefault: true,
      enabled: true,
    });
  });

  it("routes task types to enabled providers and falls back to default", () => {
    const deepseek = normalizeModelProvider({ id: "deepseek", providerName: "DeepSeek", providerType: "deepseek", isDefault: true, enabled: true });
    const codex = normalizeModelProvider({ id: "codex", providerName: "Codex", providerType: "openai-compatible", modelName: "gpt-code", enabled: true });
    const disabled = normalizeModelProvider({ id: "disabled", providerName: "Disabled", providerType: "openai-compatible", enabled: false });
    const bindings = [
      bindTaskModelProvider("codex", "codex"),
      bindTaskModelProvider("论文", "disabled"),
    ];

    expect(resolveProviderForTask("codex", [deepseek, codex], bindings)?.id).toBe("codex");
    expect(resolveProviderForTask("论文", [deepseek, disabled], bindings)?.id).toBe("deepseek");
    expect(resolveProviderForTask("unknown", [deepseek, codex], bindings)?.id).toBe("deepseek");
  });
});
