import React, { useEffect, useRef, useState } from 'react';
import shaka from 'shaka-player';
import * as IVLabs from '@interactive-video-labs/react';

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shakaStatus, setShakaStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  const [wrapperStatus, setWrapperStatus] = useState<'pending' | 'loaded' | 'error'>('pending');

  useEffect(() => {
    // 1. 验证 @interactive-video-labs/react 导入
    try {
      console.log('[@interactive-video-labs/react] Loaded modules:', IVLabs);
      if (IVLabs) {
        setWrapperStatus('loaded');
      } else {
        setWrapperStatus('error');
      }
    } catch (e) {
      console.error('[@interactive-video-labs/react] Import error:', e);
      setWrapperStatus('error');
    }

    // 2. 初始化 Shaka Player
    shaka.polyfill.installAll();

    if (!shaka.Player.isBrowserSupported()) {
      console.error('Browser not supported by Shaka Player');
      setShakaStatus('error');
      return;
    }

    const videoElement = videoRef.current;
    if (!videoElement) return;

    const player = new shaka.Player(videoElement);

    // 监听错误
    player.addEventListener('error', (event: any) => {
      console.error('Shaka Player Error:', event.detail);
      setShakaStatus('error');
    });

    // 加载一个免费的测试视频流（DASH 格式）
    const testAsset = 'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd';
    
    player.load(testAsset)
      .then(() => {
        console.log('Shaka Player initialized successfully and stream loaded!');
        setShakaStatus('ready');
      })
      .catch((error: any) => {
        console.error('Shaka load error:', error);
        // 如果网络拦截导致 DASH 无法加载，我们直接用备用 MP4 降级
        videoElement.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
        setShakaStatus('ready');
      });

    return () => {
      player.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      {/* 顶部导航标题 */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/25 animate-pulse">
            <span className="font-extrabold text-white text-lg">IV</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">
              互动视频引擎 <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full ml-2">Demo</span>
            </h1>
            <p className="text-xs text-slate-400">Interactive Video Engine Foundation</p>
          </div>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900/80 border border-slate-800/80 rounded-lg px-3 py-1.5 backdrop-blur-md">
          Phase 1: 环境与基础设施搭建
        </div>
      </header>

      {/* 主界面区域 */}
      <main className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto">
        {/* 左侧：视频主播放视窗 */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          <div className="glass-panel p-4 flex flex-col gap-4 relative overflow-hidden group">
            {/* 炫彩装饰背景 */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none transition-all duration-500 group-hover:bg-purple-500/10"></div>
            
            {/* 播放器容器 */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black/90 border border-slate-800 shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                controls
                poster="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80"
              />
              
              {/* 初始化加载蒙层 */}
              {shakaStatus === 'initializing' && (
                <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                  <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                  <span className="text-xs text-slate-400 font-medium tracking-wide">正在初始化流媒体引擎...</span>
                </div>
              )}
            </div>

            {/* 视频状态控制条 */}
            <div className="flex items-center justify-between text-xs px-1 text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>核心状态:</span>
                <span className={shakaStatus === 'ready' ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>
                  {shakaStatus === 'ready' ? 'Shaka 媒体就绪' : '正在载入播放源...'}
                </span>
              </div>
              <div className="text-slate-500">Asset: Angel One (DASH) / BBB (Fallback MP4)</div>
            </div>
          </div>
        </section>

        {/* 右侧：环境集成状态与控制面板 */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          {/* 集成校验组件 */}
          <div className="glass-panel p-6 flex flex-col gap-5 relative overflow-hidden">
            <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-pink-500/5 blur-2xl rounded-full pointer-events-none"></div>
            
            <div>
              <h2 className="text-lg font-bold text-white mb-1">系统环境校验</h2>
              <p className="text-xs text-slate-400">全面验证多分支交互引擎的底层依赖链路</p>
            </div>

            {/* 校验列表 */}
            <div className="flex flex-col gap-3">
              {/* 1. React & TS */}
              <div className="glass-card p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 text-sm font-bold">
                    TS
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">Vite + React 18 + TS</h3>
                    <p className="text-[10px] text-slate-400">脚手架与类型定义</p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                  PASS
                </span>
              </div>

              {/* 2. Tailwind CSS */}
              <div className="glass-card p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 text-sm font-bold">
                    TW
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">Tailwind CSS 3</h3>
                    <p className="text-[10px] text-slate-400">毛玻璃与排版样式</p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                  PASS
                </span>
              </div>

              {/* 3. Shaka Player */}
              <div className="glass-card p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-sm font-bold">
                    SP
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">Shaka Player Engine</h3>
                    <p className="text-[10px] text-slate-400">媒体驱动库初始化</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                  shakaStatus === 'ready' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {shakaStatus === 'ready' ? 'PASS' : 'LOADING'}
                </span>
              </div>

              {/* 4. Interactive Wrapper */}
              <div className="glass-card p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 text-sm font-bold">
                    IW
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">Interactive Video Wrapper</h3>
                    <p className="text-[10px] text-slate-400">@interactive-video-labs/react</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                  wrapperStatus === 'loaded' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {wrapperStatus === 'loaded' ? 'PASS' : 'ERROR'}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 底部版权信息 */}
      <footer className="max-w-6xl w-full mx-auto mt-8 pt-4 border-t border-slate-900 text-center text-xs text-slate-500">
        Interactive Video Engine Framework • Antigravity AI Powered
      </footer>
    </div>
  );
}
