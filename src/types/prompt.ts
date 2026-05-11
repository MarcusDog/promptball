export type PromptMode = "free" | "role" | "voice";

export type ScoreDimensionKey =
  | "clarity"
  | "role"
  | "context"
  | "input"
  | "output"
  | "constraints"
  | "actionability"
  | "evaluation";

export interface StructuredPromptFields {
  role: string;
  context: string;
  goal: string;
  task: string;
  input: string;
  output: string;
  requirements: string;
  constraints: string;
  evaluation: string;
  steps: string;
  negative: string;
}

export interface ScoreDimension {
  key: ScoreDimensionKey;
  label: string;
  score: number;
  diagnosis: string;
  suggestion: string;
}

export interface PromptScore {
  total: number;
  dimensions: ScoreDimension[];
}

export interface OptimizerResult {
  taskRecognition: string;
  optimizedPrompt: string;
  diagnosis: string;
  missingInformation: string[];
  suggestions: string[];
  trainingTips: string[];
  score: PromptScore;
  parseStatus?: "parsed" | "fallback";
}

export interface PromptHistoryItem {
  id: string;
  originalPrompt: string;
  optimizedPrompt: string;
  diagnosis: string;
  suggestions: string[];
  trainingTips: string[];
  score: PromptScore;
  model: string;
  mode: PromptMode;
  tags: string[];
  favorite: boolean;
  createdAt: string;
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  scenario: string;
  applicableModels: string[];
  variables: string[];
  content: string;
  outputExample: string;
  evaluationCriteria: string[];
  tags: string[];
  isBuiltin: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface OptimizeRequest {
  mode: PromptMode;
  prompt: string;
  structuredFields?: StructuredPromptFields;
}
