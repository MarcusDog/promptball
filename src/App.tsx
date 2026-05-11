import { useEffect } from "react";
import { Toaster, toast } from "sonner";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { listen } from "@tauri-apps/api/event";
import { currentMonitor, getCurrentWindow, LogicalSize, PhysicalPosition } from "@tauri-apps/api/window";
import { FloatingShell } from "@/components/layout/FloatingShell";
import { PromptBallDesktop } from "@/features/desktop/PromptBallDesktop";
import { FavoritePromptsPanel } from "@/features/favorites/FavoritePromptsPanel";
import { PromptFeedbackPanel } from "@/features/favorites/PromptFeedbackPanel";
import { HistoryPanel } from "@/features/history/HistoryPanel";
import { SettingsPanel } from "@/features/settings/SettingsPanel";
import { TemplateLibrary } from "@/features/templates/TemplateLibrary";
import { PromptWorkspace } from "@/features/workspace/PromptWorkspace";
import {
  getAppPreferences,
  getCurrentUser,
  getSettings,
  listCustomTemplates,
  listModelCallLogs,
  listModelProviders,
  listFavoritePrompts,
  listPromptABTests,
  listPromptEvalScores,
  listPromptFeedback,
  listPromptHistory,
  listPromptRuns,
  listPromptVersions,
  optimizePrompt,
  saveAppPreferences,
} from "@/lib/tauri";
import { FLOATING_WINDOW_SIZES, normalizeAppPreferences, snapWindowToEdge } from "@/features/floating-ball/floating-ball";
import { useAppStore } from "@/store/app-store";
import type { AppPreferences } from "@/types";

export async function refreshAppData() {
  const store = useAppStore.getState();
  const preferences = await getAppPreferences();
  store.setAppPreferences(preferences);
  applyTheme(preferences.theme);
  await applyFloatingWindowLayout(store.expanded, preferences);
  store.setCurrentUser(await getCurrentUser());
  store.setSettings(await getSettings());
  store.setProviders(await listModelProviders());
  store.setHistory(await listPromptHistory());
  store.setTemplates(await listCustomTemplates());
  store.setFavoritePrompts(await listFavoritePrompts());
  store.setPromptRuns(await listPromptRuns());
  store.setPromptFeedback(await listPromptFeedback());
  store.setPromptEvalScores(await listPromptEvalScores());
  store.setPromptVersions(await listPromptVersions());
  store.setPromptABTests(await listPromptABTests());
  store.setModelCallLogs(await listModelCallLogs());
}

export default function App() {
  const {
    activePanel,
    toggleExpanded,
    setExpanded,
    setActivePanel,
    setRawPrompt,
    rawPrompt,
    result,
    loading,
    setResult,
    setLoading,
    appPreferences,
    setAppPreferences,
    setFloatingBallStatus,
    expanded,
  } = useAppStore();

  useEffect(() => {
    void refreshAppData();
  }, []);

  useEffect(() => {
    try {
      register("Alt+Space", () => toggleExpanded()).catch(() => undefined);
      register("Ctrl+Shift+P", () => {
        window.dispatchEvent(new CustomEvent("promptball:quick-optimize-clipboard"));
      }).catch(() => undefined);
      register("Ctrl+Shift+L", () => {
        setActivePanel("favorites");
        setExpanded(true);
      }).catch(() => undefined);
    } catch {
      // Browser preview mode or unsupported platform.
    }
    return () => {
      try {
        unregister("Alt+Space").catch(() => undefined);
        unregister("Ctrl+Shift+P").catch(() => undefined);
        unregister("Ctrl+Shift+L").catch(() => undefined);
      } catch {
        // Browser preview mode or unsupported platform.
      }
    };
  }, [setActivePanel, setExpanded, toggleExpanded]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let unlisten: (() => void) | undefined;

    try {
      getCurrentWindow()
        .onMoved(({ payload }) => {
        if (timeout) {
          clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
          if (!useAppStore.getState().expanded) {
            void persistWindowPosition({ x: payload.x, y: payload.y });
          }
        }, 350);
        })
        .then((cleanup) => {
          unlisten = cleanup;
        })
        .catch(() => undefined);
    } catch {
      // Browser preview mode or unsupported platform.
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      unlisten?.();
    };
  }, []);

  useEffect(() => {
    void applyFloatingWindowLayout(expanded, appPreferences);
  }, [expanded, appPreferences.alwaysOnTop, appPreferences.edgeSnap, appPreferences.showFloatingBall]);

  useEffect(() => {
    if (loading) {
      setFloatingBallStatus("optimizing");
      return;
    }
    if (result) {
      setFloatingBallStatus("success");
      return;
    }
    if (rawPrompt.trim()) {
      setFloatingBallStatus("editing");
      return;
    }
    setFloatingBallStatus("idle");
  }, [loading, rawPrompt, result, setFloatingBallStatus]);

  useEffect(() => {
    const openPanel = (event: Event) => {
      const panel = (event as CustomEvent<string>).detail;
      if (panel === "workspace" || panel === "history" || panel === "templates" || panel === "favorites" || panel === "settings") {
        setActivePanel(panel);
        setExpanded(true);
      }
    };
    const quickOptimize = () => {
      void quickOptimizeClipboard();
    };

    window.addEventListener("promptball-open-panel", openPanel);
    window.addEventListener("promptball:quick-optimize-clipboard", quickOptimize);

    let unlistenOpen: (() => void) | undefined;
    let unlistenQuick: (() => void) | undefined;
    try {
      listen<string>("promptball-open-panel", (event) => {
        window.dispatchEvent(new CustomEvent("promptball-open-panel", { detail: event.payload }));
      }).then((cleanup) => {
        unlistenOpen = cleanup;
      }).catch(() => undefined);
      listen("promptball-quick-optimize-clipboard", () => {
        window.dispatchEvent(new CustomEvent("promptball:quick-optimize-clipboard"));
      }).then((cleanup) => {
        unlistenQuick = cleanup;
      }).catch(() => undefined);
    } catch {
      // Browser preview mode or unsupported platform.
    }

    return () => {
      window.removeEventListener("promptball-open-panel", openPanel);
      window.removeEventListener("promptball:quick-optimize-clipboard", quickOptimize);
      unlistenOpen?.();
      unlistenQuick?.();
    };
  }, [setActivePanel, setExpanded]);

  async function quickOptimizeClipboard() {
    try {
      const clipboard = await navigator.clipboard.readText();
      if (!clipboard.trim()) {
        toast.error("剪贴板没有可优化的文本");
        return;
      }
      setActivePanel("workspace");
      setExpanded(true);
      setRawPrompt(clipboard);
      setLoading(true);
      const next = await optimizePrompt(clipboard);
      setResult(next);
      useAppStore.getState().setModelCallLogs(await listModelCallLogs());
      toast.success("剪贴板内容已优化");
    } catch (error) {
      toast.error("无法读取或优化剪贴板", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  async function persistWindowPosition(position: { x: number; y: number }) {
    const nextPreferences = normalizeAppPreferences({
      ...useAppStore.getState().appPreferences,
      windowPosition: position,
    });

    if (nextPreferences.edgeSnap) {
      const snapped = await snapCurrentWindow();
      nextPreferences.windowPosition = snapped ?? position;
    }

    setAppPreferences(nextPreferences);
    await saveAppPreferences(nextPreferences);
  }

  return (
    <>
      <FloatingShell>
        <PromptBallDesktop />
      </FloatingShell>
      <PromptFeedbackPanel />
      <Toaster richColors position="top-right" />
    </>
  );
}

async function applyFloatingWindowLayout(expanded: boolean, preferences: AppPreferences) {
  try {
    const win = getCurrentWindow();
    await win.setAlwaysOnTop(preferences.alwaysOnTop);

    const logicalSize = expanded ? FLOATING_WINDOW_SIZES.expanded : FLOATING_WINDOW_SIZES.collapsed;
    if (expanded) {
      await win.setResizable(true).catch(() => undefined);
      await win.setMaxSize(undefined).catch(() => undefined);
      await win.setMinSize(new LogicalSize(640, 480)).catch(() => undefined);
    } else {
      await win.setResizable(false).catch(() => undefined);
      await win.setMaxSize(undefined).catch(() => undefined);
      await win.setMinSize(new LogicalSize(logicalSize.width, logicalSize.height)).catch(() => undefined);
    }

    await win.setSize(new LogicalSize(logicalSize.width, logicalSize.height));

    if (!expanded) {
      await win.setMinSize(new LogicalSize(logicalSize.width, logicalSize.height)).catch(() => undefined);
    }

    if (!preferences.showFloatingBall && !expanded) {
      await win.hide();
      return;
    }

    await win.show();
    const scaleFactor = await win.scaleFactor();
    const physicalSize = {
      width: Math.round(logicalSize.width * scaleFactor),
      height: Math.round(logicalSize.height * scaleFactor),
    };
    const position = await resolveFloatingWindowPosition(expanded, preferences, physicalSize);
    await win.setPosition(new PhysicalPosition(position.x, position.y));
  } catch {
    // Browser preview mode or unsupported platform.
  }
}

async function resolveFloatingWindowPosition(
  expanded: boolean,
  preferences: AppPreferences,
  size: { width: number; height: number },
) {
  const win = getCurrentWindow();
  const monitor = await currentMonitor();
  if (!monitor) {
    return preferences.windowPosition ?? { x: 0, y: 0 };
  }

  const workArea = monitor.workArea ?? { position: monitor.position, size: monitor.size };
  const screen = {
    x: workArea.position.x,
    y: workArea.position.y,
    width: workArea.size.width,
    height: workArea.size.height,
  };

  if (expanded) {
    return {
      x: screen.x + Math.max(16, Math.round((screen.width - size.width) / 2)),
      y: screen.y + Math.max(16, Math.round((screen.height - size.height) / 2)),
    };
  }

  const currentPosition = await win.outerPosition().catch(() => preferences.windowPosition ?? null);
  const preferred = preferences.windowPosition ?? currentPosition ?? {
    x: screen.x + screen.width - size.width - 24,
    y: screen.y + Math.round((screen.height - size.height) / 2),
  };

  if (preferences.edgeSnap) {
    return snapWindowToEdge(preferred, size, screen, 24);
  }

  return {
    x: Math.min(Math.max(preferred.x, screen.x + 8), screen.x + screen.width - size.width - 8),
    y: Math.min(Math.max(preferred.y, screen.y + 8), screen.y + screen.height - size.height - 8),
  };
}

async function snapCurrentWindow() {
  try {
    const win = getCurrentWindow();
    const monitor = await currentMonitor();
    if (!monitor) {
      return null;
    }
    const size = await win.outerSize();
    const position = await win.outerPosition();
    const workArea = monitor.workArea ?? { position: monitor.position, size: monitor.size };
    const snapped = snapWindowToEdge(
      { x: position.x, y: position.y },
      { width: size.width, height: size.height },
      {
        x: workArea.position.x,
        y: workArea.position.y,
        width: workArea.size.width,
        height: workArea.size.height,
      },
    );
    await win.setPosition(new PhysicalPosition(snapped.x, snapped.y));
    return snapped;
  } catch {
    return null;
  }
}

function applyTheme(theme: AppPreferences["theme"]) {
  if (theme === "system") {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    document.documentElement.classList.toggle("dark", prefersDark);
    return;
  }
  document.documentElement.classList.toggle("dark", theme === "dark");
}
