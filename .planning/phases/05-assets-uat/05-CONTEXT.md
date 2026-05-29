# Phase 5: 资产配置与全链路联合调试 - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary (Phase 5 边界)

Phase 5 为项目的收尾验证阶段，目标是部署本地多媒体测试资产，对整个互动视频状态机进行端到端的全链路联合调试，并编写全链路的集成测试，从技术与体验物理双层维度确保引擎的“分支无缝物理切换（无黑屏、过渡时间差 < 100ms）”核心价值完美兑现。

</domain>

<decisions>
## Implementation Decisions (实现决策)

### 1. 测试资产规格与标准化转码指南 (Video Asset Standardization & Codec)
- **D-01**：在交付文档中建立并集成一份标准的 `FFmpeg` 转码脚本指令规范（固定使用 H.264 High Profile 视频编码、GOP=30 闭合 GOP、禁用场景切换检测 `sc_threshold=0`、AAC 音频编码、44.1kHz 采样率），使测试资产的帧率、分辨率和关键帧物理结构保持高度一致，以达到物理无缝切换的要求。

### 2. 切换延时 (Switch Latency) 的物理量化与调试抽屉实时展示
- **D-02**：在 `InteractivePlayer` 及 `NodeStateManager` 切换瞬间，记录前一个播放器 `pause` 与下一个播放器播放事件触发的 `performance.now()` 时间差。
- **D-03**：将该切换延迟毫秒级数值（例如 `Switch Latency: 42ms`）保存并呈现在前端的**极客调试抽屉 (Debug Drawer)** 中，为无缝体验的验证提供直观、客观的指标数据支持。

### 3. 交互超时未选择 (Timeout Choice) 时的静默物理拼接设计
- **D-04**：当剧情播放进入倒计时终点且用户未作出选择时，引擎应视作用户选择进入主干/默认选项。
- **D-05**：在倒计时触底时刻，立即静默分发默认分支的流转指令（`defaultNextNodeId: "branch_a"`），并启动无缝物理预加载切换，与用户手动点击切换一致，保证播放链路完全不中断，不引入任何多余的淡出/黑屏黑过渡。

### 4. 全链路 UAT 的自动化集成测试 (Vitest Integration Testing)
- **D-06**：在 `src/components/__tests__/` 编写全链路的 Vitest 集成测试，通过模拟播放进度与播放器底层广播事件，测试并断言完整的“主线播放 -> 到达 10s 触发倒计时与交互显示 -> 15s 倒计时结束/选择分支 -> 双实例无缝切换”的全链路状态流转机制，保证引擎逻辑在迭代时的回归安全性。

### the agent's Discretion (AI 自由裁量区)
- 无特别要求 — 均采用项目推荐之最佳实践，细节实现由 Planner 和 Executor 依 Vitest 单元与集成测试为依据自由实现。

</decisions>

<canonical_refs>
## Canonical References (权威参考)

**Downstream agents MUST read these before planning or implementing.**

### 规划与需求定义
- [.planning/ROADMAP.md](file:///f:/Projects/Interective-Video/InteractiveVideoDemo/.planning/ROADMAP.md) — Phase 5 阶段目标与流转定义。
- [.planning/REQUIREMENTS.md](file:///f:/Projects/Interective-Video/InteractiveVideoDemo/.planning/REQUIREMENTS.md) — 最终验证要求 VLD-01 与 VLD-02 条目。

### 媒体播放器底层与状态核心
- [src/components/InteractivePlayer.tsx](file:///f:/Projects/Interective-Video/InteractiveVideoDemo/src/components/InteractivePlayer.tsx) — 双实例预加载切换与 Player A/B 绑定核心架构。
- [src/engine/NodeStateManager.ts](file:///f:/Projects/Interective-Video/InteractiveVideoDemo/src/engine/NodeStateManager.ts) — 状态机管理与 nodeChanged/playbackFinished 事件广播总线。

</canonical_refs>

<code_context>
## Existing Code Insights (代码上下文)

### Reusable Assets (可复用资产)
- `InteractivePlayer.tsx`：提供底层两个 shaka-player 实例的交替切换与 buffering 管理功能。
- `InteractionContainer.tsx`：提供磨砂玻璃卡片（Glassmorphism）分支交互弹窗及 10 秒倒计时条（Progress Bar）功能。
- `DebugDrawer.tsx`：用于保存并展示当前访问路径、活跃播放器和切换时差。

### Established Patterns (已建立模式)
- 使用 `useRef` 控制进度轮询与时间捕获，避免高频 React Re-render。
- 视频 A/B 播放器容器层叠定位，使用 `z-index` 与 `opacity` 完成静默交替切换。

### Integration Points (集成点)
- 视频多媒体资产存放路径 `/public/assets/` 下（包含 `intro.mp4`, `branch_a.mp4`, `branch_b.mp4`）。
- 全局主配置文件 `/public/storyConfig.json` 包含各节点时长、互动阈值和对应资产映射。

</code_context>

<specifics>
## Specific Ideas (特定设想)
- 对转码后的三个视频进行校验时，可以由 AI 编写一份简单的 `verify-transcode.sh` 脚本（或 Node 脚本）检查资产的音频、视频参数是否一致，确保在其他环境联合调试时的稳健性。

</specifics>

<deferred>
## Deferred Ideas (延期设想)
- **HLS/DASH 动态流切片** — 延期至 v2 版本讨论，暂不对本地 MP4 架构做大规模破坏性重构。

</deferred>

---

*Phase: 5-资产配置与全链路联合调试*
*Context gathered: 2026-05-29*
