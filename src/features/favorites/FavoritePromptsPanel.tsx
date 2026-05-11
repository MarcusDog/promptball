import { Eye, Plus, Search, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { summarizeFavoritePromptMetrics } from "@/lib/evaluation";
import { extractPromptVariables, rankSlashCommands, sortFavoritePrompts } from "@/lib/favorites";
import { deleteFavoritePrompt, listFavoritePrompts, saveFavoritePrompt, setDefaultFavoritePrompt } from "@/lib/tauri";
import { useAppStore } from "@/store/app-store";
import type { FavoritePrompt } from "@/types";
import { ABTestPanel } from "./ABTestPanel";
import { PromptDetailPanel } from "./PromptDetailPanel";

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function FavoritePromptsPanel() {
  const { favoritePrompts, promptRuns, promptFeedback, promptEvalScores, result, settings, providers, setFavoritePrompts } = useAppStore();
  const activeProvider = providers.find((p) => p.isDefault && p.enabled) ?? providers.find((p) => p.enabled);
  const activeModelName = activeProvider?.modelName ?? settings?.model ?? "deepseek-chat";
  const [selected, setSelected] = useState<FavoritePrompt | null>(null);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [slashCommand, setSlashCommand] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [preferredModel, setPreferredModel] = useState(activeModelName);
  const [description, setDescription] = useState("");
  const [content, setContent] = useState(result?.optimizedPrompt ?? "");
  const [note, setNote] = useState("");

  const variables = useMemo(() => extractPromptVariables(content), [content]);
  const visiblePrompts = useMemo(() => {
    if (query.trim()) {
      return rankSlashCommands(query, favoritePrompts);
    }
    return sortFavoritePrompts(favoritePrompts);
  }, [favoritePrompts, query]);

  if (selected) {
    return <PromptDetailPanel prompt={selected} onClose={() => setSelected(null)} />;
  }

  async function save() {
    if (!name.trim() || !slashCommand.trim() || !content.trim()) {
      toast.error("名称、Slash 命令和内容为必填项");
      return;
    }
    await saveFavoritePrompt({
      name,
      slashCommand,
      category,
      tags,
      description,
      preferredModel,
      model: preferredModel,
      content,
      variables,
      note,
    });
    setFavoritePrompts(await listFavoritePrompts());
    setName("");
    setSlashCommand("");
    setCategory("");
    setTags("");
    setDescription("");
    setContent("");
    setNote("");
    toast.success("已收藏为 Slash Prompt");
  }

  return (
    <section className="grid min-h-0 flex-1 grid-cols-[320px_minmax(0,1fr)] gap-4">
      <aside className="flex min-h-0 flex-col gap-3">
        <Card>
          <CardHeader>
            <CardTitle>收藏 Prompt</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label>Prompt 名称</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="论文作图专家" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Slash 命令</Label>
              <Input value={slashCommand} onChange={(event) => setSlashCommand(event.target.value)} placeholder="/论文作图" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-2">
                <Label>分类</Label>
                <Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="论文作图" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>适用模型</Label>
                <Input value={preferredModel} onChange={(event) => setPreferredModel(event.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>标签</Label>
              <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="论文, 作图, drawio" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>描述</Label>
              <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="这个 Prompt 适合什么场景" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>完整内容</Label>
              <Textarea value={content} onChange={(event) => setContent(event.target.value)} className="min-h-32" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>备注</Label>
              <Textarea value={note} onChange={(event) => setNote(event.target.value)} className="min-h-20" />
            </div>
            <div className="text-xs text-muted-foreground">变量字段：{variables.join("、") || "无"}</div>
            <Button onClick={() => void save()}>
              <Plus data-icon="inline-start" />
              保存收藏
            </Button>
          </CardContent>
        </Card>
      </aside>
      <div className="flex min-h-0 flex-col gap-3">
        <ABTestPanel />
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="搜索 Prompt、分类、标签或 /命令" />
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="grid grid-cols-2 gap-3 pr-2">
            {visiblePrompts.map((prompt) => {
              const metrics = summarizeFavoritePromptMetrics(prompt.id, promptRuns, promptFeedback, promptEvalScores);
              const finalScore = metrics.averageFinalScore || prompt.score || 0;
              const usageCount = metrics.usageCount || prompt.usageCount;
              const directUseRate = metrics.directUseRate || prompt.directUseRate;
              const modifiedUseRate = metrics.modifiedUseRate || prompt.modifiedUseRate;
              return (
                <Card key={prompt.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-sm">{prompt.name}</CardTitle>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge>{prompt.slashCommand}</Badge>
                          <Badge variant="secondary">{prompt.category}</Badge>
                          {prompt.isDefault && <Badge variant="outline">默认</Badge>}
                        </div>
                      </div>
                      <Badge variant="outline">{Math.round(finalScore)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{prompt.description || prompt.note}</p>
                    <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{prompt.content}</p>
                    <div className="flex flex-wrap gap-1">
                      {prompt.tags.slice(0, 4).map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <span>使用 {usageCount}</span>
                      <span>直用 {percent(directUseRate)}</span>
                      <span>修改 {percent(modifiedUseRate)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setSelected(prompt)}>
                        <Eye data-icon="inline-start" />
                        详情
                      </Button>
                      {!prompt.isBuiltin && (
                        <Button
                          size="sm"
                          variant={prompt.isDefault ? "default" : "outline"}
                          onClick={async () => {
                            await setDefaultFavoritePrompt(prompt.id);
                            setFavoritePrompts(await listFavoritePrompts());
                          }}
                        >
                          <Star data-icon="inline-start" />
                          默认
                        </Button>
                      )}
                      {!prompt.isBuiltin && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={async () => {
                            await deleteFavoritePrompt(prompt.id);
                            setFavoritePrompts(await listFavoritePrompts());
                          }}
                          aria-label="删除收藏 Prompt"
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </section>
  );
}
