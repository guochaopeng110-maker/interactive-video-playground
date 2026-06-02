import { useEffect, useState, useRef } from 'react';
import { NodeStateManager } from '../engine/NodeStateManager';
import type { VideoInteraction } from '../engine/types';

interface InteractionContainerProps {
  stateManager: NodeStateManager;
}

export default function InteractionContainer({ stateManager }: InteractionContainerProps) {
  const [interaction, setInteraction] = useState<VideoInteraction | null>(null);
  const [isAnimatingOut, setIsAnimatingOut] = useState<boolean>(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [progressWidth, setProgressWidth] = useState<'100%' | '0%'>('100%');
  const [isTransitionActive, setIsTransitionActive] = useState<boolean>(false);

  // 使用 Ref 存储状态以防止定时器/事件回调中的闭包问题，并作为并发原子锁
  const isLockedRef = useRef<boolean>(false);
  const autoTransitionTimerRef = useRef<number | null>(null);
  const reflowTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // 监听交互触发事件
    const onInteractionTriggered = (incomingInteraction: VideoInteraction) => {
      console.log('[InteractionContainer] 监听到交互触发事件:', incomingInteraction);
      
      // 重置锁定与状态
      isLockedRef.current = false;
      setIsAnimatingOut(false);
      setSelectedIdx(null);
      setProgressWidth('100%');
      setIsTransitionActive(false);
      setInteraction(incomingInteraction);

      // 使用 50ms 定时器强制进行浏览器排版 reflow，在 Chrome 下完美激活 transition
      if (reflowTimeoutRef.current) window.clearTimeout(reflowTimeoutRef.current);
      reflowTimeoutRef.current = window.setTimeout(() => {
        setIsTransitionActive(true);
        setProgressWidth('0%');
      }, 50);

      // 启动 10 秒超时自动流转定时器
      if (autoTransitionTimerRef.current) window.clearTimeout(autoTransitionTimerRef.current);
      autoTransitionTimerRef.current = window.setTimeout(() => {
        handleTimeout(incomingInteraction);
      }, 10000);
    };

    // 监听节点切换事件，切换新节点时彻底隐藏当前弹窗，重置状态
    const onNodeChanged = () => {
      console.log('[InteractionContainer] 监听到节点变更，重置并隐藏交互面板');
      setInteraction(null);
      setIsAnimatingOut(false);
      setSelectedIdx(null);
      setProgressWidth('100%');
      setIsTransitionActive(false);
      isLockedRef.current = false;

      if (autoTransitionTimerRef.current) {
        window.clearTimeout(autoTransitionTimerRef.current);
        autoTransitionTimerRef.current = null;
      }
      if (reflowTimeoutRef.current) {
        window.clearTimeout(reflowTimeoutRef.current);
        reflowTimeoutRef.current = null;
      }
    };

    stateManager.on('interactionTriggered', onInteractionTriggered);
    stateManager.on('nodeChanged', onNodeChanged);

    // 清理订阅，防止 StrictMode 双击挂载泄露
    return () => {
      stateManager.off('interactionTriggered', onInteractionTriggered);
      stateManager.off('nodeChanged', onNodeChanged);

      if (autoTransitionTimerRef.current) {
        window.clearTimeout(autoTransitionTimerRef.current);
      }
      if (reflowTimeoutRef.current) {
        window.clearTimeout(reflowTimeoutRef.current);
      }
    };
  }, [stateManager]);

  // 处理 10 秒倒计时超时自动跳转
  const handleTimeout = (currentInteraction: VideoInteraction) => {
    if (isLockedRef.current) return;
    isLockedRef.current = true;
    setSelectedIdx(-1); // 标记为超时

    // 获取当前节点数据
    const currentNode = stateManager.getCurrentNode();
    let targetNodeId = currentNode.defaultNextNodeId;

    // 兜底策略：如果没有 defaultNextNodeId，则取第一个选项的 targetNodeId
    if (!targetNodeId && currentInteraction.options && currentInteraction.options.length > 0) {
      targetNodeId = currentInteraction.options[0].targetNodeId;
    }

    console.log('[InteractionContainer] 超时未选择，执行自动流转兜底目标:', targetNodeId);

    // 200ms 出场平滑淡出动效，之后分发跳转指令
    setIsAnimatingOut(true);
    window.setTimeout(() => {
      if (targetNodeId) {
        stateManager.selectOption(targetNodeId);
      }
    }, 200);
  };

  // 处理用户手动点击选项
  const handleOptionClick = (targetNodeId: string, idx: number) => {
    if (isLockedRef.current) return; // 拦截二次并发点击
    isLockedRef.current = true;
    setSelectedIdx(idx);

    // 清除超时定时器
    if (autoTransitionTimerRef.current) {
      window.clearTimeout(autoTransitionTimerRef.current);
      autoTransitionTimerRef.current = null;
    }

    console.log(`[InteractionContainer] 用户手动选择分支 [${idx}]:`, targetNodeId);

    // 200ms 出场平滑淡出动效，之后分发跳转指令
    setIsAnimatingOut(true);
    window.setTimeout(() => {
      stateManager.selectOption(targetNodeId);
    }, 200);
  };

  if (!interaction) return null;

  return (
    <div className={`absolute inset-0 z-[30] bg-slate-950/30 flex items-center justify-center p-6 backdrop-blur-[3px] transition-all duration-200 ${
      isAnimatingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
    }`}
    data-testid="interaction-overlay"
    >
      {/* 赛博磨砂玻璃卡片面板 */}
      <div className="w-full max-w-md bg-slate-900/60 border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl relative overflow-hidden transition-transform duration-200">
        
        {/* GPU 硬件加速的 10 秒渐变倒计时进度条 */}
        <div
          data-testid="countdown-bar"
          className="absolute top-0 left-0 h-[3px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 will-change-[width] z-10"
          style={{
            width: progressWidth,
            transition: isTransitionActive ? 'width 10s linear' : 'none'
          }}
        />

        {/* 霓虹发光球装饰阴影 */}
        <div className="absolute -left-12 -top-12 w-24 h-24 bg-purple-500/20 blur-2xl rounded-full pointer-events-none"></div>
        <div className="absolute -right-12 -bottom-12 w-24 h-24 bg-pink-500/20 blur-2xl rounded-full pointer-events-none"></div>

        <div className="relative text-center">
          {/* 决策点微标 */}
          <span className="text-[10px] bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-extrabold px-3 py-1 rounded-full border border-purple-400/20 font-sans tracking-widest shadow-md">
            DECISION POINT
          </span>

          <h3 className="text-sm font-extrabold text-white mt-4 mb-6 tracking-wide leading-snug">
            {interaction.title || "前方的道路发生了分叉，请做出您的抉择："}
          </h3>

          {/* 选项按钮列表 */}
          <div className="flex flex-col gap-3.5">
            {interaction.options.map((option, idx) => {
              const isSelected = selectedIdx === idx;
              const isAnySelected = selectedIdx !== null;
              
              let btnClass = "bg-slate-950/60 border-slate-800/80 text-white hover:border-violet-500/40 hover:bg-gradient-to-r hover:from-purple-900/40 hover:to-fuchsia-900/40 hover:scale-[1.02]";
              let arrowClass = "opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0";
              let textContent = option.text;

              if (isAnySelected) {
                if (isSelected) {
                  // 当前被选中的高亮加载中状态
                  btnClass = "bg-gradient-to-r from-violet-600 to-fuchsia-600 border-violet-400 text-white scale-[1.02] shadow-[0_0_15px_rgba(139,92,246,0.3)]";
                  textContent = "⚡ Loading Branch...";
                  arrowClass = "opacity-100 translate-x-0";
                } else {
                  // 其它未被选中的置灰且禁用
                  btnClass = "bg-slate-950/30 border-slate-900 text-slate-500 cursor-not-allowed opacity-40";
                  arrowClass = "opacity-0";
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isAnySelected}
                  onClick={() => handleOptionClick(option.targetNodeId, idx)}
                  className={`w-full text-left px-5 py-3.5 rounded-xl border text-xs font-semibold shadow-inner flex items-center justify-between group transition-all duration-200 ease-out cursor-pointer ${btnClass}`}
                >
                  <span className="font-sans tracking-wide transition-all duration-200">
                    {textContent}
                  </span>
                  <span className={`text-[10px] text-purple-400 font-mono transition-all duration-200 ease-out ${arrowClass}`}>
                    选择分支 &rarr;
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
