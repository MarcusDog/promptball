# Part 1：浮球 & 快速启动器模块详细拆解

源图：`ui/part1.png`  
尺寸：`1448 x 1086`

本文件只覆盖 Part 1。机器可读坐标和资产清单见：

- `assets/promptball/part1/part1.manifest.json`
- `assets/promptball/part1/icons/`

## 1. 页面结构

Part 1 由 9 个标注区域组成：

| 编号 | 区域 | 坐标估算 | 交付状态 |
| --- | --- | --- | --- |
| 1 | 浮球状态 | x 38, y 120, w 414, h 228 | 已生成 SVG 三态 |
| 2 | 快速启动器弹窗 | x 510, y 155, w 338, h 433 | 已拆行、补齐图标 |
| 3 | 标题区域 | x 930, y 159, w 346, h 112 | 已复用 Logo |
| 4 | Pro 认证标识 | x 1270, y 158, w 82, h 45 | 已生成 SVG |
| 5 | 快捷键提示 | x 931, y 337, w 190, h 50 | 已记录文案和位置 |
| 6 | 顶部特性图标 | x 919, y 456, w 470, h 130 | 已生成 4 个 SVG |
| 7 | 启动器菜单项 | x 37, y 685, w 279, h 292 | 已记录行规格 |
| 8 | 图标库 | x 379, y 688, w 665, h 270 | 已补全缺失图标 |
| 9 | 规格说明 | x 1091, y 655, w 330, h 242 | 已结构化为 token |

## 2. 浮球状态

### 默认状态

- 坐标：x 62, y 217, w 64, h 64
- 资产：`assets/promptball/icons/floating-ball-default.svg`
- 结构：白色外环 + 蓝紫青渐变内圆 + 青色高光点。
- 阴影：低强度蓝色投影。

### 悬停状态

- 坐标：x 209, y 217, w 64, h 64
- 资产：`assets/promptball/icons/floating-ball-hover.svg`
- 差异：额外透明光晕层，阴影增强。
- 交互：hover 不改变布局尺寸，只改变阴影、光晕透明度和轻微亮度。

### 激活状态

- 坐标：x 359, y 217, w 64, h 64
- 资产：`assets/promptball/icons/floating-ball-active.svg`
- 差异：光晕最强，视觉上强调当前已打开/已展开。

### 背景光晕

- 坐标：x 49, y 451, w 120, h 120
- 资产：`assets/promptball/icons/floating-glow.svg`
- 用途：独立背景层，适合放在浮球后方或启动引导场景。
- CSS 建议：`position: absolute; pointer-events: none; opacity: .75;`

## 3. 快速启动器弹窗

卡片：

- 坐标：x 510, y 155, w 338, h 433
- 圆角：12px
- 背景：`#FFFFFF`
- 边框：`1px solid #E5E7EB`
- 阴影：`0 10px 30px rgba(16,24,40,0.08)`

### Header

- 坐标：x 510, y 155, w 338, h 54
- Logo：x 540, y 172, w 24, h 24，使用 `promptball-logo.svg`
- 标题：x 571, y 177，`PromptBall`，16px/22px/700
- Pro：x 791, y 176，文字 14px/700
- 底部分割线：`#E5E7EB`

### 菜单行规格

| 行 | 坐标 | 图标 | 文案 | 快捷键 |
| --- | --- | --- | --- | --- |
| 新建命令 | x 524, y 210, w 310, h 52 | `launcher-new-command.svg` | 新建命令 | `⌘K` |
| 优化当前 Prompt | x 524, y 262, w 310, h 42 | `launcher-optimize.svg` | 优化当前 Prompt | `⌘ 1` |
| 新建 Prompt | x 524, y 304, w 310, h 42 | `launcher-new-prompt.svg` | 新建 Prompt | `⌘ 2` |
| 打开库 | x 524, y 346, w 310, h 42 | `launcher-open-library.svg` | 打开库 | `⌘ 3` |
| 评估当前 | x 524, y 388, w 310, h 42 | `launcher-evaluate-briefcase.svg` | 评估当前 | `⌘ 4` |
| A/B 测试 | x 524, y 430, w 310, h 42 | `launcher-ab-test.svg` | A/B 测试 | `⌘ 5` |
| 设置 | x 524, y 472, w 310, h 54 | `launcher-settings.svg` | 设置 | `⌘ ,` |
| 切换到深色模式 | x 524, y 526, w 310, h 54 | `launcher-dark-mode.svg` | 切换到深色模式 | 无 |

行内参数：

- 左内边距：14px
- 图标尺寸：20px，图标盒 24px
- 文案左边距：14px
- 文案字号：14px，字重 500
- 快捷键右对齐，字号 13px，颜色 `#334155`
- 分割线只出现在主操作、设置、深色切换等组之间

## 4. 标题区域

- 坐标：x 930, y 159, w 346, h 112
- Logo：x 931, y 166, w 45, h 45
- 标题：`PromptBall`，约 32px/40px/700
- 副标题：`Prompt 工作台`，18px/26px/600
- 说明：`优化、训练、收藏、评估你的 Prompt`，16px/24px，颜色 `#64748B`

使用资产：`assets/promptball/icons/promptball-logo.svg`

## 5. Pro 认证标识

- 坐标：x 1270, y 158, w 82, h 45
- 资产：`assets/promptball/icons/pro-badge.svg`
- 视觉：白底、999px 圆角、1px 灰边、轻阴影。
- 字体：16px/700，颜色 `#111827`。

## 6. 快捷键提示

- 坐标：x 931, y 337, w 190, h 50
- 文案：
  - `快速入口`
  - `⌘ + Shift + P`
- 标题字号：15px/22px，颜色 `#64748B`
- 快捷键字号：14px/22px，颜色 `#64748B`

## 7. 顶部特性图标

整体坐标：x 919, y 456, w 470, h 130

单项规格：

- 图标卡片：80 x 66，圆角 12px，白底，1px `#E5E7EB`，轻阴影。
- 图标：24px，颜色 `#2563EB`
- 标题：14px/20px/600，颜色 `#111827`
- 描述：12px/18px，颜色 `#64748B`

| 项 | 坐标 | 资产 | 标题 | 描述 |
| --- | --- | --- | --- | --- |
| 更好 Prompt | x 920, y 457, w 80, h 95 | `feature-better-prompt.svg` | 更好 Prompt | 智能优化与撰写 |
| 更高质量 | x 1054, y 457, w 80, h 95 | `feature-quality.svg` | 更高质量 | 结构化与准确性 |
| 更快应用 | x 1184, y 457, w 80, h 95 | `feature-fast-apply.svg` | 更快应用 | 用得上也用得好 |
| 更科学训练 | x 1306, y 457, w 80, h 95 | `feature-training.svg` | 更科学训练 | 数据驱动与复盘 |

## 8. 左下菜单项示例

- 坐标：x 37, y 685, w 279, h 292
- 容器圆角：8px-12px
- 行高：34px
- 图标：16px
- 快捷键：右侧 13px

行内容和弹窗一致。这里是开发时的“菜单列表组件”规范，可复用同一组 `LauncherMenuItem` 数据。

## 9. 图标库拆分

图标库整体：x 379, y 688, w 665, h 270

### 第一排：启动器菜单图标

| 图标 | 资产 |
| --- | --- |
| 新建命令 | `assets/promptball/part1/icons/launcher-new-command.svg` |
| 设置 | `assets/promptball/part1/icons/launcher-settings.svg` |
| 优化 | `assets/promptball/part1/icons/launcher-optimize.svg` |
| 新建 | `assets/promptball/part1/icons/launcher-evaluate.svg` |
| 打开库 | `assets/promptball/part1/icons/launcher-open-library.svg` |
| 评估 | `assets/promptball/part1/icons/launcher-evaluate-briefcase.svg` |
| A/B 测试 | `assets/promptball/part1/icons/launcher-ab-test.svg` |
| 切换深色 | `assets/promptball/part1/icons/icon-switch-dark.svg` |

### 第二排：品牌和状态图标

| 图标 | 资产 |
| --- | --- |
| 更好 Prompt | `assets/promptball/icons/feature-better-prompt.svg` |
| 更高质量 | `assets/promptball/icons/feature-quality.svg` |
| 更快应用 | `assets/promptball/icons/feature-fast-apply.svg` |
| 更科学训练 | `assets/promptball/icons/feature-training.svg` |
| 悬停光环 | `assets/promptball/part1/icons/icon-ring-inactive.svg` |
| 激活光环 | `assets/promptball/part1/icons/icon-ring-active.svg` |
| Pro Badge | `assets/promptball/icons/pro-badge.svg` |
| PromptBall | `assets/promptball/icons/promptball-logo.svg` |

## 10. 开发组件建议

建议后续实现为：

```text
FloatingBall
FloatingBallGlow
LauncherPopover
LauncherMenuItem
FeatureIconTile
ProBadge
PromptBallLogo
```

`LauncherMenuItem` props 建议：

```ts
type LauncherMenuItemProps = {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  tone?: "default" | "success";
  active?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
};
```

状态要求：

- hover：浅蓝背景 `#EFF4FF`，图标和文字可转 `#2563EB`。
- active：背景 `#E6F0FF`，左侧可加 2px 蓝色强调条。
- disabled：opacity 0.45，禁用点击。
- focus：保留 2px 蓝色 ring，不能移除键盘焦点。

## 11. 规格摘录

| 项 | 值 |
| --- | --- |
| 浮球尺寸 | 64 x 64px |
| 光晕尺寸 | 120 x 120px |
| 弹窗卡片圆角 | 12px |
| 弹窗卡片阴影 | `0 10px 30px rgba(16,24,40,0.08)` |
| 图标线宽 | 2px |
| 主色 | `#4F6BFF` / 工程可统一到 `#2563EB` |
| 辅助渐变 | `#6A5CFF -> #00D2FF` |
| 图标建议 | SVG 使用 `currentColor`，品牌球使用固定渐变 |
