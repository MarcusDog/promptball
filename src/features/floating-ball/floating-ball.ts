import type { AppPreferences, FloatingBallStatus, WindowPosition } from "@/types";
import { DEFAULT_VOICE_SETTINGS, normalizeVoiceSettings } from "@/features/voice-input/voice-input";
import { DEFAULT_PRIVACY_SETTINGS, normalizePrivacySettings } from "@/services/privacy";

export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export const FLOATING_WINDOW_SIZES = {
  collapsed: {
    width: 66,
    height: 66,
  },
  expanded: {
    width: 860,
    height: 640,
  },
} as const;

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  showFloatingBall: true,
  alwaysOnTop: true,
  edgeSnap: true,
  launchAtStartup: false,
  theme: "system",
  windowPosition: null,
  voice: DEFAULT_VOICE_SETTINGS,
  privacy: DEFAULT_PRIVACY_SETTINGS,
};

const STATUS_LABELS: Record<FloatingBallStatus, string> = {
  idle: "空闲",
  editing: "输入中",
  optimizing: "优化中",
  success: "成功",
  error: "错误",
};

export function normalizeAppPreferences(
  preferences: Partial<AppPreferences> | null | undefined,
): AppPreferences {
  if (!preferences) {
    return DEFAULT_APP_PREFERENCES;
  }

  return {
    ...DEFAULT_APP_PREFERENCES,
    ...preferences,
    windowPosition: normalizeWindowPosition(preferences.windowPosition),
    voice: normalizeVoiceSettings(preferences.voice),
    privacy: normalizePrivacySettings(preferences.privacy),
  };
}

export function snapWindowToEdge(
  position: WindowPosition,
  size: WindowSize,
  monitor: ScreenRect,
  margin = 24,
): WindowPosition {
  const left = monitor.x + margin;
  const right = monitor.x + monitor.width - size.width - margin;
  const distanceToLeft = Math.abs(position.x - left);
  const distanceToRight = Math.abs(position.x - right);
  const x = distanceToLeft <= distanceToRight ? left : right;
  const y = clamp(position.y, monitor.y + margin, monitor.y + monitor.height - size.height - margin);

  return { x, y };
}

export function getStatusLabel(status: FloatingBallStatus): string {
  return STATUS_LABELS[status];
}

function normalizeWindowPosition(
  position: AppPreferences["windowPosition"] | undefined,
): WindowPosition | null {
  if (!position) {
    return null;
  }
  if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
    return null;
  }
  return { x: position.x, y: position.y };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
