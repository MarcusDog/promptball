export type FloatingBallStatus = "idle" | "editing" | "optimizing" | "success" | "error";

export interface WindowPosition {
  x: number;
  y: number;
}

export interface AppPreferences {
  showFloatingBall: boolean;
  alwaysOnTop: boolean;
  edgeSnap: boolean;
  launchAtStartup: boolean;
  theme: "light" | "dark" | "system";
  windowPosition: WindowPosition | null;
  voice: VoiceSettings;
  privacy: PrivacySettings;
}

export interface VoiceSettings {
  transcriptionMode: "online" | "local";
  localTranscriptionProvider: string;
  saveAudio: boolean;
  saveTranscript: boolean;
}

export interface VoiceRecord {
  id: string;
  transcript: string;
  cleanedText: string;
  audioPath: string;
  durationMs: number;
  transcriptionMode: VoiceSettings["transcriptionMode"];
  createdAt: string;
  updatedAt: string;
}

export interface PrivacySettings {
  privacyMode: boolean;
  saveHistory: boolean;
  saveModelCallLogs: boolean;
  warnBeforeModelCall: boolean;
  redactExports: boolean;
  localEncryptionReady: boolean;
}
