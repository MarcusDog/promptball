import type {
  AIEvaluatorResult,
  FavoritePromptMetrics,
  ParsedEvaluatorResult,
  PromptEvalScore,
  PromptFeedback,
  PromptPerformanceAlert,
  PromptProblemTag,
  PromptRun,
  PromptUsageResult,
  PromptVersion,
  PromptVersionMetrics,
} from "@/types";

export interface FinalScoreParts {
  structureScore: number;
  outputQualityScore: number;
  userSatisfactionScore: number;
  realUsageScore: number;
}

export const PROMPT_PROBLEM_TAGS: PromptProblemTag[] = [
  "不够专业",
  "太 AI",
  "格式不对",
  "内容空泛",
  "逻辑不清",
  "乱编内容",
  "没有按要求",
  "输出太长",
  "输出太短",
  "不适合当前模型",
  "其他",
];

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0));
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function usageScore(usageResult: PromptUsageResult): number {
  if (usageResult === "direct") {
    return 100;
  }
  if (usageResult === "modified") {
    return 70;
  }
  return 0;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toProblemTags(value: unknown): PromptProblemTag[] {
  return toStringArray(value).filter((tag): tag is PromptProblemTag => PROMPT_PROBLEM_TAGS.includes(tag as PromptProblemTag));
}

function stripJsonFence(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function fallbackEvaluatorResult(rawText: string, error?: string): ParsedEvaluatorResult {
  return {
    status: "fallback",
    rawText,
    error,
    result: {
      structureScore: 0,
      outputQualityScore: 0,
      taskFitScore: 0,
      formatScore: 0,
      constraintScore: 0,
      riskScore: 0,
      finalScore: 0,
      strengths: [],
      weaknesses: rawText ? [rawText] : [],
      suggestions: ["模型没有返回合法 JSON，建议重新评价或手动查看文本反馈。"],
      problemTags: ["其他"],
    },
  };
}

export function calculateFinalScore(parts: FinalScoreParts): number {
  const finalScore =
    clampScore(parts.structureScore) * 0.2 +
    clampScore(parts.outputQualityScore) * 0.35 +
    clampScore(parts.userSatisfactionScore) * 0.25 +
    clampScore(parts.realUsageScore) * 0.2;

  return Number(finalScore.toFixed(2));
}

export function explainFinalScore(parts: FinalScoreParts): string[] {
  const structure = Number((clampScore(parts.structureScore) * 0.2).toFixed(2));
  const output = Number((clampScore(parts.outputQualityScore) * 0.35).toFixed(2));
  const satisfaction = Number((clampScore(parts.userSatisfactionScore) * 0.25).toFixed(2));
  const usage = Number((clampScore(parts.realUsageScore) * 0.2).toFixed(2));
  const finalScore = calculateFinalScore(parts);

  return [
    `Prompt 结构分 ${clampScore(parts.structureScore)} x 0.2 = ${structure}`,
    `输出质量分 ${clampScore(parts.outputQualityScore)} x 0.35 = ${output}`,
    `用户满意分 ${clampScore(parts.userSatisfactionScore)} x 0.25 = ${satisfaction}`,
    `真实使用分 ${clampScore(parts.realUsageScore)} x 0.2 = ${usage}`,
    `综合效果分 = ${finalScore}`,
  ];
}

export function parseEvaluatorResponse(content: string): ParsedEvaluatorResult {
  const rawText = content.trim();
  try {
    const parsed = JSON.parse(stripJsonFence(rawText)) as Partial<AIEvaluatorResult>;
    return {
      status: "parsed",
      rawText,
      result: {
        structureScore: clampScore(Number(parsed.structureScore)),
        outputQualityScore: clampScore(Number(parsed.outputQualityScore)),
        taskFitScore: clampScore(Number(parsed.taskFitScore)),
        formatScore: clampScore(Number(parsed.formatScore)),
        constraintScore: clampScore(Number(parsed.constraintScore)),
        riskScore: clampScore(Number(parsed.riskScore)),
        finalScore: clampScore(Number(parsed.finalScore)),
        strengths: toStringArray(parsed.strengths),
        weaknesses: toStringArray(parsed.weaknesses),
        suggestions: toStringArray(parsed.suggestions),
        problemTags: toProblemTags(parsed.problemTags),
      },
    };
  } catch (error) {
    return fallbackEvaluatorResult(rawText, error instanceof Error ? error.message : String(error));
  }
}

export async function parseEvaluatorResponseWithRetry(generate: () => Promise<string>): Promise<ParsedEvaluatorResult> {
  const first = parseEvaluatorResponse(await generate());
  if (first.status === "parsed") {
    return first;
  }
  return parseEvaluatorResponse(await generate());
}

export function createPromptEvalScore(input: {
  runId: string;
  structureScore: number;
  outputQualityScore: number;
  feedback: PromptFeedback;
}): PromptEvalScore {
  const userSatisfactionScore = input.feedback.rating * 20;
  const realUsageScore = usageScore(input.feedback.usageResult);
  const parts = {
    structureScore: input.structureScore,
    outputQualityScore: input.outputQualityScore,
    userSatisfactionScore,
    realUsageScore,
  };
  const finalScore = calculateFinalScore(parts);

  return {
    id: crypto.randomUUID(),
    runId: input.runId,
    structureScore: clampScore(input.structureScore),
    outputQualityScore: clampScore(input.outputQualityScore),
    userSatisfactionScore,
    realUsageScore,
    finalScore,
    explanation: explainFinalScore(parts),
    createdAt: new Date().toISOString(),
  };
}

function scoreTrend(scores: PromptEvalScore[]): FavoritePromptMetrics["scoreTrend"] {
  if (scores.length < 3) {
    return "unknown";
  }
  const recent = scores.slice(0, Math.ceil(scores.length / 2));
  const older = scores.slice(Math.ceil(scores.length / 2));
  const delta = average(recent.map((score) => score.finalScore)) - average(older.map((score) => score.finalScore));
  if (Math.abs(delta) < 3) {
    return "flat";
  }
  return delta > 0 ? "up" : "down";
}

function countProblemTags(feedback: PromptFeedback[]): Array<{ tag: PromptProblemTag; count: number }> {
  const counts = new Map<PromptProblemTag, number>();
  for (const item of feedback) {
    for (const tag of item.problemTags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || PROMPT_PROBLEM_TAGS.indexOf(a.tag) - PROMPT_PROBLEM_TAGS.indexOf(b.tag));
}

export function summarizeFavoritePromptMetrics(
  favoritePromptId: string,
  runs: PromptRun[],
  feedback: PromptFeedback[],
  scores: PromptEvalScore[],
): FavoritePromptMetrics {
  const promptRuns = runs
    .filter((run) => run.favoritePromptId === favoritePromptId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const runIds = new Set(promptRuns.map((run) => run.id));
  const promptFeedback = feedback.filter((item) => runIds.has(item.runId));
  const runCreatedAt = new Map(promptRuns.map((run) => [run.id, run.createdAt]));
  const promptScores = scores
    .filter((item) => runIds.has(item.runId))
    .sort((a, b) => (runCreatedAt.get(b.runId) ?? b.createdAt).localeCompare(runCreatedAt.get(a.runId) ?? a.createdAt));
  const usageCount = promptRuns.length;
  const recentScores = promptScores.slice(0, 10);

  return {
    usageCount,
    averageRating: Number(average(promptFeedback.map((item) => item.rating)).toFixed(2)),
    averageFinalScore: Number(average(promptScores.map((item) => item.finalScore)).toFixed(2)),
    recentAverageFinalScore: Number(average(recentScores.map((item) => item.finalScore)).toFixed(2)),
    directUseRate: usageCount === 0 ? 0 : promptFeedback.filter((item) => item.usageResult === "direct").length / usageCount,
    modifiedUseRate: usageCount === 0 ? 0 : promptFeedback.filter((item) => item.usageResult === "modified").length / usageCount,
    discardedRate: usageCount === 0 ? 0 : promptFeedback.filter((item) => item.usageResult === "unused").length / usageCount,
    scoreTrend: scoreTrend(promptScores),
    problemTagCounts: countProblemTags(promptFeedback),
    recentRuns: promptRuns.slice(0, 10),
  };
}

export function summarizePromptVersionMetrics(
  favoritePromptId: string,
  versions: PromptVersion[],
  runs: PromptRun[],
  feedback: PromptFeedback[],
  scores: PromptEvalScore[],
): PromptVersionMetrics[] {
  return versions
    .filter((version) => version.favoritePromptId === favoritePromptId)
    .sort((a, b) => b.version - a.version)
    .map((version) => {
      const versionRuns = runs
        .filter((run) => run.favoritePromptId === favoritePromptId && run.versionId === version.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const runIds = new Set(versionRuns.map((run) => run.id));
      const versionFeedback = feedback.filter((item) => runIds.has(item.runId));
      const versionScores = scores.filter((item) => runIds.has(item.runId));
      const usageCount = versionRuns.length;

      return {
        versionId: version.id,
        version: version.version,
        isDefault: version.isDefault,
        usageCount,
        averageRating: Number(average(versionFeedback.map((item) => item.rating)).toFixed(2)),
        averageFinalScore: Number(average(versionScores.map((item) => item.finalScore)).toFixed(2)),
        directUseRate: usageCount === 0 ? 0 : versionFeedback.filter((item) => item.usageResult === "direct").length / usageCount,
        modifiedUseRate: usageCount === 0 ? 0 : versionFeedback.filter((item) => item.usageResult === "modified").length / usageCount,
        discardedRate: usageCount === 0 ? 0 : versionFeedback.filter((item) => item.usageResult === "unused").length / usageCount,
        recentRuns: versionRuns.slice(0, 10),
      };
    });
}

export function createPerformanceAlert(
  favoritePromptId: string,
  runs: PromptRun[],
  feedback: PromptFeedback[],
  scores: PromptEvalScore[],
): PromptPerformanceAlert {
  const metrics = summarizeFavoritePromptMetrics(favoritePromptId, runs, feedback, scores);
  const reasons: string[] = [];
  const recentRuns = metrics.recentRuns.slice(0, 5);
  const recentRunIds = new Set(recentRuns.map((run) => run.id));
  const recentFeedback = feedback.filter((item) => recentRunIds.has(item.runId));
  const lowRatingStreak = recentFeedback.slice(0, 3).length === 3 && recentFeedback.slice(0, 3).every((item) => item.rating < 3);
  const dominantProblemTags = metrics.problemTagCounts.filter((item) => item.count >= 3).map((item) => item.tag);

  if (metrics.recentAverageFinalScore > 0 && metrics.recentAverageFinalScore < 70) {
    reasons.push("最近 5 次平均分低于 70");
  }
  if (metrics.discardedRate > 0.4) {
    reasons.push("废弃率高于 40%");
  }
  if (lowRatingStreak) {
    reasons.push("连续 3 次用户评分低于 3");
  }
  if (dominantProblemTags.length > 0) {
    reasons.push(`问题标签高频出现：${dominantProblemTags.join("、")}`);
  }

  return {
    shouldSuggestNewVersion: reasons.length > 0,
    reasons,
    dominantProblemTags,
    message:
      reasons.length === 0
        ? "该 Prompt 最近表现稳定。"
        : `该 Prompt 最近表现下降，主要问题集中在“${dominantProblemTags.join("、") || "综合评分偏低"}”。是否基于历史反馈生成新版本？`,
  };
}
