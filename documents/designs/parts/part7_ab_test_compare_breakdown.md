# Part 7：A/B 测试对比模块详细拆解

源图：`ui/part7.png`  
尺寸：`1448 x 1086`

本文件只覆盖 Part 7。机器可读坐标和资产清单见：

- `assets/promptball/part7/part7.manifest.json`
- `assets/promptball/part7/icons/`

## 1. 页面结构

| 编号 | 区域 | 坐标估算 | 交付状态 |
| --- | --- | --- | --- |
| 1 | 完整对比卡片 | x 24, y 95, w 680, h 318 | 已拆双卡片与底部操作 |
| 2 | 双列对比布局 | x 724, y 95, w 689, h 198 | 已记录 grid 规格 |
| 3 | 顶部标题区域 | x 724, y 309, w 338, h 104 | 已拆标题与分数 |
| 4 | Prompt 卡片状态 | x 24, y 429, w 680, h 235 | 已拆 default/selected/neutral |
| 5 | 底部操作按钮区 | x 24, y 679, w 680, h 193 | 已拆 4 个按钮与三态 |
| 6 | 分数标签 | x 1077, y 309, w 336, h 104 | 已拆 4 种分数 tone |
| 7 | 内容预览文本区 | x 724, y 429, w 689, h 142 | 已记录文本规格 |
| 8 | 链接样式 | x 724, y 574, w 199, h 119 | 已记录 link/hover |
| 9 | 图标库 | x 937, y 574, w 476, h 119 | 已生成 6 个线性图标 |
| 10 | 按钮样式 | x 724, y 704, w 689, h 169 | 已拆 4 variants x 3 states |
| 11 | 状态说明与 Tokens | x 24, y 890, w 1389, h 176 | 已记录规范 |

## 2. 完整对比卡片

坐标：x 24, y 95, w 680, h 318

容器规格：

- 背景：`#FFFFFF`
- 边框：`1px solid #E5E7EB`
- 圆角：12px
- 阴影：`0 2px 8px rgba(16,24,40,0.06)`
- 内边距：24px

内部：

| 子区域 | 坐标估算 | 说明 |
| --- | --- | --- |
| Prompt A 卡 | x 47, y 143, w 304, h 184 | 优化版，78 分 |
| Prompt B 卡 | x 370, y 143, w 309, h 184 | 对比版，90 分 |
| 操作按钮行 | x 55, y 348, w 620, h 41 | A 胜出、B 胜出、重新测试、保存对比 |

Prompt 卡内容：

- 标题行：左侧 Prompt 名称，右侧分数。
- 正文：最多 3 行。
- 链接：`查看详情 ->`

## 3. 双列对比布局

坐标：x 724, y 95, w 689, h 198

布局规则：

- 容器内边距：24px
- 列间距：24px
- 列宽比例：`1fr 1fr`
- 推荐最小宽度：760px
- 卡片内边距：16px
- 低于 760px 时折叠为单列上下排列。

CSS 建议：

```css
.ab-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  padding: 24px;
}

@media (max-width: 760px) {
  .ab-grid {
    grid-template-columns: 1fr;
  }
}
```

## 4. 顶部标题区域

坐标：x 724, y 309, w 338, h 104

结构：

- 编号圆点：x 742, y 362, w 28, h 28。
- 标题：`A/B 测试对比`。
- A 分数：`78 分`，蓝色，中性/一般。
- B 分数：`90 分`，绿色，优秀/良好。
- 分数之间用竖线分隔。

## 5. Prompt 对比卡片状态

坐标：x 24, y 429, w 680, h 235

状态：

| 状态 | 坐标估算 | 视觉 |
| --- | --- | --- |
| Default | x 39, y 498, w 217, h 131 | 白底灰边 |
| Selected / Winner | x 273, y 498, w 205, h 131 | 蓝色边框，右上角蓝色勾 |
| Neutral | x 497, y 498, w 195, h 131 | 默认灰边，无胜出提示 |

选中图标：

- `assets/promptball/part7/icons/card-winner-check.svg`

卡片规格：

- 圆角：12px
- 内边距：16px
- 标题：14px/20px/600，蓝色。
- 分数：14px/20px/700。
- 正文：14px/20px，最多 3 行。
- 链接：14px/20px/500，蓝色。

## 6. 底部操作按钮区

坐标：x 24, y 679, w 680, h 193

按钮：

| 按钮 | Variant | 颜色 | 图标 |
| --- | --- | --- | --- |
| A 胜出 | Primary Blue | `#2563EB` | `icon-winner.svg` |
| B 胜出 | Success Green | `#16A34A` | `icon-winner.svg` |
| 重新测试 | Secondary | 白底灰边 | `icon-refresh.svg` |
| 保存对比 | Warning | 橙色描边/文字 | `icon-warning-save.svg` |

状态：

- Default：常规。
- Hover：主按钮颜色加深，次按钮背景变浅灰/浅蓝，warning 背景 `#FFF7ED`。
- Disabled：透明度 40%，禁止点击。

## 7. 分数标签

坐标：x 1077, y 309, w 336, h 104

| 文案 | 语义 | 颜色 | 点资产 |
| --- | --- | --- | --- |
| 78 分 | 中性 / 一般 | `#2563EB` | `score-dot-primary.svg` |
| 90 分 | 优秀 / 良好 | `#16A34A` | `score-dot-success.svg` |
| 60 分 | 较差 / 待优化 | `#F59E0B` | `score-dot-warning.svg` |
| -- 分 | 无数据 | `#1F2329` | `score-dot-neutral.svg` |

规格：

- 主分数：20px/28px/700
- 说明：12px/18px
- 容器可以是虚线说明框或直接布局。

## 8. 内容预览文本区

坐标：x 724, y 429, w 689, h 142  
文本框：x 748, y 472, w 448, h 60

规格：

- 字体：14px
- 行高：20px
- 颜色：`#1F2329`
- 最大显示：3 行
- 超出省略
- 预览框边框：`1px dashed rgba(37,99,235,0.35)`
- 圆角：8px

## 9. 链接样式

坐标：x 724, y 574, w 199, h 119

文案：`查看详情 ->`

规格：

- 字体：14px/20px/500
- 颜色：`#2563EB`
- Hover：下划线显示。
- 箭头图标：`icon-arrow-right.svg`

## 10. 图标库

坐标：x 937, y 574, w 476, h 119

| 名称 | 文件 |
| --- | --- |
| 对比 | `icon-compare.svg` |
| 重新测试 | `icon-refresh.svg` |
| 保存对比 | `icon-save.svg` |
| 胜出 | `icon-winner.svg` |
| 右箭头 | `icon-arrow-right.svg` |
| 勾选 | `icon-check.svg` |

图标规格：

- 尺寸：16 x 16 或 20 x 20
- 线性图标
- Stroke：1.8px
- 默认使用 `currentColor`

## 11. 按钮样式

区域：x 724, y 704, w 689, h 169

变体：

| Variant | Default | Hover | Disabled |
| --- | --- | --- | --- |
| Primary | 蓝底白字 | 深蓝底 | 淡蓝底白字 |
| Success | 绿底白字 | 深绿底 | 淡绿底白字 |
| Secondary | 白底灰边黑字 | 浅灰底/灰边 | 灰字灰边 |
| Warning | 白底橙边橙字 | 浅橙底 | 淡橙字/边 |

尺寸：

- 高度：36px
- 宽度：约 103px
- 圆角：8px
- 图标：16px
- 图标与文字间距：6px

## 12. 状态说明与设计 Tokens

坐标：x 24, y 890, w 1389, h 176

状态：

- 默认：未选择任何胜出方案。
- 胜出：选中一侧为最终方案，蓝色高亮。
- 中性：未选中且不突出显示。
- 禁用：操作不可用，透明度约 40%。

规格：

| Token | 值 |
| --- | --- |
| 卡片圆角 | 12px |
| 按钮圆角 | 8px |
| 标签圆角 | 999px |
| 卡片阴影 | `0 2px 8px rgba(16,24,40,0.06)` |
| 选中阴影 | `0 8px 24px rgba(16,24,40,0.08)` |
| 内边距 | 16px |
| 组件间距 | 16px-24px |
| 区块间距 | 24px-32px |

颜色：

- 主色：`#2563EB`
- 成功：`#16A34A`
- 警告：`#F59E0B`
- 中性文本：`#1F2329`
- 背景：`#F8FAFC`
- 边框：`#E5E7EB`

字体：

- 标题：16px / Semibold / `#111827`
- 正文：14px / Regular / `#1F2329`
- 辅助：12px / Regular / `#6B7280`
- 链接：14px / Medium / `#2563EB`

## 13. 开发组件建议

建议拆分：

```text
ABTestComparePanel
ComparePromptCard
CompareHeader
ScoreTag
ABActionBar
ABButton
ContentPreview
ABResultState
```

数据结构：

```ts
type CompareSide = "A" | "B";

type ABPromptCandidate = {
  id: string;
  side: CompareSide;
  title: string;
  score?: number;
  scoreTone: "primary" | "success" | "warning" | "neutral";
  content: string;
  selected?: boolean;
};
```

可访问性：

- 胜出状态不能只靠颜色，应有勾选图标和 `aria-pressed`。
- `重新测试` 和 `保存对比` 要有明确 loading/disabled 状态。
- 对比卡正文截断时应提供完整内容查看入口。
- 双列布局折叠为单列时，A 在上，B 在下，保持阅读顺序。
