# PromptBall UI 实施提示词

用途：后续让开发代理或开发者基于现有 React + TypeScript + Vite + Tauri 工程实现/重构界面时，可直接引用本提示词。

## 背景

PromptBall 是桌面端 Prompt 训练、优化、收藏、评估与对比工具。参考设计稿在 `ui/` 目录下：

- `总设计稿.png`：整体桌面工作台组合。
- `part1.png`：浮球与快速启动器。
- `part2.png`：主工作台。
- `part3.png`：结构化 Prompt 构建器。
- `part4.png`：Prompt 库/斜杠命令。
- `part5.png`：评估看板。
- `part6.png`：设置模块。
- `part7.png`：A/B 测试对比模块。

## 必读资产

实施前读取：

- `documents/designs/promptball_design_system.md`
- `documents/designs/promptball_component_specs.md`
- `documents/designs/promptball_asset_inventory.md`
- `assets/promptball/asset-manifest.json`
- `assets/promptball/tokens/promptball.tokens.json`

## 实施原则

1. 保持桌面效率工具观感：浅灰蓝背景、白色面板、蓝色主操作、轻阴影、清晰分层。
2. 通用图标使用 `lucide-react`，不要把设计稿里的通用线性图标切成 PNG。
3. 品牌球、浮球三态、Pro Badge、顶部四个特性图标使用 `assets/promptball/icons/` 下的 SVG。
4. 卡片圆角默认 12px，按钮/输入默认 8px。不要把卡片嵌套成多层浮卡。
5. 按钮、输入、Tab、卡片都必须有 default/hover/focus/disabled 状态。
6. Icon-only 按钮必须有 `aria-label`，图标按钮视觉盒子 36px，实际命中面积至少 44px。
7. 图表不使用截图切片，要用图表库绘制，并提供 legend、空态、loading 态。
8. 不写真实 API Key，不在 UI 默认值中泄露敏感信息。

## 推荐组件边界

按模块拆分组件：

- 浮球：`FloatingBall`, `FloatingLauncherPopover`, `LauncherMenuItem`
- 主工作台：`AppHeader`, `TopNavigationTabs`, `PromptEditorCard`, `OptimizationBanner`, `ActionBar`, `ScoreChip`
- 结构化 Prompt：`StructuredPromptBuilder`, `StructuredPromptFieldRow`, `FieldColorDot`, `PromptBuilderFooter`
- Prompt 库：`PromptLibraryPanel`, `PromptCategoryList`, `PromptCard`, `PromptLibraryTabs`, `PromptSearchFilters`
- 评估看板：`EvaluationDashboard`, `MiniSidebarTabs`, `MetricCard`, `LineChartCard`, `DonutChartCard`, `RankingCard`
- 设置：`SettingsShell`, `SettingsNav`, `ProviderList`, `ApiKeyField`, `ModelSelect`, `SettingsFormCard`
- A/B 测试：`ABTestComparePanel`, `ComparePromptCard`, `ScoreTag`, `ABActionBar`

## 验收要点

- 与设计稿一致的视觉 token：`#2563EB`, `#16A34A`, `#F59E0B`, `#EF4444`, `#E5E7EB`, `#F8FAFC`, `#FFFFFF`。
- 浮球 64px，光晕 120px，popover 宽约 338px。
- 主工作台卡片与结构化 Prompt 卡片内边距 24px，输入框高 36px。
- Prompt 卡片具备 default/hover/selected/disabled/loading 状态。
- 设置页具备左侧导航三态、服务连接状态 badge、API Key 掩码输入、select 打开态、toggle 三态。
- A/B 测试在宽屏为双列 `1fr 1fr`，窄屏折叠为单列。
- 所有主要交互控件键盘可达，focus ring 可见。
