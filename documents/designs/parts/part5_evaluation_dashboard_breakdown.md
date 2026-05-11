# Part 5：评估看板模块详细拆解

源图：`ui/part5.png`  
尺寸：`1448 x 1086`

本文件只覆盖 Part 5。机器可读坐标和资产清单见：

- `assets/promptball/part5/part5.manifest.json`
- `assets/promptball/part5/icons/`
- `assets/promptball/part5/charts/`

## 1. 页面结构

| 编号 | 区域 | 坐标估算 | 交付状态 |
| --- | --- | --- | --- |
| 1 | 完整仪表盘示例 | x 341, y 48, w 1064, h 412 | 已拆 sidebar、metric row、图表、排行 |
| 2 | 左侧导航 Mini Tabs | x 26, y 526, w 132, h 222 | 已生成 7 个侧栏图标 |
| 3 | 指标卡片 | x 207, y 562, w 168, h 115 | 已拆 label/value/delta/meta/sparkline |
| 4 | 趋势图卡片 | x 529, y 526, w 303, h 221 | 已记录折线图数据和颜色 |
| 5 | 分布图卡片 | x 862, y 526, w 243, h 221 | 已记录 donut legend |
| 6 | 排行榜卡片 | x 1139, y 526, w 242, h 221 | 已记录 tab 和排名行 |
| 7 | 基础组件 | x 26, y 835, w 482, h 130 | 已拆 metric/chart/list row |
| 8 | 图例项 | x 538, y 835, w 142, h 128 | 已生成 legend dots |
| 9 | 小图标 | x 744, y 824, w 166, h 134 | 已补齐 12 个小图标 |
| 10 | 状态 | x 954, y 836, w 469, h 118 | 已拆 loading/empty 状态 |

## 2. 完整评估看板容器

坐标：x 341, y 48, w 1064, h 412

容器规格：

- 背景：`#FFFFFF`
- 边框：`1px solid #E6EAF1`
- 圆角：12px
- 侧栏宽：160px
- 内容区左 padding：约 26px
- 卡片间距：20px-24px

布局：

| 子区域 | 坐标估算 | 说明 |
| --- | --- | --- |
| 左侧导航 | x 341, y 48, w 160, h 412 | 评估看板导航 |
| 顶部指标行 | x 527, y 68, w 782, h 108 | 4 张 metric cards |
| 趋势图 | x 523, y 194, w 285, h 250 | 最近表现 7 天 |
| 分布图 | x 824, y 194, w 284, h 250 | 问题维度分布 |
| 排行榜 | x 1125, y 194, w 264, h 250 | Prompt 排行榜 |

## 3. 左侧导航 Mini Tabs

坐标：x 26, y 526, w 132, h 222

导航项：

| 项 | 图标 | 状态 |
| --- | --- | --- |
| 概览 | `sidebar-overview.svg` | Active |
| 评分记录 | `sidebar-score-record.svg` | Default |
| 对比历史 | `sidebar-compare-history.svg` | Default |
| 模型表现 | `sidebar-model-performance.svg` | Default |
| Prompt 统计 | `sidebar-prompt-stats.svg` | Default |
| 团队评估 | `sidebar-team.svg` | Default |
| 回收站 | `sidebar-trash.svg` | Default |

规格：

- 容器宽 132px。
- 行高 32px。
- Active 背景：`#E6F0FF`，文字和图标 `#2563EB`。
- Default 文字/图标：`#64748B`。
- 图标尺寸：16px。

## 4. 指标卡片

坐标：x 207, y 562, w 168, h 115

结构：

- Label：上方 14px/20px/600。
- Value：大号 32px/38px/700。
- Delta：右侧绿色，上箭头 + 数值。
- Meta：`较昨日`，12px 灰色。
- Sparkline：右下角 64 x 24。

示例指标：

| 指标 | 值 | Delta |
| --- | --- | --- |
| 综合评分 | 86 | ↑ 8 |
| 清晰度评分 | 62% | ↑ 6% |
| 完整性评分 | 28% | ↑ 5% |
| 可执行性 | 4.2/5 | ↑ 0.3 |

趋势线资产：

- 成功趋势：`assets/promptball/part5/charts/sparkline-success.svg`
- 灰色趋势：`assets/promptball/part5/charts/sparkline-muted.svg`

## 5. 趋势图卡片（Line Chart Card）

坐标：x 529, y 526, w 303, h 221

内容：

- 标题：`最近表现（7天）`
- 右上角更多：`icon-kebab.svg`
- Legend：综合评分蓝、清晰度评分绿。
- Y 轴：0, 20, 40, 60, 80, 100。
- X 轴：5/12 到 5/18。

颜色：

- 综合评分：`#2563EB`
- 清晰度评分：`#16A34A`
- Grid：`#E6EAF1`
- Axis label：`#64748B`

实现建议：不要切图，使用图表库绘制；SVG 只提供图标与 sparkline 参考。

## 6. 分布图卡片（Donut Chart Card）

坐标：x 862, y 526, w 243, h 221

Legend：

| 类目 | 比例 | 颜色 |
| --- | --- | --- |
| 主题准确 | 28% | `#2563EB` |
| 信息完整 | 22% | `#3B82F6` |
| 逻辑清晰 | 18% | `#16A34A` |
| 可执行性 | 16% | `#8B5CF6` |
| 表达与结构 | 10% | `#F59E0B` |
| 其他 | 6% | `#64748B` |

Donut 规格建议：

- 外径约 98px。
- 环宽约 24px。
- 中心留白。
- 类目超过 6 个时应切换为列表或条形图，避免颜色过多。

## 7. 排行榜卡片

坐标：x 1139, y 526, w 242, h 221

结构：

- 标题：`Prompt 排行榜`
- Tabs：`周榜` active、`月榜`、`总榜`
- 行高：约 28px
- 底部链接：`查看全部排行 ->`

排行行：

| 排名 | 名称 | 分数 |
| --- | --- | --- |
| 1 | Galex - 微信学 | 92 |
| 2 | 学术写作大师（中阶） | 91 |
| 3 | 论文评审助手 | 87 |
| 4 | 代码解释专家 | 85 |
| 5 | 数据分析助手 | 83 |

## 8. 基础组件与图例

基础组件区域：x 26, y 835, w 482, h 130

组件：

- Metric Card：清晰度评分示例。
- Chart Card Empty：图表空状态，使用 `empty-chart.svg`。
- List Row：排行榜单行。

图例项区域：x 538, y 835, w 142, h 128

图例点资产：

- `assets/promptball/part5/charts/legend-dots.svg`

图例行规格：

- 行高 20px。
- 左侧圆点 8px-10px。
- 标签 12px/18px。
- 数值右对齐。

## 9. 小图标集

区域：x 744, y 824, w 166, h 134

已生成：

| 名称 | 文件 |
| --- | --- |
| 柱状图 | `icon-chart-bars.svg` |
| 时间 | `sidebar-score-record.svg` |
| 聚焦方框 | `icon-focus-square.svg` |
| 目标 | `icon-target.svg` |
| 剪贴板 | `icon-clipboard.svg` |
| 团队 | `sidebar-team.svg` |
| 删除 | `sidebar-trash.svg` |
| 左箭头 | `icon-chevron-left.svg` |
| 右箭头 | `icon-chevron-right.svg` |
| 趋势上升 | `icon-trend-up.svg` |
| 更多 | `icon-kebab.svg` |
| 展开 | `icon-expand-diagonal.svg` |

## 10. 状态

区域：x 954, y 836, w 469, h 118

状态：

| 状态 | 坐标估算 | 说明 |
| --- | --- | --- |
| 指标卡加载中 | x 954, y 838, w 100, h 114 | skeleton 圆点 + 文本条 |
| 图表卡空状态 | x 1074, y 838, w 100, h 114 | `empty-chart.svg` + `暂无数据` |
| 图表卡加载中 | x 1194, y 838, w 100, h 114 | `loading-spinner.svg` + `加载中...` |
| 排行榜空状态 | x 1318, y 838, w 106, h 114 | skeleton list + `暂无` |

## 11. 设计规范

底部设计规范区域：x 26, y 994, w 1398, h 74

| Token | 值 |
| --- | --- |
| 圆角 | 12px |
| 边框 | `1px #E6EAF1` |
| 背景 | `#F7F8FA` |
| 卡片背景 | `#FFFFFF` |
| 卡片阴影 | `0 2px 8px rgba(16,24,40,0.06)` |
| 主色 | `#2563EB` |
| 成功 | `#16A34A` |
| 信息 | `#3B82F6` |
| 辅助 | `#8B5CF6` |
| 警告 | `#F59E0B` |
| 中性 | `#64748B` |

## 12. 开发组件建议

建议拆分：

```text
EvaluationDashboard
EvaluationSidebar
EvaluationMetricCard
Sparkline
LineChartCard
DonutChartCard
RankingCard
LegendItem
ChartEmptyState
ChartLoadingState
MetricSkeleton
RankingEmptyState
```

数据结构：

```ts
type MetricCardModel = {
  label: string;
  value: string;
  delta: string;
  deltaTone: "success" | "warning" | "danger" | "neutral";
  meta: string;
  sparkline: number[];
};

type DonutDatum = {
  label: string;
  value: number;
  color: string;
};
```

可访问性：

- 图表必须提供文字摘要，不只靠颜色表达。
- Legend 要显示文本和数值。
- Loading 状态使用 `aria-busy`。
- 排行榜行应有明确排名文本，避免只靠颜色区分前三名。
