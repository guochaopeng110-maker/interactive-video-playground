# Phase 4: 顶层解耦交互 UI 与状态捕获 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-28
**Phase:** 04-ui (顶层解耦交互 UI 与状态捕获)
**Areas discussed:** 交互容器封装与轻量订阅设计, 赛博毛玻璃视觉主题设计, 选项倒计时与超时自动流转机制, 点击反馈与退出动效

---

## 交互容器封装与轻量订阅设计

| Option | Description | Selected |
|--------|-------------|----------|
| Props 驱动 (父组件下发) | 在父组件 App.tsx 内部维护弹窗显示状态，通过 Props 下发给 UI 组件 | |
| 直接订阅模式 (自主解耦) | 构建独立的 `InteractionContainer` 组件，它直接订阅 `NodeStateManager` 实例的事件并发起局部重绘，使父组件保持绝对静态 | ✓ |

**User's choice:** 直接订阅模式
**Notes:** 采用轻量订阅设计，能够完全避免频繁的播放器 timeupdate 导致顶层 App 组件大范围无谓重绘，实现完美的 0 卡顿 60 FPS 电影级交互效果。

---

## 赛博毛玻璃视觉主题设计

| Option | Description | Selected |
|--------|-------------|----------|
| 赛博炫彩毛玻璃 (Vibrant Cyber-Glass) | 极强 backdrop-blur-xl + 炫彩渐变外发光边框 + 悬停 3D 卡片缩放悬浮微动效 + outfit 字体 | ✓ |
| 极简现代极客 (Minimalist Tech) | 柔和暗黑毛玻璃面板 + 极细单色边框 + 扁平化无缩放微悬浮效果 | |

**User's choice:** 赛博炫彩毛玻璃 (Vibrant Cyber-Glass)
**Notes:** 赛博毛玻璃能够提供高级、奢华的界面视觉沉浸感，渐变发光配合悬停时 3D 卡片缩放能为互动电影 Demo 增添完美的现代质感。

---

## 选项倒计时与超时自动流转机制

| Option | Description | Selected |
|--------|-------------|----------|
| 线性渐变倒计时 + 自动跳转默认 (Recommended) | 弹窗顶部呈现 3px 水平渐变倒计时，限时 10 秒。超时后自动流转到 storyConfig 中指定的 defaultNextNodeId (或第一个分支兜底) | ✓ |
| 无倒计时 (无限期挂起) | 展示弹窗后，视频无限期暂停等待用户点击，无超时流转与进度提示 | |

**User's choice:** 线性渐变倒计时 + 自动跳转默认
**Notes:** 10秒时间限制极大增强了游戏的紧张感与探索代入感，同时超时安全流转机制彻底防范了游戏无响应或无限挂起的致命问题。

---

## 点击反馈与退出动效

| Option | Description | Selected |
|--------|-------------|----------|
| 点击锁定 + 平滑缩放淡出 | 点击后置灰所有选项，面板在 200ms 内向内缩放淡出，并分发跳转指令实现底层物理瞬间硬切对调 | ✓ |
| 瞬间直接隐去 | 点击后无点击锁定，面板瞬间关闭并重置状态，无平滑动画 | |

**User's choice:** 点击锁定 + 平滑缩放淡出
**Notes:** 200ms 的平滑缩放淡出（scale-95 opacity-0）为底层双实例 z-index 瞬间硬切提供完美的视觉衔接与心理缓冲，极大优化了最终用户的转场感观。

---

## the agent's Discretion

- 倒计时结束时兜底逻辑的选择形式。
- 具体渐变色色系微调及 CSS Shadows 设计。
- 是否对小屏幕手机端进行触底抽屉式响应式布局适配。

## Deferred Ideas

- 视频资产（/public/assets/）的最终真实替换与完整联合调试（留至 Phase 5 最终 UAT）。
