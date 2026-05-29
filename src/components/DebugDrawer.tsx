import { useState, useEffect } from 'react';
import type { VideoNode } from '../engine/types';
import { NodeStateManager } from '../engine/NodeStateManager';
import StoryNodeGraph from './StoryNodeGraph';

interface DebugDrawerProps {
  stateManager: NodeStateManager;
  currentNode: VideoNode;
  activePlayer: 'A' | 'B';
  visitedNodeIds: string[];
}

export default function DebugDrawer({
  stateManager,
  currentNode,
  activePlayer,
  visitedNodeIds
}: DebugDrawerProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(true);
  const [switchLatency, setSwitchLatency] = useState<number | null>(null);

  useEffect(() => {
    const handleSwitchLatency = (latency: number) => {
      setSwitchLatency(latency);
    };

    stateManager.on('switchLatency', handleSwitchLatency);
    return () => {
      stateManager.off('switchLatency', handleSwitchLatency);
    };
  }, [stateManager]);

  return (
    <>
      {/* 1. 悬浮极客 Trigger 按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[999] cursor-pointer w-12 h-12 rounded-full bg-slate-900/80 border border-white/10 hover:border-purple-500/40 text-purple-400 flex items-center justify-center backdrop-blur-md active:scale-95 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-purple-500/20 hover:scale-105 group"
        title="开启极客调试控制台"
      >
        {/* 呼吸灯发光特效 */}
        <span className="absolute inset-0 rounded-full bg-purple-500/10 group-hover:bg-purple-500/20 animate-ping opacity-60"></span>
        
        {isOpen ? (
          // 关闭图标 (X)
          <svg className="w-5 h-5 fill-current text-white transition-transform duration-300" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        ) : (
          // 齿轮/仪表盘图标
          <svg 
            className="w-5.5 h-5.5 fill-current text-purple-400 group-hover:text-purple-300 group-hover:rotate-45 transition-all duration-300" 
            viewBox="0 0 24 24"
          >
            <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
          </svg>
        )}
      </button>

      {/* 2. 背景深色半透明遮罩层 (当抽屉打开时显示，支持点击关闭) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[980] bg-black/35 backdrop-blur-[1px] transition-all duration-300 animate-fade-in"
        ></div>
      )}

      {/* 3. Slide-in 磨砂玻璃抽屉主体 */}
      <aside
        className={`fixed top-0 right-0 h-full w-[310px] sm:w-[340px] z-[990] bg-slate-950/85 backdrop-blur-xl border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col justify-between transition-transform duration-300 ease-out will-change-transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 顶部面板 Header */}
        <div className="p-4 border-b border-slate-900 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
              IV Engine 控制台
            </h2>
            <p className="text-[10px] text-slate-500 font-mono">DEBUGGING INTERACTIVE INSTANCES</p>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* 抽屉可滚动主体区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          
          {/* A. 核心剧情分支可视化决策树拓扑图 */}
          <StoryNodeGraph
            stateManager={stateManager}
            currentNode={currentNode}
            visitedNodeIds={visitedNodeIds}
          />

          {/* B. 双 Video DOM 状态监控仪表盘 (带精美折叠) */}
          <div className="glass-card border border-slate-900 rounded-xl overflow-hidden shadow-md">
            
            {/* 折叠 Header */}
            <div 
              onClick={() => setIsAccordionOpen(!isAccordionOpen)}
              className="px-3.5 py-2.5 bg-slate-900/40 border-b border-slate-900 flex items-center justify-between cursor-pointer select-none hover:bg-slate-900/60 transition-colors"
            >
              <span className="text-[10px] text-slate-400 font-mono tracking-wider font-semibold uppercase flex items-center gap-1.5">
                ⚙️ 双 DOM 物理状态监视
              </span>
              <span className={`text-slate-500 transition-transform duration-200 ${isAccordionOpen ? 'rotate-180' : ''}`}>
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </span>
            </div>

            {/* 折叠 Body */}
            <div className={`transition-all duration-300 ease-out overflow-hidden ${
              isAccordionOpen ? 'max-h-[500px] opacity-100 p-3.5 space-y-3.5' : 'max-h-0 opacity-0'
            }`}>
              
              {/* 性能量化指标监视器 */}
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-900/80 flex flex-col gap-2 font-mono text-[10px]">
                <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-0.5">
                  <span className="text-white font-bold text-[10px]">📊 拼接延时监测 (Benchmarking)</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Last Switch Latency:</span>
                  {switchLatency !== null ? (
                    <span className={`font-bold font-mono ${
                      switchLatency < 100 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      ⚡ {switchLatency.toFixed(2)} ms
                    </span>
                  ) : (
                    <span className="text-slate-600 italic">暂无切换</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 font-mono text-[10px]">
                {/* DOM A 卡片 */}
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-900/80 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-[10px]">Video DOM A</span>
                    <span className={`text-[8px] px-1 py-0.5 rounded border leading-none ${
                      activePlayer === 'A'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 font-bold'
                        : 'bg-slate-950 text-slate-600 border-slate-800'
                    }`}>
                      {activePlayer === 'A' ? 'FOREGROUND (前台)' : 'BACKGROUND (后台)'}
                    </span>
                  </div>
                  <div className="text-slate-500 flex flex-col gap-0.5 mt-1">
                    <div>z-index: <span className={activePlayer === 'A' ? 'text-purple-400 font-bold' : 'text-slate-600'}>{activePlayer === 'A' ? 20 : 10}</span></div>
                    <div>opacity: <span className={activePlayer === 'A' ? 'text-purple-400 font-bold' : 'text-slate-600'}>{activePlayer === 'A' ? 1 : 0}</span></div>
                    <div>pointer-events: <span className={activePlayer === 'A' ? 'text-purple-400 font-bold' : 'text-slate-600'}>{activePlayer === 'A' ? 'auto' : 'none'}</span></div>
                  </div>
                </div>

                {/* DOM B 卡片 */}
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-900/80 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-[10px]">Video DOM B</span>
                    <span className={`text-[8px] px-1 py-0.5 rounded border leading-none ${
                      activePlayer === 'B'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 font-bold'
                        : 'bg-slate-950 text-slate-600 border-slate-800'
                    }`}>
                      {activePlayer === 'B' ? 'FOREGROUND (前台)' : 'BACKGROUND (后台)'}
                    </span>
                  </div>
                  <div className="text-slate-500 flex flex-col gap-0.5 mt-1">
                    <div>z-index: <span className={activePlayer === 'B' ? 'text-purple-400 font-bold' : 'text-slate-600'}>{activePlayer === 'B' ? 20 : 10}</span></div>
                    <div>opacity: <span className={activePlayer === 'B' ? 'text-purple-400 font-bold' : 'text-slate-600'}>{activePlayer === 'B' ? 1 : 0}</span></div>
                    <div>pointer-events: <span className={activePlayer === 'B' ? 'text-purple-400 font-bold' : 'text-slate-600'}>{activePlayer === 'B' ? 'auto' : 'none'}</span></div>
                  </div>
                </div>
              </div>

              {/* 原理说明 */}
              <div className="text-slate-500 text-[9.5px] leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-900/60 font-sans">
                <span className="font-semibold text-slate-400 block mb-0.5">💡 无缝物理硬切换机制：</span>
                两个 HTML5 Video 标签常驻于 DOM。当在上方拓扑图双击跳转或做出剧情选项时，处于后台的 Video 实例会提前静音预载或抢占。激活时，后台直接播放，并在下一帧 <code className="text-purple-400 font-mono">requestAnimationFrame</code> 内瞬时对调两者的样式状态。切换零时差，保证极佳的无感衔接体验。
              </div>

            </div>
          </div>

        </div>

        {/* 底部 Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-900 text-center text-[9px] text-slate-600 font-mono">
          IV Engine Debug System &copy; 2026
        </div>
      </aside>
    </>
  );
}
