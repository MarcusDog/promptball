import { describe, expect, it } from "vitest";
import { createHeuristicScore } from "./scoring";

describe("prompt scoring", () => {
  it("returns all 8 diagnostic dimensions with a bounded total", () => {
    const score = createHeuristicScore(
      "你是资深前端工程师。背景：已有 React 项目。任务：重构组件。输入：以下代码。输出格式：表格。要求：保留行为。评价标准：测试通过。步骤：先分析再修改。",
    );

    expect(score.dimensions).toHaveLength(8);
    expect(score.dimensions.map((item) => item.key)).toEqual([
      "clarity",
      "role",
      "context",
      "input",
      "output",
      "constraints",
      "actionability",
      "evaluation",
    ]);
    expect(score.total).toBeGreaterThanOrEqual(0);
    expect(score.total).toBeLessThanOrEqual(100);
  });
});
