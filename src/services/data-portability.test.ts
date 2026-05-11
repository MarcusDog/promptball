import { describe, expect, it } from "vitest";

import {
  createExportBundle,
  createPrivacySafeExportBundle,
  parseExportBundle,
  prepareDuplicateFavoritePromptImport,
  resolveImportConflicts,
  type ImportConflictStrategy,
} from "./data-portability";
import { normalizePrivacySettings } from "./privacy";

const basePrompt = {
  id: "prompt-1",
  name: "Academic polish",
  slashCommand: "/polish",
  category: "academic",
  tags: ["academic", "polish"],
  description: "Academic polishing prompt",
  model: "deepseek-chat",
  preferredModel: "deepseek-chat",
  content: "Improve {{text}}",
  variables: ["text"],
  note: "",
  version: 1,
  score: 80,
  usageCount: 2,
  successRate: 0.5,
  averageRating: 4,
  directUseRate: 0.5,
  modifiedUseRate: 0.5,
  discardedRate: 0,
  defaultVersionId: "version-1",
  isFavorite: true,
  isDefault: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("data portability", () => {
  it("creates a versioned export bundle", () => {
    const bundle = createExportBundle({
      favoritePrompts: [basePrompt],
      promptRuns: [],
      promptFeedback: [],
      promptEvalScores: [],
      promptVersions: [],
      promptAbTests: [],
    });

    expect(bundle.schemaVersion).toBe(1);
    expect(bundle.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(bundle.data.favoritePrompts).toHaveLength(1);
  });

  it.each<ImportConflictStrategy>(["skip", "overwrite", "duplicate"])(
    "resolves favorite prompt id conflicts with %s strategy",
    (strategy) => {
      const result = resolveImportConflicts({
        existing: { favoritePrompts: [basePrompt] },
        incoming: { favoritePrompts: [{ ...basePrompt, name: "Incoming" }] },
        strategy,
        idFactory: (id) => `${id}-copy`,
      });

      if (strategy === "skip") {
        expect(result.favoritePrompts).toHaveLength(1);
        expect(result.summary.skipped).toBe(1);
      }

      if (strategy === "overwrite") {
        expect(result.favoritePrompts).toHaveLength(1);
        expect(result.favoritePrompts[0].name).toBe("Incoming");
        expect(result.summary.overwritten).toBe(1);
      }

      if (strategy === "duplicate") {
        expect(result.favoritePrompts).toHaveLength(2);
        expect(result.favoritePrompts[1].id).toBe("prompt-1-copy");
        expect(result.summary.duplicated).toBe(1);
      }
    },
  );

  it("redacts sensitive content before privacy-safe export", () => {
    const bundle = createPrivacySafeExportBundle(
      {
        favoritePrompts: [
          {
            ...basePrompt,
            content: "Use sk-test-secret-1234567890 for user@example.com",
          },
        ],
        promptRuns: [
          {
            id: "run-1",
            favoritePromptId: "prompt-1",
            versionId: "version-1",
            input: "Email user@example.com",
            output: "Token sk-test-secret-1234567890",
            model: "deepseek-chat",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        promptFeedback: [],
        promptEvalScores: [],
        promptVersions: [],
        promptAbTests: [
          {
            id: "ab-1",
            promptAId: "prompt-1",
            promptBId: "prompt-2",
            input: "private C:\\Users\\lenovo\\secret.txt",
            outputA: "A",
            outputB: "B",
            model: "deepseek-chat",
            winner: "a",
            reason: "",
            taskType: "",
            blindMode: false,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      },
      normalizePrivacySettings({ redactExports: true }),
    );

    expect(bundle.data.favoritePrompts[0].content).toContain("[REDACTED:api_key]");
    expect(bundle.data.promptRuns[0].input).toContain("[REDACTED:email]");
    expect(bundle.data.promptAbTests[0].input).toContain("[REDACTED:private_path]");
  });
  it("rejects malformed import bundles", () => {
    expect(() => parseExportBundle("not json")).toThrow("Import file is not valid JSON");
    expect(() => parseExportBundle(JSON.stringify({ schemaVersion: 2, app: "PromptBall", data: {} }))).toThrow(
      "Unsupported PromptBall import schema",
    );
    expect(() => parseExportBundle(JSON.stringify({ schemaVersion: 1, app: "Other", data: {} }))).toThrow(
      "File is not a PromptBall export",
    );
  });

  it("parses valid export bundles", () => {
    const bundle = createExportBundle({
      favoritePrompts: [basePrompt],
      promptRuns: [],
      promptFeedback: [],
      promptEvalScores: [],
      promptVersions: [],
      promptAbTests: [],
    });

    expect(parseExportBundle(JSON.stringify(bundle))).toEqual(bundle);
  });

  it("prepares duplicate favorite prompt imports without overwriting existing prompts", () => {
    const prepared = prepareDuplicateFavoritePromptImport({
      existingPrompts: [basePrompt],
      bundle: createExportBundle({
        favoritePrompts: [{ ...basePrompt, name: "Imported prompt" }],
        promptRuns: [],
        promptFeedback: [],
        promptEvalScores: [],
        promptVersions: [],
        promptAbTests: [],
      }),
      idFactory: (id) => `${id}-imported`,
    });

    expect(prepared.prompts).toHaveLength(1);
    expect(prepared.prompts[0].id).toBe("prompt-1-imported");
    expect(prepared.prompts[0].slashCommand).toBe("/polish-2");
    expect(prepared.summary.duplicated).toBe(1);
  });
});
