import { describe, expect, it } from "vitest";

import {
  DEFAULT_APP_PREFERENCES,
  FLOATING_WINDOW_SIZES,
  getStatusLabel,
  normalizeAppPreferences,
  snapWindowToEdge,
} from "./floating-ball";

describe("floating ball window behavior", () => {
  it("snaps to the nearest screen edge and clamps vertical position", () => {
    const monitor = {
      x: 0,
      y: 0,
      width: 1440,
      height: 900,
    };
    const size = { width: 320, height: 160 };

    expect(snapWindowToEdge({ x: 200, y: -20 }, size, monitor, 24)).toEqual({
      x: 24,
      y: 24,
    });
    expect(snapWindowToEdge({ x: 900, y: 850 }, size, monitor, 24)).toEqual({
      x: 1096,
      y: 716,
    });
  });

  it("normalizes partial preferences without losing known settings", () => {
    const preferences = normalizeAppPreferences({
      showFloatingBall: false,
      edgeSnap: false,
      windowPosition: { x: 100, y: 200 },
    });

    expect(preferences.showFloatingBall).toBe(false);
    expect(preferences.edgeSnap).toBe(false);
    expect(preferences.windowPosition).toEqual({ x: 100, y: 200 });
    expect(preferences.alwaysOnTop).toBe(DEFAULT_APP_PREFERENCES.alwaysOnTop);
  });

  it("keeps the collapsed window compact and reserves a focused desktop canvas when expanded", () => {
    expect(FLOATING_WINDOW_SIZES.collapsed).toEqual({ width: 66, height: 66 });
    expect(FLOATING_WINDOW_SIZES.expanded.width).toBeGreaterThanOrEqual(1200);
    expect(FLOATING_WINDOW_SIZES.expanded.height).toBeGreaterThanOrEqual(720);
  });

  it("provides concise user-facing status labels", () => {
    expect(getStatusLabel("idle")).toBe("空闲");
    expect(getStatusLabel("optimizing")).toBe("优化中");
    expect(getStatusLabel("error")).toBe("错误");
  });
});
