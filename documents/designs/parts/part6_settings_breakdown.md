# Part 6：设置模块详细拆解

源图：`ui/part6.png`  
尺寸：`1448 x 1086`

本文件只覆盖 Part 6。机器可读坐标和资产清单见：

- `assets/promptball/part6/part6.manifest.json`
- `assets/promptball/part6/icons/`
- `assets/promptball/part6/controls/`

## 1. 页面结构

| 编号 | 区域 | 坐标估算 | 交付状态 |
| --- | --- | --- | --- |
| 1 | 设置容器完整示例 | x 25, y 92, w 755, h 350 | 已拆左导航、服务列表、右表单 |
| 2 | 左侧设置导航 | x 817, y 167, w 572, h 254 | 已拆 default/hover/active |
| 3 | 模型与服务区域 | x 26, y 462, w 258, h 225 | 已补 Provider 图标 |
| 4 | API Key 输入组件 | x 299, y 462, w 369, h 225 | 已拆输入、select、toggle |
| 5 | 下拉选择器 | x 681, y 462, w 488, h 225 | 已拆 default/open/disabled |
| 6 | 开关 Toggle | x 1198, y 460, w 224, h 190 | 已生成三态 SVG |
| 7 | 状态徽章 Badge | x 26, y 701, w 164, h 174 | 已记录 4 种徽章 |
| 8 | 输入框状态 | x 199, y 700, w 469, h 176 | 已拆 default/focus/error/disabled |
| 9 | 右侧配置表单卡片 | x 681, y 700, w 436, h 176 | 已拆表单布局 |
| 10 | 图标库 | x 1129, y 648, w 292, h 226 | 已补导航与控制图标 |
| 11 | 颜色与规格说明 | x 25, y 890, w 1398, h 158 | 已提取 colors/radius/shadow |

## 2. 设置容器完整示例

坐标：x 25, y 92, w 755, h 350

容器规格：

- 背景：`#FFFFFF`
- 圆角：12px
- 边框：`1px solid #E5E7EB`
- 阴影：`0 8px 24px rgba(15,23,42,0.06)`

布局：

| 子区域 | 坐标估算 | 说明 |
| --- | --- | --- |
| 左侧设置导航 | x 48, y 137, w 154, h 292 | 8 项设置菜单 |
| 模型与服务列表 | x 224, y 137, w 222, h 292 | Provider 列表 |
| 右侧表单 | x 466, y 166, w 292, h 255 | API Key、模型、组织、备用模型 |

## 3. 左侧设置导航

区域：x 817, y 167, w 572, h 254

状态：

| 状态 | 坐标 | 视觉 |
| --- | --- | --- |
| Default | x 817, y 167, w 150, h 254 | 白底，灰色图标/文字 |
| Hover | x 1009, y 167, w 168, h 254 | 当前项浅灰蓝背景 |
| Active | x 1230, y 167, w 160, h 254 | 背景 `#E6F0FF`，图标/文字蓝色 |

菜单项：

| 项 | 图标 |
| --- | --- |
| 通用设置 | `settings-general.svg` |
| 模型与服务 | `settings-model.svg` |
| 提示词偏好 | `settings-prompt.svg` |
| 外观 | `settings-appearance.svg` |
| 绑定 | `settings-binding.svg` |
| 数据与隐私 | `settings-privacy.svg` |
| 团队与协作 | `settings-team.svg` |
| API / Playground | `settings-api.svg` |

规格：

- 行高：32px
- 图标：16px
- 文字：13px/18px
- 圆角：6px-8px

## 4. 模型与服务区域

坐标：x 26, y 462, w 258, h 225

Provider 行：

| Provider | 图标 | 状态 |
| --- | --- | --- |
| DeepSeek | `provider-deepseek.svg` | 已连接 |
| OpenAI | `provider-openai.svg` | 已连接 |
| Anthropic | `provider-anthropic.svg` | 未连接 |
| 火山引擎 | `provider-volcano.svg` | 未连接 |
| 自定义（OpenAI 兼容） | `provider-custom.svg` | 未连接 |
| 本地 | `provider-local.svg` | 未连接 |

行规格：

- 行高：33px
- 左侧连接点：8px
- Provider 图标：16px
- Badge 高：20px，圆角 999px

Badge 颜色：

- 已连接：浅绿底 `#DCFCE7`，文字 `#16A34A`
- 未连接：浅灰底 `#F1F5F9`，文字 `#64748B`

## 5. API Key 输入组件

坐标：x 299, y 462, w 369, h 225

组件：

| 子项 | 坐标估算 | 规格 |
| --- | --- | --- |
| API Key 输入 | x 321, y 522, w 318, h 36 | 掩码显示，右侧重置按钮 |
| 默认模型 Select | x 321, y 591, w 143, h 36 | `deepseek-v3` |
| 默认组织 Select | x 484, y 591, w 143, h 36 | `自定义组织名称` |
| 备用模型 Toggle | x 604, y 640, w 36, h 22 | 默认 On |

安全要求：

- API Key 永远掩码显示。
- 不在示例、文档、测试数据里写真实 key。
- 重置按钮必须清晰表达作用，建议二次确认或撤销。

## 6. 下拉选择器

区域：x 681, y 462, w 488, h 225

状态：

| 状态 | 坐标 | 说明 |
| --- | --- | --- |
| Default | x 699, y 522, w 132, h 32 | 白底灰边 |
| Open | x 858, y 522, w 138, h 143 | 蓝色 focus 边框 + 下拉列表 |
| Disabled | x 1020, y 522, w 132, h 32 | 浅灰背景，不可操作 |

Open 列表选项：

- `deepseek-v3`
- `deepseek-r1`
- `gpt-4o`
- `gpt-4-turbo`
- `claude-3-5-sonnet`

## 7. 开关 Toggle

区域：x 1198, y 460, w 224, h 190

三态资产：

- On：`assets/promptball/part6/controls/toggle-on.svg`
- Off：`assets/promptball/part6/controls/toggle-off.svg`
- Disabled：`assets/promptball/part6/controls/toggle-disabled.svg`

规格：

- 尺寸：38 x 22
- 圆角：999px
- On 轨道：`#2563EB`
- Off 轨道：`#CBD5E1`
- Thumb：白色圆形 16px

## 8. 状态徽章

区域：x 26, y 701, w 164, h 174

徽章：

| 文案 | 样式 |
| --- | --- |
| 已连接 | 绿底绿字 |
| 未连接 | 灰底灰字 |
| 已启用 | 绿底绿字 |
| 默认模型 | 蓝色描边/浅蓝底 |

规格：

- 高度：22px
- 圆角：999px
- 字号：12px/18px/600

## 9. 输入框 / 表单项状态

区域：x 199, y 700, w 469, h 176

状态：

| 状态 | 视觉 |
| --- | --- |
| Default | 白底，灰边，placeholder 灰 |
| Focus | 白底，蓝色边框 |
| Error | 白底，红色边框，下方错误文字 |
| Disabled | 浅灰底，灰文字，不可操作 |

错误文案：`请输入有效内容`

## 10. 右侧配置表单卡片

坐标：x 681, y 700, w 436, h 176

布局：

- 双列表单：左列 API Key / 默认模型，右列 默认组织 / 备用模型。
- 行间距 18px-20px。
- 控件高 34px-36px。
- Toggle 对齐说明文字右侧。

## 11. 图标库

区域：x 1129, y 648, w 292, h 226

图标：

| 名称 | 文件 |
| --- | --- |
| 通用设置 | `settings-general.svg` |
| 模型与服务 | `settings-model.svg` |
| 提示词偏好 | `settings-prompt.svg` |
| 外观 | `settings-appearance.svg` |
| 绑定 | `settings-binding.svg` |
| 数据与隐私 | `settings-privacy.svg` |
| 团队与协作 | `settings-team.svg` |
| API / Playground | `settings-api.svg` |
| 重置 | `control-reset.svg` |
| 复制 | `control-copy.svg` |
| 显示 | `control-show.svg` |
| 隐藏 | `control-hide.svg` |
| 下拉 | `../part3/icons/control-chevron-down.svg` |
| 收起 | `../part3/icons/control-chevron-down-16.svg`（旋转 180deg 使用） |
| 勾选 | `control-check.svg` |
| 关闭 | `control-close.svg` |

## 12. 颜色与规格

区域：x 25, y 890, w 1398, h 158

颜色：

| Token | 值 |
| --- | --- |
| Primary Blue | `#2563EB` |
| Success Green | `#16A34A` |
| Neutral 900 | `#0F172A` |
| Neutral 700 | `#334155` |
| Neutral 500 | `#64748B` |
| Neutral 400 | `#94A3B8` |
| Neutral 300 | `#CBD5E1` |
| Neutral 200 | `#E2E8F0` |
| Neutral 100 | `#F1F5F9` |
| Background | `#F8FAFC` |
| Surface | `#FFFFFF` |

规格：

- 分割线：`1px #E5E7EB`
- 卡片边框：`1px #E5E7EB`
- 卡片圆角：12px
- 按钮圆角：8px
- 输入框圆角：8px
- 徽章圆角：999px
- 卡片阴影：`0 8px 24px rgba(15,23,42,0.06)`
- Hover 阴影：`0 12px 32px rgba(15,23,42,0.10)`

## 13. 开发组件建议

建议拆分：

```text
SettingsShell
SettingsNav
SettingsNavItem
ProviderServiceList
ProviderServiceRow
ConnectionBadge
ApiKeyField
ModelSelect
SettingsToggle
SettingsFormCard
InputStateDemo
```

数据结构：

```ts
type SettingsNavItemId =
  | "general"
  | "model"
  | "prompt"
  | "appearance"
  | "binding"
  | "privacy"
  | "team"
  | "api";

type ProviderStatus = "connected" | "disconnected";
```

可访问性：

- API Key 输入必须支持密码管理器语义和隐藏/显示状态。
- Toggle 使用真实 checkbox/switch 语义。
- Select 打开态要支持键盘上下选择。
- Error 状态必须有错误文本，不只靠红色边框。
