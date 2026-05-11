# PromptBall 素材清单与开发接入说明

本清单把设计稿中可复用素材拆成三类：

1. 已落地 SVG：品牌、浮球、Pro Badge、四个特性图标。
2. 已落地 tokens：颜色、字号、间距、圆角、阴影、动效。
3. Lucide 图标映射：通用线性图标不重复绘制，直接从 `lucide-react` 引入。

## 1. 目录

```text
assets/promptball/
  asset-manifest.json
  icons/
    promptball-logo.svg
    floating-ball-default.svg
    floating-ball-hover.svg
    floating-ball-active.svg
    floating-glow.svg
    pro-badge.svg
    feature-better-prompt.svg
    feature-quality.svg
    feature-fast-apply.svg
    feature-training.svg
  tokens/
    promptball.tokens.css
    promptball.tokens.json
documents/designs/
  promptball_design_system.md
  promptball_component_specs.md
  promptball_asset_inventory.md
```

## 2. 已生成 SVG 资产

| ID | 文件 | 尺寸 | 可变色 | 用途 |
| --- | --- | --- | --- | --- |
| `promptball-logo` | `assets/promptball/icons/promptball-logo.svg` | 32 x 32 | 否，品牌渐变 | App Header、品牌标题 |
| `floating-ball-default` | `assets/promptball/icons/floating-ball-default.svg` | 64 x 64 | 否，品牌渐变 | 浮球默认态 |
| `floating-ball-hover` | `assets/promptball/icons/floating-ball-hover.svg` | 64 x 64 | 否，品牌渐变 | 浮球 hover |
| `floating-ball-active` | `assets/promptball/icons/floating-ball-active.svg` | 64 x 64 | 否，品牌渐变 | 浮球 active |
| `floating-glow` | `assets/promptball/icons/floating-glow.svg` | 120 x 120 | 否，透明渐变 | 浮球背后光晕层 |
| `pro-badge` | `assets/promptball/icons/pro-badge.svg` | 64 x 32 | 否 | Pro 认证标识 |
| `feature-better-prompt` | `assets/promptball/icons/feature-better-prompt.svg` | 24 x 24 | 是，`currentColor` | 顶部特性：更好 Prompt |
| `feature-quality` | `assets/promptball/icons/feature-quality.svg` | 24 x 24 | 是，`currentColor` | 顶部特性：更高质量 |
| `feature-fast-apply` | `assets/promptball/icons/feature-fast-apply.svg` | 24 x 24 | 是，`currentColor` | 顶部特性：更快应用 |
| `feature-training` | `assets/promptball/icons/feature-training.svg` | 24 x 24 | 是，`currentColor` | 顶部特性：更科学训练 |

开发建议：

- 品牌 SVG 可作为 `<img>` 使用。
- `currentColor` 图标可通过父元素 `color` 控制主题色。
- 图标按钮保留 36px 视觉盒子，同时扩展 hit area 至至少 44px。

## 3. Lucide 图标映射

完整机器可读映射在 `assets/promptball/asset-manifest.json` 的 `lucideIconMap` 字段。常用映射如下：

| 设计稿名称 | Lucide 名称 | 用途 |
| --- | --- | --- |
| 新建命令 | `LayoutGrid` | 快速启动器第一行 |
| 设置 | `Settings` | Header、菜单、设置页 |
| 优化 | `Compass` | 快速启动器、主按钮 |
| 新建 Prompt | `SquarePlus` | 快速启动器 |
| 打开库 | `Zap` | 快速启动器 |
| 评估 | `Briefcase` | 快速启动器、工作台按钮 |
| A/B 测试 | `CircleDot` | 快速启动器 |
| 切换深色 | `Moon` | Popover 底部 |
| 工作台 | `CircleGauge` | 顶部导航 |
| 命令库 | `PanelsTopLeft` | 顶部导航 |
| 更多 | `Ellipsis` | Icon button / more menu |
| 复制 | `Copy` | Action bar |
| 收藏 | `Star` | 卡片、Action bar |
| 搜索 | `Search` | Prompt 库搜索 |
| 清除 | `X` | 搜索框、关闭 |
| 筛选 | `SlidersHorizontal` | Prompt 库筛选 |
| 排序/视图 | `ListFilter` | Prompt 库视图切换 |
| 下拉 | `ChevronDown` | Select / Button |
| 收起 | `ChevronUp` | Select open |
| 选中 | `CheckCircle` | Selected 状态 |
| 添加 | `Plus` | 结构化 Prompt |
| 重置 | `RotateCcw` | 设置、筛选 |
| 链接 | `Link` | Prompt 卡片元素 |
| 编辑 | `Pencil` / `PencilLine` | 卡片、分类 |
| 代码 | `Code2` | 分类、API Playground |
| 学术 | `BookOpen` | 分类 |
| 教学 | `GraduationCap` | 分类 |
| 数据 | `ChartNoAxesCombined` | 分类 |
| 查看 | `Eye` | 卡片 meta |
| 加载中 | `LoaderCircle` | Loading |
| 图表 | `ChartNoAxesColumnIncreasing` | 评估看板 |
| 时钟 | `Clock3` | 历史、评分记录 |
| 删除 | `Trash2` | 清空、回收站 |
| 保存 | `Save` | 保存模板/保存对比 |
| 隐私 | `Lock` | 设置导航 |
| 团队 | `Users` | 设置/看板 |
| 对比 | `GitCompareArrows` | A/B 测试 |
| 重新测试 | `RefreshCcw` | A/B 测试 |
| 胜出 | `Trophy` | A/B 测试 |
| 右箭头 | `ArrowRight` | 链接 |
| 勾选 | `CircleCheck` | 成功、选中 |

## 4. Tokens 文件

| 文件 | 用途 |
| --- | --- |
| `assets/promptball/tokens/promptball.tokens.json` | 供代码生成、设计系统同步、跨端读取 |
| `assets/promptball/tokens/promptball.tokens.css` | 供 Web/Tauri CSS 直接接入 |

示例：

```tsx
import logoUrl from "../../assets/promptball/icons/promptball-logo.svg";

export function BrandMark() {
  return <img src={logoUrl} width={32} height={32} alt="PromptBall" />;
}
```

```tsx
import { Settings } from "lucide-react";

export function SettingsIcon() {
  return <Settings size={16} strokeWidth={2} aria-hidden="true" />;
}
```

## 5. 可复用组件拆分建议

建议后续开发按以下组件拆分，不把七个模块写成单个大组件：

| 模块 | 组件建议 |
| --- | --- |
| 浮球 | `FloatingBall`, `FloatingLauncherPopover`, `LauncherMenuItem` |
| 主工作台 | `AppHeader`, `TopNavigationTabs`, `PromptEditorCard`, `OptimizationBanner`, `ActionBar`, `ScoreChip` |
| 结构化 Prompt | `StructuredPromptBuilder`, `StructuredPromptFieldRow`, `FieldColorDot`, `PromptBuilderFooter` |
| Prompt 库 | `PromptLibraryPanel`, `PromptCategoryList`, `PromptCard`, `PromptLibraryTabs`, `PromptSearchFilters` |
| 评估看板 | `EvaluationDashboard`, `MiniSidebarTabs`, `MetricCard`, `LineChartCard`, `DonutChartCard`, `RankingCard` |
| 设置 | `SettingsShell`, `SettingsNav`, `ProviderList`, `ApiKeyField`, `ModelSelect`, `SettingsFormCard` |
| A/B 测试 | `ABTestComparePanel`, `ComparePromptCard`, `ScoreTag`, `ABActionBar` |

## 6. 图表资产说明

评估看板的折线图和环形图不应截图切片。后续开发建议：

- 用 `recharts`、`visx` 或当前项目认可的图表库绘制。
- 使用 token 色：蓝 `#2563EB`、绿 `#16A34A`、浅蓝 `#3B82F6`、紫 `#8B5CF6`、橙 `#F59E0B`、灰 `#64748B`。
- Legend 需要文本，不只靠颜色表达。
- 空态和 loading 态按 `promptball_component_specs.md` 实现。

## 7. 仍需从代码侧确认的事项

这些不是设计稿问题，而是开发接入时需要确认：

- 是否允许把 SVG 作为 Vite URL import 使用；当前 Vite 默认支持。
- 是否需要把 tokens 并入 `src/index.css` 的 shadcn CSS variables。
- 图表库选型是否已有约束；当前 `package.json` 未看到图表依赖。
- 是否要保留现有 Tailwind token 名称，还是新增 `pb-*` CSS 变量作为兼容层。
