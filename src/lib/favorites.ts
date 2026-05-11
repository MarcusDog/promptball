import type { ABStats, FavoritePrompt, FavoritePromptInput, PromptABTestRecord, PromptVersion, PromptVersionDiff } from "@/types";

const BUILTIN_TIME = "2026-05-06T00:00:00.000Z";

const pinyinPhrases: Array<[string, string]> = [
  ["论文作图", "lunwen zuotu"],
  ["学术润色", "xueshu runse"],
  ["通用优化", "tongyong youhua"],
  ["编程", "biancheng"],
  ["修复", "xiufu"],
  ["开发", "kaifa"],
  ["产品经理", "chanpin jingli"],
  ["图片生成", "tupian shengcheng"],
  ["文献分析", "wenxian fenxi"],
  ["代码解释", "daima jieshi"],
  ["错误排查", "cuowu paicha"],
  ["界面设计", "jiemian sheji"],
  ["设计", "sheji"],
];

export const DEFAULT_FAVORITE_PROMPTS: FavoritePrompt[] = [
  builtinPrompt({
    id: "builtin-general-optimizer",
    name: "通用 Prompt 优化",
    slashCommand: "/通用优化",
    category: "通用专业 Prompt",
    tags: ["通用", "优化"],
    description: "把模糊需求整理成结构清晰、可执行的 prompt。",
    content: "请担任 Prompt Engineering 教练，优化以下需求：{{原始需求}}。请输出诊断、改进建议和可直接复制的最终 Prompt。",
    variables: ["原始需求"],
  }),
  builtinPrompt({
    id: "builtin-academic-polish",
    name: "学术润色",
    slashCommand: "/学术润色",
    category: "学术论文 Prompt",
    tags: ["论文", "润色"],
    description: "保持原意，提升学术表达、逻辑连贯和格式规范。",
    content: "请对以下论文段落进行学术润色，保持原意，不编造事实，并说明主要修改点：{{论文段落}}",
    variables: ["论文段落"],
  }),
  builtinPrompt({
    id: "builtin-paper-figure",
    name: "论文作图专家",
    slashCommand: "/论文作图",
    category: "毕业论文作图 Prompt",
    tags: ["论文", "作图"],
    description: "把论文内容转成可交付的图示绘制说明。",
    content: "请根据论文主题《{{论文主题}}》和材料 {{输入材料}}，设计一张{{图类型}}。请给出图名、结构层级、元素说明、连线关系和绘图注意事项。",
    variables: ["论文主题", "输入材料", "图类型"],
  }),
  builtinPrompt({
    id: "builtin-codex-dev",
    name: "Codex 开发任务",
    slashCommand: "/codex开发",
    category: "Codex 开发 Prompt",
    tags: ["codex", "开发"],
    description: "把开发需求拆成可执行、可验收的 Codex 任务。",
    content: "你是资深全栈工程师。请在现有代码基础上实现：{{开发目标}}。约束：{{约束条件}}。验收标准：{{验收标准}}。",
    variables: ["开发目标", "约束条件", "验收标准"],
  }),
  builtinPrompt({
    id: "builtin-codex-fix",
    name: "Codex 修复任务",
    slashCommand: "/codex修复",
    category: "Codex 修复 Prompt",
    tags: ["codex", "修复"],
    description: "描述 bug、复现路径和修复边界，避免过度重构。",
    content: "请定位并修复以下问题：{{问题描述}}。复现方式：{{复现步骤}}。限制：只做最小必要修改，并补充或更新相关测试。",
    variables: ["问题描述", "复现步骤"],
  }),
  builtinPrompt({
    id: "builtin-ui-design",
    name: "UI 设计提示词",
    slashCommand: "/ui设计",
    category: "UI 设计 Prompt",
    tags: ["UI", "设计"],
    description: "生成清晰的产品界面设计要求。",
    content: "请为 {{产品/页面}} 设计一个现代、轻量、专业的 UI。目标用户：{{目标用户}}。核心流程：{{核心流程}}。请明确布局、组件、状态和禁止风格。",
    variables: ["产品/页面", "目标用户", "核心流程"],
  }),
  builtinPrompt({
    id: "builtin-product-manager",
    name: "产品经理需求拆解",
    slashCommand: "/产品经理",
    category: "产品经理 Prompt",
    tags: ["产品", "需求"],
    description: "把想法拆成用户场景、功能范围和验收标准。",
    content: "请把以下产品想法拆解为 PRD：{{产品想法}}。请包含用户画像、核心流程、功能优先级、边界条件和验收标准。",
    variables: ["产品想法"],
  }),
  builtinPrompt({
    id: "builtin-image-generation",
    name: "图片生成 Prompt",
    slashCommand: "/图片生成",
    category: "图片生成 Prompt",
    tags: ["图片", "生成"],
    description: "构造主体、构图、风格和禁止项明确的图片 prompt。",
    content: "请为图片生成模型编写 prompt。主体：{{主体}}。场景：{{场景}}。风格：{{风格}}。请补充构图、光线、材质、细节和负面提示词。",
    variables: ["主体", "场景", "风格"],
  }),
  builtinPrompt({
    id: "builtin-literature-analysis",
    name: "文献分析",
    slashCommand: "/文献分析",
    category: "文献分析 Prompt",
    tags: ["论文", "文献"],
    description: "提取文献贡献、方法、结论和可借鉴点。",
    content: "请分析以下文献材料：{{文献材料}}。请输出研究问题、方法、核心结论、创新点、局限性和可用于我论文的参考点。",
    variables: ["文献材料"],
  }),
  builtinPrompt({
    id: "builtin-code-explain",
    name: "代码解释",
    slashCommand: "/代码解释",
    category: "代码解释 Prompt",
    tags: ["代码", "解释"],
    description: "解释代码意图、流程、风险和可改进点。",
    content: "请解释以下代码：{{代码}}。请说明它解决什么问题、核心流程、关键变量、潜在风险和可改进建议。",
    variables: ["代码"],
  }),
  builtinPrompt({
    id: "builtin-error-debug",
    name: "错误排查",
    slashCommand: "/错误排查",
    category: "错误排查 Prompt",
    tags: ["错误", "调试"],
    description: "把报错信息转成可执行的排查路径。",
    content: "请帮我排查以下错误：{{错误信息}}。上下文：{{运行环境}}。请给出最可能原因、验证步骤、修复方案和避免复发建议。",
    variables: ["错误信息", "运行环境"],
  }),
];

function builtinPrompt(input: Omit<FavoritePromptInput, "model" | "preferredModel" | "note">): FavoritePrompt {
  return normalizeFavoritePrompt(
    {
      ...input,
      model: "deepseek-chat",
      preferredModel: "deepseek-chat",
      note: input.description,
      score: 80,
      successRate: 0,
      isFavorite: true,
      isDefault: false,
      isBuiltin: true,
      createdAt: BUILTIN_TIME,
      updatedAt: BUILTIN_TIME,
    },
    BUILTIN_TIME,
  );
}

function searchableText(value: string): string {
  const lower = value.toLowerCase();
  const hints = pinyinPhrases
    .filter(([phrase]) => value.includes(phrase))
    .map(([, pinyin]) => pinyin)
    .join(" ");
  return `${lower} ${hints}`.replace(/\s+/g, " ").trim();
}

function fuzzyMatchScore(query: string, target: string): number {
  const compactQuery = query.toLowerCase().replace(/\s+/g, "");
  const compactTarget = target.toLowerCase().replace(/\s+/g, "");
  if (!compactQuery) {
    return 0;
  }
  if (compactTarget.includes(compactQuery)) {
    return 100;
  }

  let queryIndex = 0;
  for (const char of compactTarget) {
    if (char === compactQuery[queryIndex]) {
      queryIndex += 1;
    }
  }
  return queryIndex === compactQuery.length ? 70 + queryIndex : 0;
}

function toTags(tags: string[] | string | undefined): string[] {
  if (Array.isArray(tags)) {
    return tags.map((tag) => tag.trim()).filter(Boolean);
  }
  return (tags ?? "")
    .split(/[,，\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeSlashCommand(slashCommand: string): string {
  const command = slashCommand.trim();
  return command.startsWith("/") ? command : `/${command}`;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `fav-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeFavoritePrompt(input: FavoritePromptInput, now = new Date().toISOString()): FavoritePrompt {
  const preferredModel = input.preferredModel?.trim() || input.model?.trim() || "deepseek-chat";
  const createdAt = input.createdAt ?? now;
  const updatedAt = input.updatedAt ?? now;
  const variables = input.variables?.length ? input.variables : extractPromptVariables(input.content);

  return {
    id: input.id ?? createId(),
    name: input.name.trim(),
    slashCommand: normalizeSlashCommand(input.slashCommand),
    category: input.category?.trim() || "未分类",
    tags: toTags(input.tags),
    description: input.description?.trim() || input.note?.trim() || "",
    model: input.model?.trim() || preferredModel,
    preferredModel,
    content: input.content,
    variables,
    note: input.note?.trim() || "",
    version: input.version ?? 1,
    score: input.score ?? 0,
    usageCount: input.usageCount ?? 0,
    successRate: input.successRate ?? input.directUseRate ?? 0,
    averageRating: input.averageRating ?? 0,
    directUseRate: input.directUseRate ?? 0,
    modifiedUseRate: input.modifiedUseRate ?? 0,
    discardedRate: input.discardedRate ?? 0,
    defaultVersionId: input.defaultVersionId ?? "",
    isFavorite: input.isFavorite ?? true,
    isDefault: input.isDefault ?? false,
    isBuiltin: input.isBuiltin,
    createdAt,
    updatedAt,
    lastUsedAt: input.lastUsedAt || undefined,
  };
}

export function mergeDefaultFavoritePrompts(prompts: FavoritePrompt[]): FavoritePrompt[] {
  const bySlash = new Map(prompts.map((prompt) => [prompt.slashCommand, prompt]));
  const defaults = DEFAULT_FAVORITE_PROMPTS.filter((prompt) => !bySlash.has(prompt.slashCommand));
  return sortFavoritePrompts([...prompts, ...defaults]);
}

export function sortFavoritePrompts(prompts: FavoritePrompt[]): FavoritePrompt[] {
  return [...prompts].sort((a, b) => {
    if (a.isDefault !== b.isDefault) {
      return a.isDefault ? -1 : 1;
    }
    const aRecent = a.lastUsedAt ?? a.updatedAt ?? a.createdAt;
    const bRecent = b.lastUsedAt ?? b.updatedAt ?? b.createdAt;
    if (aRecent !== bRecent) {
      return bRecent.localeCompare(aRecent);
    }
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    return b.usageCount - a.usageCount;
  });
}

export function markDefaultFavoritePrompt(prompts: FavoritePrompt[], promptId: string): FavoritePrompt[] {
  return prompts.map((prompt) => ({
    ...prompt,
    isDefault: prompt.id === promptId,
  }));
}

export function extractPromptVariables(content: string): string[] {
  const seen = new Set<string>();
  const variables: string[] = [];
  for (const match of content.matchAll(/{{\s*([\w\u4e00-\u9fa5/ -]+)\s*}}/g)) {
    const variable = match[1].trim();
    if (!seen.has(variable)) {
      seen.add(variable);
      variables.push(variable);
    }
  }
  return variables;
}

export function applyPromptVariables(content: string, values: Record<string, string>): string {
  return content.replace(/{{\s*([\w\u4e00-\u9fa5/ -]+)\s*}}/g, (_, key: string) => {
    const normalizedKey = key.trim();
    const value = values[normalizedKey]?.trim();
    return value || `【${normalizedKey}】`;
  });
}

export function buildABPromptInput(prompt: FavoritePrompt, material: string, values: Record<string, string> = {}): string {
  return `${applyPromptVariables(prompt.content, values)}\n\n测试材料：\n${material.trim()}`;
}

export function rankSlashCommands(query: string, prompts: FavoritePrompt[]): FavoritePrompt[] {
  const cleanQuery = query.replace(/^\//, "").trim();
  return prompts
    .map((prompt) => {
      const haystack = searchableText(
        `${prompt.slashCommand} ${prompt.name} ${prompt.category} ${prompt.tags.join(" ")} ${prompt.description} ${prompt.note}`,
      );
      const command = prompt.slashCommand.replace(/^\//, "").toLowerCase();
      const slashScore = command.startsWith(cleanQuery.toLowerCase()) ? 140 : 0;
      const fuzzyScore = fuzzyMatchScore(cleanQuery, haystack);
      const defaultBoost = prompt.isDefault ? 30 : 0;
      const qualityBoost = prompt.score / 10 + prompt.usageCount / 20;
      return { prompt, score: slashScore + fuzzyScore + defaultBoost + qualityBoost };
    })
    .filter((item) => cleanQuery === "" || item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.prompt);
}

export function resolveDefaultVersion(prompt: FavoritePrompt, versions: PromptVersion[]): PromptVersion | undefined {
  return versions.find((version) => version.id === prompt.defaultVersionId) ?? versions.find((version) => version.isDefault) ?? versions[0];
}

export function comparePromptVersionContent(previousContent: string, currentContent: string): PromptVersionDiff {
  const previousLines = previousContent.split(/\r?\n/);
  const currentLines = currentContent.split(/\r?\n/);
  const addedLines: string[] = [];
  const removedLines: string[] = [];
  let unchangedLines = 0;
  const maxLength = Math.max(previousLines.length, currentLines.length);

  for (let index = 0; index < maxLength; index += 1) {
    const previousLine = previousLines[index];
    const currentLine = currentLines[index];
    if (previousLine === currentLine && previousLine !== undefined) {
      unchangedLines += 1;
      continue;
    }
    if (previousLine !== undefined) {
      removedLines.push(previousLine);
    }
    if (currentLine !== undefined) {
      addedLines.push(currentLine);
    }
  }

  const lengthDelta = currentContent.length - previousContent.length;
  const changedLineCount = addedLines.length + removedLines.length;

  return {
    addedLines,
    removedLines,
    unchangedLines,
    changedLineCount,
    lengthDelta,
    summary: [
      `${addedLines.length} added lines`,
      `${removedLines.length} removed lines`,
      `${unchangedLines} unchanged lines`,
      `length delta ${lengthDelta >= 0 ? "+" : ""}${lengthDelta}`,
    ],
  };
}

export function computeABStats(promptId: string, records: PromptABTestRecord[]): ABStats {
  const related = records.filter((record) => record.promptAId === promptId || record.promptBId === promptId);
  let wins = 0;
  let losses = 0;
  let ties = 0;

  for (const record of related) {
    if (record.winner === "both") {
      ties += 1;
    } else if (record.winner === "neither") {
      losses += 1;
    } else if ((record.winner === "a" && record.promptAId === promptId) || (record.winner === "b" && record.promptBId === promptId)) {
      wins += 1;
    } else {
      losses += 1;
    }
  }

  const decisive = wins + losses;
  return {
    total: related.length,
    wins,
    losses,
    ties,
    winRate: decisive === 0 ? 0 : Number((wins / decisive).toFixed(4)),
  };
}
