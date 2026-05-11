import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { listPromptABTests, runPromptDirect, savePromptABTest } from "@/lib/tauri";
import { useAppStore } from "@/store/app-store";
import type { ABWinner } from "@/types";

export function ABTestPanel() {
  const { favoritePrompts, settings, providers, setPromptABTests } = useAppStore();
  const [promptAId, setPromptAId] = useState("");
  const [promptBId, setPromptBId] = useState("");
  const [taskType, setTaskType] = useState("");
  const [input, setInput] = useState("");
  const [outputA, setOutputA] = useState("");
  const [outputB, setOutputB] = useState("");
  const [reason, setReason] = useState("");
  const [blindMode, setBlindMode] = useState(true);
  const [running, setRunning] = useState(false);
  const promptA = useMemo(() => favoritePrompts.find((prompt) => prompt.id === promptAId), [favoritePrompts, promptAId]);
  const promptB = useMemo(() => favoritePrompts.find((prompt) => prompt.id === promptBId), [favoritePrompts, promptBId]);
  const activeProvider = providers.find((p) => p.isDefault && p.enabled) ?? providers.find((p) => p.enabled);
  const model = activeProvider?.modelName ?? settings?.model ?? promptA?.preferredModel ?? promptB?.preferredModel ?? "deepseek-chat";

  async function runTest() {
    if (!promptA || !promptB || !input.trim()) {
      toast.error("请选择两个 Prompt 并填写测试材料");
      return;
    }
    if (promptA.id === promptB.id) {
      toast.error("请选择两个不同的 Prompt");
      return;
    }

    setRunning(true);
    try {
      const [resultA, resultB] = await Promise.all([
        runPromptDirect(promptA.content, input),
        runPromptDirect(promptB.content, input),
      ]);
      setOutputA(resultA);
      setOutputB(resultB);
      toast.success("两个 Prompt 已使用同一测试材料生成结果");
    } catch (error) {
      toast.error("生成失败", { description: error instanceof Error ? error.message : String(error) });
    } finally {
      setRunning(false);
    }
  }

  async function choose(winner: ABWinner) {
    if (!promptA || !promptB || !outputA || !outputB) {
      return;
    }
    await savePromptABTest({
      promptAId: promptA.id,
      promptBId: promptB.id,
      input,
      outputA,
      outputB,
      model,
      winner,
      reason,
      taskType,
      blindMode,
    });
    setPromptABTests(await listPromptABTests());
    setReason("");
    toast.success("A/B 测试结果已记录");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>A/B 测试</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={promptAId} onChange={(event) => setPromptAId(event.target.value)}>
            <option value="">选择 Prompt A</option>
            {favoritePrompts.map((prompt) => <option key={prompt.id} value={prompt.id}>{prompt.name}</option>)}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={promptBId} onChange={(event) => setPromptBId(event.target.value)}>
            <option value="">选择 Prompt B</option>
            {favoritePrompts.map((prompt) => <option key={prompt.id} value={prompt.id}>{prompt.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <div className="flex flex-col gap-2">
            <Label>测试任务类型</Label>
            <Input value={taskType} onChange={(event) => setTaskType(event.target.value)} placeholder="论文 / Codex / UI / 图片生成" />
          </div>
          <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
            <input type="checkbox" checked={blindMode} onChange={(event) => setBlindMode(event.target.checked)} />
            盲评
          </label>
        </div>
        <Textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="输入同一份测试材料" className="min-h-24" />
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>同一模型：{model}</span>
          <Button onClick={() => void runTest()} disabled={running}>{running ? "生成中" : "分别调用两个 Prompt"}</Button>
        </div>
        {(outputA || outputB) && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-2 text-xs font-medium text-muted-foreground">{blindMode ? "结果 1" : `A：${promptA?.name}`}</div>
                <pre className="max-h-52 overflow-auto whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-xs leading-5">{outputA}</pre>
              </div>
              <div>
                <div className="mb-2 text-xs font-medium text-muted-foreground">{blindMode ? "结果 2" : `B：${promptB?.name}`}</div>
                <pre className="max-h-52 overflow-auto whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-xs leading-5">{outputB}</pre>
              </div>
            </div>
            <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="选择原因，可选" className="min-h-16" />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void choose("a")}>{blindMode ? "结果 1 更好" : "A 更好"}</Button>
              <Button size="sm" onClick={() => void choose("b")}>{blindMode ? "结果 2 更好" : "B 更好"}</Button>
              <Button size="sm" variant="outline" onClick={() => void choose("neither")}>都不好</Button>
              <Button size="sm" variant="outline" onClick={() => void choose("both")}>都可以</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
