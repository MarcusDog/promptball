import type { PromptScore, ScoreDimension, ScoreDimensionKey } from "@/types";

const dimensions: Array<{
  key: ScoreDimensionKey;
  label: string;
  patterns: RegExp[];
  suggestion: string;
}> = [
  {
    key: "clarity",
    label: "任务清晰度",
    patterns: [/任务|目标|请|需要|完成|生成|优化/],
    suggestion: "明确写出要完成的具体任务和成功结果。",
  },
  {
    key: "role",
    label: "角色设定",
    patterns: [/你是|作为|扮演|角色|专家|工程师|导师/],
    suggestion: "补充模型应该扮演的专业角色。",
  },
  {
    key: "context",
    label: "上下文",
    patterns: [/背景|上下文|场景|已有|当前|用户正在/],
    suggestion: "补充业务场景、受众、约束背景或已有材料。",
  },
  {
    key: "input",
    label: "输入材料",
    patterns: [/输入|材料|以下|数据|代码|文本|题目/],
    suggestion: "说明输入材料的来源、格式和边界。",
  },
  {
    key: "output",
    label: "输出格式",
    patterns: [/输出|格式|表格|JSON|Markdown|段落|列表/],
    suggestion: "规定输出结构、语言、长度或格式。",
  },
  {
    key: "constraints",
    label: "约束条件",
    patterns: [/要求|约束|不得|不要|必须|保留|限制/],
    suggestion: "写清楚必须遵守和必须避免的规则。",
  },
  {
    key: "actionability",
    label: "可执行性",
    patterns: [/步骤|先|再|最后|执行|流程|拆解/],
    suggestion: "把任务拆成可执行步骤，减少模型自由发挥。",
  },
  {
    key: "evaluation",
    label: "评价标准",
    patterns: [/评价|标准|验收|测试|通过|质量|清晰/],
    suggestion: "补充判断结果好坏的验收标准。",
  },
];

function scoreDimension(prompt: string, item: (typeof dimensions)[number]): ScoreDimension {
  const matched = item.patterns.some((pattern) => pattern.test(prompt));
  const score = matched ? 85 : prompt.length > 80 ? 55 : 35;

  return {
    key: item.key,
    label: item.label,
    score,
    diagnosis: matched ? "已覆盖该维度。" : "该维度信息不足。",
    suggestion: matched ? "保持当前描述，并在复杂任务中继续细化。" : item.suggestion,
  };
}

export function createHeuristicScore(prompt: string): PromptScore {
  const normalized = prompt.trim();
  const scored = dimensions.map((item) => scoreDimension(normalized, item));
  const total = Math.round(scored.reduce((sum, item) => sum + item.score, 0) / scored.length);

  return {
    total: Math.max(0, Math.min(100, total)),
    dimensions: scored,
  };
}
