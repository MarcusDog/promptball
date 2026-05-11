import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyPromptVariables } from "@/lib/favorites";
import type { FavoritePrompt } from "@/types";

export function VariableFillPanel({
  prompt,
  onCancel,
  onInsert,
}: {
  prompt: FavoritePrompt;
  onCancel: () => void;
  onInsert: (content: string) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/70 p-6 backdrop-blur-sm">
      <Card className="w-[520px] shadow-panel">
        <CardHeader>
          <CardTitle>填写变量 - {prompt.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {prompt.variables.map((variable) => (
            <div key={variable} className="flex flex-col gap-2">
              <Label htmlFor={`var-${variable}`}>{variable}</Label>
              <Input
                id={`var-${variable}`}
                value={values[variable] ?? ""}
                onChange={(event) => setValues((current) => ({ ...current, [variable]: event.target.value }))}
                placeholder={`填写 ${variable}`}
              />
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button onClick={() => onInsert(applyPromptVariables(prompt.content, values))}>插入模板</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
