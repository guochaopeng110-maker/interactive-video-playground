# Phase 4: 顶层解耦交互 UI 与状态捕获 - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段的目标是构建视觉体验极佳的顶层解耦交互 UI 与状态捕获层。具体包括：设计高内聚、低耦合的 React 交互容器组件 `InteractionContainer`，通过直接订阅 `NodeStateManager` 事件的方式处理弹窗展示与流转路由，从而完全剥离 App.tsx 重绘逻辑；使用高性能的 useRef 时间追踪与低频渲染策略，防范 React 状态频繁 Re-render 带来的卡顿；开发具备现代动效与赛博毛玻璃美学设计（Glassmorphism）、带有渐变发光边框和选项悬停 3D 微动效的交互选择弹窗卡片，同时整合 10 秒超时线性倒计时自动流转安全保障机制。

</domain>

<decisions>
## Implementation Decisions

### 交互容器封装与轻量订阅设计
- **D-01:** 构建完全解耦的 `InteractionContainer` 组件。该组件直接传入 `NodeStateManager` 实例，并在其内部单独订阅 `interactionTriggered`（触发交互弹出弹窗）和 `nodeChanged`（切换节点时淡出隐藏）事件。
- **D-02:** 采用高性能低频渲染策略。视频播放的 timeupdate 高频 tick 仅作用于底层播放器和状态机内部，`App.tsx` 保持绝对静态，完全不感知弹窗触发的 React 状态变化，从而将弹窗重绘范围完美限制在 `InteractionContainer` 内部，保障 60 FPS 流畅度。
- **D-03:** 用户在 UI 中选择选项后，UI 内部直接调用 `stateManager.selectOption(targetNodeId)`，这会触发 `nodeChanged` 事件，`InteractionContainer` 监听到此事件后淡出隐藏，底层播放器瞬间物理硬切。

### 赛博毛玻璃视觉主题设计
- **D-04:** 采用**赛博炫彩毛玻璃（Vibrant Cyber-Glassmorphism）**视觉美学：
  - 卡片面板：使用 `backdrop-blur-xl bg-slate-900/60 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]`，使弹窗在主视频背景之上呈现出半透明悬浮质感。
  - 炫彩渐变发光边框：使用紫罗兰到玫红的渐变色（`from-violet-500 to-fuchsia-500`），悬停在选项上时，激活外发光阴影。
  - 悬停动效：选项按钮采用微放大（`scale-[1.02]`）和平滑微动过渡，右侧箭头 `→` 向右滑出（`translate-x-1`）。
  - 字体排版：引入 `Inter` 和 `Outfit` 等现代无衬线字体，增加整体交互的现代科技质感。

### 倒计时与超时自动流转机制
- **D-05:** 引入**线性渐变倒计时进度条**。进度条位于弹窗卡片最顶部，高度为 `3px`，背景为 `bg-slate-800`，前景为从左至右不断缩减的渐变色条。
- **D-06:** 倒计时限制为 10 秒（若 `storyConfig.json` 节点中配置了其他时长则优先采用），在此期间视频暂停（或保持静止帧）。
- **D-07:** 超时安全自动流转：倒计时归零时，系统自动触发并调用 `stateManager.selectOption` 跳转到节点的 `defaultNextNodeId`。若未配置 `defaultNextNodeId`，则以当前节点的第一个分支选项作为兜底，防止画面无限卡死。

### 点击反馈与退出动效
- **D-08:** 被点击选项瞬间被锁定（置灰其他选项，防止重复点击触发竞态），并可显示精细的加载态（Loading...）。
- **D-09:** 面板在 200ms 内执行平滑的缩放和淡出动画（`scale-95 opacity-0`），在动画开始执行的瞬间分发指令，实现底层双实例物理硬切的无缝对接。

### the agent's Discretion
- 超时自动流转兜底逻辑中，是否加入微小的提示（例如：“由于您未做出选择，系统已为您自动流转...”）。
- 具体渐变色的色值调配与发光模糊度阴影（如 `box-shadow`）微调。
- 是否对移动端进行响应式排版适配（如在小屏幕上自动转化为下方抽屉式弹窗等细节）。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 互动引擎顶层设计与需求
- [PROJECT.md](file:///f:/Projects/Interective-Video/InteractiveVideoDemo/.planning/PROJECT.md) — 互动引擎核心理念、双实例切换架构与 Out of Scope 边界
- [REQUIREMENTS.md](file:///f:/Projects/Interective-Video/InteractiveVideoDemo/.planning/REQUIREMENTS.md) — 交互层 UI-01 至 UI-05 详细需求说明
- [ROADMAP.md](file:///f:/Projects/Interective-Video/InteractiveVideoDemo/.planning/ROADMAP.md) — 了解 Phase 4 顶层解耦与状态捕获阶段的目标与交付物

### 前序上下文与已有代码
- [02-CONTEXT.md](file:///f:/Projects/Interective-Video/InteractiveVideoDemo/.planning/phases/02-datadrive/02-CONTEXT.md) — 了解 `NodeStateManager` 的事件订阅与节点逻辑管理 API
- [03-CONTEXT.md](file:///f:/Projects/Interective-Video/InteractiveVideoDemo/.planning/phases/03-play/03-CONTEXT.md) — 了解底层双实例 `InteractivePlayer` 组件的物理切换与音频平滑淡入逻辑
- [NodeStateManager.ts](file:///f:/Projects/Interective-Video/InteractiveVideoDemo/src/engine/NodeStateManager.ts) — 状态机 Tick 推动、跳转及事件管理类
- [InteractivePlayer.tsx](file:///f:/Projects/Interective-Video/InteractiveVideoDemo/src/components/InteractivePlayer.tsx) — 双播放器物理实例交替及 z-index 硬切组件

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- [NodeStateManager](file:///f:/Projects/Interective-Video/InteractiveVideoDemo/src/engine/NodeStateManager.ts)：可以通过 `stateManager.on('interactionTriggered', callback)` 与 `stateManager.on('nodeChanged', callback)` 直接在 `InteractionContainer` 中订阅相应状态。
- Tailwind CSS：项目中集成了 Tailwind CSS v4，拥有强大的内置毛玻璃滤镜（`backdrop-blur-xl`）、渐变边框和变换动效。

### Established Patterns
- **高阶事件机制**：引擎依靠订阅模式，由底层播放器的 tick 不间断驱动，高频更新不应当传导给上层 UI 组件的根节点。
- **UI 与播放完全解耦**：UI 弹窗只是对当前状态的被动呈现，点击只向状态机分发跳转指令。

### Integration Points
- 新组件 `InteractionContainer.tsx` 应放入 `src/components/`。
- 在 `src/App.tsx` 中引入 `InteractionContainer` 并将 `stateManager` 传入，移除原有的 `activeInteraction` 内部弹窗逻辑，清理父组件 state 冗余。

</code_context>

<specifics>
## Specific Ideas

- 毛玻璃卡片使用微动效在鼠标悬浮时产生轻微的 HSL 渐变，并在面板底部或者偏上部提供一个清晰直观的 10 秒倒计时条，增强电影级游戏的代入感。

</specifics>

<deferred>
## Deferred Ideas

- 视频资产（/public/assets/）的最终真实替换及联合调试 — 留至 Phase 5 最终 UAT 阶段。

</deferred>

---

*Phase: 04-ui*
*Context gathered: 2026-05-28*
