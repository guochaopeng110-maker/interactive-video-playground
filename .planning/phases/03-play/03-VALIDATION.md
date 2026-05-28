---
phase: 3
slug: play
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-28
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest / TypeScript Compiler (tsc) |
| **Config file** | tsconfig.json / vite.config.ts |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit` and check for any syntax/type errors.
- **After every plan wave:** Run `npm run build` to verify there are no compilation or bundling errors.
- **Before `/gsd-verify-work`:** Build must pass cleanly, and manual verification checklist must be verified.
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | PLAY-01, PLAY-02 | — | N/A | Typecheck | `npx tsc --noEmit` | ✅ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | PLAY-02 | — | N/A | Typecheck | `npx tsc --noEmit` | ✅ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | PLAY-03 | — | N/A | Typecheck | `npx tsc --noEmit` | ✅ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | PLAY-04 | — | Double mute lock | unit / manual | `npx tsc --noEmit` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/engine/__tests__/NodeStateManager.test.ts` — if unit tests are added for NodeStateManager
- [ ] `src/shaka.d.ts` — verify that shaka types are fully resolved without build-time complaints

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 双 Video DOM 层叠及静默绑定 | PLAY-01, PLAY-02 | 涉及 Shaka 媒体解码与 DOM 树绝对定位层叠，自动化测试难以还原浏览器渲染层。 | 打开浏览器控制台，检查 Elements 中是否同时渲染了 `video-instance-a` 与 `video-instance-b`，并均已绑定 Shaka 实例。 |
| Proximity-Based 预加载触发时机 | PLAY-03 | 需要观察真实的视频播放进度时间轴 Tick。 | 播放主视频，观察控制台输出日志，确认是否在距离交互点（10.0s）的前 5-8 秒区间（即视频播放到 2.0s-5.0s 之间时）触发后台预加载，且该行为只触发一次。 |
| 瞬间物理硬切视觉体验 (时差 < 50ms) | PLAY-04 | 无缝硬切换是帧级微秒拼接，需要人眼主观视听及 Chrome Performance Timeline 验收。 | 到达选择点弹出选项后，点击任一分支，确认前台隐藏、后台显示，视频无黑屏、无画面卡顿定格、无绿屏，切换时差肉眼不可见。 |
| 预加载静音锁 (Explicit Mute Lock) | PLAY-04 | 听觉溢出爆音是由声卡通道渲染引起，必须佩戴耳机或开启扬声器主观验收。 | 在 2.0s-5.0s 预加载分支视频缓冲期间，确认耳机中无任何分支视频的前期音频溢出；点击跳转瞬间音频自然无爆音接合。 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending 2026-05-28
