# Phase 2: 数据驱动逻辑层设计 - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段的目标是为互动视频播放引擎实现高内聚、低耦合的“数据驱动”与“状态管理”逻辑核心。具体包括：编写 `storyConfig.json` 互动视频剧情走向的配置规范契约，以及构建节点逻辑管理器 `NodeStateManager`，全面隔离上层 React 组件的渲染逻辑与底层的跳转状态跟踪。

</domain>

<decisions>
## Implementation Decisions

### 配置文件载入与契约设计
- **D-01**: 采用统一的 `storyConfig.json` 配置所有分支视频节点、时长、触发时刻与选项路由。
- **D-02**: 互动类型首期仅支持 `choice`（单项选择），未来可扩展至 `qte` 等其他类型。
- **D-05**: 采用扁平化的统一节点结构，无交互视频节点可通过 `defaultNextNodeId` 进行线性衔接，或者直接将互动选项触发点设计在 `timestamp = duration` 处进行统一流转处理。

### 引擎逻辑管理器架构
- **D-03**: 编写纯 TypeScript 的 `NodeStateManager` 核心类，脱离 React 声明式框架的影响，具备完备的单元可测性。
- **D-04**: 通过状态变更事件订阅（标准的 EventEmitter 模式），向下游双实例播放器及上层 UI 分发节点切换状态，支持注册多个回调，具备高度解耦与扩展性。
- **D-06**: 内置浮点数时间轴容差保护与状态锁，在 `timeupdate` 越过触发时刻时单次激活互动，防止在同一节点内重复触发。

### the agent's Discretion
- `storyConfig.json` 中的各属性命名及可选范围细节。
- 具体的测试驱动或数据校验脚本实现。

</decisions>

<specifics>
## Specific Ideas

- 节点状态机不仅应该管理当前播放的节点，还应该提供“预加载候选节点列表”的方法，以便在 Phase 3 中，底层的双实例播放器能够基于当前播放进度静默调取并预加载备选分支的视频流。

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 互动引擎规划与历史沉淀
- `.planning/PROJECT.md` — 互动引擎核心价值与架构决策
- `.planning/phases/01-environment/01-01-SUMMARY.md` — 基础设施验证总结报告

</canonical_refs>

<deferred>
## Deferred Ideas

- 双实例播放器物理控制与加载调度逻辑（Player A/B 切换逻辑） — 留至 Phase 3 研发。
- 磨砂玻璃动效交互组件（Interaction Container React 渲染） — 留至 Phase 4 研发。

</deferred>

---

*Phase: 02-datadrive*
*Context gathered: 2026-05-27*
