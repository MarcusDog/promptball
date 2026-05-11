import { describe, expect, it } from "vitest";

import {
  createPromptDraft,
  EMPTY_STRUCTURED_PROMPT_FIELDS,
  estimatePromptStats,
  extractPlaceholderNames,
  normalizeStructuredFields,
} from "./prompt-editor";

describe("prompt editor helpers", () => {
  it("estimates characters, words, and tokens", () => {
    const stats = estimatePromptStats("Write a summary for 这段材料");

    expect(stats.characters).toBe(24);
    expect(stats.words).toBe(6);
    expect(stats.estimatedTokens).toBeGreaterThanOrEqual(6);
  });

  it("normalizes partial structured fields with v1 required fields", () => {
    const fields = normalizeStructuredFields({
      role: "Coach",
      goal: "Improve prompt quality",
    });

    expect(fields.role).toBe("Coach");
    expect(fields.goal).toBe("Improve prompt quality");
    expect(fields.constraints).toBe("");
    expect(fields.negative).toBe("");
    expect(Object.keys(fields)).toEqual(Object.keys(EMPTY_STRUCTURED_PROMPT_FIELDS));
  });

  it("creates a serializable draft snapshot", () => {
    const draft = createPromptDraft({
      mode: "free",
      rawPrompt: "Draft prompt",
      structuredFields: EMPTY_STRUCTURED_PROMPT_FIELDS,
    });

    expect(draft.version).toBe(1);
    expect(draft.rawPrompt).toBe("Draft prompt");
    expect(draft.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("extracts unique variable placeholders in order", () => {
    expect(extractPlaceholderNames("请处理 {{输入材料}}，输出 {{输出格式}}。再次检查 {{输入材料}}。")).toEqual([
      "输入材料",
      "输出格式",
    ]);
  });
});
