import { useEffect, useState } from 'react';
import { NodeStateManager } from './engine/NodeStateManager';
import type { VideoNode, StoryConfig } from './engine/types';
import InteractivePlayer from './components/InteractivePlayer';
import InteractionContainer from './components/InteractionContainer';
import StoryCatalog from './components/StoryCatalog';
import DebugDrawer from './components/DebugDrawer';

export default function App() {
  const [config, setConfig] = useState<StoryConfig | null>(null);
  const [stateManager, setStateManager] = useState<NodeStateManager | null>(null);
  const [currentNode, setCurrentNode] = useState<VideoNode | null>(null);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [finalNodeId, setFinalNodeId] = useState<string | null>(null);
  const [activePlayer, setActivePlayer] = useState<'A' | 'B'>('A');
  const [visitedNodeIds, setVisitedNodeIds] = useState<string[]>([]);

  // 挂载时加载剧情配置
  useEffect(() => {
    fetch('/storyConfig.json')
      .then((res) => {
        if (!res.ok) throw new Error('无法加载 storyConfig.json');
        return res.json();
      })
      .then((data: StoryConfig) => {
        setConfig(data);
        const manager = new NodeStateManager(data);
        setStateManager(manager);
        setCurrentNode(manager.getCurrentNode());
        setVisitedNodeIds([data.startNodeId]); // 初始化历史路径

        // 订阅底层节点切换，同步上层 UI 与访问记录
        manager.on('nodeChanged', (newNode) => {
          setCurrentNode(newNode);
          setVisitedNodeIds((prev) =>
            prev.includes(newNode.id) ? prev : [...prev, newNode.id]
          );
        });

        manager.on('playbackFinished', (endId) => {
          setFinalNodeId(endId);
          setIsFinished(true);
        });

        console.log('[App] 互动剧情配置文件加载完成并绑定状态管理器');
      })
      .catch((err) => {
        console.error('[App] 加载配置文件失败:', err);
      });
  }, []);

  // 重置剧情线，重新开始
  const handleRestart = () => {
    if (config) {
      setIsFinished(false);
      setFinalNodeId(null);
      setActivePlayer('A');
      setVisitedNodeIds([config.startNodeId]); // 重置历史路径

      const newManager = new NodeStateManager(config);
      setStateManager(newManager);
      setCurrentNode(newManager.getCurrentNode());

      newManager.on('nodeChanged', (newNode) => {
        setCurrentNode(newNode);
        setVisitedNodeIds((prev) =>
          prev.includes(newNode.id) ? prev : [...prev, newNode.id]
        );
      });

      newManager.on('playbackFinished', (endId) => {
        setFinalNodeId(endId);
        setIsFinished(true);
      });
    }
  };

  if (!config || !stateManager || !currentNode) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
        <span className="text-xs text-slate-400 font-mono animate-pulse">正在加载配置并初始化状态机...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between select-none bg-slate-950">
      {/* 顶部导航标题 */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <span className="font-extrabold text-white text-lg">IV</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">
              互动视频引擎 <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full ml-2">Engine</span>
            </h1>
            <p className="text-xs text-slate-400">Interactive Video Engine Pool</p>
          </div>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900/80 border border-slate-800/80 rounded-lg px-3 py-1.5 backdrop-blur-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
          <span>Phase 6: 体验升级与目录</span>
        </div>
      </header>

      {/* 主界面区域 (左右分栏影院大卡片布局) */}
      <main className="max-w-6xl w-full mx-auto my-auto">
        <div className="flex flex-col md:flex-row gap-6 items-stretch justify-center w-full">
          
          {/* 左侧分栏：手机端播放模拟器 */}
          <section className="w-full md:w-[380px] shrink-0">
            <div className="glass-panel p-4 flex flex-col gap-4 relative overflow-hidden group h-full justify-between">
              {/* 彩色背景光效 */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-3xl rounded-full -mr-24 -mt-24 pointer-events-none"></div>

              {/* 核心双实例播放器 */}
              <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-black/95 border border-slate-800 shadow-2xl flex items-center justify-center">
                {!isFinished ? (
                  <>
                    <InteractivePlayer
                      stateManager={stateManager}
                      onPlaybackFinished={(endId) => {
                        setFinalNodeId(endId);
                        setIsFinished(true);
                      }}
                      onActivePlayerChanged={(player) => {
                        setActivePlayer(player);
                      }}
                    />
                    {/* 上层 React 交互卡片 */}
                    <InteractionContainer stateManager={stateManager} />
                  </>
                ) : (
                  /* 剧情播放完成 */
                  <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center gap-6 p-6 text-center backdrop-blur-md animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                      <span className="text-emerald-400 text-3xl font-bold">✓</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">剧情播放圆满结束</h2>
                      <p className="text-xs text-slate-400 max-w-sm">您已成功到达终点节点：<span className="font-mono text-purple-400 font-bold">{finalNodeId}</span></p>
                    </div>
                    <button
                      onClick={handleRestart}
                      className="cursor-pointer px-6 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-xs shadow-md hover:shadow-purple-500/10 active:scale-95 transition-all"
                    >
                      重新体验剧情
                    </button>
                  </div>
                )}
              </div>

              {/* 播放状态栏 */}
              <div className="flex flex-col gap-1 text-xs px-1 text-slate-400 select-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
                    {isFinished ? (
                      <>
                        <span>播放状态:</span>
                        <span className="text-emerald-400 font-medium font-mono">已结束</span>
                      </>
                    ) : (
                      <>
                        <span>播放节点:</span>
                        <span className="text-purple-400 font-medium font-mono">{currentNode.id}</span>
                      </>
                    )}
                  </div>
                  <div className="text-slate-500 font-mono text-[9px]">
                    Active: Player {activePlayer}
                  </div>
                </div>
                <div className="text-slate-500 font-mono text-[9px] truncate">
                  {isFinished ? '剧情播放完毕' : `URL: ${currentNode.videoUrl}`}
                </div>
              </div>
            </div>
          </section>

          {/* 右侧分栏：常驻树状章节目录 */}
          <section className="flex-1 w-full md:max-w-xl h-full">
            <StoryCatalog
              stateManager={stateManager}
              currentNode={currentNode}
              visitedNodeIds={visitedNodeIds}
              isFinished={isFinished}
            />
          </section>

        </div>
      </main>

      {/* 极客调试悬浮抽屉面板 */}
      <DebugDrawer
        stateManager={stateManager}
        currentNode={currentNode}
        activePlayer={activePlayer}
        visitedNodeIds={visitedNodeIds}
      />

      {/* 底部信息 */}
      <footer className="max-w-6xl w-full mx-auto mt-6 pt-4 border-t border-slate-900 text-center text-xs text-slate-500">
        Interactive Video Engine Framework - TDu Powered
      </footer>
    </div>
  );
}
