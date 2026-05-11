import type { OptimizerResult, PromptScore } from "@/types";
import { createHeuristicScore } from "./scoring";

function stripJsonFence(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function asScore(value: unknown, fallbackPrompt: string): PromptScore {
  if (
    value &&
    typeof value === "object" &&
    "total" in value &&
    "dimensions" in value &&
    Array.isArray((value as PromptScore).dimensions)
  ) {
    return value as PromptScore;
  }

  return createHeuristicScore(fallbackPrompt);
}

export function parseOptimizerResponse(content: string, fallbackPrompt = ""): OptimizerResult {
  try {
    const json = JSON.parse(stripJsonFence(content)) as Partial<OptimizerResult>;
    const optimizedPrompt = typeof json.optimizedPrompt === "string" ? json.optimizedPrompt : fallbackPrompt;
    const diagnosis = typeof json.diagnosis === "string" ? json.diagnosis : "";

    return {
      taskRecognition: typeof json.taskRecognition === "string" ? json.taskRecognition : "未识别任务类型",
      optimizedPrompt,
      diagnosis,
      missingInformation: asStringArray(json.missingInformation),
      suggestions: asStringArray(json.suggestions),
      trainingTips: asStringArray(json.trainingTips),
      score: asScore(json.score, optimizedPrompt || diagnosis || fallbackPrompt),
      parseStatus: "parsed",
    };
  } catch {
    return createFallbackOptimizerResult(content, fallbackPrompt);
  }
}

export async function parseOptimizerResponseWithRetry(
  generate: () => Promise<string>,
  fallbackPrompt = "",
): Promise<OptimizerResult> {
  const first = parseOptimizerResponse(await generate(), fallbackPrompt);
  if (first.parseStatus === "parsed") {
    return first;
  }

  const second = parseOptimizerResponse(await generate(), fallbackPrompt);
  return second.parseStatus === "parsed" ? second : first;
}

export function createLocalOptimizerResult(prompt: string): OptimizerResult {
  const optimizedPrompt = createLocalOptimizedPrompt(prompt);
  const score = createHeuristicScore(optimizedPrompt);
  return {
    taskRecognition: "本地启发式 Prompt 诊断",
    optimizedPrompt,
    diagnosis: "当前未配置可用 API Key，已使用本地规则补齐角色、任务、输出格式、约束和评价标准。",
    missingInformation: score.dimensions.filter((item) => item.score < 70).map((item) => item.label),
    suggestions: score.dimensions.filter((item) => item.score < 70).map((item) => item.suggestion),
    trainingTips: [
      "先写角色和任务，再补充上下文、输入材料、输出格式和评价标准。",
      "对不确定信息使用【可替换】占位，避免让模型编造事实。",
    ],
    score,
    parseStatus: "parsed",
  };
}

function createLocalOptimizedPrompt(prompt: string): string {
  const source = prompt.trim();
  if (!source) {
    return "";
  }

  const alreadyStructured = /(^|\n)(角色|目标|任务|上下文|输出|约束|评价|Role|Goal|Task|Context|Output)\s*[:：]/i.test(source);
  if (alreadyStructured) {
    return [
      source,
      "",
      "补充要求：",
      "1. 优先使用清晰的小标题、列表或表格组织内容。",
      "2. 对不确定信息明确标注假设，不编造事实。",
      "3. 输出前自检：是否完整回应目标、是否便于直接执行。",
    ].join("\n");
  }

  return [
    "角色：你是一位严谨、清晰、可执行的专业助手，擅长把模糊需求整理成高质量结果。",
    "",
    "任务目标：根据用户提供的原始需求，生成结构清晰、信息完整、可直接使用的输出。",
    "",
    "原始需求：",
    source,
    "",
    "输出要求：",
    "1. 先简要判断任务类型和目标受众。",
    "2. 使用小标题、编号列表或表格组织关键信息。",
    "3. 对关键步骤给出可执行说明，避免空泛表述。",
    "4. 如信息不足，列出需要用户补充的问题，并基于合理假设继续给出草案。",
    "",
    "约束条件：",
    "- 语言简洁、准确、友好。",
    "- 不编造事实；不确定内容需标注为假设。",
    "- 保留用户原始意图，不擅自改变任务范围。",
    "",
    "评价标准：完整性、清晰度、可执行性、准确性、输出格式稳定性。",
  ].join("\n");
}

function createFallbackOptimizerResult(content: string, fallbackPrompt: string): OptimizerResult {
  const diagnosis = content.trim() || "模型返回内容不是合法 JSON，已降级为文本诊断。";
  const prompt = fallbackPrompt || diagnosis;

  return {
    taskRecognition: "模型输出解析失败",
    optimizedPrompt: prompt,
    diagnosis,
    missingInformation: ["模型需要返回合法 JSON"],
    suggestions: ["请重新优化，或降低模型温度后重试。"],
    trainingTips: ["要求模型只输出 JSON，不要包含 Markdown 代码块或额外解释。"],
    score: createHeuristicScore(prompt),
    parseStatus: "fallback",
  };
}
