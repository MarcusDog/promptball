# Part 4：Prompt 库 / 斜杠命令详细拆解

源图：`ui/part4.png`  
尺寸：`1448 x 1086`

本文件只覆盖 Part 4。机器可读坐标和资产清单见：

- `assets/promptball/part4/part4.manifest.json`
- `assets/promptball/part4/icons/`

## 1. 页面结构

| 编号 | 区域 | 坐标估算 | 交付状态 |
| --- | --- | --- | --- |
| 01 | 模块容器 | x 24, y 140, w 324, h 344 | 已拆标题、Tab、类别列表、底部链接 |
| 02 | 标签页 Tab Bar | x 407, y 140, w 409, h 230 | 已拆 default/hover/active |
| 03 | 搜索与筛选 | x 1063, y 151, w 320, h 125 | 已补搜索、清除、筛选、视图图标 |
| 04 | 类别链接列表 | x 1087, y 388, w 288, h 191 | 已记录 5 类命令 |
| 05 | 操作按钮 | x 1083, y 644, w 226, h 63 | 已记录按钮规格 |
| 06 | Prompt 卡片 | x 408, y 426, w 636, h 295 | 已拆 6 种状态 |
| 07 | 卡片内容元素 | x 32, y 798, w 935, h 68 | 已拆标题、描述、元数据行 |
| 08 | 图标库 | x 191, y 903, w 1190, h 48 | 已生成 20 个 SVG |
| 09 | 颜色与样式参考 | x 25, y 994, w 1399, h 68 | 已提取 token |

## 2. 模块容器（参考）

坐标：x 24, y 140, w 324, h 344

容器规格：

- 背景：`#FFFFFF`
- 边框：`1px solid #E5E7EB`
- 圆角：12px
- 阴影：`0 4px 16px rgba(17,24,39,0.06)`
- 内边距：10px-14px

内部结构：

| 子区域 | 坐标估算 | 说明 |
| --- | --- | --- |
| 模块标题 | x 38, y 160, w 220, h 26 | 编号圆点 + `Prompt 库 / 斜杠命令` |
| 内部 Tab | x 34, y 194, w 294, h 42 | 全部/常用/模板/收藏/历史 |
| 类别列表 | x 52, y 252, w 240, h 155 | 5 条命令分类 |
| 底部链接 | x 53, y 438, w 130, h 22 | `查看全部命令 ->` |

## 3. 标签页（Tab Bar）

区域：x 407, y 140, w 409, h 230

Tab 项：

- 全部
- 常用
- 模板
- 收藏
- 历史

三态：

| 状态 | 坐标 | 视觉 |
| --- | --- | --- |
| 默认 | x 407, y 140, w 409, h 50 | 白底、灰边，`全部` active 蓝字与下划线 |
| Hover | x 407, y 230, w 409, h 50 | hover 项浅蓝底 `#EFF4FF` |
| Active | x 407, y 320, w 409, h 50 | active 项蓝字 + 底部蓝线 |

规格：

- 容器圆角 8px。
- Tab 高 50px，5 等分。
- 文字 14px/20px，active 字重 600。
- Active 下划线高度 2px。

## 4. 搜索与筛选

区域：x 1063, y 151, w 320, h 125

搜索框：

- 坐标：x 1063, y 151, w 212, h 38
- 图标：`icon-search.svg`
- 清除：`icon-clear.svg`
- Placeholder：`搜索 Prompt`
- 圆角：8px，边框 `#E5E7EB`

按钮：

- 筛选：x 1285, y 151, w 79, h 38，图标 `icon-filter.svg`
- 排序/视图：x 1376, y 151, w 49, h 38，图标 `icon-sort-view.svg`

筛选 Tokens：

- 坐标：x 1063, y 238, w 325, h 38
- 项：`场景`、`类型`、`难度`、`重置`
- 下拉图标：`icon-dropdown.svg`
- 高度 38px，圆角 8px。

## 5. 类别链接列表

坐标：x 1087, y 388, w 288, h 191

行规格：

- 行高：34px
- 图标：16px
- 命令名：14px/20px/700
- 描述：13px/20px，颜色 `#6B7280`

内容：

| 命令 | 描述 | 图标 |
| --- | --- | --- |
| `/学术写作` | 学术论文、报告写作模板 | `category-pen.svg` |
| `/教学设计` | 课程与教案模板 | `category-pen.svg` |
| `/代码编程` | 代码说明与注释模板 | `category-pen.svg` |
| `/数据分析` | 数据分析可视化模板 | `category-data-lock.svg` |
| `/创意写作` | 故事与文案创作模板 | `category-pen.svg` |

## 6. 操作按钮

坐标：x 1083, y 644, w 226, h 63

文案：`查看全部命令 ->`

规格：

- 高度：63px
- 宽度：226px
- 圆角：12px
- 背景：`#FFFFFF`
- 阴影：`0 4px 16px rgba(17,24,39,0.06)`
- 文字：16px/24px/700，颜色 `#2563FF`

## 7. Prompt 卡片（多种状态）

区域：x 408, y 426, w 636, h 295  
单卡尺寸：约 202 x 126

状态：

| 状态 | 坐标 | 视觉 |
| --- | --- | --- |
| 默认 | x 408, y 426, w 202, h 126 | 白底、灰边、轻阴影 |
| Hover | x 625, y 426, w 202, h 126 | 边框蓝、阴影增强 |
| Favorite | x 849, y 426, w 202, h 126 | 右下角收藏星为蓝色 |
| Selected | x 408, y 594, w 202, h 126 | 蓝色边框，右上角选中勾 |
| Disabled | x 626, y 594, w 202, h 126 | 透明度约 45%，不可交互 |
| Loading | x 840, y 594, w 202, h 126 | skeleton 条 + 占位圆点/星标 |

卡片内部：

- Padding：14px
- 标题：14px/20px/700，最多 1 行。
- 描述：13px/20px，最多 2 行。
- Meta 行：底部对齐，Score + Usage + Favorite。

选中勾资产：`assets/promptball/part4/icons/card-selected-check.svg`

## 8. 卡片内容元素

区域：x 32, y 798, w 935, h 68

标题元素：

- 坐标：x 32, y 799, w 199, h 49
- 文案：`学术论文大纲（中文）`
- 字体：18px/26px/700

描述元素：

- 坐标：x 261, y 799, w 236, h 60
- 文案：`请为以下研究主题生成一份学术论文大纲，包含研究问题、主要论点与结论。`
- 字体：14px/22px/400

元数据行：

- 坐标：x 535, y 798, w 431, h 67
- 分三段：分数标签、使用次数、收藏。
- 虚线框说明此行可组合。

元素：

| 元素 | 图标/样式 |
| --- | --- |
| 分数标签 | `T 88`，颜色 `#16A34A` |
| 使用次数 | `icon-view.svg` + `1.2k` |
| 收藏默认 | `icon-favorite-default.svg` |
| 收藏选中 | `icon-favorite-selected.svg` |

## 9. 图标库

区域：x 191, y 903, w 1190, h 48

已生成 SVG：

| 名称 | 文件 |
| --- | --- |
| 搜索 | `icon-search.svg` |
| 清除 | `icon-clear.svg` |
| 筛选 | `icon-filter.svg` |
| 排序/视图 | `icon-sort-view.svg` |
| 下拉 | `icon-dropdown.svg` |
| 展开 | `icon-expand.svg` |
| 选中 | `icon-selected.svg` |
| 添加 | `icon-add.svg` |
| 重置 | `icon-reset.svg` |
| 链接 | `icon-link.svg` |
| 编辑 | `icon-edit.svg` |
| 代码 | `icon-code.svg` |
| 学术 | `icon-academic.svg` |
| 教学 | `icon-teaching.svg` |
| 数据 | `icon-data.svg` |
| 创意写作 | `icon-creative-writing.svg` |
| 查看 | `icon-view.svg` |
| 收藏默认 | `icon-favorite-default.svg` |
| 收藏选中 | `icon-favorite-selected.svg` |
| 加载中 | `icon-loading.svg` |

规则：

- 常规图标 20 x 20。
- 分类小图标 16 x 16。
- Stroke 1.8px。
- 普通状态用 `currentColor`，收藏选中固定蓝色填充。

## 10. 颜色与样式

区域：x 25, y 994, w 1399, h 68

| Token | 值 | 用途 |
| --- | --- | --- |
| Primary | `#2563FF` | 主色、active、链接 |
| Hover | `#EFF4FF` | hover 背景 |
| Selected | `#E6F0FF` | selected 背景 |
| Score | `#16A34A` | 分数标签 |
| Text Primary | `#111827` | 标题/主要文本 |
| Text Secondary | `#6B7280` | 描述/辅助文本 |
| Border | `#E5E7EB` | 边框 |
| Shadow | `0 4px 16px rgba(17,24,39,0.06)` | 卡片阴影 |

工程中可将 `#2563FF` 统一收敛到已使用的 `#2563EB`，但设计稿提取值保留 `#2563FF`。

## 11. 开发组件建议

建议拆分：

```text
PromptLibraryPanel
PromptLibraryTabs
PromptSearchBar
PromptFilterTokens
CategoryCommandList
PromptCard
PromptCardMeta
PromptCardSkeleton
ViewAllCommandsButton
```

PromptCard 数据结构：

```ts
type PromptCardState = "default" | "hover" | "favorite" | "selected" | "disabled" | "loading";

type PromptCardModel = {
  id: string;
  title: string;
  description: string;
  score: number;
  usageCount: string;
  favorite: boolean;
  selected?: boolean;
  disabled?: boolean;
};
```

交互要求：

- 卡片可点击时使用 button 或可访问的 role，并保留键盘 focus ring。
- Favorite 不能只靠颜色表达，应有 aria-label 状态，如 `已收藏` / `收藏`。
- Loading 状态用 skeleton，不能显示空白卡片。
- Tab 使用 `aria-selected` 表达当前项。
