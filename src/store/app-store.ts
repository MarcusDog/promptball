import { create } from "zustand";
import {
  EMPTY_STRUCTURED_PROMPT_FIELDS,
  normalizeStructuredFields,
  type PromptDraft,
} from "@/features/prompt-editor/prompt-editor";
import type {
  FavoritePrompt,
  ModelProvider,
  OptimizerResult,
  PromptABTestRecord,
  PromptEvalScore,
  PromptFeedback,
  PromptHistoryItem,
  PromptMode,
  PromptRun,
  PromptTemplate,
  PromptVersion,
  ProviderSettings,
  StructuredPromptFields,
  AppPreferences,
  FloatingBallStatus,
  ModelCallLog,
  LocalUser,
} from "@/types";
import { DEFAULT_APP_PREFERENCES } from "@/features/floating-ball/floating-ball";

interface AppState {
  expanded: boolean;
  mode: PromptMode;
  rawPrompt: string;
  structuredFields: StructuredPromptFields;
  result: OptimizerResult | null;
  activeFavoritePrompt: FavoritePrompt | null;
  pendingRun: PromptRun | null;
  history: PromptHistoryItem[];
  templates: PromptTemplate[];
  favoritePrompts: FavoritePrompt[];
  promptRuns: PromptRun[];
  promptFeedback: PromptFeedback[];
  promptEvalScores: PromptEvalScore[];
  promptVersions: PromptVersion[];
  promptABTests: PromptABTestRecord[];
  modelCallLogs: ModelCallLog[];
  currentUser: LocalUser | null;
  settings: ProviderSettings | null;
  providers: ModelProvider[];
  appPreferences: AppPreferences;
  floatingBallStatus: FloatingBallStatus;
  loading: boolean;
  activePanel: "workspace" | "history" | "templates" | "favorites" | "settings";
  setExpanded: (expanded: boolean) => void;
  toggleExpanded: () => void;
  setMode: (mode: PromptMode) => void;
  setRawPrompt: (value: string) => void;
  setStructuredField: (key: keyof StructuredPromptFields, value: string) => void;
  setStructuredFields: (fields: StructuredPromptFields) => void;
  restoreDraft: (draft: PromptDraft) => void;
  setResult: (result: OptimizerResult | null) => void;
  setActiveFavoritePrompt: (prompt: FavoritePrompt | null) => void;
  setPendingRun: (run: PromptRun | null) => void;
  setHistory: (history: PromptHistoryItem[]) => void;
  setTemplates: (templates: PromptTemplate[]) => void;
  setFavoritePrompts: (prompts: FavoritePrompt[]) => void;
  setPromptRuns: (runs: PromptRun[]) => void;
  setPromptFeedback: (feedback: PromptFeedback[]) => void;
  setPromptEvalScores: (scores: PromptEvalScore[]) => void;
  setPromptVersions: (versions: PromptVersion[]) => void;
  setPromptABTests: (records: PromptABTestRecord[]) => void;
  setModelCallLogs: (logs: ModelCallLog[]) => void;
  setCurrentUser: (user: LocalUser | null) => void;
  setSettings: (settings: ProviderSettings) => void;
  setProviders: (providers: ModelProvider[]) => void;
  setAppPreferences: (preferences: AppPreferences) => void;
  setFloatingBallStatus: (status: FloatingBallStatus) => void;
  setLoading: (loading: boolean) => void;
  setActivePanel: (panel: AppState["activePanel"]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  expanded: false,
  mode: "free",
  rawPrompt: "",
  structuredFields: EMPTY_STRUCTURED_PROMPT_FIELDS,
  result: null,
  activeFavoritePrompt: null,
  pendingRun: null,
  history: [],
  templates: [],
  favoritePrompts: [],
  promptRuns: [],
  promptFeedback: [],
  promptEvalScores: [],
  promptVersions: [],
  promptABTests: [],
  modelCallLogs: [],
  currentUser: null,
  settings: null,
  providers: [],
  appPreferences: DEFAULT_APP_PREFERENCES,
  floatingBallStatus: "idle",
  loading: false,
  activePanel: "workspace",
  setExpanded: (expanded) => set({ expanded }),
  toggleExpanded: () => set((state) => ({ expanded: !state.expanded })),
  setMode: (mode) => set({ mode }),
  setRawPrompt: (rawPrompt) => set({ rawPrompt }),
  setStructuredField: (key, value) =>
    set((state) => ({
      structuredFields: {
        ...state.structuredFields,
        [key]: value,
      },
    })),
  setStructuredFields: (structuredFields) => set({ structuredFields: normalizeStructuredFields(structuredFields) }),
  restoreDraft: (draft) =>
    set({
      mode: draft.mode,
      rawPrompt: draft.rawPrompt,
      structuredFields: normalizeStructuredFields(draft.structuredFields),
    }),
  setResult: (result) => set({ result }),
  setActiveFavoritePrompt: (activeFavoritePrompt) => set({ activeFavoritePrompt }),
  setPendingRun: (pendingRun) => set({ pendingRun }),
  setHistory: (history) => set({ history }),
  setTemplates: (templates) => set({ templates }),
  setFavoritePrompts: (favoritePrompts) => set({ favoritePrompts }),
  setPromptRuns: (promptRuns) => set({ promptRuns }),
  setPromptFeedback: (promptFeedback) => set({ promptFeedback }),
  setPromptEvalScores: (promptEvalScores) => set({ promptEvalScores }),
  setPromptVersions: (promptVersions) => set({ promptVersions }),
  setPromptABTests: (promptABTests) => set({ promptABTests }),
  setModelCallLogs: (modelCallLogs) => set({ modelCallLogs }),
  setCurrentUser: (currentUser) => set({ currentUser }),
  setSettings: (settings) => set({ settings }),
  setProviders: (providers) => set({ providers }),
  setAppPreferences: (appPreferences) => set({ appPreferences }),
  setFloatingBallStatus: (floatingBallStatus) => set({ floatingBallStatus }),
  setLoading: (loading) => set({ loading }),
  setActivePanel: (activePanel) => set({ activePanel }),
}));
