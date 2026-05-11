import type { FavoritePromptInput, PromptTemplate } from "@/types";

const BUILTIN_TIME = "2026-05-07T00:00:00.000Z";

export const BUILTIN_TEMPLATE_CATEGORIES = [
  "通用专业 Prompt",
  "学术论文 Prompt",
  "毕业论文作图 Prompt",
  "Codex 开发 Prompt",
  "Codex 修复 Prompt",
  "UI 设计 Prompt",
  "产品经理 Prompt",
  "图片生成 Prompt",
  "文献分析 Prompt",
  "代码解释 Prompt",
  "错误排查 Prompt",
  "数据分析 Prompt",
] as const;

const pinyinHints: Array<[string, string]> = [
  ["通用", "tongyong"],
  ["学术", "xueshu"],
  ["论文", "lunwen"],
  ["论文作图", "lunwen zuotu"],
  ["作图", "zuotu"],
  ["毕业论文", "biye lunwen"],
  ["修复", "xiufu"],
  ["开发", "kaifa"],
  ["设计", "sheji"],
  ["产品经理", "chanpin jingli"],
  ["图片生成", "tupian shengcheng"],
  ["文献分析", "wenxian fenxi"],
  ["代码解释", "daima jieshi"],
  ["错误排查", "cuowu paicha"],
  ["数据分析", "shuju fenxi"],
];

function template(input: Omit<PromptTemplate, "isBuiltin" | "createdAt" | "updatedAt">): PromptTemplate {
  return {
    ...input,
    isBuiltin: true,
    createdAt: BUILTIN_TIME,
    updatedAt: BUILTIN_TIME,
  };
}

export const builtinTemplates: PromptTemplate[] = [
  template({
    id: "template-general-task",
    title: "通用任务拆解 Prompt",
    category: "通用专业 Prompt",
    description: "把模糊想法拆成角色、背景、任务、输入、输出和验收标准。",
    scenario: "适合用户只有一个初步想法，需要整理成可直接交给模型执行的 Prompt。",
    applicableModels: ["deepseek-chat", "gpt-4.1", "claude-3.7-sonnet"],
    variables: ["原始想法", "目标受众", "输出格式"],
    tags: ["通用", "拆解", "优化"],
    content: [
      "你是资深 Prompt Engineering 教练。",
      "请把以下原始想法整理成高质量 Prompt。",
      "原始想法：{{原始想法}}",
      "目标受众：{{目标受众}}",
      "期望输出格式：{{输出格式}}",
      "请输出：任务识别、缺失信息、优化后的 Prompt、使用建议。",
      "不要编造事实；必须假设时使用【可替换】标注。",
    ].join("\n"),
    outputExample: "任务识别：...\n优化后的 Prompt：你是...\n使用建议：...",
    evaluationCriteria: ["任务边界清晰", "输出格式明确", "缺失信息被标注", "可直接复制使用"],
  }),
  template({
    id: "template-general-meeting",
    title: "会议纪要整理 Prompt",
    category: "通用专业 Prompt",
    description: "把会议原文整理成决议、行动项、风险和后续问题。",
    scenario: "适合整理语音转写、会议记录、访谈纪要。",
    applicableModels: ["deepseek-chat", "gpt-4.1"],
    variables: ["会议记录", "项目背景"],
    tags: ["通用", "会议", "纪要"],
    content: "你是专业项目秘书。项目背景：{{项目背景}}\n请整理会议记录：{{会议记录}}\n输出 Markdown，包含：摘要、关键决议、行动项表格、风险、待确认问题。不要补充记录中没有的信息。",
    outputExample: "|行动项|负责人|截止时间|状态|\n|---|---|---|---|",
    evaluationCriteria: ["行动项完整", "责任和时间不被编造", "风险清晰", "格式稳定"],
  }),
  template({
    id: "template-academic-polish",
    title: "学术论文润色 Prompt",
    category: "学术论文 Prompt",
    description: "保持原意，提升学术表达、逻辑连贯和规范性。",
    scenario: "适合中文论文段落润色、降 AI 味、提升表达严谨性。",
    applicableModels: ["deepseek-chat", "gpt-4.1", "claude-3.7-sonnet"],
    variables: ["论文段落", "学科方向"],
    tags: ["论文", "润色", "学术"],
    content: "你是{{学科方向}}方向的高校论文写作导师。请润色以下论文段落：{{论文段落}}\n要求：保持原意，不编造数据，不改变术语；提升学术表达、逻辑连贯和句式自然度；输出润色后正文和修改说明。",
    outputExample: "润色后：...\n修改说明：1. ...",
    evaluationCriteria: ["原意保持", "表达学术", "逻辑顺畅", "无新增事实"],
  }),
  template({
    id: "template-academic-abstract",
    title: "论文摘要生成 Prompt",
    category: "学术论文 Prompt",
    description: "基于研究材料生成规范摘要和关键词。",
    scenario: "适合毕业论文、课程论文、期刊论文摘要初稿。",
    applicableModels: ["deepseek-chat", "gpt-4.1"],
    variables: ["研究主题", "研究材料", "字数要求"],
    tags: ["论文", "摘要"],
    content: "你是学术论文写作导师。研究主题：{{研究主题}}\n研究材料：{{研究材料}}\n请生成约{{字数要求}}字中文摘要，并给出 3-5 个关键词。要求包含研究背景、方法、结果、意义；不得编造实验数据。",
    outputExample: "摘要：...\n关键词：...；...；...",
    evaluationCriteria: ["四要素完整", "字数接近", "术语准确", "无数据编造"],
  }),
  template({
    id: "template-thesis-framework-figure",
    title: "论文作图：系统架构图 Prompt",
    category: "毕业论文作图 Prompt",
    description: "把论文系统描述转成可绘制的架构图说明。",
    scenario: "适合毕业论文系统架构、平台架构、模块关系图。",
    applicableModels: ["deepseek-chat", "gpt-4.1"],
    variables: ["论文主题", "系统模块", "技术栈"],
    tags: ["论文作图", "架构图"],
    content: "请为论文《{{论文主题}}》设计一张系统架构图。系统模块：{{系统模块}}\n技术栈：{{技术栈}}\n请输出：图名、分层结构、每层节点、节点说明、连接关系、绘图注意事项，并给出 Mermaid 版本。",
    outputExample: "图名：系统总体架构图\nMermaid：graph TD...",
    evaluationCriteria: ["层次清楚", "节点关系准确", "适合论文排版", "可复现绘图"],
  }),
  template({
    id: "template-thesis-flow-figure",
    title: "论文作图：业务流程图 Prompt",
    category: "毕业论文作图 Prompt",
    description: "把业务过程转成论文可用流程图。",
    scenario: "适合需求分析、业务流程、算法流程、实验流程图。",
    applicableModels: ["deepseek-chat", "gpt-4.1"],
    variables: ["流程名称", "流程步骤", "参与角色"],
    tags: ["论文作图", "流程图"],
    content: "请为{{流程名称}}设计论文流程图。参与角色：{{参与角色}}\n流程步骤：{{流程步骤}}\n输出：流程节点、判断条件、异常分支、图注说明、Mermaid 流程图。要求简洁、学术、无多余装饰。",
    outputExample: "flowchart TD\nA[开始] --> B[提交信息]",
    evaluationCriteria: ["主流程完整", "分支合理", "图注规范", "不臆造步骤"],
  }),
  template({
    id: "template-codex-feature",
    title: "Codex 功能开发 Prompt",
    category: "Codex 开发 Prompt",
    description: "让编码 Agent 先读代码，再按最小范围实现功能。",
    scenario: "适合给 Codex、Claude Code 等代码 Agent 下发功能开发任务。",
    applicableModels: ["gpt-5.3-codex", "gpt-4.1", "claude-3.7-sonnet"],
    variables: ["开发目标", "约束条件", "验收标准"],
    tags: ["Codex", "开发"],
    content: "你是资深全栈工程师。请先审查现有代码结构，再实现：{{开发目标}}\n约束：{{约束条件}}\n验收标准：{{验收标准}}\n要求：保持现有模式，补充必要测试，不做无关重构，完成后说明修改文件和验证命令。",
    outputExample: "修改摘要：...\n验证：npm run check",
    evaluationCriteria: ["先审查代码", "范围克制", "有测试", "验收清楚"],
  }),
  template({
    id: "template-codex-refactor",
    title: "Codex 小步重构 Prompt",
    category: "Codex 开发 Prompt",
    description: "控制范围的小步重构任务模板。",
    scenario: "适合把复杂组件拆分、服务抽离、类型整理，但不能破坏现有行为。",
    applicableModels: ["gpt-5.3-codex", "gpt-4.1"],
    variables: ["重构目标", "允许修改范围", "必须保持的行为"],
    tags: ["Codex", "重构"],
    content: "请执行小步重构。目标：{{重构目标}}\n允许修改范围：{{允许修改范围}}\n必须保持的行为：{{必须保持的行为}}\n请先列出风险，再做最小必要改动；不得改变公开 API；补充或更新测试。",
    outputExample: "风险：...\n改动：...\n验证：...",
    evaluationCriteria: ["行为不变", "边界明确", "测试覆盖", "无大范围改写"],
  }),
  template({
    id: "template-codex-bugfix",
    title: "Codex Bug 修复 Prompt",
    category: "Codex 修复 Prompt",
    description: "定位并修复 bug，要求复现路径和最小修改。",
    scenario: "适合报错、回归、测试失败、边界条件错误。",
    applicableModels: ["gpt-5.3-codex", "gpt-4.1"],
    variables: ["问题描述", "复现步骤", "错误输出"],
    tags: ["Codex", "修复", "Debug"],
    content: "请定位并修复问题：{{问题描述}}\n复现步骤：{{复现步骤}}\n错误输出：{{错误输出}}\n要求：先解释根因假设，写一个能暴露问题的测试，再做最小修复；不要重写无关模块。",
    outputExample: "根因：...\n修复：...\n测试：...",
    evaluationCriteria: ["有复现", "有根因", "最小修复", "防回归测试"],
  }),
  template({
    id: "template-codex-ci",
    title: "Codex CI 失败修复 Prompt",
    category: "Codex 修复 Prompt",
    description: "根据 CI 日志修复构建或测试失败。",
    scenario: "适合 GitHub Actions、构建失败、类型检查失败、lint 失败。",
    applicableModels: ["gpt-5.3-codex", "gpt-4.1"],
    variables: ["CI 日志", "最近改动", "本地限制"],
    tags: ["Codex", "CI", "修复"],
    content: "请修复 CI 失败。CI 日志：{{CI 日志}}\n最近改动：{{最近改动}}\n本地限制：{{本地限制}}\n请定位最小失败点，避免无关格式化，完成后运行等价验证命令。",
    outputExample: "失败点：...\n修复文件：...\n验证命令：...",
    evaluationCriteria: ["定位准确", "不掩盖失败", "验证充分", "改动克制"],
  }),
  template({
    id: "template-ui-dashboard",
    title: "UI 设计：Dashboard Prompt",
    category: "UI 设计 Prompt",
    description: "生成专业、可扫描、适合长期使用的 Dashboard 设计要求。",
    scenario: "适合 SaaS、CRM、数据分析、运营工具的 Dashboard 页面设计。",
    applicableModels: ["deepseek-chat", "gpt-4.1", "claude-3.7-sonnet"],
    variables: ["产品名称", "用户角色", "核心指标"],
    tags: ["UI", "Dashboard"],
    content: "请为{{产品名称}}设计 Dashboard。用户角色：{{用户角色}}\n核心指标：{{核心指标}}\n要求：专业、轻量、信息密度合理；输出页面结构、组件清单、状态、交互、空态和禁止风格。",
    outputExample: "页面结构：顶部筛选区 / 指标区 / 趋势区 / 明细表...",
    evaluationCriteria: ["信息层级清楚", "适合重复使用", "状态完整", "无花哨装饰"],
  }),
  template({
    id: "template-ui-mobile",
    title: "UI 设计：移动端工作流 Prompt",
    category: "UI 设计 Prompt",
    description: "为移动端核心流程生成页面和交互设计。",
    scenario: "适合 App 功能页、表单流、审核流、任务处理流。",
    applicableModels: ["deepseek-chat", "gpt-4.1"],
    variables: ["应用场景", "核心流程", "用户限制"],
    tags: ["UI", "移动端"],
    content: "请设计移动端工作流。应用场景：{{应用场景}}\n核心流程：{{核心流程}}\n用户限制：{{用户限制}}\n输出：页面清单、每页核心内容、底部/顶部导航、输入控件、错误状态、加载状态和可访问性要求。",
    outputExample: "页面 1：任务列表...\n页面 2：详情处理...",
    evaluationCriteria: ["流程闭环", "控件合理", "状态齐全", "移动端可用"],
  }),
  template({
    id: "template-product-prd",
    title: "产品经理 PRD Prompt",
    category: "产品经理 Prompt",
    description: "把产品想法整理成可交付给设计和开发的 PRD。",
    scenario: "适合从粗略需求、老板想法、用户反馈生成产品需求文档。",
    applicableModels: ["deepseek-chat", "gpt-4.1"],
    variables: ["产品想法", "目标用户", "业务目标"],
    tags: ["产品", "PRD"],
    content: "你是资深产品经理。产品想法：{{产品想法}}\n目标用户：{{目标用户}}\n业务目标：{{业务目标}}\n请输出 PRD：背景、目标、用户故事、功能范围、优先级、页面结构、埋点、验收标准和风险。",
    outputExample: "P0：...\nP1：...\n验收标准：...",
    evaluationCriteria: ["需求明确", "优先级清楚", "能交付开发", "验收可测"],
  }),
  template({
    id: "template-product-user-story",
    title: "用户故事拆解 Prompt",
    category: "产品经理 Prompt",
    description: "把功能需求拆成用户故事、边界条件和验收标准。",
    scenario: "适合敏捷开发、任务拆分、研发排期前的需求澄清。",
    applicableModels: ["deepseek-chat", "gpt-4.1"],
    variables: ["功能需求", "用户角色"],
    tags: ["产品", "用户故事"],
    content: "请把功能需求拆成用户故事。功能需求：{{功能需求}}\n用户角色：{{用户角色}}\n输出：用户故事列表、业务规则、边界条件、异常场景、验收标准。不要加入需求中没有的业务事实。",
    outputExample: "作为...我希望...以便...\n验收标准：Given/When/Then...",
    evaluationCriteria: ["故事独立", "边界清晰", "验收可测", "无需求漂移"],
  }),
  template({
    id: "template-image-product",
    title: "图片生成：产品展示 Prompt",
    category: "图片生成 Prompt",
    description: "生成清晰展示真实产品特征的图片 Prompt。",
    scenario: "适合商品图、概念产品、硬件外观、App 视觉物料。",
    applicableModels: ["gpt-image-1", "dall-e-3", "midjourney"],
    variables: ["产品主体", "使用场景", "视觉风格"],
    tags: ["图片", "产品"],
    content: "请生成图片 Prompt。产品主体：{{产品主体}}\n使用场景：{{使用场景}}\n视觉风格：{{视觉风格}}\n要求：主体清晰、构图明确、光线自然、可看清关键细节。Negative：文字乱码、变形、多余物体、过度景深。",
    outputExample: "A clean product shot of..., natural light, sharp details...",
    evaluationCriteria: ["主体明确", "构图可执行", "风格一致", "禁止项清楚"],
  }),
  template({
    id: "template-image-character",
    title: "图片生成：角色设定 Prompt",
    category: "图片生成 Prompt",
    description: "为人物/角色生成稳定形象设定。",
    scenario: "适合品牌角色、游戏角色、插画人物、头像风格探索。",
    applicableModels: ["gpt-image-1", "midjourney"],
    variables: ["角色身份", "外观特征", "画面风格"],
    tags: ["图片", "角色"],
    content: "请生成角色图片 Prompt。角色身份：{{角色身份}}\n外观特征：{{外观特征}}\n画面风格：{{画面风格}}\n补充：姿态、服装、表情、背景、光线、镜头。Negative：多手指、脸部扭曲、文字、水印。",
    outputExample: "A character portrait of..., consistent facial features...",
    evaluationCriteria: ["身份鲜明", "外观稳定", "风格准确", "负面约束完整"],
  }),
  template({
    id: "template-literature-review",
    title: "文献综述分析 Prompt",
    category: "文献分析 Prompt",
    description: "从多篇文献材料中提炼研究脉络和差异。",
    scenario: "适合写文献综述、开题报告、研究现状分析。",
    applicableModels: ["deepseek-chat", "gpt-4.1", "claude-3.7-sonnet"],
    variables: ["研究主题", "文献材料"],
    tags: ["文献", "综述"],
    content: "请围绕{{研究主题}}分析以下文献材料：{{文献材料}}\n输出：研究脉络、代表观点、方法差异、争议点、研究空白、可写入论文的综述段落。不得编造文献作者和年份。",
    outputExample: "研究脉络：...\n研究空白：...",
    evaluationCriteria: ["概括准确", "比较充分", "不编造引用", "能服务论文写作"],
  }),
  template({
    id: "template-literature-matrix",
    title: "文献矩阵表 Prompt",
    category: "文献分析 Prompt",
    description: "把文献整理成研究矩阵，便于比较和引用。",
    scenario: "适合阅读多篇论文后整理研究对象、方法、结论和局限。",
    applicableModels: ["deepseek-chat", "gpt-4.1"],
    variables: ["文献摘录", "比较维度"],
    tags: ["文献", "矩阵"],
    content: "请把文献摘录整理成 Markdown 表格。文献摘录：{{文献摘录}}\n比较维度：{{比较维度}}\n表格列：文献标识、研究问题、方法、数据/样本、主要结论、局限、可借鉴点。未知信息写“未提供”。",
    outputExample: "|文献|问题|方法|结论|局限|\n|---|---|---|---|---|",
    evaluationCriteria: ["表格完整", "未知不乱填", "维度可比", "便于写综述"],
  }),
  template({
    id: "template-code-explain",
    title: "代码解释 Prompt",
    category: "代码解释 Prompt",
    description: "解释代码意图、流程、关键变量和风险。",
    scenario: "适合阅读陌生函数、模块、脚本、配置文件。",
    applicableModels: ["deepseek-chat", "gpt-4.1", "gpt-5.3-codex"],
    variables: ["代码片段", "关注点"],
    tags: ["代码", "解释"],
    content: "请解释以下代码：{{代码片段}}\n关注点：{{关注点}}\n输出：代码用途、执行流程、关键变量、外部依赖、潜在风险、可改进建议。不要假设未提供的上下文。",
    outputExample: "用途：...\n流程：1. ...\n风险：...",
    evaluationCriteria: ["解释准确", "结构清楚", "风险具体", "不臆造上下文"],
  }),
  template({
    id: "template-code-review",
    title: "代码审查 Prompt",
    category: "代码解释 Prompt",
    description: "从 bug、回归风险、可维护性和测试缺口审查代码。",
    scenario: "适合提交前自查、评审 diff、检查关键模块。",
    applicableModels: ["gpt-5.3-codex", "gpt-4.1"],
    variables: ["代码或 Diff", "业务背景"],
    tags: ["代码", "Review"],
    content: "请以代码审查视角检查以下内容。业务背景：{{业务背景}}\n代码或 Diff：{{代码或 Diff}}\n优先输出问题清单，按严重程度排序，包含位置、风险、修复建议和需要补的测试。没有问题时说明剩余风险。",
    outputExample: "P1：...\nP2：...\n测试缺口：...",
    evaluationCriteria: ["问题优先", "定位具体", "建议可执行", "测试缺口明确"],
  }),
  template({
    id: "template-debug-runtime",
    title: "错误排查 Prompt",
    category: "错误排查 Prompt",
    description: "根据报错、环境和最近改动制定排查路径。",
    scenario: "适合运行时报错、接口失败、构建失败、环境问题。",
    applicableModels: ["deepseek-chat", "gpt-4.1", "gpt-5.3-codex"],
    variables: ["错误信息", "运行环境", "最近改动"],
    tags: ["错误", "排查"],
    content: "请排查以下错误。错误信息：{{错误信息}}\n运行环境：{{运行环境}}\n最近改动：{{最近改动}}\n输出：最可能原因排序、验证步骤、修复方案、避免复发建议。不要直接跳到单一结论。",
    outputExample: "可能原因 1：...\n验证：...\n修复：...",
    evaluationCriteria: ["假设有排序", "验证步骤明确", "修复方案可执行", "避免误判"],
  }),
  template({
    id: "template-debug-api",
    title: "接口问题排查 Prompt",
    category: "错误排查 Prompt",
    description: "分析 API 请求失败、状态码异常、鉴权和数据问题。",
    scenario: "适合前后端联调、第三方 API、OpenAI-compatible 接口失败。",
    applicableModels: ["deepseek-chat", "gpt-4.1"],
    variables: ["请求信息", "响应信息", "预期行为"],
    tags: ["错误", "API"],
    content: "请排查接口问题。请求信息：{{请求信息}}\n响应信息：{{响应信息}}\n预期行为：{{预期行为}}\n请从 URL、方法、headers、鉴权、payload、状态码、超时、服务端日志角度分析，并给出最小验证请求。",
    outputExample: "检查项：Authorization header...\n最小 curl：...",
    evaluationCriteria: ["覆盖请求链路", "验证请求可执行", "原因不臆断", "修复步骤清晰"],
  }),
  template({
    id: "template-data-analysis",
    title: "数据分析 Prompt",
    category: "数据分析 Prompt",
    description: "把数据材料转成分析目标、方法、指标和结论结构。",
    scenario: "适合运营数据、实验数据、问卷数据、业务指标分析。",
    applicableModels: ["deepseek-chat", "gpt-4.1"],
    variables: ["数据说明", "分析目标", "业务问题"],
    tags: ["数据", "分析"],
    content: "你是数据分析师。数据说明：{{数据说明}}\n分析目标：{{分析目标}}\n业务问题：{{业务问题}}\n请输出：分析口径、关键指标、分析步骤、可视化建议、结论模板、风险和需要补充的数据。",
    outputExample: "指标：转化率=...\n图表建议：趋势线、漏斗图...",
    evaluationCriteria: ["口径清晰", "指标可计算", "图表合适", "风险明确"],
  }),
  template({
    id: "template-data-sql",
    title: "SQL 分析需求 Prompt",
    category: "数据分析 Prompt",
    description: "把业务问题转成 SQL 查询需求和结果解释。",
    scenario: "适合让模型帮助写 SQL、拆指标、检查查询逻辑。",
    applicableModels: ["deepseek-chat", "gpt-4.1"],
    variables: ["表结构", "业务问题", "筛选条件"],
    tags: ["数据", "SQL"],
    content: "请根据表结构和业务问题设计 SQL。表结构：{{表结构}}\n业务问题：{{业务问题}}\n筛选条件：{{筛选条件}}\n输出：指标口径、SQL、字段解释、边界条件、性能注意事项。未知字段不要编造。",
    outputExample: "SELECT ...\n字段解释：...",
    evaluationCriteria: ["SQL 可执行", "字段不编造", "口径准确", "考虑性能"],
  }),
];

export function searchPromptTemplates(templates: PromptTemplate[], query: string, category = "全部"): PromptTemplate[] {
  const cleanQuery = query.trim().toLowerCase();
  return templates
    .filter((template) => category === "全部" || template.category === category)
    .map((template) => ({ template, score: templateSearchScore(template, cleanQuery) }))
    .filter((item) => !cleanQuery || item.score > 0)
    .sort((a, b) => b.score - a.score || a.template.title.localeCompare(b.template.title))
    .map((item) => item.template);
}

export function normalizePromptTemplate(input: PromptTemplate | (Partial<PromptTemplate> & Pick<PromptTemplate, "id" | "title" | "category" | "description" | "content" | "isBuiltin" | "createdAt">)): PromptTemplate {
  return {
    id: input.id,
    title: input.title,
    category: input.category,
    description: input.description,
    scenario: input.scenario?.trim() || input.description || "自定义工作场景",
    applicableModels: input.applicableModels?.length ? input.applicableModels : ["deepseek-chat"],
    variables: input.variables?.length ? input.variables : extractVariables(input.content),
    content: input.content,
    outputExample: input.outputExample ?? "按模板要求输出结构化结果。",
    evaluationCriteria: input.evaluationCriteria?.length ? input.evaluationCriteria : ["输出可直接使用", "格式稳定", "不编造事实"],
    tags: input.tags ?? [],
    isBuiltin: input.isBuiltin,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt ?? input.createdAt,
  };
}

export function templateToFavoritePromptInput(template: PromptTemplate): FavoritePromptInput {
  return {
    name: template.title,
    slashCommand: defaultSlashCommand(template),
    category: template.category,
    tags: template.tags,
    description: template.description,
    preferredModel: template.applicableModels[0] ?? "deepseek-chat",
    model: template.applicableModels[0] ?? "deepseek-chat",
    content: template.content,
    variables: template.variables,
    note: `Created from template: ${template.title}`,
  };
}

function extractVariables(content: string): string[] {
  const seen = new Set<string>();
  for (const match of content.matchAll(/{{\s*([^}]+)\s*}}/g)) {
    seen.add(match[1].trim());
  }
  return [...seen];
}

function defaultSlashCommand(template: PromptTemplate): string {
  if (template.id === "template-codex-bugfix") {
    return "/codex修复";
  }
  const compactTitle = template.title.replace(/[：:\s]/g, "");
  const command = compactTitle
    .replace("Prompt", "")
    .replace("模板", "")
    .replace("论文作图系统架构图", "论文作图")
    .replace("论文作图业务流程图", "论文流程图")
    .slice(0, 10);
  return `/${command}`;
}

function templateSearchScore(template: PromptTemplate, query: string): number {
  if (!query) {
    return 1;
  }
  const haystack = searchableText(
    [
      template.title,
      template.category,
      template.description,
      template.scenario,
      template.variables.join(" "),
      template.tags.join(" "),
    ].join(" "),
  );
  const compactQuery = query.replace(/\s+/g, "");
  const compactHaystack = haystack.replace(/\s+/g, "");
  if (compactHaystack.includes(compactQuery)) {
    return 100 + compactQuery.length;
  }

  let queryIndex = 0;
  for (const char of compactHaystack) {
    if (char === compactQuery[queryIndex]) {
      queryIndex += 1;
    }
  }
  return queryIndex === compactQuery.length ? 60 + queryIndex : 0;
}

function searchableText(value: string): string {
  const lower = value.toLowerCase();
  const hints = pinyinHints
    .filter(([phrase]) => value.includes(phrase))
    .map(([, pinyin]) => pinyin)
    .join(" ");
  return `${lower} ${hints}`.replace(/\s+/g, " ").trim();
}
