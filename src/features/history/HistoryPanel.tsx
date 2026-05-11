import { Copy, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { deletePromptHistory, listPromptHistory, toggleFavoritePrompt } from "@/lib/tauri";
import { useAppStore } from "@/store/app-store";

export function HistoryPanel() {
  const { history, setHistory, setRawPrompt, setResult, setActivePanel } = useAppStore();

  async function refresh(query = "") {
    setHistory(await listPromptHistory(query));
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success("已复制");
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Input placeholder="搜索历史 prompt、标签或结果" onChange={(event) => void refresh(event.target.value)} />
        <Button variant="outline" onClick={() => void refresh()}>
          刷新
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="grid grid-cols-2 gap-3 pr-2">
          {history.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="truncate text-sm">{item.originalPrompt.slice(0, 44) || "无标题"}</CardTitle>
                  <Badge variant={item.favorite ? "default" : "secondary"}>{item.score.total}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{item.optimizedPrompt}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{item.model}</Badge>
                  <Badge variant="outline">{new Date(item.createdAt).toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setRawPrompt(item.originalPrompt);
                      setResult({
                        taskRecognition: "历史记录",
                        optimizedPrompt: item.optimizedPrompt,
                        diagnosis: item.diagnosis,
                        missingInformation: [],
                        suggestions: item.suggestions,
                        trainingTips: item.trainingTips,
                        score: item.score,
                        parseStatus: "parsed",
                      });
                      setActivePanel("workspace");
                    }}
                  >
                    打开
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => void copy(item.optimizedPrompt)} aria-label="复制">
                      <Copy />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        await toggleFavoritePrompt(item.id);
                        await refresh();
                      }}
                      aria-label="收藏"
                    >
                      <Star className={item.favorite ? "fill-current" : ""} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        await deletePromptHistory(item.id);
                        await refresh();
                      }}
                      aria-label="删除"
                    >
                      <Trash2 />
                    </Button>
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
