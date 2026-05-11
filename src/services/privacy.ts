import type { PrivacySettings } from "@/types";
import { redactSensitiveInfo } from "@/utils/sensitive-info";

export type PrivacyClearTarget = "history" | "modelCallLogs" | "voiceRecords" | "promptRuns";

export interface PrivacyClearOptions {
  history?: boolean;
  modelCallLogs?: boolean;
  voiceRecords?: boolean;
  promptRuns?: boolean;
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  privacyMode: false,
  saveHistory: true,
  saveModelCallLogs: true,
  warnBeforeModelCall: true,
  redactExports: true,
  localEncryptionReady: false,
};

export function normalizePrivacySettings(
  settings: Partial<PrivacySettings> | null | undefined,
): PrivacySettings {
  return {
    ...DEFAULT_PRIVACY_SETTINGS,
    ...(settings ?? {}),
  };
}

export function shouldPersistPromptData(settings: PrivacySettings): boolean {
  return !settings.privacyMode && settings.saveHistory;
}

export function shouldPersistModelCallLog(settings: PrivacySettings): boolean {
  return !settings.privacyMode && settings.saveModelCallLogs;
}

export function sanitizeTextForPrivacy(text: string, settings: PrivacySettings): string {
  return settings.redactExports ? redactSensitiveInfo(text) : text;
}

export function buildPrivacyClearPlan(options: PrivacyClearOptions): PrivacyClearTarget[] {
  return (["history", "modelCallLogs", "voiceRecords", "promptRuns"] as const).filter((target) => Boolean(options[target]));
}
