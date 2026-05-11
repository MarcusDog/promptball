# Part 3：结构化 Prompt 构建器详细拆解

源图：`ui/part3.png`  
尺寸：`1448 x 1086`

本文件只覆盖 Part 3。机器可读坐标和资产清单见：

- `assets/promptball/part3/part3.manifest.json`
- `assets/promptball/part3/icons/`

## 1. 页面结构

| 编号 | 区域 | 坐标估算 | 交付状态 |
| --- | --- | --- | --- |
| Full Card | 完整表单卡片 | x 34, y 132, w 565, h 550 | 已拆主卡、字段、底部按钮 |
| 1 | 标题区域 | x 626, y 95, w 455, h 56 | 已拆标题、模板下拉、保存模板 |
| 2 | 字段行 | x 626, y 201, w 455, h 95 | 已拆颜色点、字段名、输入框、计数 |
| All | 全部字段 | x 626, y 351, w 455, h 330 | 已记录 10 个字段内容 |
| 3 | 字段颜色图例 | x 1131, y 72, w 300, h 332 | 已生成 10 个颜色点 SVG |
| 4 | 底部操作区 | x 1104, y 454, w 315, h 162 | 已拆默认/hover/disabled |
| 5 | 按钮样式 | x 626, y 714, w 752, h 129 | 已拆主按钮和次按钮 |
| 6 | 图标 | x 39, y 881, w 252, h 108 | 已生成 4 个图标 |
| 7 | 输入框状态 | x 350, y 880, w 322, h 164 | 已拆 default/focus/disabled/error |
| 8 | 卡片样式规范 | x 724, y 878, w 654, h 168 | 已记录内距、边框、阴影 |

## 2. 完整表单卡片（Full Card）

坐标：x 34, y 132, w 565, h 550

容器规格：

- 背景：`#FFFFFF`
- 边框：`1px solid #E6EAF1`
- 圆角：12px
- 内边距：24px
- 阴影：`0 1px 2px rgba(16,24,40,0.04), 0 8px 24px rgba(16,24,40,0.08)`

内部结构：

| 子区域 | 坐标估算 | 说明 |
| --- | --- | --- |
| 标题 | x 58, y 153, w 135, h 24 | `结构化 Prompt` |
| 模板下拉 | x 306, y 146, w 160, h 32 | `模板：通用学术写作` + 下拉 |
| 保存模板 | x 496, y 146, w 80, h 32 | 次按钮 |
| 字段列表 | x 58, y 194, w 520, h 408 | 10 个字段行 |
| 底部按钮 | x 56, y 630, w 520, h 34 | 添加字段、清空、应用 |

## 3. 标题区域（Title Area）

坐标：x 626, y 95, w 455, h 56

组件：

- 标题：`结构化 Prompt`，16px/24px/700，颜色 `#111827`
- 模板 Select：x 812, y 108, w 151, h 32
- 保存模板按钮：x 990, y 108, w 78, h 32

Select：

- 高度：32px
- 圆角：8px
- 边框：`#E5E7EB`
- 下拉图标：`assets/promptball/part3/icons/control-chevron-down.svg`
- 文案字号：13px/18px

保存模板：

- 图标：`assets/promptball/part3/icons/action-save-template.svg`
- 默认白底灰边，hover 蓝边蓝字。

## 4. 字段行（Field Row）

字段行示例坐标：x 626, y 201, w 455, h 52

字段行拆解：

| 部位 | 坐标估算 | 规格 |
| --- | --- | --- |
| 字段颜色点 | x 640, y 224, w 10, h 10 | 10px 圆点 |
| 字段名 | x 662, y 218, w 60, h 22 | 13px/18px |
| 输入框 | x 753, y 213, w 318, h 32 | 高 32px，圆角 8px |
| 字数计数 | x 1028, y 219, w 38, h 18 | 11/100，12px 灰色 |

输入框内容：

- 左 padding：12px
- 右 padding：56px，留给计数显示
- 字体：13px/18px
- 边框：`#E5E7EB`

## 5. 字段列表与颜色图例

全部字段区域：x 626, y 351, w 455, h 330  
字段颜色图例：x 1131, y 72, w 300, h 332

字段定义：

| ID | 名称 | 中文说明 | 颜色 | 资产 |
| --- | --- | --- | --- | --- |
| role | Role | 角色与身份 | `#2563EB` | `field-dot-role.svg` |
| context | Context | 上下文信息 | `#3B82F6` | `field-dot-context.svg` |
| goal | Goal | 目标 | `#3B82F6` | `field-dot-goal.svg` |
| task | Task | 任务指令 | `#16A34A` | `field-dot-task.svg` |
| input | Input | 输入信息 | `#22C55E` | `field-dot-input.svg` |
| output | Output | 输出要求 | `#4ADE80` | `field-dot-output.svg` |
| requirement | Requirement | 内容要求 | `#F59E0B` | `field-dot-requirement.svg` |
| constraints | Constraints | 限制条件 | `#EF4444` | `field-dot-constraints.svg` |
| evaluation | Evaluation | 评估标准 | `#EF4444` | `field-dot-evaluation.svg` |
| style | Style | 风格语气 | `#22C55E` | `field-dot-style.svg` |

字段示例值：

| 字段 | 内容 | 计数 |
| --- | --- | --- |
| Role | 你是一位教育内容设计专家 | 11/100 |
| Context | 面向初中生、解释人工智能的基本原理与应用 | 18/200 |
| Goal | 生成一份结构清晰、易于理解的学习讲义 | 16/200 |
| Task | 1. 包含定义、核心概念；2. 实际应用与生活例子；3. 简要总结 | 32/400 |
| Input | 主题：人工智能的基本原理与应用；受众：初中生 | 20/200 |
| Output | 结构化学习讲义（含小标题、列表和表格） | 16/200 |
| Requirement | 内容准确、简洁易懂、逻辑清晰、适合课堂使用 | 18/200 |
| Constraints | 字数 200–1500 字，可使用列表、表格或图示 | 20/200 |
| Evaluation | 准确性、清晰度、完整性、可读性 | 14/200 |
| Style | 清晰友好、鼓励式表达、适合学习场景 | 15/200 |

## 6. 底部操作区（Footer Actions）

坐标：x 1104, y 454, w 315, h 162

三态：

- 默认：y 454，高 49px
- Hover：y 512，高 49px
- Disabled：y 570，高 49px

按钮：

| 按钮 | 图标 | 变体 | 尺寸建议 |
| --- | --- | --- | --- |
| 添加字段 | `action-add-field.svg` | secondary | w 93, h 34 |
| 清空 | `action-clear.svg` | secondary | w 76, h 34 |
| 应用到编辑区 | 无 | primary | w 120, h 34 |

布局：

- Footer 左右两端对齐。
- 左侧按钮组间距 12px。
- 主按钮贴右。

## 7. 按钮样式

区域：x 626, y 714, w 752, h 129

Primary：

- 默认：背景 `#2563EB`，文字白色。
- Hover：背景 `#1D4ED8`。
- Disabled：背景 `#C7D7FA`，文字白色 70%。
- 高度：34px，圆角 8px。

Secondary：

- 默认：白底，边框 `#E5E7EB`，文字 `#111827`。
- Hover：边框 `#2563EB`，文字 `#2563EB`。
- Disabled：浅灰文字和边框，opacity 0.45。
- 图标 16px，图标和文字间距 6px。

## 8. 图标（Icons）

图标区域：x 39, y 881, w 252, h 108

| 图标 | 资产 | 尺寸 |
| --- | --- | --- |
| 添加 | `assets/promptball/part3/icons/action-add-field.svg` | 16 x 16 |
| 清空 | `assets/promptball/part3/icons/action-clear.svg` | 16 x 16 |
| 下拉 | `assets/promptball/part3/icons/control-chevron-down.svg` | 12 x 12 |
| 保存模板 | `assets/promptball/part3/icons/action-save-template.svg` | 16 x 16 |

通用规则：

- 图标使用 `currentColor`。
- 按钮中图标 stroke 1.6px-1.8px。
- 图标按钮或含图标按钮都要有明确 hover/focus 状态。

## 9. 输入框状态

区域：x 350, y 880, w 322, h 164

| 状态 | 坐标 | 边框 | 说明 |
| --- | --- | --- | --- |
| Default | x 438, y 903, w 176, h 31 | `#E5E7EB` | 默认输入 |
| Focus | x 438, y 941, w 176, h 31 | `#2563EB` | 聚焦输入 |
| Disabled | x 438, y 979, w 176, h 31 | `#E5E7EB` | 浅灰背景 |
| Error | x 438, y 1017, w 176, h 31 | `#EF4444` | 下方错误文案红色 |

状态资产：

- Focus 示意：`assets/promptball/part3/icons/input-focus-ring.svg`
- Error 示意：`assets/promptball/part3/icons/input-error-ring.svg`

实现建议：实际代码用 CSS border/ring，不建议用 SVG 作为真实 input 背景；这些 SVG 主要作为设计资产记录。

## 10. 卡片样式规范（Card Spec）

区域：x 724, y 878, w 654, h 168  
示例卡片：x 967, y 898, w 408, h 137

设计稿标注：

- 背景：`#FFFFFF`
- 边框：`1px #E6EAF1`
- 圆角：12px
- 内边距：24px
- 阴影：`0 1px 2px rgba(16,24,40,0.04), 0 8px 24px rgba(16,24,40,0.08)`
- 标题区和输入区间距：12px

内距标注：

- 顶部 24px
- 左右 24px
- 底部 24px
- 标题区域到内容输入框 12px

## 11. 开发组件建议

建议拆分：

```text
StructuredPromptBuilder
StructuredPromptTitleBar
TemplateSelect
SaveTemplateButton
StructuredPromptFieldRow
FieldColorDot
StructuredPromptFooter
PromptBuilderButton
PromptInputStateDemo
```

字段类型：

```ts
type StructuredPromptFieldId =
  | "role"
  | "context"
  | "goal"
  | "task"
  | "input"
  | "output"
  | "requirement"
  | "constraints"
  | "evaluation"
  | "style";

type StructuredPromptField = {
  id: StructuredPromptFieldId;
  label: string;
  color: string;
  value: string;
  maxLength: number;
};
```

可访问性要求：

- 每个字段行必须有可见 label。
- 字数计数应绑定到输入框描述，例如 `aria-describedby`。
- Error 状态要在字段下方显示错误原因，不能只变红。
- 底部 `清空` 属于潜在破坏性操作，后续实现可加确认或撤销。
