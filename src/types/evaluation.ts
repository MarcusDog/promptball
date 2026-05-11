export type PromptUsageResult = "direct" | "modified" | "unused";

export type PromptProblemTag =
  | "不够专业"
  | "太 AI"
  | "格式不对"
  | "内容空泛"
  | "逻辑不清"
  | "乱编内容"
  | "没有按要求"
  | "输出太长"
  | "输出太短"
  | "不适合当前模型"
  | "其他";

export type ABWinner = "a" | "b" | "both" | "neither";

export interface FavoritePrompt {
  id: string;
  name: string;
  slashCommand: string;
  category: string;
  tags: string[];
  description: string;
  model: string;
  preferredModel: string;
  content: string;
  variables: string[];
  note: string;
  version: number;
  score: number;
  usageCount: number;
  successRate: number;
  averageRating: number;
  directUseRate: number;
  modifiedUseRate: number;
  discardedRate: number;
  defaultVersionId: string;
  isFavorite: boolean;
  isDefault: boolean;
  isBuiltin?: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

export interface FavoritePromptInput {
  id?: string;
  name: string;
  slashCommand: string;
  category?: string;
  tags?: string[] | string;
  description?: string;
  model?: string;
  preferredModel?: string;
  content: string;
  variables?: string[];
  note?: string;
  version?: number;
  score?: number;
  usageCount?: number;
  successRate?: number;
  averageRating?: number;
  directUseRate?: number;
  modifiedUseRate?: number;
  discardedRate?: number;
  defaultVersionId?: string;
  isFavorite?: boolean;
  isDefault?: boolean;
  isBuiltin?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastUsedAt?: string;
}

export interface PromptRun {
  id: string;
  favoritePromptId: string;
  versionId: string;
  input: string;
  output: string;
  model: string;
  createdAt: string;
}

export interface PromptFeedback {
  id: string;
  runId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  usageResult: PromptUsageResult;
  problemTags: PromptProblemTag[];
  note: string;
  createdAt: string;
}

export interface PromptEvalScore {
  id: string;
  runId: string;
  structureScore: number;
  outputQualityScore: number;
  userSatisfactionScore: number;
  realUsageScore: number;
  finalScore: number;
  explanation: string[];
  createdAt: string;
}

export type PromptEvaluationParseStatus = "parsed" | "fallback";

export interface AIEvaluatorResult {
  structureScore: number;
  outputQualityScore: number;
  taskFitScore: number;
  formatScore: number;
  constraintScore: number;
  riskScore: number;
  finalScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  problemTags: PromptProblemTag[];
}

export interface ParsedEvaluatorResult {
  status: PromptEvaluationParseStatus;
  result: AIEvaluatorResult;
  rawText?: string;
  error?: string;
}

export interface PromptVersion {
  id: string;
  favoritePromptId: string;
  version: number;
  content: string;
  note: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PromptVersionDiff {
  addedLines: string[];
  removedLines: string[];
  unchangedLines: number;
  changedLineCount: number;
  lengthDelta: number;
  summary: string[];
}

export interface PromptABTestRecord {
  id: string;
  promptAId: string;
  promptBId: string;
  input: string;
  outputA: string;
  outputB: string;
  model: string;
  winner: ABWinner;
  reason: string;
  taskType: string;
  blindMode: boolean;
  createdAt: string;
}

export interface FavoritePromptMetrics {
  usageCount: number;
  averageRating: number;
  averageFinalScore: number;
  recentAverageFinalScore: number;
  directUseRate: number;
  modifiedUseRate: number;
  discardedRate: number;
  scoreTrend: "up" | "down" | "flat" | "unknown";
  problemTagCounts: Array<{ tag: PromptProblemTag; count: number }>;
  recentRuns: PromptRun[];
}

export interface PromptVersionMetrics {
  versionId: string;
  version: number;
  isDefault: boolean;
  usageCount: number;
  averageRating: number;
  averageFinalScore: number;
  directUseRate: number;
  modifiedUseRate: number;
  discardedRate: number;
  recentRuns: PromptRun[];
}

export interface PromptPerformanceAlert {
  shouldSuggestNewVersion: boolean;
  reasons: string[];
  dominantProblemTags: PromptProblemTag[];
  message: string;
}

export interface ABStats {
  total: number;
  wins: number;
  losses: number;
  ties: number;
  winRate: number;
}
