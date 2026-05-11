import { Mic, Square, WandSparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  buildStructuredPromptFromTranscript,
  cleanupOralTranscript,
  createVoiceRecord,
  normalizeVoiceSettings,
} from "./voice-input";
import { saveVoiceRecord } from "@/lib/tauri";
import type { AppPreferences, StructuredPromptFields } from "@/types";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

function createSpeechRecognition(): SpeechRecognitionLike | null {
  const globalWindow = window as typeof window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Constructor = globalWindow.SpeechRecognition ?? globalWindow.webkitSpeechRecognition;
  return Constructor ? new Constructor() : null;
}

export function VoiceInputPanel({
  appPreferences,
  transcript,
  onTranscriptChange,
  onStructuredFields,
}: {
  appPreferences: AppPreferences;
  transcript: string;
  onTranscriptChange: (value: string) => void;
  onStructuredFields: (fields: StructuredPromptFields) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [cleanedText, setCleanedText] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceSettings = normalizeVoiceSettings(appPreferences.voice);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  async function startRecording() {
    try {
      chunksRef.current = [];
      setStartedAt(Date.now());
      setRecording(true);

      const stream = await navigator.mediaDevices?.getUserMedia?.({ audio: true });
      if (stream) {
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };
        recorder.start();
      }

      const recognition = createSpeechRecognition();
      if (recognition) {
        recognition.lang = "zh-CN";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event) => {
          const text = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join("");
          onTranscriptChange(text);
        };
        recognition.onerror = (event) => {
          toast.error(`语音识别失败：${event.error ?? "未知错误"}`);
        };
        recognitionRef.current = recognition;
        recognition.start();
      } else {
        toast("当前 WebView 不支持内置语音识别，可停止录音后手动粘贴转写文本。");
      }
    } catch (error) {
      setRecording(false);
      toast.error(error instanceof Error ? error.message : "无法访问麦克风");
    }
  }

  async function stopRecording() {
    setRecording(false);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    const recorder = mediaRecorderRef.current;
    if (recorder?.state === "recording") {
      recorder.stop();
      recorder.stream.getTracks().forEach((track) => track.stop());
    }
    mediaRecorderRef.current = null;
    const cleaned = cleanupOralTranscript(transcript);
    setCleanedText(cleaned);
    const record = createVoiceRecord({
      transcript,
      cleanedText: cleaned,
      durationMs: startedAt ? Date.now() - startedAt : 0,
      audioPath: voiceSettings.saveAudio && chunksRef.current.length > 0 ? "in-memory-recording.webm" : "",
      settings: voiceSettings,
    });
    if (!appPreferences.privacy.privacyMode && (voiceSettings.saveAudio || voiceSettings.saveTranscript)) {
      await saveVoiceRecord(record);
    } else if (appPreferences.privacy.privacyMode) {
      toast("隐私模式已开启，本次语音记录不会保存。");
    }
  }

  function cleanTranscript() {
    const cleaned = cleanupOralTranscript(transcript);
    setCleanedText(cleaned);
    onTranscriptChange(cleaned);
  }

  function structureTranscript() {
    const source = cleanedText || cleanupOralTranscript(transcript);
    if (!source.trim()) {
      toast.error("请先录音、转写或粘贴文本");
      return;
    }
    onStructuredFields(buildStructuredPromptFromTranscript(source));
    toast.success("已整理为结构化 Prompt 字段");
  }

  return (
    <Card className="flex min-h-[430px] flex-1 border-dashed bg-background/70">
      <CardContent className="flex w-full flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">语音输入</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              默认不保存录音和转写文本。可先使用系统语音识别，失败时手动粘贴转写文本。
            </p>
          </div>
          <div className="flex gap-2">
            {!recording ? (
              <Button onClick={() => void startRecording()}>
                <Mic data-icon="inline-start" />
                开始录音
              </Button>
            ) : (
              <Button variant="destructive" onClick={() => void stopRecording()}>
                <Square data-icon="inline-start" />
                停止
              </Button>
            )}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
          <div className="flex min-h-0 flex-col gap-2">
            <Label>转写文本</Label>
            <Textarea
              value={transcript}
              onChange={(event) => onTranscriptChange(event.target.value)}
              placeholder="也可以在这里粘贴语音转写文本。"
              className="min-h-64 flex-1"
            />
          </div>
          <div className="flex min-h-0 flex-col gap-2">
            <Label>口语化清理结果</Label>
            <Textarea
              value={cleanedText}
              onChange={(event) => setCleanedText(event.target.value)}
              placeholder="清理后的需求会显示在这里。"
              className="min-h-64 flex-1"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            在线转写：{voiceSettings.transcriptionMode === "online" ? "启用" : "关闭"}；保存录音：{voiceSettings.saveAudio ? "是" : "否"}；保存转写：{voiceSettings.saveTranscript ? "是" : "否"}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={cleanTranscript}>
              清理口语化文本
            </Button>
            <Button onClick={structureTranscript}>
              <WandSparkles data-icon="inline-start" />
              结构化为 Prompt
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
