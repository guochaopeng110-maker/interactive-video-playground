# 互动视频引擎 (Interactive Video Engine Demo)

## What This Is

一个基于 Web 的多分支互动视频引擎 Demo。项目旨在通过数据驱动（JSON 配置文件）的方式定义视频播放节点与交互逻辑，并利用双实例交替预加载技术（Dual-Player Preloading）在物理层面实现无缝的 `.mp4` 视频分支切换，同时将底层视频媒体引擎与上层交互 UI 完全解耦。

## Core Value

实现分支视频无缝切换（无黑屏、无卡顿），并且实现底层播放引擎与上层 React 交互 UI 的解耦。

## Requirements

### Validated

- [x] **项目基础环境搭建 (Phase 1)**：构建 Vite + React 18 + TS + Tailwind CSS 项目骨架。
- [x] **数据驱动层实现 (Phase 2)**：读取并解析 `storyConfig.json` 互动逻辑配置文件，驱动引擎运转。
- [x] **双实例播放器架构 (Phase 3)**：实现 `InteractivePlayer`，挂载双 Video DOM 实例，A 播放时静默预加载 B，实现无缝瞬间切换。
- [x] **上层交互与状态管理 (Phase 4)**：使用 React 组件处理弹窗选项，利用 `useRef` 高效追踪视频播放进度以触发交互。
- [x] **资产管理与演示 (Phase 5)**：放置 3 个本地测试视频文件，验证完整的主线到分支 A/B 的无缝切换流程。

### Active

- [ ] **时间进度条跳跃与智能拦截 (Phase 6 / EXP-01)**：将进度条改为可交互，若跳转目标跨越了互动选择点，自动智能拦截，将播放时间截断至互动时刻并立刻暂停且弹出选项。
- [ ] **常驻剧本结构化目录 (Phase 6 / EXP-02)**：在主界面右侧新增一个常驻的分支章节目录卡片（毛玻璃质感），结构化展示整部剧的所有分支节点，并支持点击任意节点进行跳转讲解。

### Out of Scope

- **云端视频点播切片分发 (DASH/HLS)** — 本项目聚焦于本地 `.mp4` 双播放器预加载物理无缝切换，暂不实现复杂的流媒体切片分发。
- **互动视频编辑器 UI** — 暂时仅支持通过手动编写 `storyConfig.json` 来配置剧情走向，不提供可视化编辑界面。

## Context

- 核心痛点：使用单实例 Shaka Player 切换 `.mp4` 的 `src` 会导致明显的初始化黑屏和缓冲等待，影响用户沉浸感。
- 解决方案：采用“双实例交替预加载 (Dual-Player Preloading)”策略。通过双 Video 元素，在 A 视频播放到分支判定点前，B 视频已在后台加载完毕并 `pause` 在第 0 秒；触发交互选择后，瞬间通过切换 CSS（如 `z-index` / `opacity`）和控制 A `pause`、B `play` 实现无缝拼接。
- 核心技术：shaka-player 用于控制媒体播放，React 处理交互弹窗与时间监听。

## Constraints

- **Tech Stack**: Vite + React 18 + TS + Tailwind CSS 与 `@interactive-video-labs/react` — 确保高品质的开发环境与现代互动视频生态集成。
- **Media Engine**: shaka-player — 满足底层交替预加载与缓冲管理要求。
- **Browser Compatibility**: 现代浏览器（Chrome/Edge/Safari/Firefox），支持 HTML5 视频双实例同时渲染与播放。

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 双实例交替策略 (Dual-Player) | 单实例 `.mp4` 切换 src 无法消除黑屏，双实例物理切换是最可靠 of 无缝过渡方案 | — Approved (Phase 3) |
| 数据驱动解耦设计 (JSON-Driven) | 互动逻辑与 UI 框架剥离，方便后期扩充视频节点，无需改动引擎代码 | — Approved (Phase 2) |
| 进度条跳转智能拦截 (Jump Intercept) | 用户在快进演示时，若跳过交互点会导致分支选项无法展示。通过在交互点自动拦截截断，既满足了快进到关键点，又保证了逻辑完整性。 | — Approved (Phase 6) |
| 常驻毛玻璃章节目录 (Story Catalog) | 提供高可视化的剧本层级脉络，直观展示整部剧的分支关系，方便讲解人进行结构化演示，无需完全依赖剧情自然流转。 | — Approved (Phase 6) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-11 after Phase 5 UAT & Phase 6 setup*
