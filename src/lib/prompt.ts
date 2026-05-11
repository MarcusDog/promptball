import { OPTIMIZER_SYSTEM_PROMPT } from "@/features/prompt-optimizer/system-prompts/optimizer.system.prompt";
import type { StructuredPromptFields } from "@/types";

const structuredSections: Array<[keyof StructuredPromptFields, string]> = [
  ["role", "Role"],
  ["context", "Context"],
  ["goal", "Goal"],
  ["task", "Task"],
  ["input", "Input"],
  ["output", "Output"],
  ["requirements", "Requirements"],
  ["constraints", "Constraints"],
  ["evaluation", "Evaluation"],
  ["steps", "Steps"],
  ["negative", "Negative"],
];

export function normalizePromptText(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildStructuredPrompt(fields: StructuredPromptFields): string {
  return structuredSections
    .map(([key, title]) => {
      const content = normalizePromptText(fields[key] ?? "");
      return content ? `# ${title}\n${content}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

export const optimizerSystemPrompt = OPTIMIZER_SYSTEM_PROMPT;

export function buildOptimizerUserPrompt(prompt: string): string {
  return [
    "请优化下面的 prompt，并严格返回合法 JSON：",
    '{ "taskRecognition": string, "diagnosis": string, "optimizedPrompt": string, "missingInformation": string[], "suggestions": string[], "trainingTips": string[], "score": { "total": number, "dimensions": [{ "key": string, "label": string, "score": number, "diagnosis": string, "suggestion": string }] } }',
    "",
    normalizePromptText(prompt),
  ].join("\n");
}
