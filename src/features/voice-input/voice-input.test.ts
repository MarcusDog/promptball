import { describe, expect, it } from "vitest";
import {
  DEFAULT_VOICE_SETTINGS,
  buildStructuredPromptFromTranscript,
  cleanupOralTranscript,
  createVoiceRecord,
  normalizeVoiceSettings,
} from "./voice-input";

describe("voice input settings", () => {
  it("defaults to online transcription with privacy-preserving storage", () => {
    expect(normalizeVoiceSettings({})).toEqual(DEFAULT_VOICE_SETTINGS);
    expect(normalizeVoiceSettings({ saveAudio: true, saveTranscript: true })).toMatchObject({
      saveAudio: true,
      saveTranscript: true,
    });
  });
});

describe("voice transcript cleanup", () => {
  it("removes filler words and repeated spaces without inventing facts", () => {
    expect(cleanupOralTranscript("嗯 我想让 AI 帮我，呃，整理 一下   论文摘要。")).toBe("我想让 AI 帮我，整理 一下 论文摘要。");
  });
});

describe("voice transcript structuring", () => {
  it("extracts role, task, output, requirements, and negative hints from oral text", () => {
    const fields = buildStructuredPromptFromTranscript(
      "角色是论文导师。任务是润色摘要。输出格式要 Markdown 表格。要求保持原意。不要编造事实。",
    );

    expect(fields.role).toBe("论文导师");
    expect(fields.task).toBe("润色摘要");
    expect(fields.output).toBe("Markdown 表格");
    expect(fields.requirements).toBe("保持原意");
    expect(fields.negative).toBe("编造事实");
  });

  it("creates a voice record only with allowed persisted fields", () => {
    const privateRecord = createVoiceRecord({
      transcript: "请优化 prompt",
      cleanedText: "请优化 prompt",
      durationMs: 1200,
      settings: DEFAULT_VOICE_SETTINGS,
    });
    const savedRecord = createVoiceRecord({
      transcript: "请优化 prompt",
      cleanedText: "请优化 prompt",
      durationMs: 1200,
      audioPath: "local.webm",
      settings: { ...DEFAULT_VOICE_SETTINGS, saveAudio: true, saveTranscript: true },
    });

    expect(privateRecord).toMatchObject({ transcript: "", cleanedText: "", audioPath: "" });
    expect(savedRecord).toMatchObject({ transcript: "请优化 prompt", cleanedText: "请优化 prompt", audioPath: "local.webm" });
  });
});
