# Phase 3: 双实例交替播放核心 (PLAY) - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段的目标是攻克本地 MP4 视频切换黑屏顽疾，实现底层双 Video DOM 的物理交替无缝拼接。具体包括开发 `InteractivePlayer` 核心媒体组件，管理两个 Shaka Player 实例，并设计高性能的预加载时机控制与无缝瞬间物理切换算法，实现过渡时间差控制在 50ms 以内的绝对流畅电影级交互体验。

</domain>

<decisions>
## Implementation Decisions

### 预加载控制策略 (Preloading Trigger & Control)
- **D-01:** 采用**临近预加载**机制。当主线视频（当前 Foreground 播放器）播放到距离下一个交互选项点 5 - 8 秒的缓冲窗口时，启动后台 Background 播放器对候选分支节点的流媒体加载，以此降低用户提早退出时的带宽资源损耗。
- **D-02:** 默认对 `NodeStateManager.getPreloadCandidateNodeIds()` 中列出的所有后续备选分支进行静默加载，确保备选路径 100% 覆盖。

### 画面过渡方案 (Visual Transition Effect)
- **D-03:** 采用**瞬间物理硬切**方案。在触发跳转的时刻，直接对前后台两个 Video DOM 执行 CSS 层级（`z-index`）瞬间互换和显示属性物理硬覆盖，不引入透明度渐变过渡动画。切换过渡时间差控制在 50ms 以内，以提供最极致的电影级无缝帧级衔接。

### 播放器实例管理 (Shaka Player Instance Management)
- **D-04:** 采用**静态双播放器回收重用池**。系统全局常驻且只挂载 2 个 Video 标签，并实例化 2 个固定的 Shaka Player。两个实例交替扮演 Foreground 和 Background 角色。当发生跳转后，前台变后台，后台变前台。在需要下一次预加载时，直接在当前的后台实例上执行 `load()` 操作，彻底避免高频销毁和重建 Shaka.Player 带来的 CPU 瞬时飙高与垃圾回收开销。

### 音频泄漏防范 (Explicit Background Mute Lock)
- **D-05:** 实施**后台显式静音锁**机制。任何处于 Background 预加载状态的播放器，其物理 `muted` 属性必须强制设为 `true`，且 `volume` 设为 `0`。只有在发生物理瞬间切换成为 Foreground 播放器的时刻，才解除音频锁定恢复正常声音，彻底杜绝现代浏览器预填充缓冲区或 seek 寻道时可能产生的瞬时“爆音”与“声音泄漏”。

### the agent's Discretion
- 静态回收池两播放器实例的交替切换调度（A/B 双实例逻辑状态机管理）。
- CSS 具体的 z-index 浮动范围与层级细节实现（如 `z-10` 与 `z-20` 的交替）。
- Shaka Player 实例的具体初始化参数与缓冲容量配置。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 互动视频引擎核心规划
- [PROJECT.md](file:///f:/Projects/Interective-Video/InteractiveVideoDemo/.planning/PROJECT.md) — 互动引擎整体架构与核心双实例预加载决策
- [REQUIREMENTS.md](file:///f:/Projects/Interective-Video/InteractiveVideoDemo/.planning/REQUIREMENTS.md) — v1 Requirements 中的 PLAY 部分（PLAY-01 至 PLAY-04）
- [STATE.md](file:///f:/Projects/Interective-Video/InteractiveVideoDemo/.planning/STATE.md) — 项目最新开发与执行状态追踪
- [02-CONTEXT.md](file:///f:/Projects/Interective-Video/InteractiveVideoDemo/.planning/phases/02-datadrive/02-CONTEXT.md) — 了解 `NodeStateManager` 的事件订阅与节点后续预加载候选获取 `getPreloadCandidateNodeIds()` API 规范

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- [NodeStateManager](file:///f:/Projects/Interective-Video/InteractiveVideoDemo/src/engine/NodeStateManager.ts): 用于驱动整个引擎状态流转。Phase 3 需要订阅 `nodeChanged` 和 `interactionTriggered` 等事件，并调用其 `getPreloadCandidateNodeIds()` 获悉当下需要预加载的分支。
- [types.ts](file:///f:/Projects/Interective-Video/InteractiveVideoDemo/src/engine/types.ts): 包含了 `StoryConfig` 和 `VideoNode` 等强类型接口契约。

### Established Patterns
- **事件驱动解耦 (Event-Driven)**: 核心状态管理器与 UI/媒体层完全脱钩。底层播放器通过监听事件并 tick 驱动 NodeStateManager 状态轴。
- **沙盒冒烟测试 (Sandbox Smoke Test)**: 在 `main.tsx` 中保留了完善的虚拟 Tick 时钟和状态自检自驱逻辑。

### Integration Points
- **InteractivePlayer**: 本阶段将设计并开发的核心 React 媒体组件，放置于 React 应用层，替代原先 `App.tsx` 中的单实例测试播放器。

</code_context>

<specifics>
## Specific Ideas

- 用户期望双 Video 在物理拼合时无任何视觉停顿。开发时需细致同步“旧播放器暂停(pause) + 隐藏”和“新播放器播放(play) + 显示”的微秒级指令，优先通过 `Promise.all` 或顺序微任务极速调度。

</specifics>

<deferred>
## Deferred Ideas

- 磨砂玻璃毛玻璃卡片（Glassmorphism）、微悬停交互动效 UI（Interaction Container React 渲染） — 留至 Phase 4 研发。
- 真实本地资产放入 `/public/assets/` 及全链路 UAT 最终调试 — 留至 Phase 5 研发。

</deferred>

---

*Phase: 03-play*
*Context gathered: 2026-05-28*
