import { Clipboard, Copy, Eraser, Gauge, PanelsLeftRight, Save, Sparkles, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SlashCommandMenu } from "@/features/favorites/SlashCommandMenu";
import { VariableFillPanel } from "@/features/favorites/VariableFillPanel";
import {
  EMPTY_STRUCTURED_PROMPT_FIELDS,
  createPromptDraft,
  estimatePromptStats,
  extractPlaceholderNames,
  normalizeStructuredFields,
  type PromptDraft,
} from "@/features/prompt-editor/prompt-editor";
import { VoiceInputPanel } from "@/features/voice-input/VoiceInputPanel";
import { applyPromptVariables } from "@/lib/favorites";
import { buildStructuredPrompt } from "@/lib/prompt";
import { createHeuristicScore } from "@/lib/scoring";
import {
  createPromptRun,
  listFavoritePrompts,
  listPromptHistory,
  listPromptRuns,
  optimizePrompt,
  saveFavoritePrompt,
  savePromptHistory,
} from "@/lib/tauri";
import { useAppStore } from "@/store/app-store";
import { shouldPersistPromptData } from "@/services/privacy";
import type { FavoritePrompt, PromptMode, StructuredPromptFields } from "@/types";
import { detectSensitiveInfo } from "@/utils/sensitive-info";

const DRAFT_KEY = "promptball.promptDraft.v1";

const fields: Array<{ key: keyof StructuredPromptFields; label: string; placeholder: string }> = [
  { key: "role", label: "角色", placeholder: "高级工程师、学术编辑、产品经理……" },
  { key: "context", label: "背景", placeholder: "业务背景、受众、平台、现有状态……" },
  { key: "goal", label: "目标", placeholder: "最终需要完成的结果是什么。" },
  { key: "task", label: "任务", placeholder: "模型需要执行的具体操作。" },
  { key: "input", label: "输入", placeholder: "原始文本、代码、资料、数据……" },
  { key: "output", label: "输出", placeholder: "Markdown、JSON、表格、广播题……" },
  { key: "requirements", label: "要求", placeholder: "质量要求和必须包含的内容。" },
  { key: "constraints", label: "约束", placeholder: "不得包含、长度限制、风格要求……" },
  { key: "evaluation", label: "评价", placeholder: "如何判断结果是否符合预期。" },
  { key: "steps", label: "步骤", placeholder: "模型应按哪些步骤执行任务。" },
  { key: "negative", label: "如不", placeholder: "模型必须避免的事项。" },
];

function getActivePrompt(mode: PromptMode, rawPrompt: string, structuredFields: StructuredPromptFields) {
  return mode === "role" ? buildStructuredPrompt(structuredFields) : rawPrompt.trim();
}

function slashQuery(value: string) {
  const match = value.match(/(?:^|\n)\/([^\n]*)$/);
  return match ? match[1] : null;
}

function readDraft(): PromptDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) {
      return null;
    }
    const draft = JSON.parse(raw) as PromptDraft;
    if (draft.version !== 1) {
      return null;
    }
    return {
      ...draft,
      structuredFields: normalizeStructuredFields(draft.structuredFields),
    };
  } catch {
    return null;
  }
}

function saveDraft(draft: PromptDraft) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function PromptWorkspace() {
  const {
    mode,
    rawPrompt,
    structuredFields,
    result,
    settings,
    providers,
    appPreferences,
    loading,
    favoritePrompts,
    activeFavoritePrompt,
    setMode,
    setRawPrompt,
    setStructuredField,
    setStructuredFields,
    restoreDraft,
    setResult,
    setHistory,
    setLoading,
    setFavoritePrompts,
    setPromptRuns,
    setActiveFavoritePrompt,
    setPendingRun,
    setActivePanel,
  } = useAppStore();
  const [variablePrompt, setVariablePrompt] = useState<FavoritePrompt | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const activePrompt = getActivePrompt(mode, rawPrompt, structuredFields);
  const query = mode === "free" ? slashQuery(rawPrompt) : null;
  const previewScore = createHeuristicScore(activePrompt);
  const displayedScore = result?.score ?? previewScore;
  const stats = estimatePromptStats(activePrompt);
  const placeholders = useMemo(() => extractPlaceholderNames(activePrompt), [activePrompt]);
  const activeProvider = providers.find((p) => p.isDefault && p.enabled) ?? providers.find((p) => p.enabled);
  const activeModel = activeProvider?.modelName ?? settings?.model ?? "deepseek-chat";

  useEffect(() => {
    const draft = readDraft();
    if (draft && !rawPrompt && !activePrompt) {
      restoreDraft(draft);
      setLastSavedAt(draft.updatedAt);
    }
    // Restore only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const draft = createPromptDraft({ mode, rawPrompt, structuredFields });
      saveDraft(draft);
      setLastSavedAt(draft.updatedAt);
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [mode, rawPrompt, structuredFields]);

  function insertPrompt(prompt: FavoritePrompt, content?: string) {
    const inserted = content ?? (prompt.variables.length ? "" : applyPromptVariables(prompt.content, {}));
    if (!inserted) {
      setVariablePrompt(prompt);
      return;
    }
    setRawPrompt(rawPrompt.replace(/(?:^|\n)\/([^\n]*)$/, (match) => `${match.startsWith("\n") ? "\n" : ""}${inserted}`));
    setActiveFavoritePrompt(prompt);
    setVariablePrompt(null);
  }

  async function handleOptimize() {
    if (!activePrompt) {
      toast.error("请先输入一段 Prompt。");
      return;
    }

    setLoading(true);
    try {
      const findings = appPreferences.privacy.warnBeforeModelCall ? detectSensitiveInfo(activePrompt) : [];
      if (findings.length > 0) {
        const types = [...new Set(findings.map((finding) => finding.type))].join("、");
        toast.warning("将发送模型请求，检测到敏感信息", {
          description: `检测到：${types}。Prompt 内容将被发送到已配置的模型供应商。`,
        });
      }
      const next = await optimizePrompt(activePrompt);
      setResult(next);
      if (activeFavoritePrompt && shouldPersistPromptData(appPreferences.privacy)) {
        const run = await createPromptRun({
          favoritePromptId: activeFavoritePrompt.id,
          versionId: activeFavoritePrompt.defaultVersionId,
          input: activePrompt,
          output: next.optimizedPrompt,
          model: activeModel ?? activeFavoritePrompt.preferredModel ?? activeFavoritePrompt.model,
        });
        setPendingRun(run);
        setPromptRuns(await listPromptRuns());
      } else if (activeFavoritePrompt && appPreferences.privacy.privacyMode) {
        toast("隐私模式开启，本次调用未保存。");
      }
      toast.success("优化完成。");
    } finally {
      setLoading(false);
    }
  }

  function handleScore() {
    setResult({
      taskRecognition: "本地快速评分",
      optimizedPrompt: activePrompt,
      diagnosis: "这是调用模型前的本地启发式评分。",
      missingInformation: previewScore.dimensions.filter((item) => item.score < 70).map((item) => item.label),
      suggestions: previewScore.dimensions.filter((item) => item.score < 70).map((item) => item.suggestion),
      trainingTips: ["先补全弱维度再调用模型，减少低价吃迭代。"],
      score: previewScore,
      parseStatus: "parsed",
    });
  }

  async function handleCopy(text = result?.optimizedPrompt || activePrompt) {
    await navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板。");
  }

  async function handlePasteClipboard() {
    const text = await navigator.clipboard.readText();
    if (!text.trim()) {
      toast.error("剪贴板为空。");
      return;
    }
    setRawPrompt(rawPrompt ? `${rawPrompt}\n\n${text}` : text);
    setMode("free");
  }

  function handleClear() {
    setRawPrompt("");
    setStructuredFields(EMPTY_STRUCTURED_PROMPT_FIELDS);
    setResult(null);
    setActiveFavoritePrompt(null);
    localStorage.removeItem(DRAFT_KEY);
    setLastSavedAt(null);
  }

  async function handleSaveHistory() {
    if (!result || !activePrompt) {
      toast.error("请先进行评分或优化，再保存历史。");
      return;
    }
    if (!shouldPersistPromptData(appPreferences.privacy)) {
      toast.error("隱私设置禁止保存 Prompt 历史。");
      return;
    }
    await savePromptHistory({
      originalPrompt: activePrompt,
      optimizedPrompt: result.optimizedPrompt,
      diagnosis: result.diagnosis,
      suggestions: result.suggestions,
      trainingTips: result.trainingTips,
      score: result.score,
      model: activeModel,
      mode,
      tags: [],
    });
    setHistory(await listPromptHistory());
    toast.success("已保存到历史。");
  }

  async function handleFavorite() {
    if (!result?.optimizedPrompt) {
      toast.error("请先生成优化结果再收藏。");
      return;
    }
    const count = favoritePrompts.filter((prompt) => !prompt.isBuiltin).length + 1;
    await saveFavoritePrompt({
      name: `收藏 Prompt ${count}`,
      slashCommand: `/prompt${count}`,
      category: "未分类",
      tags: [],
      description: "从优化结果快速保存，可在 Prompt 库中编辑元数据。",
      preferredModel: activeModel,
      model: activeModel,
      content: result.optimizedPrompt,
      note: "从工作台优化结果保存。",
    });
    setFavoritePrompts(await listFavoritePrompts());
    setActivePanel("favorites");
    toast.success("已收藏为常用 Prompt。");
  }

  function openABTest() {
    if (result?.optimizedPrompt) {
      setActivePanel("favorites");
      toast("请在 Prompt 库打开 A/B 面板，选择两个常用 Prompt 进行对比。");
    }
  }

  return (
    <div className="relative grid min-h-0 flex-1 grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] gap-4">
      {variablePrompt && (
        <VariableFillPanel
          prompt={variablePrompt}
          onCancel={() => setVariablePrompt(null)}
          onInsert={(content) => insertPrompt(variablePrompt, content)}
        />
      )}

      <section className="flex min-h-0 flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Tabs value={mode} onValueChange={(value) => setMode(value as PromptMode)}>
            <TabsList>
              <TabsTrigger value="free">自由</TabsTrigger>
              <TabsTrigger value="role">结构</TabsTrigger>
              <TabsTrigger value="voice">语音</TabsTrigger>
            </TabsList>
          </Tabs>
          <Badge variant="secondary">{activeFavoritePrompt ? activeFavoritePrompt.slashCommand : activeModel}</Badge>
        </div>

        {mode === "free" && (
          <div className="relative min-h-[430px] flex-1">
            <Textarea
              value={rawPrompt}
              onChange={(event) => {
                setRawPrompt(event.target.value);
                if (!slashQuery(event.target.value)) {
                  setActiveFavoritePrompt(null);
                }
              }}
              placeholder="输入 Prompt。输入 / 调用常用 Prompt。使用 {{variables}} 创建可替换变量。"
              className="size-full min-h-[430px] text-[15px]"
            />
            {query !== null && <SlashCommandMenu query={query} prompts={favoritePrompts} onSelect={(prompt) => insertPrompt(prompt)} />}
          </div>
        )}

        {mode === "role" && (
          <ScrollArea className="min-h-0 flex-1 rounded-lg border bg-background/70">
            <div className="grid grid-cols-2 gap-3 p-3">
              {fields.map((field) => (
                <div key={field.key} className="flex flex-col gap-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Textarea
                    id={field.key}
                    value={structuredFields[field.key]}
                    onChange={(event) => setStructuredField(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    className="min-h-24"
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {mode === "voice" && (
          <VoiceInputPanel
            appPreferences={appPreferences}
            transcript={rawPrompt}
            onTranscriptChange={setRawPrompt}
            onStructuredFields={(nextFields) => {
              setStructuredFields(nextFields);
              setMode("role");
            }}
          />
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{stats.characters} 字符</span>
            <span>{stats.words} 词</span>
            <span>~{stats.estimatedTokens} tokens</span>
            {placeholders.length > 0 && <span>{placeholders.length} 个变量</span>}
            {lastSavedAt && <span>草稿已保存 {new Date(lastSavedAt).toLocaleTimeString()}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePasteClipboard}>
              <Clipboard data-icon="inline-start" />
              粘贴
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Eraser data-icon="inline-start" />
              清空
            </Button>
            <Button variant="outline" size="sm" onClick={handleScore}>
              <Gauge data-icon="inline-start" />
              评分
            </Button>
            <Button size="sm" onClick={handleOptimize} disabled={loading}>
              <Sparkles data-icon="inline-start" />
              {loading ? "优化中…" : "优化"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => void handleCopy()}>
              <Copy data-icon="inline-start" />
              复制
            </Button>
            <Button variant="outline" size="sm" onClick={handleFavorite}>
              <Star data-icon="inline-start" />
              收藏
            </Button>
            <Button variant="outline" size="sm" onClick={openABTest} disabled={!result?.optimizedPrompt}>
              A/B
            </Button>
            <Button variant="secondary" size="sm" onClick={handleSaveHistory}>
              <Save data-icon="inline-start" />
              保存
            </Button>
          </div>
        </div>
      </section>

      <section className="flex min-h-0 flex-col gap-3">
        <Card className="min-h-0 flex-1 overflow-hidden">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle>优化前 / 优化后</CardTitle>
            <PanelsLeftRight className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="grid min-h-0 grid-cols-2 gap-3">
            <ScrollArea className="h-[190px] rounded-md bg-muted/40 p-3">
              <div className="mb-2 text-xs font-medium text-muted-foreground">原始 Prompt</div>
              <pre className="whitespace-pre-wrap break-words text-sm leading-6">{activePrompt || "等待输入…"}</pre>
            </ScrollArea>
            <ScrollArea className="h-[190px] rounded-md bg-muted/40 p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>优化后 Prompt</span>
                {result?.optimizedPrompt && (
                  <button className="text-primary" type="button" onClick={() => void handleCopy(result.optimizedPrompt)}>
                    Copy
                  </button>
                )}
              </div>
              <pre className="whitespace-pre-wrap break-words text-sm leading-6">{result?.optimizedPrompt || "优化后的 Prompt 将显示在这里。"}</pre>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle>Prompt 评分</CardTitle>
            <Badge>{displayedScore.total}/100</Badge>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>维度</TableHead>
                    <TableHead>得分</TableHead>
                    <TableHead>诊断</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedScore.dimensions.map((item) => (
                    <TableRow key={item.key}>
                      <TableCell className="font-medium">{item.label}</TableCell>
                      <TableCell>{item.score}</TableCell>
                      <TableCell className="text-muted-foreground">{item.diagnosis}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-0 flex-1 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle>优化记录</CardTitle>
          </CardHeader>
          <CardContent className="min-h-0">
            <ScrollArea className="h-[250px] pr-3">
              {!result ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  使用『评分』进行本地诊断，或使用『优化』调用已配置的模型。
                </p>
              ) : (
                <div className="flex flex-col gap-3 text-sm leading-6">
                  <div>
                    <div className="font-medium">任务识别</div>
                    <p className="text-muted-foreground">{result.taskRecognition}</p>
                  </div>
                  <div>
                    <div className="font-medium">诊断</div>
                    <p className="text-muted-foreground">{result.diagnosis}</p>
                  </div>
                  {result.missingInformation.length > 0 && (
                    <div>
                      <div className="font-medium">缺失信息</div>
                      <ul className="list-inside list-disc text-muted-foreground">
                        {result.missingInformation.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">优化建议</div>
                    <ul className="list-inside list-disc text-muted-foreground">
                      {result.suggestions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium">训练技巧</div>
                    <ul className="list-inside list-disc text-muted-foreground">
                      {result.trainingTips.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
