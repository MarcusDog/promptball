import { describe, expect, it } from "vitest";
import { buildStructuredPrompt, normalizePromptText } from "./prompt";

describe("prompt assembly", () => {
  it("builds a structured prompt from role-mode fields in a stable order", () => {
    const result = buildStructuredPrompt({
      role: "资深论文写作导师",
      context: "用户正在写毕业论文开题报告。",
      goal: "让开题报告更清晰。",
      task: "补全研究意义。",
      input: "题目：智能客服系统设计。",
      output: "输出 3 段中文正文。",
      requirements: "语气正式，不编造数据。",
      constraints: "不要新增未提供的实验数据。",
      evaluation: "逻辑清晰，能支撑后续章节。",
      steps: "先概括背景，再写实践价值。",
      negative: "不要使用口号式表达。",
    });

    expect(result).toContain("# Role\n资深论文写作导师");
    expect(result).toContain("# Context\n用户正在写毕业论文开题报告。");
    expect(result.indexOf("# Role")).toBeLessThan(result.indexOf("# Context"));
    expect(result.indexOf("# Goal")).toBeLessThan(result.indexOf("# Task"));
    expect(result.indexOf("# Task")).toBeLessThan(result.indexOf("# Output"));
    expect(result.indexOf("# Constraints")).toBeLessThan(result.indexOf("# Evaluation"));
    expect(result).toContain("# Negative\n不要使用口号式表达。");
    expect(result).not.toContain("undefined");
  });

  it("trims blank lines without removing intentional paragraph breaks", () => {
    expect(normalizePromptText("  第一段\n\n\n第二段  ")).toBe("第一段\n\n第二段");
  });
});
