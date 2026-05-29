---
phase: 03
reviewers: [codex, claude, gemini, qwen, cursor, opencode]
reviewed_at: 2026-05-29T09:34:59
plans_reviewed: ["03-01-PLAN.md", "03-02-PLAN.md"]
---
# Cross-AI Plan Review - Phase 03

## Codex Review

## Plan 03-01 Review

### 1. Summary
Plan 03-01 has a solid foundation for the Phase 3 goal: persistent dual-video DOM + persistent dual Shaka instances, with StrictMode-aware cleanup and compile/build verification. The core architecture is aligned with low-latency transitions. The main weaknesses are some scope creep (native fallback behavior details) and a few under-specified lifecycle/error paths that could cause unstable behavior in React effects.

### 2. Strengths
- Clear architectural direction: fixed two-video pool + two long-lived Shaka players.
- Correctly prioritizes StrictMode/destroy cleanup, which is critical in React 18.
- Explicit layering contract (`z-index`, `opacity`, `pointer-events`) is testable.
- Includes build/type verification gates (`tsc`, `build`), not just visual checks.
- Introduces resilience concept (`useNativeVideo` fallback) early.

### 3. Concerns
- **HIGH**: Fallback scope is ambiguous and potentially too broad for this phase. Full “switch to native `<video src>`” may break node/state integration unless URL mapping and event wiring are fully defined.
- **MEDIUM**: No explicit guard against repeated player init across effect reruns besides `isDestroyed`; missing “already initialized” short-circuit can still produce duplicate listeners/init races.
- **MEDIUM**: Shaka configuration values are hardcoded without rationale per browser/network profile; risk of brittle tuning.
- **MEDIUM**: Plan references `src/shaka.d.ts` validation but doesn’t specify what to do if typings mismatch (blocker handling missing).
- **LOW**: DOM verification via Elements panel is useful but not sufficient to prove no leaks or duplicate handlers.

### 4. Suggestions
- Define fallback as **minimal** for Phase 3: “fail closed + user-facing error/start retry,” and defer full native-engine parity unless explicitly required.
- Add `initializedRef` and listener-registration guards in `useEffect`.
- Add explicit teardown checklist: destroy players, remove all player/video listeners, null refs.
- Add one runtime assertion log block (dev-only) to confirm exactly two players and one init cycle after StrictMode remount.
- Document acceptance criteria for fallback: what still works, what is intentionally degraded.

### 5. Risk Assessment
**Overall Risk: MEDIUM**  
Core design is correct and feasible, but fallback and lifecycle details are underspecified enough to cause regressions or complexity spillover.

---

## Plan 03-02 Review

### 1. Summary
Plan 03-02 is ambitious and technically thoughtful, with strong intent around preload timing, preemption, autoplay handling, and seamless swap orchestration. It likely achieves the UX target if implemented well, but it currently risks over-engineering (overlay UX, glassmorphism, timeout policies, audio fades) and has ordering/race complexities that can destabilize transition correctness under rapid user interactions.

### 2. Strengths
- Good alignment with phase objective: proximity preload + seamless A/B swap.
- Explicit non-reentrancy control (`preloadedNodeIdRef`) and cleanup expectations.
- Handles real-world browser autoplay restrictions.
- Includes preemption path for “user chose non-preloaded branch.”
- Recognizes timeout/failsafe needs instead of assuming perfect network.

### 3. Concerns
- **HIGH**: Too many responsibilities in one phase task (algorithm + UX overlays + autoplay UX + timeout UX + audio DSP-like behavior). High implementation risk and test burden.
- **HIGH**: Potential race conditions among `timeupdate`, preload completion, user choice, timeout firing, and swap execution. No explicit state machine defined.
- **HIGH**: `NodeJS.Timeout` type in React browser code is incorrect in many TS setups (`number` expected); may cause type friction.
- **MEDIUM**: 5–8s trigger window is vague; without deterministic policy, behavior can be inconsistent and hard to test.
- **MEDIUM**: Audio fade via `setInterval` can drift/jitter; may introduce artifacts vs simpler deterministic mute/unmute for this phase.
- **MEDIUM**: “glassmorphism loading skeleton” is UI-scope creep relative to PLAY foundation.
- **LOW**: Microtask/requestAnimationFrame wording is inconsistent (rAF is frame task, not microtask), which may confuse implementation intent.

### 4. Suggestions
- Introduce a small explicit transition state machine, e.g. `idle | preloading | ready | swapping | hotloading`.
- Reduce scope for Phase 3: keep swap reliability first; defer polished overlay styling/audio fade polish to UI phase unless required.
- Make preload trigger deterministic (e.g., fixed threshold like `<= 8s` with one-shot per node).
- Replace `NodeJS.Timeout` with `ReturnType<typeof setTimeout>` for cross-env TS compatibility.
- Add cancellation tokens/version counters so stale async preload completions cannot overwrite newer intent.
- Define hard acceptance tests for race cases:
  - rapid repeated choices,
  - choice exactly at timeout boundary,
  - preload completes after preemption started.
- Prefer initial implementation with strict mute/unmute; add fade only if measurable audio click persists.

### 5. Risk Assessment
**Overall Risk: HIGH**  
Concept is strong, but current plan packs too many moving parts and lacks a formal concurrency model. Without scope reduction or explicit state management, transition bugs are likely.

---

## Cross-Plan Overall Assessment
The two plans are directionally correct for Phase 3 and technically aligned with dual-player preloading architecture. The primary risk is execution complexity, especially in 03-02. If you constrain Phase 3 to deterministic transition correctness (state machine + minimal UX), risk drops significantly and Phase 5 validation becomes more reliable.


---

## the agent Review

API Error: 502 status code (no body). This is a server-side issue, usually temporary — try again in a moment. If it persists, check status.claude.com.


---

## Gemini Review

gemini review failed or returned empty output.


---

## Qwen Review

qwen review timed out after 120 seconds.


---

## Cursor Review

Run with 'cursor -' to read output from another program (e.g. 'echo Hello World | cursor -').


---

## OpenCode Review



---

## Consensus Summary

### Agreed Strengths
- Phase 03 architecture direction is sound: dual video DOM + dual persistent player instances aligns with seamless transition goals.
- Cleanup/lifecycle awareness is present and recognized as critical under React StrictMode.

### Agreed Concerns
- 03-02 has high complexity and race-condition risk due to concurrent preload/choice/timeout/swap paths.
- Scope risk: UX polish items (complex overlay/audio fade) may overrun PLAY-phase core reliability goals.
- Need tighter deterministic transition policy and clearer state/control model.

### Divergent Views
- Most external CLIs failed/timed out in this run, so detailed divergence analysis is limited.
- Codex produced complete actionable feedback; others mainly returned availability/runtime errors.
