import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRIVACY_SETTINGS,
  buildPrivacyClearPlan,
  normalizePrivacySettings,
  sanitizeTextForPrivacy,
  shouldPersistModelCallLog,
  shouldPersistPromptData,
} from "./privacy";

describe("privacy service", () => {
  it("normalizes privacy settings with conservative defaults", () => {
    expect(normalizePrivacySettings({})).toEqual(DEFAULT_PRIVACY_SETTINGS);
    expect(
      normalizePrivacySettings({
        privacyMode: true,
        saveHistory: false,
        warnBeforeModelCall: false,
      }),
    ).toMatchObject({
      privacyMode: true,
      saveHistory: false,
      saveModelCallLogs: true,
      warnBeforeModelCall: false,
      redactExports: true,
    });
  });

  it("disables prompt and model log persistence while privacy mode is enabled", () => {
    expect(shouldPersistPromptData(DEFAULT_PRIVACY_SETTINGS)).toBe(true);
    expect(shouldPersistModelCallLog(DEFAULT_PRIVACY_SETTINGS)).toBe(true);

    const privacyMode = normalizePrivacySettings({ privacyMode: true });

    expect(shouldPersistPromptData(privacyMode)).toBe(false);
    expect(shouldPersistModelCallLog(privacyMode)).toBe(false);
  });

  it("redacts sensitive fields when export redaction is enabled", () => {
    const text = "Contact user@example.com with sk-test-secret-1234567890";

    expect(sanitizeTextForPrivacy(text, normalizePrivacySettings({ redactExports: true }))).toContain("[REDACTED:email]");
    expect(sanitizeTextForPrivacy(text, normalizePrivacySettings({ redactExports: false }))).toBe(text);
  });

  it("creates an explicit local data clearing plan", () => {
    expect(
      buildPrivacyClearPlan({
        history: true,
        modelCallLogs: true,
        voiceRecords: false,
        promptRuns: true,
      }),
    ).toEqual(["history", "modelCallLogs", "promptRuns"]);
  });
});
