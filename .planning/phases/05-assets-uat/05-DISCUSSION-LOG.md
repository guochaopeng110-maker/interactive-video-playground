# Phase 5: 资产配置与全链路联合调试 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-29
**Phase:** 5-资产配置与全链路联合调试
**Areas discussed:** 测试资产规格与标准化转码指南, 切换延时 (Switch Latency) 的量化与调试抽屉实时展示, 交互未选择 (超时默认流转) 的物理无缝拼接设计, 全链路 UAT 的自动化集成测试

---

## 1. 测试资产规格与标准化转码指南 (FFmpeg Transcoding Standards)

| Option | Description | Selected |
|--------|-------------|----------|
| Option A (推荐) | 在 Phase 5 交付文档中提供标准的 `FFmpeg` 转码脚本指令规范，确保所有测试资产物理编码完全一致，将其作为本阶段验证资产的基础红线 | ✓ |
| Option B | 仅对 `/public/assets` 下现存的 3 个视频进行黑盒测试，不制定转码指令规范 | |

**User's choice:** 选项 A (全部采用推荐方案)
**Notes:** 采用高度一致的转码标准能够保证在不同平台、多浏览器环境下的切换极致平滑，降低兼容性风险。

---

## 2. 切换延时 (Switch Latency) 的物理量化与调试抽屉实时展示

| Option | Description | Selected |
|--------|-------------|----------|
| Option A (推荐) | 在 `InteractivePlayer` 及 `NodeStateManager` 切换瞬间，通过 `performance.now()` 记录时差。在极客调试抽屉中实时显示切换延时 | ✓ |
| Option B | 仅使用 `console.log` 将时差输出在浏览器控制台，不在前端面板上展示 | |

**User's choice:** 选项 A (全部采用推荐方案)
**Notes:** 可视化量化指标数据能够极大提高全链路调试的验证效率，为优化切换间隔打下良好基础。

---

## 3. 交互未选择 (超时默认流转) 的物理无缝拼接设计

| Option | Description | Selected |
|--------|-------------|----------|
| Option A (推荐) | 当倒计时触底时，直接静默无缝物理切换到默认分支 `branch_a`，与用户手动点击体验一致，保证画面绝对连续 | ✓ |
| Option B | 倒计时结束后画面淡出至黑屏，再淡入到分支 A | |
| Option C | 倒计时触底后画面暂停，必须等待用户做出生死抉择才跳转 | |

**User's choice:** 选项 A (全部采用推荐方案)
**Notes:** 保证播放流程全自动化与静默连续性，绝不引入多余的黑场与淡出动画，贯彻无缝物理拼接宗旨。

---

## 4. 全链路 UAT 的自动化集成测试 (Vitest Integration Testing)

| Option | Description | Selected |
|--------|-------------|----------|
| Option A (推荐) | 在 `src/components/__tests__/` 中利用 Vitest + React Testing Library + JSDOM，对整个剧情状态机流转路线进行自动化集成测试 | ✓ |
| Option B | 仅依赖浏览器手工点击来验证，不在代码中增加额外的测试 | |

**User's choice:** 选项 A (全部采用推荐方案)
**Notes:** 全链路的集成测试能够建立高强度的防退化安全网，保障后续代码变更不破坏核心无缝切换逻辑。

---

## the agent's Discretion

- 引擎其他非核心交互视觉细节与代码重构优化均由 AI 自由裁量实现。

## Deferred Ideas

- v2 版本的 HLS/DASH 动态视频分片。
