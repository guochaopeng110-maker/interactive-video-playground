# Requirements: Interactive Video Engine Demo

**Defined:** 2026-05-27
**Core Value:** 实现分支视频无缝切换（无黑屏、无卡顿），并且实现底层播放引擎与上层 React 交互 UI 的解耦。

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core Environment (ENV)

- [x] **ENV-01**: 搭建 Vite + React 18 + TS + Tailwind CSS 基础工程，确保样式与排版工具就绪。
- [x] **ENV-02**: 集成 `shaka-player` 作为核心媒体播放库，并集成 `@interactive-video-labs/react` (interactive-video-react-wrapper) 作为核心互动 logic 包装器。

### Configuration & Data (DATA)

- [x] **DATA-01**: 支持加载 `storyConfig.json` 互动视频配置文件，包含节点 ID、视频 URL、视频时长及交互触发点（如 timestamp、问题、选项等）。
- [x] **DATA-02**: 引擎能根据配置文件中的 `startNodeId` 初始化播放起点。

### Media Player Foundation (PLAY)

- [x] **PLAY-01**: 实现 `InteractivePlayer` 核心媒体组件。
- [x] **PLAY-02**: 在组件内挂载双 Video DOM 实例，并使用 `shaka-player` 初始化两个实例。
- [x] **PLAY-03**: 实现 Dual-Player Preloading 预加载机制：当当前播放器 A 接近判定点或检测到有后续分支时，静默使播放器 B 加载对应分支视频并缓冲首帧。
- [x] **PLAY-04**: 实现瞬间无缝物理切换：隐藏 A 播放器（z-index 降低/隐藏），显示 B 播放器（z-index 提升/显示），并精准同步播放与暂停状态，达到视觉无缝拼接。

### Interaction Layer (UI)

- [x] **UI-01**: 交互层与媒体播放层完全解耦，引入并配置 `@interactive-video-labs/react` 组件包进行上层选项卡片与流转路由映射。
- [x] **UI-02**: 使用 React `useRef` 或低频订阅模型，优雅捕获播放进度，避免每一帧渲染都触发 React UI 的高频 Re-render。
- [x] **UI-03**: 在交互触发点（如 15 秒）弹出选择卡片，展示问题及剧情分支选项，并在此期间暂停视频（或保持挂起）。
- [x] **UI-04**: 用户选择选项后，分发流转指令，通知 `InteractivePlayer` 执行相应节点的双实例预加载/切换动作。
- [x] **UI-05**: 交互页面具备极佳的现代动效和磨砂玻璃（glassmorphism）美学设计，给用户高级的交互沉浸感。

### Asset Integration & Verification (VLD)

- [x] **VLD-01**: 在 `/public/assets/` 放入 3 个测试用视频（video_main.mp4, video_branch_a.mp4, video_branch_b.mp4）。
- [x] **VLD-02**: 完整链路测试：从主线播放至 15 秒触发交互选择，选择“分支 A”或“分支 B”后瞬间无缝切换至对应分支，无卡顿或黑屏。

## v1.1 Experience Enhancements (EXP)

### Interactive Timeline & Branch Catalog

- [ ] **EXP-01**: 进度条支持鼠标点击与拖拽跳转，当跳转的目标时间跨越了设定好的交互点时，自动智能拦截，将时间截断回退至交互点时刻，并立刻激活分支选项弹窗。
- [ ] **EXP-02**: 在主界面新增一个常驻的分支章节目录卡片（毛玻璃质感），结构化展示整部剧的所有分支节点，提供醒目的状态标示（正在播放、已访问、未访问），并允许点击任意节点进行跳转演示。

## v2 Requirements

### Analytics & Editor

- **ANL-01**: 收集用户交互路径分析数据，记录用户每个节点停留时长与选择倾向。
- **EDT-01**: 可视化节点编辑器，允许非开发者在线拖拽节点连线并导出 `storyConfig.json`。

## Out of Scope

| Feature | Reason |
|---------|--------|
| HLS/DASH 动态切片 | 现阶段使用双播放器物理预加载已能完美解决 MP4 的切换黑屏，流媒体切片开发复杂度高，不作为首期目标。 |
| 云端视频编辑器 | 目前只实现本地播放引擎核心验证。 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ENV-01 | Phase 1 | Complete |
| ENV-02 | Phase 1 | Complete |
| DATA-01 | Phase 2 | Complete |
| DATA-02 | Phase 2 | Complete |
| PLAY-01 | Phase 3 | Complete |
| PLAY-02 | Phase 3 | Complete |
| PLAY-03 | Phase 3 | Complete |
| PLAY-04 | Phase 3 | Complete |
| UI-01 | Phase 4 | Complete |
| UI-02 | Phase 4 | Complete |
| UI-03 | Phase 4 | Complete |
| UI-04 | Phase 4 | Complete |
| UI-05 | Phase 4 | Complete |
| VLD-01 | Phase 5 | Complete |
| VLD-02 | Phase 5 | Complete |
| EXP-01 | Phase 6 | Pending |
| EXP-02 | Phase 6 | Pending |

**Coverage:**
- v1 & v1.1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-27*
*Last updated: 2026-06-11 after Milestone V1.0 completion & V1.1 planning*
