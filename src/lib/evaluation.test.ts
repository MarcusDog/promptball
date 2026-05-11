import { describe, expect, it } from "vitest";
import {
  calculateFinalScore,
  createPromptEvalScore,
  explainFinalScore,
  parseEvaluatorResponse,
  parseEvaluatorResponseWithRetry,
  createPerformanceAlert,
  summarizeFavoritePromptMetrics,
  summarizePromptVersionMetrics,
} from "./evaluation";
import type { PromptEvalScore, PromptFeedback, PromptRun } from "@/types";

describe("prompt evaluation scoring", () => {
  it("calculates weighted final score from explainable score parts", () => {
    expect(
      calculateFinalScore({
        structureScore: 80,
        outputQualityScore: 90,
        userSatisfactionScore: 100,
        realUsageScore: 50,
      }),
    ).toBe(82.5);
  });

  it("explains the weighted final score in user-readable parts", () => {
    expect(
      explainFinalScore({
        structureScore: 80,
        outputQualityScore: 90,
        userSatisfactionScore: 100,
        realUsageScore: 50,
      }),
    ).toEqual([
      "Prompt 结构分 80 x 0.2 = 16",
      "输出质量分 90 x 0.35 = 31.5",
      "用户满意分 100 x 0.25 = 25",
      "真实使用分 50 x 0.2 = 10",
      "综合效果分 = 82.5",
    ]);
  });

  it("maps feedback into satisfaction and real-usage scores", () => {
    const score = createPromptEvalScore({
      runId: "run-1",
      structureScore: 80,
      outputQualityScore: 70,
      feedback: {
        id: "fb-1",
        runId: "run-1",
        rating: 4,
        usageResult: "modified",
        problemTags: ["格式不对"],
        note: "需要微调",
        createdAt: "",
      },
    });

    expect(score.userSatisfactionScore).toBe(80);
    expect(score.realUsageScore).toBe(70);
    expect(score.finalScore).toBe(74.5);
  });

  it("parses AI evaluator JSON from fenced model output", () => {
    const parsed = parseEvaluatorResponse(`\`\`\`json
{
  "structureScore": 82,
  "outputQualityScore": 76,
  "taskFitScore": 80,
  "formatScore": 70,
  "constraintScore": 90,
  "riskScore": 12,
  "finalScore": 79,
  "strengths": ["结构清楚"],
  "weaknesses": ["输出格式还不够细"],
  "suggestions": ["补充表格格式"],
  "problemTags": ["格式不对"]
}
\`\`\``);

    expect(parsed.status).toBe("parsed");
    expect(parsed.result.outputQualityScore).toBe(76);
    expect(parsed.result.problemTags).toEqual(["格式不对"]);
  });

  it("falls back to text display when evaluator output is not valid JSON", () => {
    const parsed = parseEvaluatorResponse("模型给了一段解释，但不是 JSON");

    expect(parsed.status).toBe("fallback");
    expect(parsed.result.finalScore).toBe(0);
    expect(parsed.rawText).toContain("不是 JSON");
  });

  it("retries evaluator parsing once before falling back", async () => {
    let calls = 0;
    const parsed = await parseEvaluatorResponseWithRetry(async () => {
      calls += 1;
      return calls === 1
        ? "bad"
        : JSON.stringify({
            structureScore: 90,
            outputQualityScore: 88,
            taskFitScore: 86,
            formatScore: 84,
            constraintScore: 82,
            riskScore: 10,
            finalScore: 87,
            strengths: [],
            weaknesses: [],
            suggestions: [],
            problemTags: [],
          });
    });

    expect(calls).toBe(2);
    expect(parsed.status).toBe("parsed");
  });
});

describe("favorite prompt metrics", () => {
  it("summarizes usage rates, average scores, and recent runs", () => {
    const runs: PromptRun[] = [
      { id: "run-1", favoritePromptId: "fav", versionId: "v1", input: "a", output: "a", model: "m", createdAt: "2026-05-06T01:00:00.000Z" },
      { id: "run-2", favoritePromptId: "fav", versionId: "v1", input: "b", output: "b", model: "m", createdAt: "2026-05-06T02:00:00.000Z" },
      { id: "run-3", favoritePromptId: "fav", versionId: "v1", input: "c", output: "c", model: "m", createdAt: "2026-05-06T03:00:00.000Z" },
    ];
    const feedback: PromptFeedback[] = [
      { id: "fb-1", runId: "run-1", rating: 5, usageResult: "direct", problemTags: [], note: "", createdAt: "" },
      { id: "fb-2", runId: "run-2", rating: 4, usageResult: "modified", problemTags: [], note: "", createdAt: "" },
      { id: "fb-3", runId: "run-3", rating: 2, usageResult: "unused", problemTags: ["太 AI"], note: "", createdAt: "" },
    ];
    const scores: PromptEvalScore[] = [
      { id: "s1", runId: "run-1", structureScore: 80, outputQualityScore: 90, userSatisfactionScore: 100, realUsageScore: 100, finalScore: 92.5, explanation: [], createdAt: "" },
      { id: "s2", runId: "run-2", structureScore: 80, outputQualityScore: 80, userSatisfactionScore: 80, realUsageScore: 70, finalScore: 78, explanation: [], createdAt: "" },
      { id: "s3", runId: "run-3", structureScore: 70, outputQualityScore: 40, userSatisfactionScore: 40, realUsageScore: 0, finalScore: 38, explanation: [], createdAt: "" },
    ];

    const metrics = summarizeFavoritePromptMetrics("fav", runs, feedback, scores);

    expect(metrics.usageCount).toBe(3);
    expect(metrics.averageRating).toBeCloseTo(3.67, 2);
    expect(metrics.directUseRate).toBeCloseTo(1 / 3, 2);
    expect(metrics.modifiedUseRate).toBeCloseTo(1 / 3, 2);
    expect(metrics.discardedRate).toBeCloseTo(1 / 3, 2);
    expect(metrics.averageFinalScore).toBeCloseTo(69.5, 1);
    expect(metrics.recentAverageFinalScore).toBeCloseTo(69.5, 1);
    expect(metrics.scoreTrend).toBe("down");
    expect(metrics.problemTagCounts).toEqual([{ tag: "太 AI", count: 1 }]);
    expect(metrics.recentRuns.map((run) => run.id)).toEqual(["run-3", "run-2", "run-1"]);
  });

  it("suggests a new prompt version when recent scores and feedback degrade", () => {
    const runs: PromptRun[] = Array.from({ length: 5 }, (_, index) => ({
      id: `run-${index + 1}`,
      favoritePromptId: "fav",
      versionId: "v1",
      input: "input",
      output: "output",
      model: "m",
      createdAt: `2026-05-06T0${index}:00:00.000Z`,
    }));
    const feedback: PromptFeedback[] = runs.map((run, index) => ({
      id: `fb-${index + 1}`,
      runId: run.id,
      rating: index < 3 ? 2 : 3,
      usageResult: index < 3 ? "unused" : "modified",
      problemTags: ["格式不对", "内容空泛"],
      note: "",
      createdAt: "",
    }));
    const scores: PromptEvalScore[] = runs.map((run, index) => ({
      id: `s-${index + 1}`,
      runId: run.id,
      structureScore: 60,
      outputQualityScore: 55,
      userSatisfactionScore: 40,
      realUsageScore: 0,
      finalScore: 50 + index,
      explanation: [],
      createdAt: "",
    }));

    const alert = createPerformanceAlert("fav", runs, feedback, scores);

    expect(alert.shouldSuggestNewVersion).toBe(true);
    expect(alert.dominantProblemTags).toEqual(["格式不对", "内容空泛"]);
    expect(alert.message).toContain("格式不对、内容空泛");
  });
});

describe("prompt version metrics", () => {
  it("summarizes prompt runs and scores per version", () => {
    const versions = [
      { id: "v1", favoritePromptId: "fav", version: 1, content: "old", note: "", isDefault: false, createdAt: "2026-05-06T00:00:00.000Z" },
      { id: "v2", favoritePromptId: "fav", version: 2, content: "new", note: "", isDefault: true, createdAt: "2026-05-06T01:00:00.000Z" },
    ];
    const runs: PromptRun[] = [
      { id: "run-1", favoritePromptId: "fav", versionId: "v1", input: "a", output: "a", model: "m", createdAt: "2026-05-06T02:00:00.000Z" },
      { id: "run-2", favoritePromptId: "fav", versionId: "v2", input: "b", output: "b", model: "m", createdAt: "2026-05-06T03:00:00.000Z" },
      { id: "run-3", favoritePromptId: "fav", versionId: "v2", input: "c", output: "c", model: "m", createdAt: "2026-05-06T04:00:00.000Z" },
    ];
    const feedback: PromptFeedback[] = [
      { id: "fb-1", runId: "run-1", rating: 2, usageResult: "unused", problemTags: [], note: "", createdAt: "" },
      { id: "fb-2", runId: "run-2", rating: 5, usageResult: "direct", problemTags: [], note: "", createdAt: "" },
      { id: "fb-3", runId: "run-3", rating: 4, usageResult: "modified", problemTags: [], note: "", createdAt: "" },
    ];
    const scores: PromptEvalScore[] = [
      { id: "s1", runId: "run-1", structureScore: 50, outputQualityScore: 50, userSatisfactionScore: 40, realUsageScore: 0, finalScore: 47.5, explanation: [], createdAt: "" },
      { id: "s2", runId: "run-2", structureScore: 90, outputQualityScore: 90, userSatisfactionScore: 100, realUsageScore: 100, finalScore: 94.5, explanation: [], createdAt: "" },
      { id: "s3", runId: "run-3", structureScore: 80, outputQualityScore: 80, userSatisfactionScore: 80, realUsageScore: 70, finalScore: 78, explanation: [], createdAt: "" },
    ];

    expect(summarizePromptVersionMetrics("fav", versions, runs, feedback, scores)).toMatchObject([
      { versionId: "v2", version: 2, usageCount: 2, averageRating: 4.5, averageFinalScore: 86.25, directUseRate: 0.5, modifiedUseRate: 0.5 },
      { versionId: "v1", version: 1, usageCount: 1, averageRating: 2, averageFinalScore: 47.5, discardedRate: 1 },
    ]);
  });
});
