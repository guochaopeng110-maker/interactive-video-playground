# Phase 2: 数据驱动逻辑层设计 — Specification

**Created:** 2026-05-27
**Ambiguity score:** 0.10 (gate: ≤ 0.20)
**Requirements:** 2 locked

## Goal

设计数据配置文件 `storyConfig.json` 的格式契约，并在 TypeScript 中编写无框架依赖的核心状态机类 `NodeStateManager`，实现配置解析、状态路由跳转、状态变更订阅以及分支预加载候选计算，为接下来的双实例播放器及上层 UI 交互组件提供一致、高内聚的数据驱动引擎。

## Background

单 Video 实例在交互视频中的逻辑非常零碎和耦合，往往将“视频加载”、“何时弹窗”、“点击后去向何处”混杂在 React 界面代码中。我们在 Phase 2 专门设计纯逻辑的 `NodeStateManager`，就是为了把底层播放器（物理层）和上层界面（展示层）的通信逻辑梳理清楚，仅通过统一的数据路由层驱动。

## Requirements

1. **`storyConfig.json` 契约定义**:
   - 具备唯一的启动节点 `startNodeId`。
   - 每个视频节点 `VideoNode` 包含 `id`、`videoUrl`、视频总时长 `duration` 以及交互事件数组 `interactions`。
   - 每个 `VideoInteraction` 定义触发时间点 `timestamp` 和一组分支选项 `options`，每个选项指向另一个合法的 `targetNodeId`。

2. **核心逻辑管理器 `NodeStateManager` 实现**:
   - 通过传入配置对象实例化核心，验证逻辑无死循环、无非法路由节点。
   - 维护当前活跃节点 ID `currentNodeId`，提供 `getCurrentNode()` 获取当前视频信息的 API。
   - 提供路由转移方法 `selectOption(optionText: string)` 或 `transitionToNode(nodeId: string)`。
   - 实现低耦合的订阅模式（或事件发射器 `EventEmitter`），支持注册 `onNodeChanged`、`onInteractionTriggered` 回调。
   - 提供 `getPreloadCandidateNodeIds()`：获取当前节点可能流转的下一个/所有备选分支节点，让播放引擎能够提前默默加载资产。

## Boundaries

**In scope:**
- `storyConfig.json` 规范定义与一份用于演示的 Mock 配置。
- `src/engine/types.ts` 数据结构类型定义。
- `src/engine/NodeStateManager.ts` 状态机类逻辑实现与事件绑定。
- 编写一套轻量级的单元测试或运行验证脚本（模拟引擎在不依赖 Video DOM 的情况下的纯数据逻辑运转流程）。

**Out of Scope:**
- 挂载真实的 `<video>` A/B 播放器 — Phase 3 研发。
- 搭建真实的毛玻璃 React 弹窗 UI — Phase 4 研发。

## Constraints

- 状态管理器必须是纯 TypeScript 类，完全不依赖任何 DOM 或 React API（例如 `useState`，`useEffect` 等），确保其极其轻量且完全可控。
- 对浮点数时间轴触发判断做容差保护。

## Acceptance Criteria

- [ ] 成功编写并导出类型规范文件 `types.ts`。
- [ ] 实例化 `NodeStateManager` 时，输入错误的配置文件结构会正常拦截并报错抛出。
- [ ] 调用状态流转方法时，`currentNodeId` 正确变更，且成功触发已绑定的监听回调。
- [ ] 针对备选节点预加载机制，`getPreloadCandidateNodeIds` 能够准确输出该节点下游所有可能的 `targetNodeId` 数组。
- [ ] `npm run build` 正常通过，没有任何打包和 TS 编译报错。

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes |
|--------------------|-------|------|--------|-------|
| Goal Clarity       | 0.95  | 0.75 | ✓      | 数据驱动核心目标极其明确 |
| Boundary Clarity   | 0.90  | 0.70 | ✓      | 严格界定在逻辑层，不涉及 DOM/UI |
| Constraint Clarity | 0.90  | 0.65 | ✓      | 强调无 React 框架依赖与强 TS 校验 |
| Acceptance Criteria| 0.90  | 0.70 | ✓      | 功能点与编译指标契合 |
| **Ambiguity**      | 0.10  | ≤0.20| ✓      | 通过门票 |

---

*Phase: 02-datadrive*
*Spec created: 2026-05-27*
*Next step: Create plan /gsd-plan-phase 2*
