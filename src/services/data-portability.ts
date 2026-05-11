import type {
  FavoritePrompt,
  PromptABTestRecord,
  PromptEvalScore,
  PromptFeedback,
  PromptRun,
  PromptVersion,
  PrivacySettings,
} from "../types";
import { sanitizeTextForPrivacy } from "./privacy";

export type ImportConflictStrategy = "skip" | "overwrite" | "duplicate";

export interface ExportData {
  favoritePrompts: FavoritePrompt[];
  promptRuns: PromptRun[];
  promptFeedback: PromptFeedback[];
  promptEvalScores: PromptEvalScore[];
  promptVersions: PromptVersion[];
  promptAbTests: PromptABTestRecord[];
}

export interface ExportBundle {
  schemaVersion: 1;
  exportedAt: string;
  app: "PromptBall";
  data: ExportData;
}

export interface ImportConflictInput {
  existing: Partial<Pick<ExportData, "favoritePrompts">>;
  incoming: Partial<Pick<ExportData, "favoritePrompts">>;
  strategy: ImportConflictStrategy;
  idFactory?: (id: string) => string;
}

export interface ImportConflictResult {
  favoritePrompts: FavoritePrompt[];
  summary: {
    added: number;
    skipped: number;
    overwritten: number;
    duplicated: number;
  };
}

export function createExportBundle(data: ExportData): ExportBundle {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    app: "PromptBall",
    data,
  };
}

export function createPrivacySafeExportBundle(
  data: ExportData,
  privacySettings: PrivacySettings,
): ExportBundle {
  return createExportBundle({
    favoritePrompts: data.favoritePrompts.map((prompt) => ({
      ...prompt,
      description: sanitizeTextForPrivacy(prompt.description, privacySettings),
      content: sanitizeTextForPrivacy(prompt.content, privacySettings),
      note: sanitizeTextForPrivacy(prompt.note, privacySettings),
    })),
    promptRuns: data.promptRuns.map((run) => ({
      ...run,
      input: sanitizeTextForPrivacy(run.input, privacySettings),
      output: sanitizeTextForPrivacy(run.output, privacySettings),
    })),
    promptFeedback: data.promptFeedback.map((feedback) => ({
      ...feedback,
      note: sanitizeTextForPrivacy(feedback.note, privacySettings),
    })),
    promptEvalScores: data.promptEvalScores,
    promptVersions: data.promptVersions.map((version) => ({
      ...version,
      content: sanitizeTextForPrivacy(version.content, privacySettings),
      note: sanitizeTextForPrivacy(version.note, privacySettings),
    })),
    promptAbTests: data.promptAbTests.map((test) => ({
      ...test,
      input: sanitizeTextForPrivacy(test.input, privacySettings),
      outputA: sanitizeTextForPrivacy(test.outputA, privacySettings),
      outputB: sanitizeTextForPrivacy(test.outputB, privacySettings),
      reason: sanitizeTextForPrivacy(test.reason, privacySettings),
    })),
  });
}

export function parseExportBundle(raw: string): ExportBundle {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Import file is not valid JSON");
  }

  if (!isRecord(parsed)) {
    throw new Error("Import file is not a valid PromptBall bundle");
  }

  if (parsed.app !== "PromptBall") {
    throw new Error("File is not a PromptBall export");
  }

  if (parsed.schemaVersion !== 1) {
    throw new Error("Unsupported PromptBall import schema");
  }

  if (!isRecord(parsed.data)) {
    throw new Error("Import file is missing PromptBall data");
  }

  return {
    schemaVersion: 1,
    exportedAt: typeof parsed.exportedAt === "string" ? parsed.exportedAt : new Date().toISOString(),
    app: "PromptBall",
    data: {
      favoritePrompts: readArray(parsed.data.favoritePrompts),
      promptRuns: readArray(parsed.data.promptRuns),
      promptFeedback: readArray(parsed.data.promptFeedback),
      promptEvalScores: readArray(parsed.data.promptEvalScores),
      promptVersions: readArray(parsed.data.promptVersions),
      promptAbTests: readArray(parsed.data.promptAbTests),
    },
  };
}

export function prepareDuplicateFavoritePromptImport({
  existingPrompts,
  bundle,
  idFactory,
}: {
  existingPrompts: FavoritePrompt[];
  bundle: ExportBundle;
  idFactory?: (id: string) => string;
}): { prompts: FavoritePrompt[]; summary: ImportConflictResult["summary"] } {
  const resolved = resolveImportConflicts({
    existing: { favoritePrompts: existingPrompts },
    incoming: { favoritePrompts: bundle.data.favoritePrompts },
    strategy: "duplicate",
    idFactory,
  });
  const existingIds = new Set(existingPrompts.map((prompt) => prompt.id));

  return {
    prompts: resolved.favoritePrompts.filter((prompt) => !existingIds.has(prompt.id)),
    summary: resolved.summary,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function resolveImportConflicts({
  existing,
  incoming,
  strategy,
  idFactory = (id) => `${id}-${cryptoRandomSuffix()}`,
}: ImportConflictInput): ImportConflictResult {
  const result = [...(existing.favoritePrompts ?? [])];
  const byId = new Map(result.map((prompt, index) => [prompt.id, index]));
  const summary = {
    added: 0,
    skipped: 0,
    overwritten: 0,
    duplicated: 0,
  };

  for (const prompt of incoming.favoritePrompts ?? []) {
    const existingIndex = byId.get(prompt.id);

    if (existingIndex === undefined) {
      byId.set(prompt.id, result.length);
      result.push(prompt);
      summary.added += 1;
      continue;
    }

    if (strategy === "skip") {
      summary.skipped += 1;
      continue;
    }

    if (strategy === "overwrite") {
      result[existingIndex] = prompt;
      summary.overwritten += 1;
      continue;
    }

    const duplicatedPrompt = {
      ...prompt,
      id: nextUniqueId(prompt.id, byId, idFactory),
      slashCommand: nextUniqueSlashCommand(prompt.slashCommand, result),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    byId.set(duplicatedPrompt.id, result.length);
    result.push(duplicatedPrompt);
    summary.duplicated += 1;
  }

  return { favoritePrompts: result, summary };
}

function nextUniqueId(
  id: string,
  byId: Map<string, number>,
  idFactory: (id: string) => string,
): string {
  let nextId = idFactory(id);
  let counter = 2;

  while (byId.has(nextId)) {
    nextId = `${idFactory(id)}-${counter}`;
    counter += 1;
  }

  return nextId;
}

function nextUniqueSlashCommand(
  slashCommand: string,
  prompts: FavoritePrompt[],
): string {
  const used = new Set(prompts.map((prompt) => prompt.slashCommand));
  if (!used.has(slashCommand)) {
    return slashCommand;
  }

  let counter = 2;
  let candidate = `${slashCommand}-${counter}`;
  while (used.has(candidate)) {
    counter += 1;
    candidate = `${slashCommand}-${counter}`;
  }

  return candidate;
}

function cryptoRandomSuffix(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}
