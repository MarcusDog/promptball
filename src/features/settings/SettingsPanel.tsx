import { CheckCircle2, LogOut, PlugZap, Save, ShieldAlert, Trash2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  clearModelCallLogs,
  clearPromptHistory,
  clearPromptRunData,
  clearVoiceRecords,
  getAppPreferences,
  getCurrentUser,
  getSettings,
  listCustomTemplates,
  listFavoritePrompts,
  listModelCallLogs,
  listModelProviders,
  listPromptABTests,
  listPromptEvalScores,
  listPromptFeedback,
  listPromptHistory,
  listPromptRuns,
  listPromptVersions,
  listTaskModelBindings,
  loginUser,
  logoutUser,
  registerUser,
  saveAppPreferences,
  saveModelProvider,
  saveSettings,
  saveTaskModelBinding,
  setDefaultModelProvider,
  testModelProvider,
  testProviderConnection,
} from "@/lib/tauri";
import { bindTaskModelProvider, normalizeModelProvider } from "@/services/model-config";
import { useAppStore } from "@/store/app-store";
import type {
  AppPreferences,
  ModelProvider,
  ModelProviderInput,
  ModelProviderType,
  ProviderSettings,
  TaskModelBinding,
} from "@/types";

const PROVIDER_TYPE_OPTIONS: Array<{
  type: ModelProviderType;
  label: string;
  baseUrl: string;
  modelName: string;
  providerName?: string;
  preset: string;
  overwriteDefaults?: boolean;
}> = [
  { type: "deepseek", label: "DeepSeek", preset: "deepseek", baseUrl: "https://api.deepseek.com", modelName: "deepseek-chat", overwriteDefaults: true },
  { type: "openai-compatible", label: "MiniMax", preset: "minimax", providerName: "MiniMax", baseUrl: "https://api.minimaxi.com/v1", modelName: "MiniMax-M2.7", overwriteDefaults: true },
  { type: "openai-compatible", label: "OpenAI 兼容", preset: "openai-compatible", baseUrl: "", modelName: "" },
  { type: "ollama", label: "Ollama", preset: "ollama", baseUrl: "http://localhost:11434", modelName: "llama3.1", overwriteDefaults: true },
];

const DEFAULT_PROVIDER_FORM: ModelProviderInput = {
  providerName: "DeepSeek",
  providerType: "deepseek",
  baseUrl: "https://api.deepseek.com",
  modelName: "deepseek-chat",
  temperature: 0.3,
  maxTokens: 1800,
  timeout: 30000,
  enabled: true,
  isDefault: true,
};

export function SettingsPanel() {
  const {
    settings,
    setSettings,
    appPreferences,
    setAppPreferences,
    currentUser,
    setCurrentUser,
    setHistory,
    setTemplates,
    setFavoritePrompts,
    setPromptRuns,
    setPromptFeedback,
    setPromptEvalScores,
    setPromptVersions,
    setPromptABTests,
    setModelCallLogs,
    setProviders: setStoreProviders,
  } = useAppStore();
  const [providers, setProviders] = useState<ModelProvider[]>([]);
  const [bindings, setBindings] = useState<TaskModelBinding[]>([]);
  const [providerForm, setProviderForm] = useState<ModelProviderInput>(DEFAULT_PROVIDER_FORM);
  const [selectedPreset, setSelectedPreset] = useState<string>("deepseek");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [bindingTaskType, setBindingTaskType] = useState("codex");
  const [bindingProviderId, setBindingProviderId] = useState("");
  const [confirmClearPrivacyData, setConfirmClearPrivacyData] = useState(false);

  const [form, setForm] = useState<ProviderSettings>(
    settings ?? {
      apiKey: "",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-chat",
      temperature: 0.3,
      maxTokens: 1800,
    },
  );

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  useEffect(() => {
    void refreshProviders();
  }, []);

  async function refreshProviders() {
    const nextProviders = await listModelProviders();
    const nextBindings = await listTaskModelBindings();
    setProviders(nextProviders);
    setStoreProviders(nextProviders);
    setBindings(nextBindings);
    setBindingProviderId((current) => current || nextProviders.find((provider) => provider.isDefault)?.id || nextProviders[0]?.id || "");
  }

  async function refreshUserScopedData() {
    const [
      nextPreferences,
      nextSettings,
      nextHistory,
      nextTemplates,
      nextFavoritePrompts,
      nextPromptRuns,
      nextPromptFeedback,
      nextPromptEvalScores,
      nextPromptVersions,
      nextPromptABTests,
      nextModelCallLogs,
      nextUser,
    ] = await Promise.all([
      getAppPreferences(),
      getSettings(),
      listPromptHistory(),
      listCustomTemplates(),
      listFavoritePrompts(),
      listPromptRuns(),
      listPromptFeedback(),
      listPromptEvalScores(),
      listPromptVersions(),
      listPromptABTests(),
      listModelCallLogs(),
      getCurrentUser(),
    ]);
    setAppPreferences(nextPreferences);
    setSettings(nextSettings);
    setHistory(nextHistory);
    setTemplates(nextTemplates);
    setFavoritePrompts(nextFavoritePrompts);
    setPromptRuns(nextPromptRuns);
    setPromptFeedback(nextPromptFeedback);
    setPromptEvalScores(nextPromptEvalScores);
    setPromptVersions(nextPromptVersions);
    setPromptABTests(nextPromptABTests);
    setModelCallLogs(nextModelCallLogs);
    setCurrentUser(nextUser);
    setForm(nextSettings);
    await refreshProviders();
  }

  function validateAuthForm() {
    if (!authUsername.trim()) {
      return "请填写用户名。";
    }
    if (!authPassword) {
      return "请填写密码。";
    }
    if (authMode === "register" && authPassword.length < 6) {
      return "注册密码至少需要 6 位。";
    }
    return null;
  }

  async function handleAuthSubmit() {
    const validationError = validateAuthForm();
    if (validationError) {
      toast.error(authMode === "register" ? "注册信息不完整" : "登录信息不完整", { description: validationError });
      return;
    }
    try {
      const user = authMode === "register" ? await registerUser(authUsername, authPassword) : await loginUser(authUsername, authPassword);
      setCurrentUser(user);
      await refreshUserScopedData();
      setAuthPassword("");
      toast.success(authMode === "register" ? "注册并登录成功" : "登录成功", {
        description: `当前用户：${user.username}`,
      });
    } catch (error) {
      toast.error(authMode === "register" ? "注册失败" : "登录失败", {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function handleLogout() {
    await logoutUser();
    await refreshUserScopedData();
    toast.success("已退出当前用户");
  }

  async function handleSave() {
    const saved = await saveSettings(form);
    setSettings(saved);
    toast.success("设置已保存。");
  }

  async function handleTest() {
    const saved = await saveSettings(form);
    setSettings(saved);
    const result = await testProviderConnection();
    toast(result.ok ? "连接成功" : "连接失败", { description: result.message });
  }

  async function updatePreference<K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) {
    const next = { ...appPreferences, [key]: value };
    setAppPreferences(next);
    await saveAppPreferences(next);
  }

  async function updateVoicePreference<K extends keyof AppPreferences["voice"]>(key: K, value: AppPreferences["voice"][K]) {
    const next = { ...appPreferences, voice: { ...appPreferences.voice, [key]: value } };
    setAppPreferences(next);
    await saveAppPreferences(next);
  }

  async function updatePrivacyPreference<K extends keyof AppPreferences["privacy"]>(
    key: K,
    value: AppPreferences["privacy"][K],
  ) {
    const next = { ...appPreferences, privacy: { ...appPreferences.privacy, [key]: value } };
    setAppPreferences(next);
    await saveAppPreferences(next);
  }

  function update<K extends keyof ProviderSettings>(key: K, value: ProviderSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateProvider<K extends keyof ModelProviderInput>(key: K, value: ModelProviderInput[K]) {
    setProviderForm((current) => ({ ...current, [key]: value }));
  }

  function updateProviderPreset(preset: string) {
    const option = PROVIDER_TYPE_OPTIONS.find((item) => item.preset === preset);
    if (!option) {
      return;
    }
    setSelectedPreset(preset);
    setProviderForm((current) => ({
      ...current,
      providerType: option.type,
      providerName: option.providerName || current.providerName || option.label,
      baseUrl: option.overwriteDefaults ? option.baseUrl : current.baseUrl?.trim() ? current.baseUrl : option.baseUrl,
      modelName: option.overwriteDefaults ? option.modelName : current.modelName?.trim() ? current.modelName : option.modelName,
      apiKey: option.type === "ollama" ? "" : current.apiKey,
    }));
  }

  function validateProviderForm() {
    if (!providerForm.providerName?.trim()) {
      return "请填写 Provider 名称。";
    }
    if (!providerForm.providerType) {
      return "请选择 Provider 类型。";
    }
    if (!providerForm.baseUrl?.trim()) {
      return "请填写 Base URL。";
    }
    if (!providerForm.modelName?.trim()) {
      return "请填写模型名。";
    }
    if (providerForm.providerType !== "ollama" && !providerForm.apiKey?.trim()) {
      return "请填写 API Key；本地 Ollama 才可以留空。";
    }
    if (!Number.isFinite(providerForm.maxTokens) || Number(providerForm.maxTokens) <= 0) {
      return "max_tokens 必须大于 0。";
    }
    if (!Number.isFinite(providerForm.timeout) || Number(providerForm.timeout) < 1000) {
      return "timeout 至少需要 1000ms。";
    }
    return null;
  }

  async function handleSaveProvider() {
    const validationError = validateProviderForm();
    if (validationError) {
      toast.error("Provider 配置不完整", { description: validationError });
      return;
    }
    const saved = await saveModelProvider(normalizeModelProvider(providerForm));
    await refreshProviders();
    setBindingProviderId(saved.id);
    toast.success("模型供应商已保存。");
  }

  function handleNewProvider() {
    setSelectedPreset("openai-compatible");
    setProviderForm({
      ...DEFAULT_PROVIDER_FORM,
      providerName: "",
      providerType: "openai-compatible",
      baseUrl: "",
      modelName: "",
      apiKey: "",
      isDefault: false,
    });
    toast.info("已切换为新增 Provider 表单。");
  }

  function handleEditProvider(provider: ModelProvider) {
    let preset = "openai-compatible";
    if (provider.providerType === "deepseek") preset = "deepseek";
    else if (provider.providerType === "ollama") preset = "ollama";
    else if (provider.baseUrl?.includes("minimaxi")) preset = "minimax";
    setSelectedPreset(preset);
    setProviderForm({
      id: provider.id,
      providerName: provider.providerName,
      providerType: provider.providerType,
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
      modelName: provider.modelName,
      temperature: provider.temperature,
      maxTokens: provider.maxTokens,
      stream: provider.stream,
      timeout: provider.timeout,
      isDefault: provider.isDefault,
      enabled: provider.enabled,
    });
    setBindingProviderId(provider.id);
    toast.info("Provider 已载入表单，可修改后保存。");
  }

  async function handleSetDefaultProvider(id: string) {
    await setDefaultModelProvider(id);
    await refreshProviders();
    toast.success("默认模型已更新。");
  }

  async function handleTestProvider(id: string) {
    const result = await testModelProvider(id);
    toast(result.ok ? "Provider 可用" : "Provider 不可用", { description: result.message });
  }

  async function handleSaveBinding() {
    if (!bindingTaskType.trim() || !bindingProviderId) {
      toast.error("请填写任务类型并选择 Provider。");
      return;
    }
    await saveTaskModelBinding(bindTaskModelProvider(bindingTaskType, bindingProviderId));
    await refreshProviders();
    toast.success("任务模型绑定已保存。");
  }

  async function handleClearPrivacyData() {
    if (!confirmClearPrivacyData) {
      setConfirmClearPrivacyData(true);
      toast.warning("再次点击确认清除本地隐私数据。", {
        description: "会清除历史、Prompt run、模型调用日志和语音记录。",
      });
      return;
    }
    await Promise.all([clearPromptHistory(), clearPromptRunData(), clearModelCallLogs(), clearVoiceRecords()]);
    setHistory([]);
    setPromptRuns([]);
    setPromptFeedback([]);
    setPromptEvalScores([]);
    setPromptABTests([]);
    setModelCallLogs([]);
    setConfirmClearPrivacyData(false);
    toast.success("本地历史、调用日志、语音记录和 Prompt run 数据已清除。");
  }

  return (
    <section className="grid min-h-full grid-cols-[minmax(0,1fr)_340px] gap-4">
      <div className="flex min-h-0 flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-5" />
              本地用户
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {currentUser ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
                <div>
                  <div className="font-medium">{currentUser.username}</div>
                  <div className="text-xs text-muted-foreground">已启用独立本地数据库</div>
                </div>
                <Button variant="outline" onClick={() => void handleLogout()}>
                  <LogOut data-icon="inline-start" />
                  退出
                </Button>
              </div>
            ) : (
              <form
                className="grid grid-cols-[1fr_1fr_auto_auto] gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleAuthSubmit();
                }}
              >
                <Input value={authUsername} onChange={(event) => setAuthUsername(event.target.value)} placeholder="用户名" />
                <Input type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="密码" />
                <Button type="button" variant={authMode === "login" ? "default" : "outline"} onClick={() => setAuthMode("login")}>登录</Button>
                <Button type="button" variant={authMode === "register" ? "default" : "outline"} onClick={() => setAuthMode("register")}>注册</Button>
              </form>
            )}
            {!currentUser && (
              <Button onClick={() => void handleAuthSubmit()} disabled={!authUsername.trim() || !authPassword || (authMode === "register" && authPassword.length < 6)}>{authMode === "register" ? "注册并登录" : "登录到本地账户"}</Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>快速设置（DeepSeek）</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {providers.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
                <ShieldAlert className="size-3.5 shrink-0" />
                已配置多模型 Provider，优先使用下方"多模型 Provider"中的默认模型。此处设置仅作为兜底备用。
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Base URL">
                <Input value={form.baseUrl} onChange={(event) => update("baseUrl", event.target.value)} />
              </Field>
              <Field label="模型名">
                <Input value={form.model} onChange={(event) => update("model", event.target.value)} />
              </Field>
            </div>
            <Field label="API Key">
              <Input type="password" value={form.apiKey} onChange={(event) => update("apiKey", event.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Label>temperature</Label>
                  <span className="text-sm text-muted-foreground">{form.temperature.toFixed(1)}</span>
                </div>
                <Slider min={0} max={1} step={0.1} value={[form.temperature]} onValueChange={([value]) => update("temperature", value)} />
              </div>
              <Field label="max_tokens">
                <Input type="number" value={form.maxTokens} onChange={(event) => update("maxTokens", Number(event.target.value))} />
              </Field>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={() => void handleSave()}>
                <Save data-icon="inline-start" />
                保存设置
              </Button>
              <Button variant="outline" onClick={() => void handleTest()}>
                <PlugZap data-icon="inline-start" />
                测试连接
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>多模型 Provider</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Field label="Provider 名称">
                <Input value={providerForm.providerName ?? ""} onChange={(event) => updateProvider("providerName", event.target.value)} />
              </Field>
              <div className="flex flex-col gap-2">
                <Label>类型</Label>
                <div className="grid grid-cols-4 gap-2">
                  {PROVIDER_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.preset}
                      className={`rounded-lg border px-2 py-2 text-center text-sm transition ${selectedPreset === option.preset ? "border-primary bg-primary/10 font-medium text-primary" : "hover:bg-muted/60"}`}
                      type="button"
                      onClick={() => updateProviderPreset(option.preset)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Base URL">
                  <Input value={providerForm.baseUrl ?? ""} onChange={(event) => updateProvider("baseUrl", event.target.value)} />
                </Field>
                <Field label="模型名">
                  <Input value={providerForm.modelName ?? ""} onChange={(event) => updateProvider("modelName", event.target.value)} />
                </Field>
              </div>
              <Field label="API Key">
                <Input type="password" value={providerForm.apiKey ?? ""} onChange={(event) => updateProvider("apiKey", event.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="max_tokens">
                  <Input type="number" value={providerForm.maxTokens ?? 4096} onChange={(event) => updateProvider("maxTokens", Number(event.target.value))} />
                </Field>
                <Field label="timeout(ms)">
                  <Input type="number" value={providerForm.timeout ?? 30000} onChange={(event) => updateProvider("timeout", Number(event.target.value))} />
                </Field>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <PreferenceSwitch title="启用" description="关闭后不会被任务路由选择" checked={providerForm.enabled ?? true} onChange={(value) => updateProvider("enabled", value)} />
              <PreferenceSwitch title="默认模型" description="没有任务绑定时使用" checked={providerForm.isDefault ?? false} onChange={(value) => updateProvider("isDefault", value)} />
              <PreferenceSwitch title="Streaming" description="预留流式输出配置" checked={providerForm.stream ?? false} onChange={(value) => updateProvider("stream", value)} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => void handleSaveProvider()}>
                <Save data-icon="inline-start" />
                {providerForm.id ? "更新 Provider" : "保存 Provider"}
              </Button>
              <Button variant="outline" onClick={handleNewProvider}>
                新增 Provider
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              {providers.map((provider) => (
                <div key={provider.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">
                      {provider.providerName}
                      {provider.isDefault ? " · 默认" : ""}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {provider.providerType} · {provider.modelName} · {provider.baseUrl}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditProvider(provider)}>
                      编辑
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void handleTestProvider(provider.id)}>
                      测试
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void handleSetDefaultProvider(provider.id)}>
                      设默认
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border p-3">
              <div className="mb-3 text-sm font-medium">任务类型绑定</div>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Input value={bindingTaskType} onChange={(event) => setBindingTaskType(event.target.value)} placeholder="论文 / codex / UI / 图片生成" />
                <Button onClick={() => void handleSaveBinding()}>绑定</Button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    className={`rounded-lg border p-2 text-left text-xs transition ${bindingProviderId === provider.id ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted/60"}`}
                    type="button"
                    onClick={() => setBindingProviderId(provider.id)}
                  >
                    <div className="truncate font-medium">{provider.providerName}{provider.isDefault ? " · 默认" : ""}</div>
                    <div className="mt-1 truncate text-muted-foreground">{provider.modelName}</div>
                  </button>
                ))}
                {!providers.length && <div className="col-span-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">先保存一个 Provider，再为任务类型绑定模型。</div>}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {bindings.map((binding) => {
                  const provider = providers.find((item) => item.id === binding.providerId);
                  return (
                    <span key={binding.id} className="rounded bg-muted px-2 py-1">
                      {binding.taskType} {"->"} {provider?.providerName ?? binding.providerId}
                    </span>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>桌面与隐私</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <PreferenceSwitch title="显示悬浮球" description="关闭后仍可通过托盘和快捷键打开" checked={appPreferences.showFloatingBall} onChange={(value) => void updatePreference("showFloatingBall", value)} />
          <PreferenceSwitch title="窗口置顶" description="让 PromptBall 保持在其他窗口上方" checked={appPreferences.alwaysOnTop} onChange={(value) => void updatePreference("alwaysOnTop", value)} />
          <PreferenceSwitch title="贴边吸附" description="拖动后自动吸附到屏幕边缘" checked={appPreferences.edgeSnap} onChange={(value) => void updatePreference("edgeSnap", value)} />
          <PreferenceSwitch title="开机自启动" description="当前版本先保存偏好，系统级自启动在打包阶段接入" checked={appPreferences.launchAtStartup} onChange={(value) => void updatePreference("launchAtStartup", value)} />
          <PreferenceSwitch
            title="深色模式"
            description="切换浅色 / 深色主题"
            checked={document.documentElement.classList.contains("dark")}
            onChange={(value) => {
              document.documentElement.classList.toggle("dark", value);
              void updatePreference("theme", value ? "dark" : "light");
            }}
          />
          <PreferenceSwitch title="在线语音转写" description="优先使用 WebView 可用的语音识别能力" checked={appPreferences.voice.transcriptionMode === "online"} onChange={(value) => void updateVoicePreference("transcriptionMode", value ? "online" : "local")} />
          <PreferenceSwitch title="保存录音" description="默认关闭；开启后才记录录音引用" checked={appPreferences.voice.saveAudio} onChange={(value) => void updateVoicePreference("saveAudio", value)} />
          <PreferenceSwitch title="保存转写文本" description="默认关闭；开启后才保存语音转写文本" checked={appPreferences.voice.saveTranscript} onChange={(value) => void updateVoicePreference("saveTranscript", value)} />

          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/20 dark:text-amber-100">
            <ShieldAlert className="mb-2 size-4" />
            隐私模式开启后，不保存原始输入、模型输出、Prompt run、反馈日志和模型调用日志。
          </div>
          <PreferenceSwitch title="隐私模式" description="仅在本次会话中使用输入与输出" checked={appPreferences.privacy.privacyMode} onChange={(value) => void updatePrivacyPreference("privacyMode", value)} />
          <PreferenceSwitch title="保存历史记录" description="关闭后不写入自由优化历史" checked={appPreferences.privacy.saveHistory} onChange={(value) => void updatePrivacyPreference("saveHistory", value)} />
          <PreferenceSwitch title="保存模型调用日志" description="关闭后不保留模型耗时、token 和错误日志" checked={appPreferences.privacy.saveModelCallLogs} onChange={(value) => void updatePrivacyPreference("saveModelCallLogs", value)} />
          <PreferenceSwitch title="调用前提示" description="检测到 Key、邮箱、手机号、身份证等敏感信息时提醒" checked={appPreferences.privacy.warnBeforeModelCall} onChange={(value) => void updatePrivacyPreference("warnBeforeModelCall", value)} />
          <PreferenceSwitch title="导出前脱敏" description="导出 JSON / Markdown 前替换敏感字段" checked={appPreferences.privacy.redactExports} onChange={(value) => void updatePrivacyPreference("redactExports", value)} />

          <Button variant="destructive" onClick={() => void handleClearPrivacyData()}>
            <Trash2 data-icon="inline-start" />
            {confirmClearPrivacyData ? "再次点击确认清除" : "清除本地隐私数据"}
          </Button>

          <div className="rounded-lg bg-muted/50 p-3 text-sm leading-6 text-muted-foreground">
            <CheckCircle2 className="mb-2 text-primary" />
            API Key 仅保存在本机配置中，不写入源码和 `.env.example`。本地数据加密已预留配置位，正式发布前接入系统安全存储。
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function PreferenceSwitch({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
