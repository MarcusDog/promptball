import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  CircleGauge,
  CirclePlus,
  Copy,
  Eye,
  LayoutGrid,
  Link,
  ListFilter,
  LoaderCircle,
  Mic,
  MoreHorizontal,
  PanelsTopLeft,
  RefreshCcw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ABTestPanel } from "@/features/favorites/ABTestPanel";
import { SlashCommandMenu } from "@/features/favorites/SlashCommandMenu";
import { SettingsPanel } from "@/features/settings/SettingsPanel";
import { VoiceInputPanel } from "@/features/voice-input/VoiceInputPanel";
import {
  createExportBundle,
  createPrivacySafeExportBundle,
  parseExportBundle,
  prepareDuplicateFavoritePromptImport,
} from "@/services/data-portability";
import { createHeuristicScore } from "@/lib/scoring";
import { listFavoritePrompts, optimizePrompt, saveFavoritePrompt } from "@/lib/tauri";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import type { FavoritePrompt, ModelCallLog, PromptABTestRecord, PromptEvalScore, PromptFeedback, PromptMode, PromptRun, StructuredPromptFields } from "@/types";

import promptballLogo from "../../../assets/promptball/icons/promptball-logo.svg";
import proBadge from "../../../assets/promptball/icons/pro-badge.svg";

type AppView = "workspace" | "builder" | "library" | "dashboard" | "settings";

const samplePrompt =
  "你是一位教育内容设计专家，擅长将复杂知识转化为结构清晰、易于理解的学习内容。\n\n" +
  "请根据以下主题生成一份适合中学生的学习讲义：\n\n" +
  "主题：人工智能的基本原理与应用\n" +
  "目标受众：初中生\n" +
  "输出要求：包含定义、核心概念、实际应用场景、生活中的例子，以及简要总结。\n\n" +
  "请使用清晰的段落结构和小标题，必要时使用列表或表格呈现关键信息，语言简洁 friendly。";

interface StructuredTemplate {
  name: string;
  fields: Partial<StructuredPromptFields>;
}

const STRUCTURED_TEMPLATES: StructuredTemplate[] = [
  {
    name: "通用学术写作",
    fields: {
      role: "你是一位学术写作专家",
      context: "面向学术期刊的论文写作，注重逻辑严密与引用规范",
      goal: "生成结构清晰、逻辑严谨的学术内容",
      task: "1. 确定研究问题；2. 构建论证框架；3. 撰写各章节内容",
      input: "研究主题、目标期刊或会议、字数要求",
      output: "标准 IMRAD 格式的学术论文草稿",
      requirements: "语言规范学术化、引用准确、逻辑清晰",
      constraints: "符合目标期刊格式规范，不捏造数据或引用",
      evaluation: "学术性、逻辑性、创新性、引用准确度",
      steps: "正式学术风格，客观严谨，避免口语化",
      negative: "",
    },
  },
  {
    name: "产品需求文档",
    fields: {
      role: "你是一位资深产品经理",
      context: "互联网产品功能规划与设计阶段",
      goal: "撰写清晰完整的产品需求文档（PRD）",
      task: "1. 描述功能背景与价值；2. 拆解用户故事；3. 定义验收标准",
      input: "功能名称、目标用户群体、核心需求描述",
      output: "包含用户故事、功能流程和验收标准的 PRD 文档",
      requirements: "逻辑清晰，表达简洁，面向工程师和设计师",
      constraints: "单次只描述一个功能点，避免需求蔓延",
      evaluation: "完整性、可实现性、用户价值清晰度",
      steps: "专业简洁，结构化表达，使用用户故事格式",
      negative: "",
    },
  },
  {
    name: "代码审查任务",
    fields: {
      role: "你是一位高级软件工程师和代码审查专家",
      context: "代码合并前的质量把关和安全审查阶段",
      goal: "识别代码中的问题并给出具体改进建议",
      task: "1. 检查逻辑错误与边界条件；2. 评估性能和安全影响；3. 提出重构建议",
      input: "待审查的代码片段和业务背景说明",
      output: "问题清单（含严重等级）和带注释的改进建议",
      requirements: "客观具体，指出问题时提供可运行的修复示例",
      constraints: "只评审提供的代码，不臆断上下文，标注假设",
      evaluation: "覆盖率、准确性、建议可操作性",
      steps: "技术严谨，言简意赅，分优先级排列问题",
      negative: "",
    },
  },
  {
    name: "营销文案创作",
    fields: {
      role: "你是一位擅长高转化率文案的营销专家",
      context: "品牌推广或产品发布的营销活动",
      goal: "撰写能吸引目标受众并促成行动的文案",
      task: "1. 提炼核心卖点与差异化优势；2. 设计情感共鸣点；3. 设置行动召唤（CTA）",
      input: "产品/服务名称、目标受众画像、核心优势 2-3 点",
      output: "完整文案（标题 + 正文 + CTA 按钮文字）",
      requirements: "吸引眼球、情感共鸣、清晰有力，避免套话",
      constraints: "标题不超过 20 字，正文不超过 200 字",
      evaluation: "吸引力、与受众相关性、转化潜力",
      steps: "活泼有力，情感驱动，使用二人称",
      negative: "",
    },
  },
  {
    name: "数据分析报告",
    fields: {
      role: "你是一位数据分析师",
      context: "基于业务数据的洞察与决策支持场景",
      goal: "将原始数据转化为清晰的分析结论和可执行建议",
      task: "1. 概述数据背景与分析目标；2. 分析关键指标变化；3. 给出可执行建议",
      input: "数据集摘要、核心指标数值或统计表格",
      output: "结论清晰的分析报告，含关键发现与图表建议",
      requirements: "数据驱动，结论有据可查，避免主观臆断",
      constraints: "不得编造数据，数值不确定时标注「需确认」",
      evaluation: "准确性、可读性、决策价值",
      steps: "客观严谨，结构清晰，使用数据支撑每个结论",
      negative: "",
    },
  },
  {
    name: "UI/UX 设计提案",
    fields: {
      role: "你是一位资深 UI/UX 设计师",
      context: "产品界面改版或新功能设计阶段",
      goal: "提出可落地的界面设计方案和交互建议",
      task: "1. 分析用户体验痛点；2. 提出设计原则；3. 描述具体交互方案",
      input: "界面截图描述或现有设计问题、目标用户群体",
      output: "设计方案描述（含布局、色彩、交互逻辑）",
      requirements: "以用户为中心，符合 Material/HIG 设计规范",
      constraints: "优先考虑无障碍访问，移动端优先",
      evaluation: "可用性、美观性、一致性、可实现性",
      steps: "清晰专业，用具体描述代替抽象词汇",
      negative: "",
    },
  },
];

const fieldRows: Array<{
  key: keyof StructuredPromptFields;
  label: string;
  color: string;
  limit: number;
  placeholder: string;
}> = [
  { key: "role", label: "Role", color: "#2563EB", limit: 100, placeholder: "你是一位教育内容设计专家" },
  { key: "context", label: "Context", color: "#3B82F6", limit: 200, placeholder: "面向初中生，解释人工智能的基本原理与应用" },
  { key: "goal", label: "Goal", color: "#3B82F6", limit: 200, placeholder: "生成一份结构清晰、易于理解的学习讲义" },
  { key: "task", label: "Task", color: "#16A34A", limit: 400, placeholder: "1. 包含定义、核心概念；2. 实际应用与生活例子；3. 简要总结" },
  { key: "input", label: "Input", color: "#22C55E", limit: 200, placeholder: "主题：人工智能的基本原理与应用；受众：初中生" },
  { key: "output", label: "Output", color: "#4ADE80", limit: 200, placeholder: "结构化学习讲义（含小标题、列表或表格）" },
  { key: "requirements", label: "Requirement", color: "#F59E0B", limit: 200, placeholder: "内容准确、简洁易懂、逻辑清晰、适合课堂使用" },
  { key: "constraints", label: "Constraints", color: "#EF4444", limit: 200, placeholder: "字数 200-1500 字，可使用列表、表格或图示" },
  { key: "evaluation", label: "Evaluation", color: "#EF4444", limit: 200, placeholder: "准确性、清晰度、完整性、可读性" },
  { key: "steps", label: "Style", color: "#22C55E", limit: 200, placeholder: "清晰友好，鼓励式表达，适合学习场景" },
];

const viewNav: Array<{ view: AppView; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { view: "workspace", label: "工作台", icon: CircleGauge },
  { view: "builder", label: "结构化", icon: LayoutGrid },
  { view: "library", label: "命令库", icon: PanelsTopLeft },
  { view: "dashboard", label: "评估", icon: BarChart3 },
  { view: "settings", label: "设置", icon: Settings },
];

const fallbackPrompts = [
  { id: "sample-1", name: "学术论文大纲（中文）", description: "请为以下研究主题生成一份学术论文大纲，包含研究问题、主要论点与结论。", content: "请为以下研究主题生成一份学术论文大纲，包含：研究背景、研究问题、核心论点、章节结构、方法建议、预期结论。", score: 88, usageCount: 1200, isFavorite: false },
  { id: "sample-2", name: "中英试题总结表", description: "将以下知识点整理成表格，包含定义、要点、例题与常见误区。", content: "请将以下知识点整理成中英双语表格，列包括：概念、英文表达、定义、核心要点、例题、常见误区和复习建议。", score: 82, usageCount: 892, isFavorite: false },
  { id: "sample-3", name: "论文写作 | 讨论部分", description: "基于研究结果，撰写论文讨论部分，并指出局限与后续方向。", content: "请基于以下研究结果撰写论文讨论部分，包含：主要发现解释、与既有研究对比、理论意义、实践意义、研究局限和未来研究方向。", score: 78, usageCount: 624, isFavorite: false },
  { id: "sample-4", name: "Codex 开发任务", description: "把开发需求拆成可执行、可验收的 Codex 任务。", content: "请把以下开发需求拆解为 Codex 可执行任务，包含：背景、目标、涉及文件、实施步骤、验收标准、测试命令和风险点。", score: 90, usageCount: 1600, isFavorite: true },
];

function activePrompt(mode: PromptMode, rawPrompt: string, structuredFields: StructuredPromptFields) {
  if (mode === "role") {
    return fieldRows
      .map((row) => [row.label, structuredFields[row.key].trim()] as const)
      .filter(([, value]) => value)
      .map(([label, value]) => `${label}: ${value}`)
      .join("\n");
  }
  return rawPrompt.trim();
}

async function startWindowDrag() {
  try {
    await getCurrentWindow().startDragging();
  } catch {
    // Browser preview mode.
  }
}

export function PromptBallDesktop() {
  const {
    mode,
    rawPrompt,
    structuredFields,
    result,
    loading,
    settings,
    providers,
    favoritePrompts,
    promptRuns,
    promptFeedback,
    promptEvalScores,
    promptABTests,
    modelCallLogs,
    promptVersions,
    appPreferences,
    setMode,
    setRawPrompt,
    setStructuredField,
    setResult,
    setLoading,
    setFavoritePrompts,
    setExpanded,
    activePanel,
  } = useAppStore();

  const activeProvider = providers.find((p) => p.isDefault && p.enabled) ?? providers.find((p) => p.enabled);
  const activeModel = activeProvider?.modelName ?? settings?.model ?? "deepseek-chat";

  const [view, setView] = useState<AppView>("workspace");
  const [libraryTab, setLibraryTab] = useState("全部");
  const [winner, setWinner] = useState<"a" | "b">("b");
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const prompt = activePrompt(mode, rawPrompt, structuredFields) || rawPrompt.trim();
  const score = result?.score ?? createHeuristicScore(prompt);
  const promptCards = useMemo(() => {
    const normalized = normalizeFavoriteCards(favoritePrompts);
    return normalized.length ? normalized : fallbackPrompts;
  }, [favoritePrompts]);
  const directRate = promptFeedback.length
    ? Math.round((promptFeedback.filter((item) => item.usageResult === "direct").length / promptFeedback.length) * 100)
    : 62;
  const qualityScore = promptEvalScores[0]?.finalScore ?? score.total;
  const usageCount = promptRuns.length || promptCards.reduce((sum, item) => sum + item.usageCount, 0);

  useEffect(() => {
    if (activePanel === "workspace") {
      setView("workspace");
    }
    if (activePanel === "favorites" || activePanel === "templates" || activePanel === "history") {
      setView("library");
    }
    if (activePanel === "settings") {
      setView("settings");
    }
  }, [activePanel]);

  async function handleOptimize() {
    const source = prompt || samplePrompt;
    setLoading(true);
    try {
      const next = await optimizePrompt(source);
      setRawPrompt(next.optimizedPrompt);
      setResult(next);
      toast.success("Prompt 已优化并覆盖编辑区");
    } catch (error) {
      toast.error("优化失败", { description: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  }

  function handleScore() {
    const nextScore = createHeuristicScore(prompt || samplePrompt);
    setResult({
      taskRecognition: "本地 Prompt 结构诊断",
      optimizedPrompt: prompt || samplePrompt,
      diagnosis: "已根据目标清晰度、角色设定、上下文、输出格式和约束条件生成快速诊断。",
      missingInformation: nextScore.dimensions.filter((item) => item.score < 70).map((item) => item.label),
      suggestions: nextScore.dimensions.filter((item) => item.score < 70).map((item) => item.suggestion),
      trainingTips: ["补齐低分维度后再调用模型，可减少无效迭代。"],
      score: nextScore,
      parseStatus: "parsed",
    });
    toast.success("评分已更新");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result?.optimizedPrompt || prompt || samplePrompt);
    toast.success("已复制到剪贴板");
  }

  async function handleFavorite() {
    const content = result?.optimizedPrompt || prompt || samplePrompt;
    const count = favoritePrompts.filter((item) => !item.isBuiltin).length + 1;
    await saveFavoritePrompt({
      name: `精选 Prompt ${count}`,
      slashCommand: `/精选${count}`,
      category: "通用",
      tags: ["工作台"],
      description: "从工作台保存的 Prompt。",
      preferredModel: activeModel,
      model: activeModel,
      content,
      note: "PromptBall Desktop UI saved item.",
      score: score.total,
      isFavorite: true,
    });
    setFavoritePrompts(await listFavoritePrompts());
    toast.success("已收藏为 Slash Prompt");
  }

  async function handleExportPrompts() {
    const bundleData = {
      favoritePrompts,
      promptRuns,
      promptFeedback,
      promptEvalScores,
      promptVersions,
      promptAbTests: promptABTests,
    };
    const bundle = appPreferences.privacy.redactExports
      ? createPrivacySafeExportBundle(bundleData, appPreferences.privacy)
      : createExportBundle(bundleData);
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `promptball-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Prompt 数据已导出");
  }

  async function handleImportPrompts(file: File) {
    try {
      const bundle = parseExportBundle(await file.text());
      const prepared = prepareDuplicateFavoritePromptImport({ existingPrompts: favoritePrompts, bundle });
      await Promise.all(prepared.prompts.map((prompt) => saveFavoritePrompt(prompt)));
      setFavoritePrompts(await listFavoritePrompts());
      toast.success("Prompt 已导入", {
        description: `新增 ${prepared.summary.added + prepared.summary.duplicated} 条，跳过 ${prepared.summary.skipped} 条`,
      });
    } catch (error) {
      toast.error("导入失败", { description: error instanceof Error ? error.message : String(error) });
    }
  }

  function handleImportPromptFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        void handleImportPrompts(file);
      }
    };
    input.click();
  }

  function applyStructuredPrompt() {
    const next = activePrompt("role", rawPrompt, structuredFields);
    if (!next.trim()) {
      toast.error("请先填写结构化字段");
      return;
    }
    setMode("role");
    setRawPrompt(next);
    setView("workspace");
    toast.success("结构化 Prompt 已应用到编辑区");
  }

  function clearStructuredPrompt() {
    fieldRows.forEach((row) => setStructuredField(row.key, ""));
    toast.success("结构化字段已清空");
  }

  function applyPromptCard(content: string) {
    setMode("free");
    setRawPrompt(content);
    setView("workspace");
    toast.success("Prompt 已载入编辑区");
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_58%,#F1F5F9_100%)] text-[#111827]">
      {showProModal && <ProModal onClose={() => setShowProModal(false)} />}
      <AppChrome activeView={view} onViewChange={setView} onCollapse={() => setExpanded(false)} onProClick={() => setShowProModal(true)} />
      <main className="min-h-0 flex-1 overflow-auto p-4">
        {view === "workspace" && (
          <WorkspacePage
            rawPrompt={rawPrompt}
            prompt={prompt}
            loading={loading}
            score={score.total}
            onPromptChange={setRawPrompt}
            onSlashPromptSelect={(favoritePrompt) => {
              const content = favoritePrompt.content || favoritePrompt.description;
              const slashMatch = rawPrompt.match(/(?:^|\s)\/([^\s/]*)$/);
              if (!slashMatch || slashMatch.index === undefined) {
                applyPromptCard(content);
                return;
              }
              const prefix = rawPrompt.slice(0, slashMatch.index).trimEnd();
              setMode("free");
              setRawPrompt(prefix ? `${prefix}\n\n${content}` : content);
            }}
            onVoiceTranscriptChange={setRawPrompt}
            onVoiceStructuredFields={(fields) => {
              setMode("role");
              Object.entries(fields).forEach(([key, value]) => {
                setStructuredField(key as keyof StructuredPromptFields, value);
              });
            }}
            voicePanelOpen={voicePanelOpen}
            onVoicePanelToggle={() => setVoicePanelOpen((open) => !open)}
            favoritePrompts={favoritePrompts}
            appPreferences={appPreferences}
            onOptimize={() => void handleOptimize()}
            onScore={handleScore}
            onFavorite={() => void handleFavorite()}
            onCopy={() => void handleCopy()}
            onOpenView={setView}
          />
        )}
        {view === "builder" && (
          <StructuredPromptBuilder
            fields={structuredFields}
            onFocusField={() => setMode("role")}
            onChangeField={setStructuredField}
            onApply={applyStructuredPrompt}
            onClear={clearStructuredPrompt}
          />
        )}
        {view === "library" && (
          <PromptLibrary
            tab={libraryTab}
            onTabChange={setLibraryTab}
            prompts={promptCards}
            onApplyPrompt={applyPromptCard}
            onExport={() => void handleExportPrompts()}
            onImport={handleImportPromptFile}
          />
        )}
        {view === "dashboard" && (
          <EvaluationDashboard
            qualityScore={qualityScore}
            directRate={directRate}
            usageCount={usageCount}
            promptRuns={promptRuns}
            promptFeedback={promptFeedback}
            promptEvalScores={promptEvalScores}
            promptABTests={promptABTests}
            modelCallLogs={modelCallLogs}
            favoritePrompts={favoritePrompts}
            winner={winner}
            onWinnerChange={setWinner}
          />
        )}
        {view === "settings" && <SettingsPanel />}
      </main>
    </div>
  );
}

function AppChrome({
  activeView,
  onViewChange,
  onCollapse,
  onProClick,
}: {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  onCollapse: () => void;
  onProClick: () => void;
}) {
  return (
    <header
      data-tauri-drag-region
      className="shrink-0 border-b border-[#E5E7EB] bg-white/90 px-4 backdrop-blur"
      onMouseDown={(event) => {
        const target = event.target as HTMLElement;
        if (event.button !== 0 || target.closest("button, a, input, textarea, select")) {
          return;
        }
        void startWindowDrag();
      }}
    >
      <div data-tauri-drag-region className="flex h-14 items-center gap-4">
        <div
          data-tauri-drag-region
          className="flex items-center gap-2"
          onMouseDown={(event) => {
            if (event.button === 0) {
              void startWindowDrag();
            }
          }}
        >
          <span className="size-3 rounded-full bg-[#FF5F57]" />
          <span className="size-3 rounded-full bg-[#FFBD2E]" />
          <span className="size-3 rounded-full bg-[#28C840]" />
        </div>
        <button
          className="flex min-w-0 items-center gap-2.5"
          type="button"
          onClick={() => onViewChange("workspace")}
          onMouseDown={(event) => {
            if (event.detail > 1) {
              return;
            }
            if (event.button === 0 && event.movementX !== 0) {
              void startWindowDrag();
            }
          }}
        >
          <img src={promptballLogo} alt="" className="size-7 shrink-0" />
          <span className="truncate text-lg font-bold promptball-brand-label">PromptBall</span>
        </button>
        <nav className="ml-auto flex h-full min-w-0 items-center gap-1 overflow-hidden">
          {viewNav.map((item) => {
            const Icon = item.icon;
            const active = item.view === activeView;
            return (
              <button
                key={item.view}
                className={cn(
                  "relative flex h-full shrink-0 items-center gap-1.5 px-2.5 text-sm text-[#64748B] transition hover:text-[#2563EB]",
                  active && "font-semibold text-[#2563EB] after:absolute after:bottom-0 after:left-2.5 after:right-2.5 after:h-0.5 after:bg-[#2563EB]",
                )}
                type="button"
                onClick={() => onViewChange(item.view)}
              >
                <Icon className="size-4" />
                <span className="promptball-nav-label whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <button type="button" onClick={onProClick} className="ml-1 shrink-0 rounded-lg transition hover:opacity-75 focus:outline-none">
          <img src={proBadge} alt="Pro 功能" className="h-7 w-14" />
        </button>
        <button
          className="flex size-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#64748B] shadow-sm transition hover:border-[#B7CDFB] hover:bg-[#EFF4FF] hover:text-[#2563EB]"
          type="button"
          aria-label="收起为浮球"
          title="收起为浮球"
          onClick={onCollapse}
        >
          <X className="size-4" />
        </button>
      </div>
    </header>
  );
}

function WorkspacePage({
  rawPrompt,
  prompt,
  loading,
  score,
  onPromptChange,
  onSlashPromptSelect,
  onVoiceTranscriptChange,
  onVoiceStructuredFields,
  voicePanelOpen,
  onVoicePanelToggle,
  favoritePrompts,
  appPreferences,
  onOptimize,
  onScore,
  onFavorite,
  onCopy,
  onOpenView,
}: {
  rawPrompt: string;
  prompt: string;
  loading: boolean;
  score: number;
  onPromptChange: (value: string) => void;
  onSlashPromptSelect: (prompt: FavoritePrompt) => void;
  onVoiceTranscriptChange: (value: string) => void;
  onVoiceStructuredFields: (fields: StructuredPromptFields) => void;
  voicePanelOpen: boolean;
  onVoicePanelToggle: () => void;
  favoritePrompts: FavoritePrompt[];
  appPreferences: ReturnType<typeof useAppStore.getState>["appPreferences"];
  onOptimize: () => void;
  onScore: () => void;
  onFavorite: () => void;
  onCopy: () => void;
  onOpenView: (view: AppView) => void;
}) {
  const slashMatch = rawPrompt.match(/(?:^|\s)\/([^\s/]*)$/);
  const slashQuery = slashMatch?.[1] ?? "";
  const showSlashMenu = Boolean(slashMatch) && favoritePrompts.length > 0;

  return (
    <div className="h-full min-h-0">
      <section className="flex h-full min-h-0 flex-col rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,.07)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
            <span className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 font-semibold shadow-sm">Prompt 编辑区</span>
            <StatusBadge label="已优化" tone="success" />
            <span className="text-xs text-[#64748B]">已自动增强原始内容</span>
          </div>
          <div className="flex shrink-0 items-center gap-5 text-xs text-[#64748B]">
            <span>字数 {(prompt || rawPrompt).length} / 8000</span>
            <span>版本 v3</span>
          </div>
        </div>
        <div className="relative mt-4 min-h-0 flex-1">
          <Textarea
            value={rawPrompt}
            onChange={(event) => onPromptChange(event.target.value)}
            placeholder="输入 Prompt；输入 / 可快速选择收藏 Prompt"
            className="h-full min-h-0 resize-none rounded-xl border-[#DDE5F2] bg-white p-4 text-sm leading-6 text-[#111827] shadow-inner shadow-slate-100/60 placeholder:text-[#A8B3C7] focus-visible:ring-[#8DB7FF]"
          />
          {showSlashMenu && (
            <div className="absolute left-4 top-12 z-20 w-[360px]">
              <SlashCommandMenu
                query={slashQuery}
                prompts={favoritePrompts}
                onSelect={(favoritePrompt) => {
                  onSlashPromptSelect(favoritePrompt);
                }}
              />
            </div>
          )}
        </div>
        {voicePanelOpen && (
          <div className="mt-3 max-h-[260px] overflow-auto rounded-xl border border-[#DDE5F2] bg-[#F8FAFF] p-3">
            <VoiceInputPanel
              appPreferences={appPreferences}
              transcript={rawPrompt}
              onTranscriptChange={onVoiceTranscriptChange}
              onStructuredFields={onVoiceStructuredFields}
            />
          </div>
        )}
        <div className="mt-3 flex min-h-10 flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-[#8DB7FF] bg-[#F8FAFF] px-4 py-2 text-sm">
          <span className="flex min-w-0 items-center gap-2 text-[#334155]">
            <Link className="size-4 text-[#16A34A]" />
            <span className="truncate">已优化并覆盖原始内容（基于你的目标与结构化配置）</span>
          </span>
          <button className="text-sm font-semibold text-[#2563EB] hover:underline" type="button" onClick={() => onOpenView("dashboard")}>
            查看优化日志
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={onOptimize} disabled={loading}>
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              {loading ? "优化中" : "优化"}
            </Button>
            <Button variant="outline" onClick={onScore}>
              <Search className="size-4" />
              评分
            </Button>
            <Button variant="outline" onClick={onFavorite}>
              <Star className="size-4" />
              收藏
            </Button>
            <Button variant="outline" onClick={onVoicePanelToggle}>
              <Mic className="size-4" />
              录音
            </Button>
            <Button variant="outline" onClick={onCopy}>
              <Copy className="size-4" />
              复制
            </Button>
            <Button variant="secondary" onClick={() => onOpenView("builder")}>
              结构化
            </Button>
          </div>
          <ScoreChip score={score} />
        </div>
      </section>
    </div>
  );
}

function FeatureTile({
  title,
  desc,
  icon: Icon,
  onClick,
}: {
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button className="rounded-2xl border border-[#E5E7EB] bg-white p-3.5 text-left shadow-[0_8px_24px_rgba(15,23,42,.06)] transition duration-150 hover:-translate-y-0.5 hover:border-[#B7CDFB] hover:bg-[#F8FAFF] hover:shadow-[0_12px_28px_rgba(37,99,235,.10)]" type="button" onClick={onClick}>
      <div className="flex size-9 items-center justify-center rounded-xl bg-[#E6F0FF] text-[#2563EB]">
        <Icon className="size-5" />
      </div>
      <div className="mt-3 text-sm font-bold">{title}</div>
      <div className="mt-1 text-xs leading-5 text-[#64748B]">{desc}</div>
    </button>
  );
}

function StructuredPromptBuilder({
  fields,
  onFocusField,
  onChangeField,
  onApply,
  onClear,
}: {
  fields: StructuredPromptFields;
  onFocusField: () => void;
  onChangeField: (key: keyof StructuredPromptFields, value: string) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  const [templateOpen, setTemplateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(STRUCTURED_TEMPLATES[0].name);

  function applyTemplate(name: string) {
    const template = STRUCTURED_TEMPLATES.find((t) => t.name === name);
    if (!template) return;
    setSelectedTemplate(name);
    setTemplateOpen(false);
    Object.entries(template.fields).forEach(([key, value]) => {
      onChangeField(key as keyof StructuredPromptFields, value as string);
    });
    onFocusField();
    toast.success(`已载入模板：${name}`);
  }

  return (
    <section className="mx-auto flex h-full max-w-4xl flex-col rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,.08)]">
      <div className="mb-5 flex items-center justify-between">
        <div className="text-lg font-bold">结构化 Prompt</div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Button className="h-9 rounded-lg px-3 text-xs" variant="outline" onClick={() => setTemplateOpen((o) => !o)}>
              模板：{selectedTemplate}
              <ChevronDown className="size-3.5" />
            </Button>
            {templateOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-lg">
                {STRUCTURED_TEMPLATES.map((t) => (
                  <button
                    key={t.name}
                    className={cn(
                      "w-full px-4 py-2.5 text-left text-xs transition hover:bg-[#F8FAFF]",
                      selectedTemplate === t.name && "font-semibold text-[#2563EB]",
                    )}
                    type="button"
                    onClick={() => applyTemplate(t.name)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button className="h-9 rounded-lg px-3 text-xs" variant="outline" onClick={() => toast.success("当前结构已保存为模板草稿")}>
            <Save className="size-3.5" />
            保存模板
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-auto pr-1">
        {fieldRows.map((row) => {
          const value = fields[row.key];
          return (
            <div key={row.key} className="grid grid-cols-[126px_minmax(0,1fr)] items-center gap-4">
              <label className="flex items-center gap-3 text-sm font-medium text-[#1F2329]">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                {row.label}
              </label>
              <div className="relative">
                <Input
                  value={value}
                  onFocus={onFocusField}
                  onChange={(event) => onChangeField(row.key, event.target.value)}
                  placeholder={row.placeholder}
                  className="h-10 rounded-lg border-[#E5E7EB] bg-white pr-16 text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B]">
                  {value.length}/{row.limit}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-5 flex items-center justify-between">
        <Button className="h-9 rounded-lg px-4 text-sm" variant="outline" onClick={() => toast.info("已支持 10 个标准字段；自定义字段编辑器将在模板库中继续扩展")}>
          <CirclePlus className="size-4" />
          添加字段
        </Button>
        <div className="flex items-center gap-3">
          <Button className="h-9 rounded-lg px-4 text-sm" variant="outline" onClick={onClear}>
            <Trash2 className="size-4" />
            清空
          </Button>
          <Button className="h-9 rounded-lg px-4 text-sm" onClick={onApply}>
            应用到编辑区
          </Button>
        </div>
      </div>
    </section>
  );
}

function PromptLibrary({
  tab,
  onTabChange,
  prompts,
  onApplyPrompt,
  onExport,
  onImport,
}: {
  tab: string;
  onTabChange: (tab: string) => void;
  prompts: Array<{ id: string; name: string; description: string; content: string; score: number; usageCount: number; isFavorite: boolean; slashCommand?: string }>;
  onApplyPrompt: (content: string) => void;
  onExport: () => void;
  onImport: () => void;
}) {
  const tabs = ["全部", "常用", "收藏", "历史"];
  const [query, setQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  async function copyPrompt(content: string) {
    await navigator.clipboard.writeText(content);
    toast.success("Prompt 已复制");
  }
  const sortedPrompts = useMemo(() => {
    const base = [...prompts];
    if (tab === "常用") {
      return base.sort((a, b) => b.usageCount - a.usageCount);
    }
    if (tab === "收藏") {
      return base.filter((item) => item.isFavorite);
    }
    if (tab === "历史") {
      return base.slice().reverse();
    }
    return base;
  }, [prompts, tab]);
  const filteredPrompts = sortedPrompts.filter((item) => {
    const matchesQuery = !query.trim() || `${item.name} ${item.description} ${item.slashCommand ?? ""}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesFavorite = !showFavoritesOnly || item.isFavorite;
    return matchesQuery && matchesFavorite;
  });

  return (
    <section className="grid h-full min-h-0 grid-cols-[300px_minmax(0,1fr)] gap-6">
      <aside className="flex min-h-0 flex-col rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_2px_8px_rgba(16,24,40,.06)]">
        <div className="text-base font-bold">收藏命令</div>
        <p className="mt-1 text-xs leading-5 text-[#64748B]">这里不再展示固定示例命令；工作台输入 / 会从你的收藏 Prompt 中选择。</p>
        <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-auto pr-1">
          {filteredPrompts.slice(0, 12).map((item) => (
            <div key={item.id} className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFF] p-3 text-sm">
              <button className="w-full text-left font-semibold text-[#2563EB]" type="button" onClick={() => onApplyPrompt(item.content)}>
                {item.slashCommand || `/${item.name}`}
              </button>
              <div className="mt-1 line-clamp-2 text-xs leading-5 text-[#64748B]">{item.name}</div>
              <div className="mt-2 flex gap-2">
                <Button className="h-7 px-2 text-xs" variant="outline" onClick={() => onApplyPrompt(item.content)}>
                  使用
                </Button>
                <Button className="h-7 px-2 text-xs" variant="outline" onClick={() => void copyPrompt(item.content)}>
                  <Copy className="size-3" />
                  复制
                </Button>
              </div>
            </div>
          ))}
          {!filteredPrompts.length && (
            <div className="rounded-xl border border-dashed border-[#B7CDFB] bg-white p-4 text-sm">
              <div className="font-semibold text-[#111827]">还没有可用命令</div>
              <p className="mt-2 text-xs leading-5 text-[#64748B]">先在工作台写好 Prompt 并点击“收藏”，或导入已有 JSON；之后输入 / 就能快速调用。</p>
              <div className="mt-3 flex gap-2">
                <Button className="h-8 px-3 text-xs" variant="outline" onClick={onImport}>
                  <CirclePlus className="size-3" />
                  导入
                </Button>
                <Button className="h-8 px-3 text-xs" onClick={() => onTabChange("全部")}>
                  查看全部
                </Button>
              </div>
            </div>
          )}
        </div>
        <button className="mt-4 text-sm font-semibold text-[#2563EB] hover:underline" type="button" onClick={() => onTabChange("收藏")}>
          只看收藏 →
        </button>
      </aside>
      <div className="flex min-h-0 flex-col rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-[0_8px_24px_rgba(16,24,40,.08)]">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid grid-cols-4 rounded-lg border border-[#E5E7EB] bg-white text-center text-sm">
            {tabs.map((item) => (
              <button
                key={item}
                className={cn("relative h-10 px-3 text-[#64748B]", tab === item && "font-semibold text-[#2563EB] after:absolute after:bottom-0 after:left-4 after:right-4 after:h-0.5 after:bg-[#2563EB]")}
                type="button"
                onClick={() => onTabChange(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
            <Input className="h-10 border-[#E5E7EB] bg-white pl-9" placeholder="搜索 Prompt / Slash 命令" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <Button className="h-10" variant={showFavoritesOnly ? "secondary" : "outline"} onClick={() => setShowFavoritesOnly((value) => !value)}>
            <SlidersHorizontal className="size-4" />
            收藏
          </Button>
          <Button className="h-10" variant="outline" onClick={() => toast.success("已按综合评分排序")}>
            <ListFilter className="size-4" />
            排序
          </Button>
          <Button className="h-10" variant="outline" onClick={onImport}>
            <CirclePlus className="size-4" />
            导入
          </Button>
          <Button className="h-10" onClick={onExport}>
            <Save className="size-4" />
            导出
          </Button>
        </div>
        <div className="grid min-h-0 flex-1 gap-3 overflow-auto pr-1" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", alignContent: "start" }}>
          {filteredPrompts.length > 0 ? (
            filteredPrompts.map((item) => (
              <PromptCard key={item.id} compact prompt={item} onApply={() => onApplyPrompt(item.content)} onCopy={() => void copyPrompt(item.content)} />
            ))
          ) : (
            <div className="col-span-full flex h-full min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6 text-center text-sm text-[#64748B]">
              <div className="font-semibold text-[#111827]">暂无匹配 Prompt</div>
              <p className="mt-2 max-w-sm">换一个关键词，或导入/收藏 Prompt 后再用 / 快速调用。</p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={onImport}>
                  <CirclePlus className="size-4" />
                  导入 JSON
                </Button>
                <Button onClick={() => onTabChange("全部")}>清除筛选</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PromptCard({
  prompt,
  compact = false,
  onApply,
  onCopy,
}: {
  prompt: { name: string; description: string; content: string; score: number; usageCount: number; isFavorite: boolean; slashCommand?: string };
  compact?: boolean;
  onApply?: () => void;
  onCopy?: () => void;
}) {
  return (
    <div
      className={cn(
        "relative min-w-0 rounded-xl border border-[#E5E7EB] bg-white p-4 text-left shadow-[0_4px_14px_rgba(15,23,42,.05)] transition duration-150 hover:-translate-y-0.5 hover:border-[#B7CDFB] hover:shadow-[0_10px_24px_rgba(37,99,235,.10)]",
        compact && "p-3",
      )}
    >
      <button className="w-full text-left" type="button" onClick={onApply}>
        <div className="truncate text-sm font-bold">{prompt.name}</div>
        {prompt.slashCommand && <div className="mt-1 text-xs font-semibold text-[#2563EB]">{prompt.slashCommand}</div>}
        <p className={cn("mt-2 line-clamp-3 text-xs leading-5 text-[#64748B]", compact && "line-clamp-2")}>{prompt.description}</p>
      </button>
      <div className="mt-4 flex items-center justify-between gap-2 text-xs">
        <span className="font-bold text-[#16A34A]">T {Math.round(prompt.score)}</span>
        <span className="flex items-center gap-1 text-[#64748B]">
          <Eye className="size-3.5" />
          {compactNumber(prompt.usageCount)}
        </span>
        <Star className={cn("size-4", prompt.isFavorite ? "fill-[#2563EB] text-[#2563EB]" : "text-[#64748B]")} />
        {onCopy && (
          <Button className="h-7 px-2 text-xs" variant="outline" onClick={onCopy}>
            <Copy className="size-3" />
            复制
          </Button>
        )}
      </div>
    </div>
  );
}

function EvaluationDashboard({
  qualityScore,
  directRate,
  usageCount,
  promptRuns,
  promptFeedback,
  promptEvalScores,
  promptABTests,
  modelCallLogs,
  favoritePrompts,
  winner,
  onWinnerChange,
}: {
  qualityScore: number;
  directRate: number;
  usageCount: number;
  promptRuns: PromptRun[];
  promptFeedback: PromptFeedback[];
  promptEvalScores: PromptEvalScore[];
  promptABTests: PromptABTestRecord[];
  modelCallLogs: ModelCallLog[];
  favoritePrompts: FavoritePrompt[];
  winner: "a" | "b";
  onWinnerChange: (winner: "a" | "b") => void;
}) {
  const [section, setSection] = useState("概览");
  const averageRating = promptFeedback.length
    ? promptFeedback.reduce((sum, item) => sum + item.rating, 0) / promptFeedback.length
    : 0;
  const successfulCalls = modelCallLogs.filter((log) => log.ok).length;
  const callSuccessRate = modelCallLogs.length ? Math.round((successfulCalls / modelCallLogs.length) * 100) : 0;
  const averageLatency = modelCallLogs.length
    ? Math.round(modelCallLogs.reduce((sum, log) => sum + log.durationMs, 0) / modelCallLogs.length)
    : 0;
  const problemCounts = countProblemTags(promptFeedback);
  const topPrompts = [...favoritePrompts]
    .sort((a, b) => b.usageCount - a.usageCount || b.score - a.score)
    .slice(0, 5);
  const metrics = [
    { title: "综合评分", value: qualityScore.toFixed(0), suffix: "", detail: `${promptEvalScores.length} 条评分` },
    { title: "直接使用率", value: `${directRate}`, suffix: "%", detail: `${promptFeedback.length} 条反馈` },
    { title: "A/B 对比", value: `${promptABTests.length}`, suffix: "", detail: `当前 ${winner.toUpperCase()} 胜出` },
    { title: "模型成功率", value: modelCallLogs.length ? `${callSuccessRate}` : "-", suffix: modelCallLogs.length ? "%" : "", detail: `${modelCallLogs.length} 次调用` },
  ];

  return (
    <section className="grid h-full min-h-0 grid-cols-[180px_minmax(0,1fr)] rounded-xl border border-[#E5E7EB] bg-white shadow-[0_8px_24px_rgba(16,24,40,.08)]">
      <nav className="border-r border-[#E5E7EB] p-4">
        <div className="mb-5 flex items-center gap-2 font-bold">
          <BarChart3 className="size-4 text-[#2563EB]" />
          评估看板
        </div>
        {["概览", "评分记录", "A/B 测试", "对比历史", "模型表现", "Prompt 统计"].map((item) => (
          <button
            key={item}
            className={cn("flex h-10 w-full items-center gap-2 rounded-lg px-3 text-sm text-[#64748B] hover:bg-[#F8FAFF]", section === item && "bg-[#E6F0FF] font-semibold text-[#2563EB]")}
            type="button"
            onClick={() => setSection(item)}
          >
            {section === item ? <LayoutGrid className="size-4" /> : <CircleGauge className="size-4" />}
            {item}
          </button>
        ))}
      </nav>
      <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-5 p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((item) => (
            <MetricCard key={item.title} {...item} />
          ))}
        </div>
        {section === "概览" && (
          <div className="grid min-h-0 grid-cols-[1fr_minmax(0,210px)] gap-4">
            <ChartCard usageCount={usageCount} promptRuns={promptRuns} promptEvalScores={promptEvalScores} />
            <div className="flex flex-col gap-4">
              <DonutCard rows={problemCounts} />
              <RankingCard prompts={topPrompts} />
            </div>
          </div>
        )}
        {section === "评分记录" && <ScoreRecords scores={promptEvalScores} />}
        {section === "A/B 测试" && (
          <div className="overflow-y-auto">
            <ABTestPanel />
          </div>
        )}
        {section === "对比历史" && <ABHistory records={promptABTests} />}
        {section === "模型表现" && <ModelPerformance logs={modelCallLogs} averageLatency={averageLatency} />}
        {section === "Prompt 统计" && <PromptStats prompts={favoritePrompts} runs={promptRuns} feedback={promptFeedback} />}
      </div>
    </section>
  );
}

function MetricCard({ title, value, suffix, detail }: { title: string; value: string; suffix: string; detail: string }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_2px_8px_rgba(16,24,40,.04)]">
      <div className="text-xs font-semibold text-[#111827]">{title}</div>
      <div className="mt-2 flex items-end gap-2">
        <span className="font-mono text-[28px] font-bold leading-none">{value}</span>
        <span className="pb-0.5 text-sm">{suffix}</span>
      </div>
      <div className="mt-3 text-xs text-[#64748B]">{detail}</div>
    </div>
  );
}

function ChartCard({ usageCount, promptRuns, promptEvalScores }: { usageCount: number; promptRuns: PromptRun[]; promptEvalScores: PromptEvalScore[] }) {
  const recentRuns = promptRuns.slice(0, 7).reverse();
  const recentScores = promptEvalScores.slice(0, 7).reverse();
  const scorePoints = buildSparklinePoints(recentScores.map((item) => item.finalScore), 70, 26, 306, 178);
  const runPoints = buildSparklinePoints(recentRuns.map((_, index) => index + 1), 70, 26, 306, 178);

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-bold">最近表现</div>
        <MoreHorizontal className="size-4 text-[#64748B]" />
      </div>
      {recentRuns.length || recentScores.length ? (
        <svg className="h-[280px] w-full" viewBox="0 0 350 260" aria-label={`本地共记录 ${usageCount} 次 Prompt 使用`}>
          {[50, 100, 150, 200].map((y) => (
            <line key={y} x1="34" x2="324" y1={y} y2={y} stroke="#E5E7EB" strokeDasharray="4 4" />
          ))}
          {scorePoints && <polyline points={scorePoints} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
          {runPoints && <polyline points={runPoints} fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
          <text x="42" y="246" fill="#64748B" fontSize="10">较早</text>
          <text x="286" y="246" fill="#64748B" fontSize="10">最近</text>
        </svg>
      ) : (
        <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6 text-center">
          <div className="font-semibold text-[#111827]">暂无趋势数据</div>
          <p className="max-w-xs text-xs text-[#64748B]">在工作台点击「优化」调用模型后，趋势图将自动生成。</p>
          <div className="flex flex-col gap-1 text-xs text-[#94A3B8]">
            <span>① 工作台 → 输入 Prompt → 点击「优化」</span>
            <span>② 点击「评分」生成本地评分记录</span>
            <span>③ 反馈使用结果积累问题标签</span>
          </div>
        </div>
      )}
    </div>
  );
}

function DonutCard({ rows }: { rows: Array<{ label: string; value: number; color: string }> }) {
  const total = rows.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
      <div className="font-bold">问题维度分布</div>
      {total ? (
        <div className="mt-8 flex flex-col items-center gap-6">
          <div className="size-40 rounded-full bg-[conic-gradient(#2563EB_0_28%,#3B82F6_28%_50%,#16A34A_50%_68%,#8B5CF6_68%_84%,#F59E0B_84%_94%,#94A3B8_94%_100%)] p-10">
            <div className="size-full rounded-full bg-white" />
          </div>
          <div className="w-full space-y-2">
            {rows.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="flex-1 text-[#64748B]">{item.label}</span>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title="暂无问题标签" description="提交反馈后会统计常见问题。" />
      )}
    </div>
  );
}

function RankingCard({ prompts }: { prompts: FavoritePrompt[] }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
      <div className="font-bold">Prompt 排行榜</div>
      <div className="mt-4 space-y-3">
        {prompts.length ? (
          prompts.map((item, index) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">
                <span className="mr-2 font-bold text-[#F59E0B]">{index + 1}</span>
                {item.name}
              </span>
              <span className="font-semibold">{item.usageCount || item.score}</span>
            </div>
          ))
        ) : (
          <EmptyState title="暂无收藏 Prompt" description="收藏或导入 Prompt 后会显示排行。" />
        )}
      </div>
    </div>
  );
}

function ScoreRecords({ scores }: { scores: PromptEvalScore[] }) {
  if (!scores.length) {
    return <EmptyState title="暂无评分记录" description="运行评分后会在这里看到结构、质量、满意度和最终分。" />;
  }

  return (
    <DataPanel title="评分记录">
      {scores.slice(0, 12).map((score) => (
        <div key={score.id} className="grid grid-cols-[1fr_repeat(4,90px)] items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm">
          <span className="truncate text-[#64748B]">{formatDate(score.createdAt)}</span>
          <span>结构 {score.structureScore}</span>
          <span>质量 {score.outputQualityScore}</span>
          <span>满意 {score.userSatisfactionScore}</span>
          <span className="font-semibold text-[#2563EB]">总分 {score.finalScore}</span>
        </div>
      ))}
    </DataPanel>
  );
}

function ABHistory({ records }: { records: PromptABTestRecord[] }) {
  if (!records.length) {
    return <EmptyState title="暂无 A/B 对比" description="保存 A/B 测试后会显示胜出版本、模型和任务类型。" />;
  }

  return (
    <DataPanel title="对比历史">
      {records.slice(0, 12).map((record) => (
        <div key={record.id} className="grid grid-cols-[1fr_100px_120px_120px] items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm">
          <span className="truncate text-[#64748B]">{record.reason || record.input || "本地 A/B 对比"}</span>
          <span className="font-semibold text-[#2563EB]">{record.winner.toUpperCase()}</span>
          <span>{record.model}</span>
          <span>{formatDate(record.createdAt)}</span>
        </div>
      ))}
    </DataPanel>
  );
}

function ModelPerformance({ logs, averageLatency }: { logs: ModelCallLog[]; averageLatency: number }) {
  if (!logs.length) {
    return <EmptyState title="暂无模型调用记录" description="调用模型优化 Prompt 后会显示耗时、Token、成本和错误。" />;
  }

  return (
    <DataPanel title={`模型表现 · 平均耗时 ${averageLatency}ms`}>
      {logs.slice(0, 12).map((log) => (
        <div key={log.id} className="grid grid-cols-[1fr_90px_90px_90px_90px] items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm">
          <span className="truncate text-[#64748B]">{log.providerId} / {log.modelName}</span>
          <span>{log.durationMs}ms</span>
          <span>{log.promptTokens + log.completionTokens} tokens</span>
          <span>{log.estimatedCost.toFixed(4)}</span>
          <StatusBadge label={log.ok ? "成功" : "失败"} tone={log.ok ? "success" : "neutral"} />
        </div>
      ))}
    </DataPanel>
  );
}

function PromptStats({ prompts, runs, feedback }: { prompts: FavoritePrompt[]; runs: PromptRun[]; feedback: PromptFeedback[] }) {
  if (!prompts.length && !runs.length && !feedback.length) {
    return <EmptyState title="暂无 Prompt 统计" description="收藏、运行或反馈 Prompt 后会显示使用统计。" />;
  }

  return (
    <DataPanel title="Prompt 统计">
      {prompts.slice(0, 12).map((prompt) => (
        <div key={prompt.id} className="grid grid-cols-[1fr_90px_90px_90px] items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm">
          <span className="truncate text-[#64748B]">{prompt.name}</span>
          <span>{prompt.usageCount} 次</span>
          <span>{prompt.averageRating ? prompt.averageRating.toFixed(1) : "-"}/5</span>
          <span className="font-semibold text-[#2563EB]">{prompt.score || 0} 分</span>
        </div>
      ))}
    </DataPanel>
  );
}

function DataPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-0 overflow-auto rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
      <div className="mb-4 font-bold">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6 text-center">
      <div className="font-semibold text-[#111827]">{title}</div>
      <p className="mt-2 max-w-sm text-sm text-[#64748B]">{description}</p>
    </div>
  );
}

function countProblemTags(feedback: PromptFeedback[]) {
  const colors = ["#2563EB", "#3B82F6", "#16A34A", "#8B5CF6", "#F59E0B", "#94A3B8"];
  const counts = new Map<string, number>();
  feedback.forEach((item) => {
    item.problemTags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
  });
  return [...counts.entries()].slice(0, 6).map(([label, value], index) => ({ label, value, color: colors[index] }));
}

function buildSparklinePoints(values: number[], minY: number, maxY: number, width: number, height: number) {
  if (!values.length) {
    return null;
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  return values
    .map((value, index) => {
      const x = 42 + (values.length === 1 ? width / 2 : (index / (values.length - 1)) * width);
      const y = minY + height - ((value - min) / range) * (height - maxY);
      return `${Math.round(x)},${Math.round(y)}`;
    })
    .join(" ");
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function ABTestCompare({
  winner,
  onWinnerChange,
  compact = false,
}: {
  winner: "a" | "b";
  onWinnerChange: (winner: "a" | "b") => void;
  compact?: boolean;
}) {
  function rerunTest() {
    onWinnerChange(winner === "a" ? "b" : "a");
    toast.success("已重新模拟对比评分");
  }

  function saveCompare() {
    toast.success(`已保存对比结果：Prompt ${winner.toUpperCase()} 胜出`);
  }

  return (
    <section className={cn("mx-auto flex h-full flex-col rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,.08)]", compact ? "max-w-none" : "max-w-5xl")}>
      <div className="mb-5 flex items-center gap-4">
        <div className="text-xl font-bold">A/B 测试对比</div>
        <ScoreTag score={78} label="中性 / 蓝色" />
        <ScoreTag score={90} label="优秀 / 绿色" success />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-6">
        <CompareCard
          title="Prompt A（优化版）"
          score={78}
          winner={winner === "a"}
          body="你是一位教育内容设计专家，请为初中生解释人工智能，描述定义、应用和例子帮助他们理解。"
        />
        <CompareCard
          title="Prompt B（对比版）"
          score={90}
          winner={winner === "b"}
          body="作为一位教育内容设计专家，面向初中生创建包括清晰的人工智能学习讲义，包含定义与核心概念、应用场景与例子、总结。"
        />
      </div>
      <div className="mt-5 grid grid-cols-4 gap-4">
        <Button className="h-11 rounded-lg" onClick={() => onWinnerChange("a")}>A 胜出</Button>
        <Button className="h-11 rounded-lg bg-[#16A34A] hover:bg-[#15803D]" onClick={() => onWinnerChange("b")}>B 胜出</Button>
        <Button className="h-11 rounded-lg" variant="outline" onClick={rerunTest}>
          <RefreshCcw className="size-4" />
          重新测试
        </Button>
        <Button className="h-11 rounded-lg border-[#FFB86B] text-[#F59E0B] hover:bg-[#FFF7ED]" variant="outline" onClick={saveCompare}>
          <Save className="size-4" />
          保存对比
        </Button>
      </div>
    </section>
  );
}

function CompareCard({ title, score, body, winner }: { title: string; score: number; body: string; winner: boolean }) {
  return (
    <div className={cn("relative rounded-xl border bg-white p-6", winner ? "border-[#2563EB] shadow-[0_0_0_1px_#2563EB]" : "border-[#E5E7EB]")}>
      {winner && (
        <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-[#2563EB] text-white">
          <CheckCircle2 className="size-4" />
        </span>
      )}
      <div className="flex items-center justify-between">
        <div className="font-bold text-[#2563EB]">{title}</div>
        <div className={cn("font-mono text-xl font-bold", score >= 85 ? "text-[#16A34A]" : "text-[#2563EB]")}>{score}<span className="ml-1 text-sm">分</span></div>
      </div>
      <p className="mt-5 text-base leading-8 text-[#1F2329]">{body}</p>
      <button className="mt-5 text-sm font-semibold text-[#2563EB] hover:underline" type="button" onClick={() => toast.info(`${title}：结构、约束、输出格式维度已展开`)}>
        查看详细 →
      </button>
    </div>
  );
}

function ScoreTag({ score, label, success = false }: { score: number; label: string; success?: boolean }) {
  return (
    <div className={cn("flex items-end gap-2 border-l border-[#E5E7EB] pl-4", success ? "text-[#16A34A]" : "text-[#2563EB]")}>
      <span className="font-mono text-xl font-bold">{score}</span>
      <span className="pb-1 text-xs text-[#64748B]">{label}</span>
    </div>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: "success" | "neutral" | "info" }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-md px-2 text-[10px] font-semibold",
        tone === "success" && "bg-[#DCFCE7] text-[#16A34A]",
        tone === "info" && "bg-[#E6F0FF] text-[#2563EB]",
        tone === "neutral" && "bg-[#F1F5F9] text-[#64748B]",
      )}
    >
      {label}
    </span>
  );
}

function ScoreChip({ score }: { score: number }) {
  const tone = score >= 75 ? "text-[#16A34A]" : score >= 55 ? "text-[#F59E0B]" : "text-[#EF4444]";
  return (
    <div className="flex h-9 shrink-0 items-center rounded-lg border border-[#E5E7EB] bg-white px-4 text-sm">
      综合评分 <span className={cn("ml-2 font-mono text-xl font-bold", tone)}>{Math.round(score)}</span>
      <span className={cn("ml-0.5 text-xs", tone)}>/100</span>
    </div>
  );
}

function ProModal({ onClose }: { onClose: () => void }) {
  const features: Array<{ icon: React.ComponentType<{ className?: string }>; title: string; desc: string }> = [
    { icon: Zap, title: "无限模型调用", desc: "不限次数使用 DeepSeek、MiniMax、Ollama 等多模型" },
    { icon: Sparkles, title: "高级 Prompt 优化", desc: "多轮迭代优化、A/B 智能对比、版本管理" },
    { icon: BarChart3, title: "完整评估看板", desc: "质量趋势、问题分布、模型性能深度分析" },
    { icon: ShieldCheck, title: "隐私加密存储", desc: "本地数据加密，敏感信息自动脱敏，数据不出境" },
    { icon: Star, title: "优先体验新功能", desc: "Prompt 云同步、团队协作、自定义模型工作流" },
  ];

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-[420px] rounded-2xl border border-[#E5E7EB] bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-lg text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#111827]"
          onClick={onClose}
        >
          <X className="size-4" />
        </button>
        <div className="flex items-center gap-3">
          <img src={proBadge} alt="Pro" className="h-8 w-16" />
          <div>
            <h2 className="text-lg font-bold text-[#111827]">升级到 Pro</h2>
            <p className="text-xs text-[#64748B]">解锁全部高级功能，提升 Prompt 工程效率</p>
          </div>
        </div>
        <div className="mt-5 space-y-2.5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 rounded-xl bg-[#F8FAFF] px-4 py-3">
              <Icon className="mt-0.5 size-4 shrink-0 text-[#2563EB]" />
              <div>
                <div className="text-sm font-semibold text-[#111827]">{title}</div>
                <div className="mt-0.5 text-xs text-[#64748B]">{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-2">
          <button
            type="button"
            className="w-full rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            onClick={() => {
              toast.success("Pro 功能将在正式版本中开放，敬请期待！");
              onClose();
            }}
          >
            立即升级 Pro
          </button>
          <p className="text-center text-xs text-[#94A3B8]">当前为预览版 · Pro 功能正式发布前免费使用</p>
        </div>
      </div>
    </div>
  );
}

function normalizeFavoriteCards(prompts: FavoritePrompt[]) {
  return prompts.slice(0, 12).map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description || item.content,
    content: item.content || item.description,
    score: item.score || 80,
    usageCount: item.usageCount || 0,
    isFavorite: item.isFavorite,
    slashCommand: item.slashCommand,
  }));
}

function compactNumber(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return `${value}`;
}
