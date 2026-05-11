import { describe, expect, it } from "vitest";
import { parseOptimizerResponse, parseOptimizerResponseWithRetry } from "./provider";

describe("provider response parsing", () => {
  it("parses fenced JSON returned by an OpenAI-compatible model", () => {
    const parsed = parseOptimizerResponse(`
\`\`\`json
{
  "optimizedPrompt": "请作为专家完成任务。",
  "diagnosis": "缺少输出格式。",
  "suggestions": ["补充评价标准"],
  "trainingTips": ["先写角色，再写任务"],
  "score": {
    "total": 80,
    "dimensions": []
  }
}
\`\`\`
`);

    expect(parsed.optimizedPrompt).toBe("请作为专家完成任务。");
    expect(parsed.suggestions).toEqual(["补充评价标准"]);
    expect(parsed.score.total).toBe(80);
  });

  it("parses the v1 optimizer result contract", () => {
    const parsed = parseOptimizerResponse(`
{
  "taskRecognition": "论文润色任务",
  "diagnosis": "缺少评价标准。",
  "optimizedPrompt": "请作为学术写作导师润色以下文本。",
  "missingInformation": ["目标期刊", "字数要求"],
  "suggestions": ["补充输出格式"],
  "trainingTips": ["先说明用途，再说明标准"],
  "score": { "total": 76, "dimensions": [] }
}
`);

    expect(parsed.taskRecognition).toBe("论文润色任务");
    expect(parsed.missingInformation).toEqual(["目标期刊", "字数要求"]);
    expect(parsed.optimizedPrompt).toContain("学术写作导师");
  });

  it("falls back to text display when JSON is invalid", () => {
    const parsed = parseOptimizerResponse("模型返回了一段非 JSON 诊断。", "原始 prompt");

    expect(parsed.optimizedPrompt).toBe("原始 prompt");
    expect(parsed.diagnosis).toContain("模型返回了一段非 JSON 诊断");
    expect(parsed.parseStatus).toBe("fallback");
  });

  it("retries parsing once before falling back", async () => {
    let attempts = 0;

    const parsed = await parseOptimizerResponseWithRetry(
      async () => {
        attempts += 1;
        return attempts === 1
          ? "invalid json"
          : '{"optimizedPrompt":"第二次成功","diagnosis":"ok","suggestions":[],"trainingTips":[],"score":{"total":90,"dimensions":[]}}';
      },
      "原始 prompt",
    );

    expect(attempts).toBe(2);
    expect(parsed.optimizedPrompt).toBe("第二次成功");
    expect(parsed.parseStatus).toBe("parsed");
  });
});
