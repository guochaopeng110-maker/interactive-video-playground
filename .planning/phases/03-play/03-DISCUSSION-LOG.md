# Phase 3: 双实例交替播放核心 (PLAY) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-28
**Phase:** 03-双实例交替播放核心 (PLAY)
**Areas discussed:** 预加载触发时机与控制策略, 双播放器切换的视觉过渡方案, 双实例 Shaka Player 的生命周期管理, 预加载视频的静音与音频冲突防范

---

## 预加载触发时机与控制策略 (Preloading Trigger & Control)

| Option | Description | Selected |
|--------|-------------|----------|
| 采用临近预加载 (Proximity-Based) | 距离交互点仅剩 5-8 秒时启动预加载，兼顾极致切换速度与带宽开销。 | ✓ (Recommended) |
| 采用立即预加载 (Immediate) | 节点载入即启动全部后继节点预加载，优先保障绝对无缝，忽略带宽损耗。 | |
| 由引擎自动决定 (You Decide) | 让底层加载器在运行时自适应调节。 | |

**User's choice:** 采用临近预加载 (Proximity-Based)
**Notes:** 采用此模式可以完美平衡无缝切换的用户沉浸感体验和长视频、复杂分支下的网络带宽资源开销。

---

## 双播放器切换的视觉过渡方案 (Visual Transition Effect)

| Option | Description | Selected |
|--------|-------------|----------|
| 采用瞬间物理硬切 (Instant Hard Cut) | 以低于 50ms 的速度瞬间覆盖，不使用任何过渡动画，最大程度保证画面帧级物理拼接的连续性。 | ✓ (Recommended) |
| 采用极速淡入淡出 (Cross-Fade) | 使用 100ms - 200ms 的 opacity 渐变淡出淡入，追求视觉的柔和过渡。 | |
| 由引擎自动决定 (You Decide) | 默认使用物理硬切，但提供 CSS 透明度渐变的过渡参数接口，方便后期定制。 | |

**User's choice:** 采用瞬间物理硬切 (Instant Hard Cut)
**Notes:** 物理瞬时硬切是电影级视频无缝无缝接合的行业标配，能维持画面在物理层级的帧连续性，避免渐变时的重影与底色外漏。

---

## 双实例 Shaka Player 的生命周期管理 (Shaka Player Instance Management)

| Option | Description | Selected |
|--------|-------------|----------|
| 采用静态双播放器回收池 (Static Recycling) | 全局仅挂载 2 个 Video 元素与 Shaka 实例，交替扮演前台/后台角色，通过重用实例避免销毁与重建带来的 CPU 抖动。 | ✓ (Recommended) |
| 采用动态按需创建与销毁 (Dynamic Lifecycle) | 后台实例随用随建，用完即毁，优先节约移动端等低内存设备的常驻内存占用。 | |
| 由引擎自动决定 (You Decide) | 默认实现静态回收池，在发生未知网络/播放错误时作为兜底重新初始化实例。 | |

**User's choice:** 采用静态双播放器回收池 (Static Recycling)
**Notes:** Shaka Player 的实例化与销毁在底层极为沉重。回收池架构将实例限制为 2 个，重用实例的 API 加载能力，以带来全生命周期极平稳的 CPU 和 GC 表现。

---

## 预加载视频的静音与音频冲突防范 (Audio Management during Preloading)

| Option | Description | Selected |
|--------|-------------|----------|
| 采用后台显式静音锁 (Explicit Mute Lock) | 后台静默预加载的实例一律强制 `muted = true` 且 `volume = 0`，直至物理切换到前台的瞬间才解锁音频，彻底消除爆音和声音泄漏。 | ✓ (Recommended) |
| 仅靠播放/暂停状态控制 (Pure Playback State) | 信任浏览器的暂停机制，不做音频静音锁定，避免频繁更改音量 API 的开销。 | |
| 由引擎自动决定 (You Decide) | 默认使用显式静音锁，若后续用户有特殊多声道或背景音效流转需求，再开放解除静音锁的接口。 | |

**User's choice:** 采用后台显式静音锁 (Explicit Mute Lock)
**Notes:** 从物理层面上给后台预加载实例加锁静音，彻底消除浏览器在缓冲、解码第一帧或 seek 时可能产生的漏音与爆音隐患。

---

## the agent's Discretion

- 静态回收池两播放器实例的交替切换调度（A/B 双实例逻辑状态机管理）。
- CSS 具体的 z-index 浮动范围与层级细节实现（如 `z-10` 与 `z-20` 的交替）。
- Shaka Player 实例的具体初始化参数与缓冲容量配置。

## Deferred Ideas

- 磨砂玻璃毛玻璃卡片（Glassmorphism）、微悬停交互动效 UI（Interaction Container React 渲染） — 留至 Phase 4 研发。
- 真实本地资产放入 `/public/assets/` 及全链路 UAT 最终调试 — 留至 Phase 5 研发。
