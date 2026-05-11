# Part 2：主工作台模块详细拆解

源图：`ui/part2.png`  
尺寸：`1448 x 1086`

本文件只覆盖 Part 2。机器可读坐标和资产清单见：

- `assets/promptball/part2/part2.manifest.json`
- `assets/promptball/part2/icons/`

## 1. 页面结构

| 编号 | 区域 | 坐标估算 | 交付状态 |
| --- | --- | --- | --- |
| 1 | 应用头部 App Header | x 24, y 184, w 510, h 66 | 已记录窗口点、Logo、导航图标 |
| 2 | 顶部导航标签 | x 38, y 335, w 416, h 103 | 已拆 active / inactive |
| 3 | 区域标签 Section Tabs | x 24, y 501, w 345, h 98 | 已拆 outline / success / muted |
| 4 | Prompt Editor Card | x 24, y 643, w 510, h 396 | 已拆 header、textarea、banner、action bar |
| 5 | Textarea | x 562, y 12, w 455, h 565 | 已拆 empty / filled |
| 6 | Optimization Banner | x 548, y 584, w 470, h 105 | 已补 SVG 图标 |
| 7 | Action Bar | x 548, y 703, w 470, h 93 | 已补 5 个操作图标 |
| 8 | Score Chip | x 562, y 853, w 442, h 35 | 已拆成功/警告/错误/空态 |
| 9 | Card Container | x 562, y 982, w 442, h 73 | 已拆默认卡片/虚线卡片 |
| 10 | UI Components | x 1031, y 12, w 406, h 1034 | 已拆按钮、徽章、分割线状态 |

## 2. 应用头部（App Header）

坐标：x 24, y 184, w 510, h 66

容器：

- 背景：`#FFFFFF`
- 圆角：12px
- 边框：`1px solid #E5E7EB`
- 内边距：水平约 14px，垂直约 16px

窗口控制点：

| 点 | 坐标 | 尺寸 | 颜色 |
| --- | --- | --- | --- |
| 关闭 | x 39, y 207 | 12 x 12 | `#FF4D4F` |
| 最小化 | x 61, y 207 | 12 x 12 | `#F59E0B` |
| 最大化 | x 82, y 207 | 12 x 12 | `#22C55E` |

品牌区：

- Logo：x 128, y 204, w 20, h 20，使用 `assets/promptball/icons/promptball-logo.svg`
- 文本：`PromptBall`，14px/20px/700，颜色 `#111827`

导航：

| 项 | 坐标 | 图标 | 状态 |
| --- | --- | --- | --- |
| 工作台 | x 276, y 205, w 70, h 34 | `nav-workspace.svg` | Active |
| 命令库 | x 371, y 205, w 75, h 34 | `nav-command-library.svg` | Inactive |
| 设置 | x 466, y 205, w 54, h 34 | `launcher-settings.svg` | Inactive |

Active 规则：文字/图标 `#2563EB`，底部 2px 蓝色指示线。

## 3. 顶部导航标签

坐标：x 38, y 335, w 416, h 103

默认状态行：

- y 335-371，底部分割线 `#E5E7EB`
- active item 使用蓝色图标和文字，底部指示线约 129px 宽。
- item 间距约 94px。

非激活状态行：

- y 413-438
- 所有文字/图标使用 `#64748B`
- 无蓝色指示线。

图标：

- 工作台：`assets/promptball/part2/icons/nav-workspace.svg`
- 命令库：`assets/promptball/part2/icons/nav-command-library.svg`
- 设置：`assets/promptball/part1/icons/launcher-settings.svg`

## 4. 区域标签（Section Tabs）

坐标：x 24, y 501, w 345, h 98

两组示例：

1. 完整状态：`Prompt 编辑区` + `已优化` + `已自动增强原始内容`
2. 精简状态：`Prompt 编辑区` + `已优化`

规格：

- 容器高：42px
- 圆角：8px
- 外边框：`#E5E7EB`
- 单个 chip 高：30px
- 字号：13px/18px

状态：

- Outline chip：白底、灰边、黑字。
- Success chip：浅绿底 `#DCFCE7`，绿字 `#16A34A`。
- Muted text：灰蓝字 `#64748B`，无明显边框。

## 5. Prompt Editor Card

坐标：x 24, y 643, w 510, h 396

结构：

- Header：x 38, y 657, w 482, h 38
- Textarea：x 38, y 694, w 482, h 164
- 优化后背景预览区：x 38, y 906, w 482, h 48
- 底部 Action Bar：x 38, y 979, w 482, h 36

卡片规格：

- 背景：`#FFFFFF`
- 边框：`#E5E7EB`
- 圆角：12px
- 阴影：`0 2px 8px rgba(16,24,40,0.06)`
- 内边距：14px

Header 内容：

- 左侧 Section Tabs：`Prompt 编辑区`、`已优化`、`已自动增强原始内容`
- 右侧统计：`字数 0 / 8000`、`版本 v3`
- 字数与版本：12px/18px，颜色 `#334155`

Textarea：

- Placeholder：`在此输入你的 Prompt....`
- 字号：14px/22px
- 内边距：14px
- 圆角：8px
- 边框：`#E5E7EB`

## 6. Textarea 独立状态

区域坐标：x 562, y 12, w 455, h 565

### Empty State

- 输入框坐标：x 562, y 88, w 442, h 112
- Placeholder：`在此输入你的 Prompt....`
- Placeholder 颜色：`#94A3B8`
- 背景白色，灰边，圆角 8px。

### Filled State

- 输入框坐标：x 562, y 250, w 442, h 326
- 内容内边距：16px
- 正文：14px/24px，颜色 `#111827`
- 底部统计：右对齐，`字数 328 / 8000` + `版本 v3`

示例内容：

```text
你是一位教育内容设计专家，擅长将复杂知识转化为结构清晰、易于理解的学习内容。

请根据以下主题生成一份适合中学生的学习讲义：

主题：人工智能的基本原理与应用
目标受众：初中生
输出要求：包含定义、核心概念、实际应用场景、生活中的例子，以及简要总结。

请使用清晰的段落结构和小标题，必要时使用列表或表格呈现关键信息，语言简洁 friendly。
```

## 7. 优化状态横幅（Optimization Banner）

组件区域：x 548, y 584, w 470, h 105  
横幅本体：x 562, y 628, w 442, h 40

资产：`assets/promptball/part2/icons/optimization-banner.svg`

规格：

- 背景：白色或 `#FFFFFF`
- 边框：`1px dashed rgba(37, 99, 235, 0.45)`
- 圆角：8px
- 左侧图标：16px，颜色 `#16A34A`
- 正文：13px/18px，颜色 `#334155`
- 右侧链接：`查看优化日志`，颜色 `#2563EB`

## 8. 底部操作栏（Action Bar）

区域坐标：x 548, y 703, w 470, h 93  
按钮行：x 562, y 747, h 32

| 按钮 | 坐标 | 变体 | 图标 |
| --- | --- | --- | --- |
| 优化 | x 562, y 747, w 61, h 32 | Primary | `action-optimize.svg` |
| 评分 | x 632, y 747, w 63, h 32 | Secondary | `action-score.svg` |
| 收藏 | x 706, y 747, w 63, h 32 | Secondary | `action-favorite.svg` |
| 复制 | x 779, y 747, w 63, h 32 | Secondary | `action-copy.svg` |
| 更多 | x 851, y 747, w 52, h 32 | Secondary dropdown | `action-more-chevron.svg` |
| 综合评分 | x 913, y 747, w 93, h 32 | Score chip | 无 |

主按钮：

- 背景：`#2563EB`
- Hover：`#1D4ED8`
- Disabled：`#CBD5E1`
- 圆角：8px

次按钮：

- 白底，灰边，黑字。
- Hover：蓝边、蓝字、浅蓝背景。
- Disabled：灰字、灰边、透明度下降。

## 9. Score Chip

坐标：x 562, y 853, w 442, h 35

示例：

| 状态 | 文案 | 数值颜色 |
| --- | --- | --- |
| Success | `综合评分 86/100` | `#16A34A` |
| Warning | `综合评分 62/100` | `#F59E0B` |
| Danger | `综合评分 28/100` | `#EF4444` |
| Empty | `综合评分 --/100` | `#16A34A` 或 muted |

规格：

- 高度：34px
- 圆角：8px
- 背景：白色
- 边框：`#E5E7EB`
- 标签：12px/18px
- 数值：16px/22px/700

## 10. Card Container

坐标：x 562, y 982, w 442, h 73

变体：

- 默认卡片：x 562, y 982, w 206, h 73，白底、灰边、12px 圆角。
- 虚线卡片：x 787, y 982, w 217, h 73，虚线蓝边，用作次要信息区或 Dropzone。

## 11. 通用组件库

坐标：x 1031, y 12, w 406, h 1034

### Pill Tabs / 标签

状态：

- 默认：白底、灰边、黑字。
- 可点击：蓝边、蓝字、白底。
- 禁用：浅灰底、灰字。
- 成功标签：浅绿底、绿字。

建议尺寸：

- 高度：30px
- 最小宽度：72px
- 圆角：999px 或 8px，根据语义选择。图中 pill 更接近 999px。

### Status Badges

| Badge | 背景 | 文字 | 边框 |
| --- | --- | --- | --- |
| 已优化 / 成功 | `#DCFCE7` | `#16A34A` | `#BBF7D0` |
| 已自动增强 / 进行中 | `#E6F0FF` | `#2563EB` | `#BFDBFE` |
| 草稿 / 警告 | `#FFF7ED` | `#F59E0B` | `#FED7AA` |
| 停用 | `#F8FAFC` | `#64748B` | `#E5E7EB` |
| 错误 | `#FEF2F2` | `#EF4444` | `#FECACA` |

### Icon Buttons

图标：

- 编辑：`icon-button-edit.svg`
- 收藏：`action-favorite.svg`
- 复制：`icon-button-copy-square.svg`
- 更多：`action-more.svg`

状态：

- 默认：白底、灰边、深灰图标。
- Hover：白底或浅蓝底、蓝边、蓝图标。
- Disabled：浅灰图标、不可点击。

规格：

- 视觉尺寸：36 x 36
- 图标：16px-18px
- 圆角：999px 或 8px；图中 icon button 为圆形。
- 实际点击面积至少 44 x 44。

### Primary Button

示例：

- 默认：`优化`
- Hover：`复修`
- Disabled：`禁用`

规格：高 32px-36px，宽 80px，圆角 8px。

### Secondary Button

按钮：`评分`、`收藏`、`复制`、`更多`

状态：

- 默认：灰边黑字。
- Hover：蓝边蓝字。
- Disabled：灰边灰字。

### Divider

水平分割线：

- 实线：`1px solid #E5E7EB`
- 虚线：`assets/promptball/part2/icons/divider-dashed.svg` 或 CSS `border-top: 1px dashed #CBD5E1`

## 12. 开发组件建议

建议拆为：

```text
AppHeader
TopNavigationTabs
SectionTabs
PromptEditorCard
PromptTextarea
OptimizationBanner
ActionBar
ScoreChip
StatusBadge
IconButton
PrimaryButton
SecondaryButton
CardContainer
Divider
```

ActionBar 数据结构建议：

```ts
type ActionBarItem = {
  id: "optimize" | "score" | "favorite" | "copy" | "more";
  label: string;
  icon: React.ReactNode;
  variant: "primary" | "secondary";
  disabled?: boolean;
};
```

可访问性要求：

- Icon-only buttons 必须有 `aria-label`。
- Textarea 必须有可见 label 或 `aria-label`。
- Tab 必须暴露 selected 状态。
- Disabled 组件要使用真实 `disabled` 属性，不只改变颜色。
