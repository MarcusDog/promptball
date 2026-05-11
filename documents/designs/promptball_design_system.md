# PromptBall 设计系统拆解

来源图片：

- `ui/总设计稿.png`：1672 x 941
- `ui/part1.png` - `ui/part7.png`：每张 1448 x 1086

本文件用于后续开发对齐视觉语言。可直接使用的 tokens 位于 `assets/promptball/tokens/`，可直接使用的 SVG 位于 `assets/promptball/icons/`。

## 1. 视觉定位

PromptBall 是桌面端 Prompt 工作台，整体应保持“轻量、可信、效率工具”的观感。界面不是营销页，主要视觉特征是：

- 白色卡片和浅灰蓝背景，靠边框、阴影、浅蓝选中态建立层级。
- 主色为高饱和蓝 `#2563EB`，用于主按钮、活动导航、关键分数、链接、编号圆点。
- PromptBall 品牌球使用蓝紫到青蓝渐变，并通过 120px 柔和光晕强调悬浮入口。
- 图标以 1.8px-2px 线性图标为主，功能图标允许使用 `currentColor`，品牌球为渐变 SVG。

## 2. 色彩 Tokens

| Token | Hex | 用途 |
| --- | --- | --- |
| `primary` | `#2563EB` | 主按钮、活动 Tab、链接、编号圆点 |
| `primaryHover` | `#1D4ED8` | 主按钮 hover/pressed |
| `primarySoft` | `#E6F0FF` | 活动行、选中背景、侧栏 active 背景 |
| `primaryTint` | `#EFF4FF` | hover 背景、淡蓝容器 |
| `primaryGradientStart` | `#4F6BFF` | 品牌球渐变起点 |
| `primaryGradientEnd` | `#00D2FF` | 品牌球渐变终点 |
| `success` | `#16A34A` | 成功、评分上涨、B 胜出 |
| `info` | `#3B82F6` | 信息、字段 Goal/Context |
| `warning` | `#F59E0B` | 警告、保存对比按钮 |
| `danger` | `#EF4444` | 错误、约束字段 |
| `purple` | `#8B5CF6` | 图表辅助色 |
| `neutral900` | `#0F172A` | 深文本/标题 |
| `neutral800` | `#111827` | 主要文本 |
| `neutral500` | `#64748B` | 次要说明 |
| `neutral200` | `#E5E7EB` | 边框、分割线 |
| `surface` | `#FFFFFF` | 卡片/面板 |
| `background` | `#F8FAFC` | 页面底色 |

辅助色应通过语义 token 使用，不建议在组件内部散落硬编码。字段颜色与结构化 Prompt 颜色图例一致：

- Role: `#2563EB`
- Context / Goal: `#3B82F6`
- Task: `#16A34A`
- Input / Output / Style: `#22C55E` / `#4ADE80`
- Requirement: `#F59E0B`
- Constraints / Evaluation: `#EF4444`

## 3. 字体与排版

字体栈：

```css
Inter, "PingFang SC", ui-sans-serif, system-ui, sans-serif
```

| 样式 | 字号/行高/字重 | 用途 |
| --- | --- | --- |
| Display | 40 / 48 / 700 | 总稿左侧大标题 |
| H1 | 32 / 40 / 700 | 分区稿标题、模块标题 |
| H2 | 24 / 32 / 700 | 卡片组标题、看板标题 |
| Title | 18 / 26 / 700 | 面板标题、卡片标题 |
| Subtitle | 16 / 24 / 600 | 顶部导航、按钮主要文字 |
| Body | 14 / 22 / 400 | 文本区、描述内容 |
| Body Strong | 14 / 22 / 600 | 表单标签、列表标题 |
| Caption | 12 / 18 / 400 | 说明、计数、快捷键 |
| Metric | 28 / 34 / 700 | 看板指标主值 |
| Score | 20 / 28 / 700 | A/B 分数、综合评分 |

规则：

- 桌面端主体文字最小 12px；内容输入和预览建议 14px。
- 数据分数使用 tabular figures，避免数值变化造成抖动。
- 字间距保持 `0`，不要使用负字距。

## 4. 布局与间距

基础间距为 4/8px 系统：

- 控件内边距：8px、12px、16px。
- 卡片内边距：16px 或 24px。
- 大面板内边距：24px。
- 模块间距：24px-32px。
- 区域级分隔：40px-48px。

固定规格：

| 对象 | 尺寸/规格 |
| --- | --- |
| 浮球 | 64 x 64 |
| 浮球光晕 | 120 x 120，可叠加透明度 |
| Popover 卡片 | 宽 338px，圆角 12px |
| 图标按钮 | 36 x 36，图标 16px-20px |
| 主按钮 | 高 36px，圆角 8px |
| 输入框 | 高 36px，圆角 8px，边框 1px |
| 面板卡片 | 圆角 12px，边框 `#E5E7EB` |
| Badge | 圆角 999px，高 26px-28px |
| Dashboard metric card | 约 172 x 108 |

## 5. 圆角、阴影、边框

| Token | 值 | 用途 |
| --- | --- | --- |
| `radius.control` | 8px | 按钮、输入、Tab chip |
| `radius.card` | 12px | 面板、卡片、Popover |
| `radius.pill` | 999px | Pro Badge、状态徽章 |
| `shadow.card` | `0 2px 8px rgba(16,24,40,.06)` | 小卡片 |
| `shadow.panel` | `0 8px 24px rgba(16,24,40,.08)` | 大面板 |
| `shadow.popover` | `0 10px 30px rgba(16,24,40,.08)` | 快速启动器弹窗 |
| `shadow.floatingBall` | `0 18px 48px rgba(37,99,235,.32)` | 浮球 |

边框：

- 默认：`1px solid #E5E7EB`
- Focus：`1px solid #2563EB`，外层可加 2px 淡蓝 ring
- Error：`1px solid #EF4444`
- 提示/可放置区域：`1px dashed rgba(37, 99, 235, .45)`

## 6. 组件状态

### 按钮

主按钮：

- 默认：背景 `#2563EB`，文字白色，圆角 8px。
- Hover：背景 `#1D4ED8`。
- Disabled：背景 `#C7D7FA` 或 `#CBD5E1`，文字白色 70%。

次按钮：

- 默认：白底，边框 `#E5E7EB`，文本 `#111827`。
- Hover：边框/文本 `#2563EB`，背景 `#F8FAFF`。
- Disabled：文本 `#CBD5E1`，边框 `#E5E7EB`。

警告按钮：

- 默认：白底，边框 `#FFB86B`，文字 `#F59E0B`。
- Hover：背景 `#FFF7ED`。

### 输入框

- 默认：白底、1px 灰边、12px 横向 padding。
- Focus：蓝边框，不能只靠颜色，应保留清晰边框。
- Error：红边框，错误文本置于字段下方。
- Disabled：浅灰背景，文字降至 40%-50% 透明。

### Tab

- 顶部导航：活动态蓝色文字 + 底部 2px 蓝色指示线。
- 分段 Tab：容器白底边框，活动态使用 `#E6F0FF` 或白底 + 蓝线。
- 侧栏导航：活动态 `#E6F0FF` 背景，图标和文字 `#2563EB`。

### 卡片

- 默认卡片：白底、1px 边框、12px 圆角、轻阴影。
- Hover 卡片：边框浅蓝，阴影略增强。
- Selected 卡片：蓝边框，右上角可放 16px 勾选圆点。
- Disabled 卡片：整体 40%-50% 透明，禁止 hover 阴影。
- Loading 卡片：灰色 skeleton 条，使用 `#E5E7EB` 与 `#F1F5F9`。

## 7. 图标规范

可直接使用 SVG：

- `assets/promptball/icons/promptball-logo.svg`
- `assets/promptball/icons/floating-ball-default.svg`
- `assets/promptball/icons/floating-ball-hover.svg`
- `assets/promptball/icons/floating-ball-active.svg`
- `assets/promptball/icons/floating-glow.svg`
- `assets/promptball/icons/pro-badge.svg`
- `assets/promptball/icons/feature-better-prompt.svg`
- `assets/promptball/icons/feature-quality.svg`
- `assets/promptball/icons/feature-fast-apply.svg`
- `assets/promptball/icons/feature-training.svg`

通用图标使用 `lucide-react`，完整映射见 `assets/promptball/asset-manifest.json`。建议：

- 小图标 16px，常规图标 20px，特征图标 24px。
- Stroke 统一 1.8px-2px。
- 图标按钮视觉盒子 36px，实际命中面积不少于 44px。
- Icon-only 按钮必须提供 `aria-label`。

## 8. 动效建议

- Hover/pressed/focus：150ms-220ms ease-out。
- Popover 展开：scale 0.98 -> 1 + opacity 0 -> 1，220ms。
- 浮球 hover：光晕 opacity 提升、阴影增强，不改变布局尺寸。
- 加载态：超过 300ms 后显示 skeleton 或 spinner。
- 需要尊重 `prefers-reduced-motion`，减少 scale/位移动效。
