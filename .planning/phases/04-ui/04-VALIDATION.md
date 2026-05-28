---
phase: 04
slug: ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-28
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest & @testing-library/react |
| **Config file** | vite.config.ts |
| **Quick run command** | `npx vitest run src/components/__tests__/InteractionContainer.test.tsx` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/components/__tests__/InteractionContainer.test.tsx`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | UI-01, UI-02 | — | N/A | unit | `npx vitest run src/components/__tests__/InteractionContainer.test.tsx` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | UI-03, UI-04 | T-04-01 | 按钮点击后立即锁定 isLocked，拦截任何并发的二次跳转指令 | unit | `npx vitest run src/components/__tests__/InteractionContainer.test.tsx` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | UI-05 | — | N/A | unit | `npx vitest run src/components/__tests__/InteractionContainer.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/__tests__/InteractionContainer.test.tsx` — stubs for UI-01, UI-02, UI-03, UI-04, UI-05
- [ ] Install `@testing-library/react` and `@testing-library/jest-dom` if not present: `npm install -D @testing-library/react @testing-library/jest-dom @vitejs/plugin-react vitest jsdom`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 赛博毛玻璃视觉与 3D Hover 微缩放动画效果 | UI-05 | 视觉效果和细腻的动画表现属于主观体验，无法通过自动化单测完全覆盖 | 1. 运行 `npm run dev` 启动开发服务器。<br>2. 打开浏览器并等待视频播放到 10 秒交互触发时刻。<br>3. 验证卡片弹窗是否具备高斯模糊的赛博毛玻璃视觉效果，且顶部拥有渐变宽度的缩减倒计时条。<br>4. 鼠标悬停于选项按钮时，验证是否流畅执行 `scale-[1.02]` 微缩放及右侧箭头移出动画。 |
| Chrome DevTools 零重绘性能验证 | UI-02 | 性能帧率和组件 Re-render 性能需要在真实浏览器多 Tick 播放模式下通过 DevTools Profiler 进行验证 | 1. 运行 `npm run dev` 启动开发服务器。<br>2. 打开 Chrome 并打开 React Developer Tools 面板的 Profiler。<br>3. 点击 Record 开始录制并进行播放与交互。<br>4. 确认在视频 tick 时 `InteractionContainer` 重绘次数为 0；在弹窗展示和点击选项时局部重绘次数极低。 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** {pending}
