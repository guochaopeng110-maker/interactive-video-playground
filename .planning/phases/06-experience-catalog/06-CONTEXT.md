# Phase 6: 体验升级与结构化章节目录 - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning

<domain>
## Phase Boundary (Phase 6 边界)

Phase 6 为项目的体验增强与演示优化阶段。目标是解决演示过程中“无法快进跳跃”以及“无法直观展示剧情结构”的痛点。我们将在底层播放器注入进度跳转拦截算法，并在顶层提供高颜值的常驻剧本目录面板，使得引擎既能结构化演示，又能灵活调节节奏。

</domain>

<decisions>
## Implementation Decisions (实现决策)

### 1. 进度条交互化与指针操作适配 (Interactable Timeline)
- **D-01**：对播放器进度条组件进行修改，使其响应 `onClick` / `onMouseDown` 事件。通过点击的坐标与进度条宽度的比例计算跳转时刻 $T_{target}$，移除 `pointer-events-none` 限制。

### 2. 跳转时跨越交互点的拦截截断机制 (Jump Interception)
- **D-02**：如果跳转的目标时间 $T_{target}$ 跨越了当前节点的交互阈值时刻 $T_{inter}$，则跳转时间自动重置为该交互时刻 $T_{inter}$。同时强制调用播放器 `pause` 和 `stateManager.tick(T_inter)`，立即呈现毛玻璃选项卡，防止演示者通过拉进度条直接绕过剧情选择。

### 3. 常驻毛玻璃章节目录卡片 (Story Catalog Card)
- **D-03**：在主界面右侧开发一个全新的 `StoryCatalog.tsx` 组件，使用树状/层级缩进列表完整展示整本剧的分支节点，在 PC 端以 $9:16$ 模拟器左右分栏的形式并排呈现。
- **D-04**：目录卡片展示全部节点，当前播放节点拥有渐变高亮与呼吸小灯泡动效；已访问分支高亮紫色；未访问分支半透明灰色（但仍可点击跳转，以便于结构性讲解和演示）。

</decisions>

<canonical_refs>
## Canonical References (权威参考)

### 规划与需求定义
- [.planning/ROADMAP.md](file:///f:/Projects/Interective-Video/InteractiveVideoDemo/.planning/ROADMAP.md) — Phase 6 体验增强阶段任务。
- [.planning/REQUIREMENTS.md](file:///f:/Projects/Interective-Video/InteractiveVideoDemo/.planning/REQUIREMENTS.md) — 最终优化要求 EXP-01 与 EXP-02。

### 核心关联代码
- [src/components/InteractivePlayer.tsx](file:///f:/Projects/Interective-Video/InteractiveVideoDemo/src/components/InteractivePlayer.tsx) — 双实例物理播放器与底层进度更新。
- [src/App.tsx](file:///f:/Projects/Interective-Video/InteractiveVideoDemo/src/App.tsx) — 顶层页面布局集成入口。

</canonical_refs>

<code_context>
## Existing Code Insights (代码上下文)

### Established Patterns (已建立模式)
- 通过 `stateManager.on('nodeChanged', ...)` 监听逻辑节点切换，同步重置视频时间并刷新相关 UI。
- 利用 Tailwind CSS 完成优雅的磨砂玻璃卡片（`glass-panel`）与深色高科技质感面板。

### Integration Points (集成点)
- 进度条跳转逻辑将直接整合在 `InteractivePlayer.tsx` 底部控制层，不再是纯静态进度显示。
- 新增 `StoryCatalog` 组件将直接整合在 `App.tsx` 页面中，在 PC 端大屏下与播放器实现分栏对称。

</code_context>

<specifics>
## Specific Ideas (特定设想)
- 在目录中显示每个分支节点的选项预览，悬浮在节点上时可以直观看到“此节点会有哪些分支走向”，极大增强剧本故事的结构性呈现。

</specifics>

<deferred>
## Deferred Ideas (延期设想)
- **剧本编辑和导出** — 延期至后续可视化编辑器（EDT-01）中实现，现阶段目录只读。

</deferred>

---

*Phase: 6-体验升级与结构化章节目录*
*Context gathered: 2026-06-11*
