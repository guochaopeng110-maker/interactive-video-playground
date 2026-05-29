# Phase 1: 环境与基础设施搭建 — Specification

**Created:** 2026-05-27
**Ambiguity score:** 0.10 (gate: ≤ 0.20)
**Requirements:** 3 locked

## Goal

搭建一个干净、高性能、支持 TypeScript 的 React 18 基础开发环境，并成功引入 Tailwind CSS、`shaka-player` 以及 `@interactive-video-labs/react` 核心互动视频包装库。

## Background

当前工作区是一个全新的空白 Git 仓库，没有任何代码文件。我们需要从零初始化开发底座，确保样式的重置、流媒体播放库以及核心交互包装库能够正常通过 Vite 加包和打包。

## Requirements

1. **Vite + React 18 + TS 基础底座**:
   - Current: 空白工作区，无任何代码文件。
   - Target: 通过 Vite 搭建起 React 18 + TS 项目骨架，包管理器采用 npm，能够在本地运行 dev 服务。
   - Acceptance: 运行 `npm run dev` 能启动开发服务器，运行 `npm run build` 无任何 TS 报错，打包出完整的 `dist`。

2. **Tailwind CSS 样式系统集成**:
   - Current: 无样式系统，依赖默认浏览器表现。
   - Target: 安装并在项目中完整配置 Tailwind CSS，包含 CSS 重置与毛玻璃（Glassmorphism）等必备特效的配置。
   - Acceptance: 项目中能渲染一个拥有 `backdrop-blur-md` 磨砂玻璃特效和 Tailwind 工具类的测试组件，样式与 Tailwind 重置相匹配。

3. **Shaka Player 与 `@interactive-video-labs/react` 媒体与交互依赖**:
   - Current: 没有任何流媒体或底层视频控制与互动组件库。
   - Target: npm 安装并集成 `shaka-player` 和 `@interactive-video-labs/react`，在页面上初始化基础播放和互动包装实例。
   - Acceptance: 成功引入这两个核心依赖，在浏览器控制台中没有初始化或类型解析报错，可读取普通的 `.mp4` 文件，并且 wrapper 导入正常。

## Boundaries

**In scope:**
- Vite + React 18 + TypeScript 工程初始化。
- Tailwind CSS 样式集成与配置文件（`tailwind.config.js` 等）。
- `shaka-player` 与 `@interactive-video-labs/react` npm 依赖集成与基础引用测试。
- 用于环境冒烟校验的极简主页渲染（验证 Shaka 加载、Tailwind 渲染与 Wrapper 引用）。

**Out of Scope:**
- 互动播放控制机与 JSON 逻辑层 — Phase 2 开发。
- 双播放器交替预加载（Dual-Player Preloading）算法 — Phase 3 开发。
- 解耦的分支选项 UI 组件设计 — Phase 4 开发。

## Constraints

- 必须在项目当前根目录 `./` 初始化，不产生嵌套的子文件夹。
- Shaka Player 需要解决在 React 中重复实例化的问题，确保组件卸载时正确销毁实例。

## Acceptance Criteria

- [ ] `npm run dev` 能够正常拉起开发服务器，没有警告或报错。
- [ ] `npm run build` 打包无 TS 编译报错，生成完整的 production 静态包。
- [ ] 页面在 `localhost` 加载成功，Tailwind CSS 的基础重置样式完全生效。
- [ ] 主页测试组件成功渲染毛玻璃磨砂特效卡片（验证 Tailwind 集成）。
- [ ] Shaka Player 成功在 React `useEffect` 中完成对 Video 元素的绑定，并在 console 中输出 Shaka 引擎初始化的 log 且无加载报错。
- [ ] `@interactive-video-labs/react` 核心包装库在 React 项目中能够成功导入，没有 TypeScript 类型解析报错。

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes |
|--------------------|-------|------|--------|-------|
| Goal Clarity       | 0.95  | 0.75 | ✓      | 目标清晰，专注底座搭建 |
| Boundary Clarity   | 0.90  | 0.70 | ✓      | 明确排除了数据逻辑与双实例策略 |
| Constraint Clarity | 0.85  | 0.65 | ✓      | 指明了 ORM 和 Shaka 重复实例化问题 |
| Acceptance Criteria| 0.90  | 0.70 | ✓      | 拥有 5 条具体的 Pass/Fail 判定标准 |
| **Ambiguity**      | 0.10  | ≤0.20| ✓      | 通过门票 |

## Interview Log

| Round | Perspective     | Question summary | Decision locked |
|-------|-----------------|------------------|-----------------|
| 1     | Researcher      | 选用什么版本的 React 和播放引擎？ | React 18 + shaka-player |
| 2     | Simplifier      | 这一阶段需要渲染实际多分支视频吗？ | 不需要，只渲染基础播放和加载验证 |
| 3     | Boundary Keeper | 是否集成 storyConfig.json？ | 否，这属于 Phase 2 |

---

*Phase: 01-environment*
*Spec created: 2026-05-27*
*Next step: /gsd-discuss-phase 1 — implementation decisions (how to build what's specified above)*
