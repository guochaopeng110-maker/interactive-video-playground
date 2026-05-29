# Roadmap: Interactive Video Engine Demo

## Overview

本项目致力于构建一个基于 Web 的数据驱动互动视频引擎。通过五个清晰的开发阶段，逐步搭建基础环境、实现数据结构解析、攻克双播放器无缝切换核心技术、开发解耦的 React 极简高阶交互界面，并引入本地测试资产进行全链路的 UAT 验证。最终交付一个无黑屏、高性能、交互流畅的演示 Demo。

## Phases

- [x] **Phase 1: 环境与基础设施搭建** - 搭建 React 18 + TS + Tailwind 开发环境，并引入 `shaka-player` 与 `@interactive-video-labs/react`。
- [x] **Phase 2: 数据驱动逻辑层设计** - 设计解析逻辑并定义 `storyConfig.json` 数据流驱动。
- [x] **Phase 3: 双实例交替播放核心 (PLAY)** - 开发 `InteractivePlayer` 底层双 Video DOM 交替预加载与瞬间物理切换算法。
- [x] **Phase 4: 顶层解耦交互 UI 与状态捕获** - 构建高性能进度捕获逻辑与高颜值、动效感十足的交互选择弹窗。
- [x] **Phase 5: 资产配置与全链路联合调试** - 部署本地 mp4 资产，验证完整的剧情分支切换无缝链路。

## Phase Details

### Phase 1: 环境与基础设施搭建

**Goal**: 搭建高质量的 React 开发环境，配置好 UI 框架与核心媒体播放器库。
**Depends on**: Nothing
**Requirements**: ENV-01, ENV-02
**Success Criteria**:

  1. Vite 启动正常，支持 React 18 + TS。
  2. Tailwind CSS 正确集成，样式重置与全局字体引入就绪。
  3. `shaka-player` 能够正确在项目中导入，没有打包或类型错误。

**Plans**: 1 plan

Plans:

- [x] 01-01: 集成项目环境、Tailwind 及 Shaka-player 与 Wrapper 依赖

### Phase 2: 数据驱动逻辑层设计

**Goal**: 完成状态机与配置文件的读取解耦，使引擎纯粹依赖 JSON 数据。
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-02
**Success Criteria**:

  1. `storyConfig.json` 被正确解析，各分支节点关系树结构清晰。
  2. 引擎能基于起点 `startNodeId` 初始化逻辑状态，包含后续所有交互点的路由表映射。

**Plans**: 1 plan

Plans:

- [x] 02-01: 编写 storyConfig.json 契约，设计引擎节点逻辑管理器 (NodeStateManager)

### Phase 3: 双实例交替播放核心 (PLAY)

**Goal**: 攻克本地 MP4 切换黑屏顽疾，实现底层双 Video 的物理交替无缝拼接。
**Depends on**: Phase 2
**Requirements**: PLAY-01, PLAY-02, PLAY-03, PLAY-04
**Success Criteria**:

  1. `InteractivePlayer` 能够正确渲染两个层叠的 Video DOM（Player A / Player B）。
  2. 当 Player A 接近判定点时，能够命令隐藏状态下的 Player B 提前静默加载分支视频，并将其 pause 在首帧。
  3. 切换瞬间：A 暂停并隐藏，B 显示并瞬间播放，两播放器过渡时间差 < 100ms，肉眼看不出黑屏与卡顿。

**Plans**: 2 plans

Plans:

- [x] 03-01: 构建双 Video DOM 媒体底层架构及 Shaka Player 实例管理
- [x] 03-02: 实现双播放器交替预加载与 z-index 无缝瞬间切换算法

### Phase 4: 顶层解耦交互 UI 与状态捕获

**Goal**: 构建视觉体验极佳的高级交互卡片，采用 useRef 进行高性能时间捕获以防止不必要的 re-render。
**Depends on**: Phase 3
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05
**Success Criteria**:

  1. 上层 React UI 与底层播放状态解耦，通过回调函数或 Event Listener 与引擎沟通。
  2. 捕获视频进度（useRef 挂载时间监听），只有当到达互动点时才触发 React 状态变更与弹窗渲染，确保 60 FPS 的流畅度。
  3. 分支选项框使用现代的磨砂玻璃毛玻璃卡片（Glassmorphism）、渐变边框和极速悬停微动效。

**Plans**: 1 plan

Plans:

- [x] 04-01-PLAN.md — 编写解耦的 Interaction Container 与毛玻璃分支交互弹窗 UI

### Phase 5: 资产配置与全链路联合调试

**Goal**: 挂载真实本地视频资产，进行端到端的无缝切换验证。
**Depends on**: Phase 4
**Requirements**: VLD-01, VLD-02
**Success Criteria**:

  1. `/public/assets/` 下有 3 个测试用视频。
  2. 启动服务，完整跑通：主线播放 -> 到达 15 秒自动暂停并呈现两个分支选项 -> 选择分支 A 或分支 B -> 无黑屏、无明显缝隙地直接跳转到相应视频播放。

**Plans**: 1 plan
Plans:

- [x] 05-01: 导入测试资产并进行全链路 UAT 最终调试

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 环境与基础设施搭建 | 1/1 | Complete | 2026-05-27 |
| 2. 数据驱动逻辑层设计 | 1/1 | Complete | 2026-05-28 |
| 3. 双实例交替播放核心 (PLAY) | 2/2 | Complete | 2026-05-28 |
| 4. 顶层解耦交互 UI 与状态捕获 | 1/1 | Complete | 2026-05-28 |
| 5. 资产配置与全链路联合调试 | 1/1 | Complete | 2026-05-29 |
