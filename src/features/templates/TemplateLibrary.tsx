import { Copy, Plus, Search, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  BUILTIN_TEMPLATE_CATEGORIES,
  builtinTemplates,
  searchPromptTemplates,
  templateToFavoritePromptInput,
} from "@/lib/templates";
import {
  deleteCustomTemplate,
  listCustomTemplates,
  listFavoritePrompts,
  saveCustomTemplate,
  saveFavoritePrompt,
} from "@/lib/tauri";
import { useAppStore } from "@/store/app-store";
import type { PromptTemplate } from "@/types";

function splitList(value: string): string[] {
  return value
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function TemplateLibrary() {
  const {
    templates,
    settings,
    providers,
    setTemplates,
    setRawPrompt,
    setActivePanel,
    setFavoritePrompts,
  } = useAppStore();
  const activeProvider = providers.find((p) => p.isDefault && p.enabled) ?? providers.find((p) => p.enabled);
  const activeModelName = activeProvider?.modelName ?? settings?.model ?? "deepseek-chat";
  const [category, setCategory] = useState("全部");
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scenario, setScenario] = useState("");
  const [variables, setVariables] = useState("");
  const [models, setModels] = useState(activeModelName);
  const [content, setContent] = useState("");
  const [outputExample, setOutputExample] = useState("");
  const [criteria, setCriteria] = useState("");

  const allTemplates = useMemo(() => [...builtinTemplates, ...templates], [templates]);
  const categories = ["全部", ...BUILTIN_TEMPLATE_CATEGORIES, ...Array.from(new Set(templates.map((item) => item.category)))];
  const filtered = useMemo(() => searchPromptTemplates(allTemplates, query, category), [allTemplates, category, query]);

  async function saveTemplate() {
    if (!title.trim() || !content.trim()) {
      toast.error("请填写模板标题和内容。");
      return;
    }
    const nextVariables = splitList(variables);
    await saveCustomTemplate({
      title,
      category: "自定义模板",
      description: description || "用户保存的自定义模板",
      scenario: scenario || description || "自定义工作场景",
      applicableModels: splitList(models).length ? splitList(models) : [activeModelName],
      variables: nextVariables,
      content,
      outputExample,
      evaluationCriteria: splitList(criteria),
      tags: ["自定义"],
    });
    setTemplates(await listCustomTemplates());
    setTitle("");
    setDescription("");
    setScenario("");
    setVariables("");
    setModels(activeModelName);
    setContent("");
    setOutputExample("");
    setCriteria("");
    toast.success("模板已保存。");
  }

  async function favoriteTemplate(template: PromptTemplate) {
    await saveFavoritePrompt(templateToFavoritePromptInput(template));
    setFavoritePrompts(await listFavoritePrompts());
    toast.success("已收藏为 Prompt，可通过 Slash 命令调用。");
  }

  return (
    <section className="grid min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)] gap-4">
      <aside className="flex min-h-0 flex-col gap-3">
        <Card>
          <CardHeader>
            <CardTitle>模板分类</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索模板 / 拼音" />
            </div>
            <ScrollArea className="h-[300px] pr-2">
              <div className="flex flex-col gap-1">
                {categories.map((item) => (
                  <Button key={item} variant={item === category ? "default" : "ghost"} className="justify-start" onClick={() => setCategory(item)}>
                    {item}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="min-h-0">
          <CardHeader>
            <CardTitle>保存自定义模板</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Field label="标题">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </Field>
            <Field label="场景说明">
              <Input value={scenario} onChange={(event) => setScenario(event.target.value)} placeholder="例如：论文摘要、Codex 修复" />
            </Field>
            <Field label="描述">
              <Input value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>
            <Field label="适用模型">
              <Input value={models} onChange={(event) => setModels(event.target.value)} placeholder="deepseek-chat, gpt-4.1" />
            </Field>
            <Field label="变量字段">
              <Input value={variables} onChange={(event) => setVariables(event.target.value)} placeholder="任务背景, 输入材料" />
            </Field>
            <Field label="完整 Prompt">
              <Textarea value={content} onChange={(event) => setContent(event.target.value)} className="min-h-28" />
            </Field>
            <Field label="输出示例">
              <Textarea value={outputExample} onChange={(event) => setOutputExample(event.target.value)} className="min-h-20" />
            </Field>
            <Field label="评价标准">
              <Input value={criteria} onChange={(event) => setCriteria(event.target.value)} placeholder="清晰, 可执行, 格式稳定" />
            </Field>
            <Button onClick={() => void saveTemplate()}>
              <Plus data-icon="inline-start" />
              保存
            </Button>
          </CardContent>
        </Card>
      </aside>

      <ScrollArea className="min-h-0">
        <div className="grid grid-cols-2 gap-3 pr-2">
          {filtered.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.scenario}</p>
                  </div>
                  <Badge variant={item.isBuiltin ? "secondary" : "default"}>{item.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                <div className="flex flex-wrap gap-1">
                  {item.variables.map((variable) => (
                    <Badge key={variable} variant="outline">
                      {variable}
                    </Badge>
                  ))}
                </div>
                <pre className="max-h-32 overflow-hidden whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-xs leading-5">{item.content}</pre>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="rounded-md bg-muted/40 p-2">
                    <div className="mb-1 font-medium text-foreground">适用模型</div>
                    {item.applicableModels.join(", ")}
                  </div>
                  <div className="rounded-md bg-muted/40 p-2">
                    <div className="mb-1 font-medium text-foreground">评价标准</div>
                    {item.evaluationCriteria.slice(0, 3).join(" / ")}
                  </div>
                </div>
                <div className="rounded-md border p-2 text-xs leading-5 text-muted-foreground">
                  <div className="mb-1 font-medium text-foreground">输出示例</div>
                  <div className="line-clamp-3 whitespace-pre-wrap">{item.outputExample}</div>
                </div>
                <div className="flex items-center justify-between">
                  <Button
                    size="sm"
                    onClick={() => {
                      setRawPrompt(item.content);
                      setActivePanel("workspace");
                    }}
                  >
                    使用
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" title="收藏为 Prompt" onClick={() => void favoriteTemplate(item)}>
                      <Star />
                    </Button>
                    <Button variant="ghost" size="icon" title="复制" onClick={() => void navigator.clipboard.writeText(item.content)}>
                      <Copy />
                    </Button>
                    {!item.isBuiltin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="删除"
                        onClick={async () => {
                          await deleteCustomTemplate(item.id);
                          setTemplates(await listCustomTemplates());
                        }}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
