import { describe, expect, it } from "vitest";
import {
  DEFAULT_FAVORITE_PROMPTS,
  applyPromptVariables,
  buildABPromptInput,
  comparePromptVersionContent,
  computeABStats,
  extractPromptVariables,
  mergeDefaultFavoritePrompts,
  markDefaultFavoritePrompt,
  normalizeFavoritePrompt,
  rankSlashCommands,
  resolveDefaultVersion,
  sortFavoritePrompts,
} from "./favorites";
import type { FavoritePrompt, PromptABTestRecord, PromptVersion } from "@/types";

const favorite: FavoritePrompt = {
  id: "fav-1",
  name: "论文作图专家",
  slashCommand: "/论文作图",
  category: "论文作图",
  tags: ["论文", "作图"],
  description: "把论文段落转成可交付的配图需求",
  model: "deepseek-chat",
  preferredModel: "deepseek-chat",
  content: "请为《{{title}}》绘制{{figureType}}，要求：{{requirements}}。",
  variables: ["title", "figureType", "requirements"],
  note: "适合论文配图",
  version: 1,
  score: 88,
  usageCount: 12,
  successRate: 0.75,
  averageRating: 4.4,
  directUseRate: 0.5,
  modifiedUseRate: 0.25,
  discardedRate: 0.25,
  defaultVersionId: "v2",
  isFavorite: true,
  isDefault: false,
  createdAt: "2026-05-06T00:00:00.000Z",
  updatedAt: "2026-05-06T00:00:00.000Z",
  lastUsedAt: "2026-05-06T01:00:00.000Z",
};

describe("favorite prompt slash commands", () => {
  it("extracts unique template variables from double-brace placeholders", () => {
    expect(extractPromptVariables("生成 {{topic}}，再检查 {{ topic }} 和 {{audience}}")).toEqual(["topic", "audience"]);
  });

  it("applies variable values and marks missing values as replaceable", () => {
    expect(applyPromptVariables(favorite.content, { title: "AIGC 系统", figureType: "架构图" })).toContain(
      "请为《AIGC 系统》绘制架构图，要求：【requirements】。",
    );
  });

  it("ships the required built-in slash command prompts", () => {
    expect(DEFAULT_FAVORITE_PROMPTS.map((prompt) => prompt.slashCommand)).toEqual([
      "/通用优化",
      "/学术润色",
      "/论文作图",
      "/codex开发",
      "/codex修复",
      "/ui设计",
      "/产品经理",
      "/图片生成",
      "/文献分析",
      "/代码解释",
      "/错误排查",
    ]);
  });

  it("normalizes saved favorite prompt metadata for v1 fields", () => {
    const normalized = normalizeFavoritePrompt({
      name: "Codex 修复",
      slashCommand: "codex修复",
      category: "",
      tags: "codex, 修复",
      description: "定位并修复 bug",
      preferredModel: "deepseek-chat",
      content: "请修复 {{error}}",
      note: "",
    }, "2026-05-06T02:00:00.000Z");

    expect(normalized).toMatchObject({
      slashCommand: "/codex修复",
      category: "未分类",
      tags: ["codex", "修复"],
      variables: ["error"],
      version: 1,
      score: 0,
      usageCount: 0,
      successRate: 0,
      isFavorite: true,
      isDefault: false,
    });
  });

  it("merges built-in prompts without duplicating user commands", () => {
    const merged = mergeDefaultFavoritePrompts([{ ...favorite, id: "custom-paper" }]);

    expect(merged.filter((prompt) => prompt.slashCommand === "/论文作图")).toHaveLength(1);
    expect(merged.some((prompt) => prompt.slashCommand === "/codex修复")).toBe(true);
  });

  it("ranks slash commands by exact command, fuzzy text, default flag, score, and usage recency", () => {
    const results = rankSlashCommands("lunwen zuotu", [
      favorite,
      {
        ...favorite,
        id: "fav-2",
        name: "Codex 修复",
        slashCommand: "/codex修复",
        category: "编程",
        tags: ["codex"],
        usageCount: 20,
      },
    ]);

    expect(results[0].id).toBe("fav-1");
  });

  it("sorts prompt cards by default flag, latest usage, score, and usage count", () => {
    const sorted = sortFavoritePrompts([
      { ...favorite, id: "old", isDefault: false, lastUsedAt: "2026-05-05T00:00:00.000Z", score: 90 },
      { ...favorite, id: "default", isDefault: true, score: 10 },
      { ...favorite, id: "recent", isDefault: false, lastUsedAt: "2026-05-06T03:00:00.000Z", score: 80 },
    ]);

    expect(sorted.map((prompt) => prompt.id)).toEqual(["default", "recent", "old"]);
  });

  it("marks exactly one favorite prompt as default", () => {
    const prompts = markDefaultFavoritePrompt([
      { ...favorite, id: "a", isDefault: true },
      { ...favorite, id: "b", isDefault: false },
    ], "b");

    expect(prompts.map((prompt) => [prompt.id, prompt.isDefault])).toEqual([
      ["a", false],
      ["b", true],
    ]);
  });

  it("resolves the selected default prompt version", () => {
    const versions: PromptVersion[] = [
      { id: "v1", favoritePromptId: "fav-1", version: 1, content: "old", note: "", isDefault: false, createdAt: "" },
      { id: "v2", favoritePromptId: "fav-1", version: 2, content: "new", note: "", isDefault: true, createdAt: "" },
    ];

    expect(resolveDefaultVersion(favorite, versions)?.content).toBe("new");
  });

  it("summarizes changed lines between prompt versions", () => {
    const diff = comparePromptVersionContent("Role: writer\nTask: draft\nOutput: markdown", "Role: editor\nTask: draft\nOutput: table\nConstraints: concise");

    expect(diff.addedLines).toEqual(["Role: editor", "Output: table", "Constraints: concise"]);
    expect(diff.removedLines).toEqual(["Role: writer", "Output: markdown"]);
    expect(diff.unchangedLines).toBe(1);
    expect(diff.changedLineCount).toBe(5);
  });
});

describe("A/B testing helpers", () => {
  it("computes win rates for prompt pairs", () => {
    const records: PromptABTestRecord[] = [
      { id: "ab-1", promptAId: "a", promptBId: "b", input: "x", outputA: "a", outputB: "b", model: "deepseek-chat", winner: "a", reason: "", taskType: "Codex", blindMode: false, createdAt: "" },
      { id: "ab-2", promptAId: "a", promptBId: "b", input: "x", outputA: "a", outputB: "b", model: "deepseek-chat", winner: "both", reason: "", taskType: "Codex", blindMode: false, createdAt: "" },
      { id: "ab-3", promptAId: "a", promptBId: "b", input: "x", outputA: "a", outputB: "b", model: "deepseek-chat", winner: "b", reason: "", taskType: "Codex", blindMode: false, createdAt: "" },
    ];

    expect(computeABStats("a", records)).toEqual({
      total: 3,
      wins: 1,
      losses: 1,
      ties: 1,
      winRate: 0.5,
    });
  });

  it("builds identical-model A/B prompt inputs from the same material", () => {
    const input = buildABPromptInput(favorite, "测试材料");

    expect(input).toContain("测试材料");
    expect(input).toContain("请为《【title】》绘制【figureType】");
  });
});
