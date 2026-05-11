import { EMPTY_STRUCTURED_PROMPT_FIELDS } from "@/features/prompt-editor/prompt-editor";
import type { StructuredPromptFields, VoiceRecord, VoiceSettings } from "@/types";

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  transcriptionMode: "online",
  localTranscriptionProvider: "",
  saveAudio: false,
  saveTranscript: false,
};

const FILLER_WORDS = ["嗯", "呃", "额", "那个", "就是", "然后然后"];

export function normalizeVoiceSettings(settings: Partial<VoiceSettings> | null | undefined): VoiceSettings {
  return {
    ...DEFAULT_VOICE_SETTINGS,
    ...settings,
    transcriptionMode: settings?.transcriptionMode === "local" ? "local" : "online",
  };
}

export function cleanupOralTranscript(transcript: string): string {
  let cleaned = transcript.trim();
  for (const word of FILLER_WORDS) {
    cleaned = cleaned.replace(new RegExp(`(^|[\\s，,。！？；;])${word}([\\s，,。！？；;]|$)`, "g"), "$1");
  }
  return cleaned
    .replace(/\s+/g, " ")
    .replace(/\s+([，。！？；,.!?;])/g, "$1")
    .replace(/([，。！？；,.!?;]){2,}/g, "$1")
    .trim();
}

function extractAfter(text: string, labels: string[]): string {
  for (const label of labels) {
    const match = text.match(new RegExp(`${label}(?:是|为|要)?([^。；;\\n]+)`));
    if (match?.[1]) {
      return match[1].trim().replace(/^[：:，,\s]+/, "");
    }
  }
  return "";
}

export function buildStructuredPromptFromTranscript(transcript: string): StructuredPromptFields {
  const cleaned = cleanupOralTranscript(transcript);
  return {
    ...EMPTY_STRUCTURED_PROMPT_FIELDS,
    role: extractAfter(cleaned, ["角色"]),
    task: extractAfter(cleaned, ["任务"]),
    output: extractAfter(cleaned, ["输出格式", "输出"]),
    requirements: extractAfter(cleaned, ["要求"]),
    negative: extractAfter(cleaned, ["不要", "禁止"]),
    input: cleaned,
  };
}

export function createVoiceRecord(input: {
  transcript: string;
  cleanedText: string;
  durationMs: number;
  audioPath?: string;
  settings: VoiceSettings;
}): VoiceRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    transcript: input.settings.saveTranscript ? input.transcript : "",
    cleanedText: input.settings.saveTranscript ? input.cleanedText : "",
    audioPath: input.settings.saveAudio ? input.audioPath ?? "" : "",
    durationMs: Math.max(0, input.durationMs),
    transcriptionMode: input.settings.transcriptionMode,
    createdAt: now,
    updatedAt: now,
  };
}
