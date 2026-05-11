import { GitCompare, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  createPerformanceAlert,
  summarizeFavoritePromptMetrics,
  summarizePromptVersionMetrics,
} from "@/lib/evaluation";
import { comparePromptVersionContent, computeABStats } from "@/lib/favorites";
import {
  listFavoritePrompts,
  listPromptVersions,
  setDefaultPromptVersion,
  updateFavoritePromptVersion,
} from "@/lib/tauri";
import { useAppStore } from "@/store/app-store";
import type { FavoritePrompt } from "@/types";

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function trendLabel(trend: "up" | "down" | "flat" | "unknown") {
  if (trend === "up") {
    return "上升";
  }
  if (trend === "down") {
    return "下降";
  }
  if (trend === "flat") {
    return "稳定";
  }
  return "样本不足";
}

export function PromptDetailPanel({ prompt, onClose }: { prompt: FavoritePrompt; onClose: () => void }) {
  const {
    favoritePrompts,
    promptRuns,
    promptFeedback,
    promptEvalScores,
    promptVersions,
    promptABTests,
    setFavoritePrompts,
    setPromptVersions,
  } = useAppStore();
  const currentPrompt = favoritePrompts.find((item) => item.id === prompt.id) ?? prompt;
  const [draftContent, setDraftContent] = useState(currentPrompt.content);
  const [draftNote, setDraftNote] = useState("");
  const metrics = summarizeFavoritePromptMetrics(currentPrompt.id, promptRuns, promptFeedback, promptEvalScores);
  const alert = createPerformanceAlert(currentPrompt.id, promptRuns, promptFeedback, promptEvalScores);
  const versions = useMemo(
    () => promptVersions.filter((version) => version.favoritePromptId === currentPrompt.id).sort((a, b) => b.version - a.version),
    [currentPrompt.id, promptVersions],
  );
  const versionMetrics = summarizePromptVersionMetrics(currentPrompt.id, versions, promptRuns, promptFeedback, promptEvalScores);
  const metricsByVersion = new Map(versionMetrics.map((item) => [item.versionId, item]));
  const feedbackByRun = new Map(promptFeedback.map((feedback) => [feedback.runId, feedback]));
  const scoresByRun = new Map(promptEvalScores.map((score) => [score.runId, score]));
  const abStats = computeABStats(currentPrompt.id, promptABTests);

  async function refreshVersionData() {
    setFavoritePrompts(await listFavoritePrompts());
    setPromptVersions(await listPromptVersions());
  }

  async function setVersionAsDefault(versionId: string) {
    await setDefaultPromptVersion(currentPrompt.id, versionId);
    await refreshVersionData();
    toast.success("已切换默认版本");
  }

  async function createVersion(setDefault: boolean) {
    if (!draftContent.trim()) {
      toast.error("版本内容不能为空");
      return;
    }
    await updateFavoritePromptVersion({
      favoritePromptId: currentPrompt.id,
      content: draftContent,
      note: draftNote,
      setDefault,
    });
    await refreshVersionData();
    setDraftNote("");
    toast.success(setDefault ? "已创建并设为默认版本" : "已创建新版本");
  }

  return (
    <Card className="min-h-0 flex-1 overflow-hidden">
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle>{currentPrompt.name}</CardTitle>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge>{currentPrompt.slashCommand}</Badge>
            <Badge variant="secondary">{currentPrompt.category}</Badge>
            <Badge variant="outline">{currentPrompt.preferredModel || currentPrompt.model}</Badge>
            {currentPrompt.isDefault && <Badge variant="outline">默认 Prompt</Badge>}
          </div>
        </div>
        <Button variant="outline" onClick={onClose}>
          返回列表
        </Button>
      </CardHeader>
      <CardContent className="grid min-h-0 grid-cols-[minmax(0,1fr)_320px] gap-4">
        <ScrollArea className="min-h-0">
          <div className="flex flex-col gap-4 pr-2">
            {alert.shouldSuggestNewVersion && (
              <Card className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                <CardContent className="p-4 text-sm leading-6">
                  <strong>优化提醒：</strong>
                  {alert.message}
                  <div className="mt-2 text-xs">{alert.reasons.join("；")}</div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">完整内容</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm leading-6">{currentPrompt.content}</pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">创建新版本</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label>版本内容</Label>
                  <Textarea value={draftContent} onChange={(event) => setDraftContent(event.target.value)} className="min-h-40" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>版本备注</Label>
                  <Textarea
                    value={draftNote}
                    onChange={(event) => setDraftNote(event.target.value)}
                    className="min-h-20"
                    placeholder="说明这次修改解决了什么问题"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setDraftContent(currentPrompt.content)}>
                    使用当前默认版本
                  </Button>
                  <Button variant="outline" onClick={() => void createVersion(false)}>
                    保存为新版本
                  </Button>
                  <Button onClick={() => void createVersion(true)}>保存并设为默认</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">最近 10 次表现</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {metrics.recentRuns.length === 0 && <p className="text-sm text-muted-foreground">暂无调用记录。</p>}
                {metrics.recentRuns.map((run) => {
                  const feedback = feedbackByRun.get(run.id);
                  const score = scoresByRun.get(run.id);
                  return (
                    <div key={run.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{new Date(run.createdAt).toLocaleString()}</span>
                        <Badge variant="secondary">综合 {score?.finalScore ?? "-"}</Badge>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{run.output}</p>
                      {score && (
                        <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                          <span>结构 {score.structureScore}</span>
                          <span>输出 {score.outputQualityScore}</span>
                          <span>满意 {score.userSatisfactionScore}</span>
                          <span>使用 {score.realUsageScore}</span>
                        </div>
                      )}
                      {score?.explanation.length ? (
                        <div className="mt-2 rounded bg-muted/40 p-2 text-xs leading-5 text-muted-foreground">
                          {score.explanation.join("；")}
                        </div>
                      ) : null}
                      {feedback && (
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>{feedback.rating}/5</span>
                          <span>{feedback.usageResult}</span>
                          <span>{feedback.problemTags.join("、") || "无问题标签"}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">版本历史</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {versions.length === 0 && <p className="text-sm text-muted-foreground">暂无版本记录。</p>}
                {versions.map((version, index) => {
                  const previous = versions[index + 1];
                  const diff = previous ? comparePromptVersionContent(previous.content, version.content) : null;
                  const versionStat = metricsByVersion.get(version.id);
                  return (
                    <div key={version.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={version.isDefault ? "default" : "secondary"}>v{version.version}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(version.createdAt).toLocaleString()}</span>
                        </div>
                        {!version.isDefault && (
                          <Button size="sm" variant="outline" onClick={() => void setVersionAsDefault(version.id)}>
                            <RotateCcw data-icon="inline-start" />
                            设为默认
                          </Button>
                        )}
                      </div>
                      {version.note && <p className="mt-2 text-xs text-muted-foreground">{version.note}</p>}
                      <pre className="mt-2 max-h-24 overflow-hidden whitespace-pre-wrap rounded bg-muted/40 p-2 text-xs leading-5">{version.content}</pre>
                      <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                        <span>调用 {versionStat?.usageCount ?? 0}</span>
                        <span>均分 {versionStat?.averageFinalScore || "-"}</span>
                        <span>直用 {percent(versionStat?.directUseRate ?? 0)}</span>
                        <span>废弃 {percent(versionStat?.discardedRate ?? 0)}</span>
                      </div>
                      {diff && (
                        <div className="mt-2 rounded bg-muted/40 p-2 text-xs leading-5 text-muted-foreground">
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            <GitCompare className="size-3" />
                            对比 v{previous.version}
                          </div>
                          <div className="mt-1">
                            +{diff.addedLines.length} 行，-{diff.removedLines.length} 行，未变 {diff.unchangedLines} 行，长度变化{" "}
                            {diff.lengthDelta >= 0 ? "+" : ""}
                            {diff.lengthDelta}
                          </div>
                          {diff.addedLines.length > 0 && (
                            <div className="mt-1 text-emerald-700 dark:text-emerald-300">
                              新增：{diff.addedLines.slice(0, 2).join(" / ")}
                            </div>
                          )}
                          {diff.removedLines.length > 0 && (
                            <div className="mt-1 text-red-700 dark:text-red-300">
                              移除：{diff.removedLines.slice(0, 2).join(" / ")}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <aside className="flex flex-col gap-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">效果指标</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between"><span>使用次数</span><strong>{metrics.usageCount || currentPrompt.usageCount}</strong></div>
              <div className="flex justify-between"><span>平均评分</span><strong>{metrics.averageRating || currentPrompt.averageRating || "-"}</strong></div>
              <div className="flex justify-between"><span>综合效果分</span><strong>{metrics.averageFinalScore || currentPrompt.score || "-"}</strong></div>
              <div className="flex justify-between"><span>最近 10 次均分</span><strong>{metrics.recentAverageFinalScore || "-"}</strong></div>
              <div className="flex justify-between"><span>评分趋势</span><strong>{trendLabel(metrics.scoreTrend)}</strong></div>
              <Separator />
              <div className="flex justify-between"><span>直接可用率</span><strong>{percent(metrics.directUseRate || currentPrompt.directUseRate)}</strong></div>
              <div className="flex justify-between"><span>修改后可用率</span><strong>{percent(metrics.modifiedUseRate || currentPrompt.modifiedUseRate)}</strong></div>
              <div className="flex justify-between"><span>废弃率</span><strong>{percent(metrics.discardedRate || currentPrompt.discardedRate)}</strong></div>
              <Separator />
              <div className="flex justify-between"><span>A/B 胜率</span><strong>{percent(abStats.winRate)}</strong></div>
              <div className="text-xs text-muted-foreground">
                胜 {abStats.wins} / 负 {abStats.losses} / 平 {abStats.ties}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">常见问题标签</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {metrics.problemTagCounts.length === 0 && <p className="text-xs text-muted-foreground">暂无问题标签。</p>}
              {metrics.problemTagCounts.slice(0, 8).map((item) => (
                <Badge key={item.tag} variant="outline">{item.tag} x {item.count}</Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">用户反馈</CardTitle>
            </CardHeader>
            <CardContent className="flex max-h-64 flex-col gap-2 overflow-auto">
              {promptFeedback
                .filter((feedback) => metrics.recentRuns.some((run) => run.id === feedback.runId))
                .map((feedback) => (
                  <div key={feedback.id} className="rounded-md bg-muted/40 p-2 text-xs leading-5">
                    <strong>{feedback.rating}/5</strong> {feedback.problemTags.join("、") || "无标签"}
                    <p className="text-muted-foreground">{feedback.note || "无备注"}</p>
                  </div>
                ))}
            </CardContent>
          </Card>
        </aside>
      </CardContent>
    </Card>
  );
}
