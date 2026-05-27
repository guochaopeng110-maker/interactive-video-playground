# Phase 1: 环境与基础设施搭建 - Research

**Date:** 2026-05-27
**Phase Number:** 01

## 1. 核心技术栈选择与调研

### Vite + React 18 + TS
- **优点**：极速的热重载（HMR）以及优秀的 TS 原生支持，保证了开发过程中的高反馈感。
- **集成细节**：需确保 `@types/react` 与 React 主版本对齐，并保持打包时 Shaka Player 类型的导入兼容性。

### Tailwind CSS
- **无缝磨砂玻璃设计实现**：
  在 Tailwind 中，利用 `backdrop-blur-md` 和带透明度的背景（如 `bg-white/20`）并配合渐变边框，可完美搭建 Glassmorphism 样式。这正是我们在 Phase 4 需要的视觉效果底座。
- **集成步骤**：
  1. 安装 `tailwindcss postcss autoprefixer`。
  2. 初始化 `tailwind.config.js` 并配置 `content`。
  3. 在全局 CSS 中导入 Tailwind 的基础层、组件层和公用层。

### Shaka Player 集成
- **简介**：Google 开发的媒体播放框架，广泛支持 DASH / HLS，同时也完美兼容 `.mp4` 文件。
- **包名称**：`shaka-player`
- **使用细节**：
  - 在 React 中集成 Shaka Player 时，通常需要通过 `useRef` 绑定原始的 `<video>` DOM 元素。
  - 通过 `new shaka.Player(videoElement)` 初始化播放器实例。
  - 对于普通的本地 `.mp4`，可以使用 `player.load(url)` 方法加载。在双实例交替预加载（Dual-Player Preloading）中，这能精确地允许静默缓冲首帧。
  - 注意：需要引入 `shaka-player/dist/shaka-player.compiled.d.ts` 以提供完整的 TypeScript 类型声明支持。

## 2. 潜在隐患与解决方案 (Pitfalls & Mitigation)

- **隐患 A**：Shaka Player 在 React 组件中可能会因为组件频繁 re-render 而被重复实例化，导致内存泄泄或报错。
  * **解决方案**：使用 `useEffect` 在组件 mount 时初始化，并在 return cleanup 函数中显式执行 `player.destroy()`。
- **隐患 B**：Shaka Player 打包可能在某些环境下类型解析失败。
  * **解决方案**：在项目的全局声明文件（如 `shaka.d.ts`）中声明或者直接通过正确引入 `import shaka from 'shaka-player';` 来获得类型支持。

## 3. 验证体系架构 (Validation Architecture)

### 验证指标
- **V-1**: 项目能够一键通过 `npm run dev` 启动，并在控制台无报错。
- **V-2**: 能够通过引入的 Shaka Player API 成功把普通 MP4 绑定在页面 Video 标签上并播放。
- **V-3**: Tailwind CSS 的 Utility classes 渲染完全正常。

---

*Research complete: 2026-05-27*
