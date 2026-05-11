import type { PromptMode, StructuredPromptFields } from "@/types";

export const EMPTY_STRUCTURED_PROMPT_FIELDS: StructuredPromptFields = {
  role: "",
  context: "",
  goal: "",
  task: "",
  input: "",
  output: "",
  requirements: "",
  constraints: "",
  evaluation: "",
  steps: "",
  negative: "",
};

export interface PromptStats {
  characters: number;
  words: number;
  estimatedTokens: number;
}

export interface PromptDraft {
  version: 1;
  mode: PromptMode;
  rawPrompt: string;
  structuredFields: StructuredPromptFields;
  updatedAt: string;
}

export function normalizeStructuredFields(
  fields: Partial<StructuredPromptFields> | null | undefined,
): StructuredPromptFields {
  return {
    ...EMPTY_STRUCTURED_PROMPT_FIELDS,
    ...(fields ?? {}),
  };
}

export function estimatePromptStats(prompt: string): PromptStats {
  const normalized = prompt.trim();
  const characters = Array.from(normalized).length;
  if (!normalized) {
    return { characters: 0, words: 0, estimatedTokens: 0 };
  }

  const latinWords = normalized.match(/[A-Za-z0-9_]+/g) ?? [];
  const cjkRuns = normalized.match(/[\u3400-\u9fff]+/g) ?? [];
  const cjkCharacterCount = cjkRuns.join("").length;
  const cjkWordEstimate = cjkRuns.reduce((sum, run) => sum + Math.ceil(Array.from(run).length / 2), 0);
  const words = latinWords.length + cjkWordEstimate;
  const estimatedTokens = Math.max(1, Math.ceil(latinWords.join("").length / 4) + cjkCharacterCount);

  return { characters, words, estimatedTokens };
}

export function createPromptDraft(input: {
  mode: PromptMode;
  rawPrompt: string;
  structuredFields: StructuredPromptFields;
}): PromptDraft {
  return {
    version: 1,
    mode: input.mode,
    rawPrompt: input.rawPrompt,
    structuredFields: normalizeStructuredFields(input.structuredFields),
    updatedAt: new Date().toISOString(),
  };
}

export function extractPlaceholderNames(prompt: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();

  for (const match of prompt.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)) {
    const name = match[1].trim();
    if (!name || seen.has(name)) {
      continue;
    }
    seen.add(name);
    names.push(name);
  }

  return names;
}
