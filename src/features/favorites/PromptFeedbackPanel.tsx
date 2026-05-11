import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PROMPT_PROBLEM_TAGS, calculateFinalScore, createPromptEvalScore } from "@/lib/evaluation";
import { createHeuristicScore } from "@/lib/scoring";
import { listPromptEvalScores, listPromptFeedback, savePromptEvalScore, savePromptFeedback } from "@/lib/tauri";
import { useAppStore } from "@/store/app-store";
import type { PromptProblemTag, PromptUsageResult } from "@/types";

const usageOptions: Array<{ value: PromptUsageResult; label: string }> = [
  { value: "direct", label: "直接使用" },
  { value: "modified", label: "修改后使用" },
  { value: "unused", label: "未使用" },
];

function usageScore(usageResult: PromptUsageResult) {
  if (usageResult === "direct") {
    return 100;
  }
  if (usageResult === "modified") {
    return 70;
  }
  return 0;
}

export function PromptFeedbackPanel() {
  const { pendingRun, setPendingRun, setPromptFeedback, setPromptEvalScores } = useAppStore();
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [usageResult, setUsageResult] = useState<PromptUsageResult>("modified");
  const [tags, setTags] = useState<PromptProblemTag[]>([]);
  const [note, setNote] = useState("");

  const preview = useMemo(() => {
    if (!pendingRun) {
      return null;
    }
    const structureScore = createHeuristicScore(pendingRun.input).total;
    const outputQualityScore = createHeuristicScore(pendingRun.output).total;
    const userSatisfactionScore = rating * 20;
    const realUsageScore = usageScore(usageResult);
    return {
      structureScore,
      outputQualityScore,
      userSatisfactionScore,
      realUsageScore,
      finalScore: calculateFinalScore({ structureScore, outputQualityScore, userSatisfactionScore, realUsageScore }),
    };
  }, [pendingRun, rating, usageResult]);

  if (!pendingRun || !preview) {
    return null;
  }

  async function submit() {
    if (!pendingRun || !preview) {
      return;
    }
    const feedback = await savePromptFeedback({
      runId: pendingRun.id,
      rating,
      usageResult,
      problemTags: tags,
      note,
    });
    const evalScore = createPromptEvalScore({
      runId: pendingRun.id,
      structureScore: preview.structureScore,
      outputQualityScore: preview.outputQualityScore,
      feedback,
    });
    await savePromptEvalScore(evalScore);
    setPromptFeedback(await listPromptFeedback());
    setPromptEvalScores(await listPromptEvalScores());
    setPendingRun(null);
    toast.success("反馈已记录，综合效果分已更新");
  }

  return (
    <Card className="fixed bottom-6 right-6 z-40 w-[420px] shadow-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">这次 Prompt 效果如何？</CardTitle>
          <Badge>{preview.finalScore}/100</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
          <span>结构 {preview.structureScore}</span>
          <span>输出 {preview.outputQualityScore}</span>
          <span>满意 {preview.userSatisfactionScore}</span>
          <span>使用 {preview.realUsageScore}</span>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <Button key={value} size="sm" variant={rating === value ? "default" : "outline"} onClick={() => setRating(value as 1 | 2 | 3 | 4 | 5)}>
              {value}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {usageOptions.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={usageResult === option.value ? "secondary" : "outline"}
              onClick={() => setUsageResult(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {PROMPT_PROBLEM_TAGS.map((tag) => (
            <Badge
              key={tag}
              variant={tags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]))}
            >
              {tag}
            </Badge>
          ))}
        </div>
        <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="备注，可选" className="min-h-20" />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setPendingRun(null)}>
            稍后
          </Button>
          <Button onClick={() => void submit()}>提交反馈</Button>
        </div>
      </CardContent>
    </Card>
  );
}
