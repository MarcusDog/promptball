import { CornerDownLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { rankSlashCommands } from "@/lib/favorites";
import { cn } from "@/lib/utils";
import type { FavoritePrompt } from "@/types";

export function SlashCommandMenu({
  query,
  prompts,
  onSelect,
}: {
  query: string;
  prompts: FavoritePrompt[];
  onSelect: (prompt: FavoritePrompt) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const ranked = useMemo(() => rankSlashCommands(query, prompts).slice(0, 8), [query, prompts]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (ranked.length === 0) {
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % ranked.length);
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => (index - 1 + ranked.length) % ranked.length);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        onSelect(ranked[activeIndex]);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, onSelect, ranked]);

  if (ranked.length === 0) {
    return null;
  }

  return (
    <Card className="absolute bottom-14 left-3 right-3 z-20 overflow-hidden border-primary/20 bg-background/98 p-2 shadow-panel backdrop-blur">
      <div className="mb-2 px-2 text-xs font-medium text-muted-foreground">Slash 命令</div>
      <div className="flex flex-col gap-1">
        {ranked.map((prompt, index) => (
          <button
            key={prompt.id}
            type="button"
            onClick={() => onSelect(prompt)}
            className={cn(
              "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-left transition-colors",
              index === activeIndex ? "bg-secondary" : "hover:bg-muted",
            )}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">{prompt.name}</span>
                <Badge variant="outline">{prompt.slashCommand}</Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{prompt.category}</span>
                <span>评分 {prompt.score || Math.round(prompt.averageRating * 20) || 0}</span>
                <span>使用 {prompt.usageCount}</span>
                {prompt.variables.length > 0 && <span>{prompt.variables.length} 个变量</span>}
              </div>
            </div>
            {index === activeIndex && <CornerDownLeft className="shrink-0 text-muted-foreground" />}
          </button>
        ))}
      </div>
    </Card>
  );
}
