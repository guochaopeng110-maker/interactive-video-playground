# Phase 2: 数据驱动逻辑层设计 - Research

**Date:** 2026-05-27
**Phase Number:** 02

## 1. 核心技术选择与调研

### JSON 互动视频路由契约
- **契约核心要素**：
  - 节点 ID (`id`)：唯一标识视频文件或剧情段落。
  - 视频 URL (`videoUrl`)：对应的本地 MP4 文件相对或绝对路径。
  - 交互触发点 (`interactions`)：包含触发时刻、问题文本以及按钮列表。
  - 路由目标 (`targetNodeId`)：点击选项后转换的新节点 ID。
- **设计推演**：
  这种图结构（Graph Structure）在前端可用 `Record<string, VideoNode>` 字典形式完美表示，O(1) 复杂度即可直接定位并查找目标节点。

### NodeStateManager 单例/状态机设计
- 为了让顶层 UI 组件和底层双实例播放器完全解耦，`NodeStateManager` 应该充当单一数据源（Single Source of Truth）。
- **解耦方法**：
  - `NodeStateManager` 维护 `currentNode` 和播放状态。
  - 支持向播放器暴露 `getPreloadCandidateNodeIds()`，在播放进度快接近 `interaction.timestamp` 前，返回该节点后续可能跳转的备选节点 ID，供底层播放器静默缓冲。
  - React 上层组件通过订阅 `NodeStateManager` 的事件（例如 `onNodeChanged`，`onInteractionTriggered`），当进入新阶段或触发选择时才触发局部重绘，其余视频播放阶段（大部分时间）顶层 React 无需发生任何高频 re-render。

## 2. 潜在隐患与解决方案 (Pitfalls & Mitigation)

- **隐患 A**：JSON 配置文件格式不规范，或者在分支节点中指向了不存在的 `targetNodeId`，导致运行时发生黑屏甚至 JS 崩溃。
  * **解决方案**：在 `NodeStateManager` 初始化时提供对配置文件的 Schema 强类型检验与连通性静态分析。如果发现有断头节点或错误的 `targetNodeId`，立即抛出友好的错误提示，提前拦截问题。
- **隐患 B**：时间轴精度与浮点数比对漂移。在 60 FPS 播放下，视频的 `currentTime` 可能无法精确等于配置的 `timestamp`（比如配置 15.0，而播放器抛出的进度可能是 14.982 或 15.012）。
  * **解决方案**：引入一个“触发判定窗口”（例如 `currentTime >= timestamp - 0.2`）或者利用 Shaka 的 `cue` 点事件监听，或做“一次性单向状态阀门”机制，防止交互弹窗多次被触发或漏触发。

## 3. 验证体系架构 (Validation Architecture)

### 验证指标
- **V-1**: 能成功通过编写 TypeScript 单元测试或 Demo 模拟运行，加载并连通分析 `storyConfig.json` 结构。
- **V-2**: 模拟状态流转（例如模拟选择选项 A，NodeStateManager 状态正确更新为 A 节点，并触发对应事件监听器）。
- **V-3**: 打包构建无任何语法或模块路径错误。

---

*Research complete: 2026-05-27*
