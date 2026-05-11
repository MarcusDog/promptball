import { describe, expect, it } from "vitest";
import {
  BUILTIN_TEMPLATE_CATEGORIES,
  builtinTemplates,
  searchPromptTemplates,
  normalizePromptTemplate,
  templateToFavoritePromptInput,
} from "./templates";

describe("prompt templates", () => {
  it("ships at least 20 complete builtin templates across v1 categories", () => {
    expect(builtinTemplates.length).toBeGreaterThanOrEqual(20);

    for (const category of BUILTIN_TEMPLATE_CATEGORIES) {
      expect(builtinTemplates.some((template) => template.category === category)).toBe(true);
    }

    for (const template of builtinTemplates) {
      expect(template.title.trim()).not.toBe("");
      expect(template.scenario.trim()).not.toBe("");
      expect(template.applicableModels.length).toBeGreaterThan(0);
      expect(template.variables.length).toBeGreaterThan(0);
      expect(template.content).toContain("{{");
      expect(template.outputExample.trim()).not.toBe("");
      expect(template.evaluationCriteria.length).toBeGreaterThan(0);
    }
  });

  it("searches templates by title category variables and pinyin hints", () => {
    const thesisFigure = searchPromptTemplates(builtinTemplates, "lunwen zuotu");
    const codexFix = searchPromptTemplates(builtinTemplates, "codex 修复");

    expect(thesisFigure[0].title).toContain("论文作图");
    expect(codexFix[0].title.toLowerCase()).toContain("codex");
  });

  it("converts a template into favorite prompt input", () => {
    const template = builtinTemplates.find((item) => item.id === "template-codex-bugfix")!;
    const favorite = templateToFavoritePromptInput(template);

    expect(favorite.name).toBe(template.title);
    expect(favorite.slashCommand).toBe("/codex修复");
    expect(favorite.category).toBe(template.category);
    expect(favorite.variables).toEqual(template.variables);
    expect(favorite.content).toBe(template.content);
    expect(favorite.preferredModel).toBe(template.applicableModels[0]);
  });

  it("normalizes legacy custom templates with v1 fields", () => {
    const normalized = normalizePromptTemplate({
      id: "legacy",
      title: "Legacy",
      category: "自定义模板",
      description: "Old template",
      content: "Use {{输入}}",
      isBuiltin: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    expect(normalized.scenario).toBe("Old template");
    expect(normalized.applicableModels).toEqual(["deepseek-chat"]);
    expect(normalized.variables).toEqual(["输入"]);
    expect(normalized.evaluationCriteria).toContain("输出可直接使用");
  });
});
