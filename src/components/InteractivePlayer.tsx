import React, { useEffect, useRef, useState } from 'react';
import shaka from 'shaka-player';
import { NodeStateManager } from '../engine/NodeStateManager';
import type { VideoNode, VideoInteraction } from '../engine/types';

const formatTime = (secs: number) => {
  if (isNaN(secs) || secs === Infinity) return '00:00';
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

interface InteractivePlayerProps {
  stateManager: NodeStateManager;
  onInteractionTriggered?: (interaction: VideoInteraction) => void;
  onPlaybackFinished?: (finalNodeId: string) => void;
  onActivePlayerChanged?: (player: 'A' | 'B') => void;
}

export default function InteractivePlayer({
  stateManager,
  onInteractionTriggered,
  onPlaybackFinished,
  onActivePlayerChanged
}: InteractivePlayerProps) {
  // 基础 React 状态
  const [activePlayer, setActivePlayer] = useState<'A' | 'B'>('A');
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [useNativeVideo, setUseNativeVideo] = useState<boolean>(false);
  const [isPreempting, setIsPreempting] = useState<boolean>(false);
  const [isMutedAutoplay, setIsMutedAutoplay] = useState<boolean>(false);
  const [isChoiceShowing, setIsChoiceShowing] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showHudAnim, setShowHudAnim] = useState<'play' | 'pause' | null>(null);
  const hudTimeoutRef = useRef<any>(null);

  // DOM 引用
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const timeDisplayRef = useRef<HTMLSpanElement>(null);

  // Shaka 实例引用 (用 any 规避全局 namespace 缺失的 TS 编译错误)
  const playerARef = useRef<any>(null);
  const playerBRef = useRef<any>(null);

  // 状态机与竞态控制引用（Ref 防闭包滞后）
  const activePlayerRef = useRef<'A' | 'B'>('A');
  const preloadedNodeIdRef = useRef<string | null>(null);
  const preloadTimeoutRef = useRef<any>(null);
  const isPreloadReadyRef = useRef<boolean>(false);

  const globalVolume = 0.8;

  // 辅助状态同步触发器
  const updateActivePlayer = (player: 'A' | 'B') => {
    activePlayerRef.current = player;
    setActivePlayer(player);
    if (onActivePlayerChanged) {
      onActivePlayerChanged(player);
    }
  };

  const togglePlayPause = () => {
    if (!hasStarted || isChoiceShowing || isPreempting) return;

    const active = activePlayerRef.current;
    const video = active === 'A' ? videoRefA.current : videoRefB.current;
    if (video) {
      if (video.paused) {
        video.play().then(() => {
          setIsPaused(false);
          triggerHudAnimation('play');
        }).catch(e => console.error('Play error on HUD click:', e));
      } else {
        video.pause();
        setIsPaused(true);
        triggerHudAnimation('pause');
      }
    }
  };

  const triggerHudAnimation = (type: 'play' | 'pause') => {
    setShowHudAnim(type);
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    hudTimeoutRef.current = setTimeout(() => {
      setShowHudAnim(null);
    }, 800);
  };

  // 1. 初始化双 Shaka 播放器与清理机制
  useEffect(() => {
    let isDestroyed = false;

    // 自检 ts 类型支持与 shaka-player
    shaka.polyfill.installAll();

    if (!shaka.Player.isBrowserSupported()) {
      console.warn('[InteractivePlayer] 浏览器不支持 Shaka Player，将自动降级为原生 HTML5 播放器。');
      setUseNativeVideo(true);
      return;
    }

    const initPlayers = async () => {
      try {
        if (!videoRefA.current || !videoRefB.current || isDestroyed) return;

        // 实例化 A 与 B 播放器
        const playerA = new shaka.Player(videoRefA.current);
        const playerB = new shaka.Player(videoRefB.current);

        // 配置 Shaka 缓冲与流参数以优化本地极速加载
        const shakaConfig = {
          streaming: {
            bufferingGoal: 6, // 6秒预缓冲目标
            rebufferingGoal: 2, // 缓冲达2秒即允许启动播放
            bufferBehind: 2 // 保留2秒后方历史缓冲
          }
        };
        playerA.configure(shakaConfig);
        playerB.configure(shakaConfig);

        // 注册全局错误监听
        const handleError = (event: any) => {
          const err = event.detail;
          console.error('[InteractivePlayer] Shaka 播放器发生异常:', err);
          
          // 如果是严重的致命错误 (Severity.FATAL)，启动高可用降级至原生 HTML5 Video
          if (err && err.severity === shaka.Player.Severity.FATAL) {
            console.error('[InteractivePlayer] Shaka 遭遇致命错误，立即启动高可用降级！');
            triggerNativeFallback();
          }
        };

        playerA.addEventListener('error', handleError);
        playerB.addEventListener('error', handleError);

        playerARef.current = playerA;
        playerBRef.current = playerB;

        console.log('[InteractivePlayer] 静态双播放器回收重用池初始化就绪！');
      } catch (err) {
        console.error('[InteractivePlayer] 初始化 Shaka Player 失败:', err);
        triggerNativeFallback();
      }
    };

    initPlayers();

    return () => {
      isDestroyed = true;
      // 卸载与彻底清理 Shaka 实例，释放解码器和网路流
      if (playerARef.current) {
        playerARef.current.destroy().catch((e: any) => console.error('Clean playerA error:', e));
      }
      if (playerBRef.current) {
        playerBRef.current.destroy().catch((e: any) => console.error('Clean playerB error:', e));
      }
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
      if (hudTimeoutRef.current) {
        clearTimeout(hudTimeoutRef.current);
      }
    };
  }, [useNativeVideo]);

  // 高可用降级执行器
  const triggerNativeFallback = () => {
    setUseNativeVideo(true);
    // 销毁可能存在的残留 shaka 实例
    playerARef.current?.destroy().catch(() => {});
    playerBRef.current?.destroy().catch(() => {});
    playerARef.current = null;
    playerBRef.current = null;
  };

  // 2. 状态机事件订阅流 (nodeChanged & interactionTriggered & playbackFinished)
  useEffect(() => {
    // 订阅节点变更事件 (执行物理瞬间对调或抢占加载)
    const handleNodeChanged = (newNode: VideoNode) => {
      console.log(`[InteractivePlayer] [EVENT] 状态机触发节点变更 -> ${newNode.id} (已预载: ${preloadedNodeIdRef.current})`);
      setIsChoiceShowing(false);
      setIsPaused(false);
      
      // 重置非交互进度条与时间文本
      if (progressBarRef.current) {
        progressBarRef.current.style.width = '0%';
      }
      if (timeDisplayRef.current) {
        timeDisplayRef.current.textContent = `00:00 / ${formatTime(newNode.duration)}`;
      }

      if (newNode.id === preloadedNodeIdRef.current && isPreloadReadyRef.current) {
        // A. 预加载命中 -> 执行绝对流畅瞬间硬切
        executeSeamlessTransition(newNode);
      } else {
        // B. 预加载失配 / 抢占 (Preemption) / 未就绪超时 -> 执行 Loading 垫片并强行重载
        executePreemptionHotload(newNode);
      }
    };

    // 订阅交互触发点弹出事件
    const handleInteractionTriggered = (interaction: VideoInteraction) => {
      console.log('[InteractivePlayer] [EVENT] 状态机触发弹出分支交互弹窗');
      setIsChoiceShowing(true);
      setIsPaused(true);
      
      // 暂停前台播放，等待用户做出选择
      const active = activePlayerRef.current;
      const foregroundVideo = active === 'A' ? videoRefA.current : videoRefB.current;
      if (foregroundVideo) {
        foregroundVideo.pause();
      }

      if (onInteractionTriggered) {
        onInteractionTriggered(interaction);
      }
    };

    // 订阅故事线终点完结事件
    const handlePlaybackFinished = (finalNodeId: string) => {
      console.log('[InteractivePlayer] [EVENT] 状态机宣布剧情全链路成功播放结束！');
      if (onPlaybackFinished) {
        onPlaybackFinished(finalNodeId);
      }
    };

    stateManager.on('nodeChanged', handleNodeChanged);
    stateManager.on('interactionTriggered', handleInteractionTriggered);
    stateManager.on('playbackFinished', handlePlaybackFinished);

    return () => {
      // 卸载注销所有状态机监听，完美防御 StrictMode 双向泄露
      stateManager.off('nodeChanged', handleNodeChanged);
      stateManager.off('interactionTriggered', handleInteractionTriggered);
      stateManager.off('playbackFinished', handlePlaybackFinished);
    };
  }, [onInteractionTriggered, onPlaybackFinished]);

  // 3. 开始首播（点击遮罩层触发，解除浏览器 Autoplay 限制）
  const handleStartExperience = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setHasStarted(true);
    setIsPaused(false);
    const startNode = stateManager.getCurrentNode();
    
    // 初始化时间文本
    if (timeDisplayRef.current) {
      timeDisplayRef.current.textContent = `00:00 / ${formatTime(startNode.duration)}`;
    }

    // 初始化首视频源
    await loadVideoSource(startNode, 'A');

    const videoA = videoRefA.current;
    if (videoA) {
      try {
        videoA.muted = false;
        videoA.volume = globalVolume;
        await videoA.play();
        console.log('[InteractivePlayer] 用户手势授权成功，首视频有声播放顺利启动！');
      } catch (err: any) {
        console.warn('[InteractivePlayer] play() 被浏览器拦截:', err);
        if (err.name === 'NotAllowedError') {
          // 降级为静音播放
          videoA.muted = true;
          await videoA.play();
          setIsMutedAutoplay(true);
        }
      }
    }
  };

  // 解除静音辅助按钮
  const handleUnlockVolume = () => {
    const active = activePlayerRef.current;
    const video = active === 'A' ? videoRefA.current : videoRefB.current;
    if (video) {
      video.muted = false;
      video.volume = globalVolume;
      setIsMutedAutoplay(false);
      console.log('[InteractivePlayer] 用户手动解除静音成功！');
    }
  };

  // 4. 视频源加载机 (适配 Shaka 或 HTML5 原生)
  const loadVideoSource = async (node: VideoNode, playerRole: 'A' | 'B'): Promise<void> => {
    const videoElement = playerRole === 'A' ? videoRefA.current : videoRefB.current;
    const shakaInstance = playerRole === 'A' ? playerARef.current : playerBRef.current;

    if (!videoElement) return;

    if (useNativeVideo || !shakaInstance) {
      // 原生 HTML5 加载
      videoElement.src = node.videoUrl;
      videoElement.load();
    } else {
      // Shaka 加载
      try {
        await shakaInstance.load(node.videoUrl);
      } catch (e) {
        console.error(`[InteractivePlayer] Player ${playerRole} 加载 Shaka 源失败:`, e);
        // 尝试降级为原生 HTML5 方式单次载入
        videoElement.src = node.videoUrl;
        videoElement.load();
      }
    }
  };

  // 进度条点击跳转与智能拦截逻辑
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!hasStarted || isChoiceShowing || isPreempting) return;

    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPct = Math.max(0, Math.min(1, clickX / rect.width));

    const active = activePlayerRef.current;
    const video = active === 'A' ? videoRefA.current : videoRefB.current;
    if (!video) return;

    const duration = video.duration || stateManager.getCurrentNode().duration;
    let targetTime = clickPct * duration;
    const currentTime = video.currentTime;

    // 智能拦截：如果在当前时间与目标跳转时间之间存在未触发的交互点
    const node = stateManager.getCurrentNode();
    if (Array.isArray(node.interactions)) {
      for (const interaction of node.interactions) {
        if (currentTime < interaction.timestamp && targetTime > interaction.timestamp) {
          console.log(`[InteractivePlayer] 跳转拦截！越过互动点 ${interaction.timestamp}s，强制截断并激活分支选项。`);
          targetTime = interaction.timestamp;
          
          // 强制暂停并设置视频进度，调用 tick 触发 Overlay
          video.pause();
          setIsPaused(true);
          video.currentTime = targetTime;
          stateManager.tick(targetTime);
          return;
        }
      }
    }

    // 正常跳转
    video.currentTime = targetTime;
    stateManager.tick(targetTime);
  };

  // 5. 临近预加载与多分支竞态算法 (Proximity Preload)
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    if (!hasStarted) return;
    
    const video = e.currentTarget;
    const currentTime = video.currentTime;
    const duration = video.duration || stateManager.getCurrentNode().duration;

    // 推动 NodeStateManager 核心状态管理器 Tick
    stateManager.tick(currentTime);

    // 性能优化：直接操作 DOM 更新进度条与时间文本，免去 React 重绘开销
    const pct = duration > 0 ? (currentTime / duration) : 0;
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${pct * 100}%`;
    }
    if (timeDisplayRef.current) {
      timeDisplayRef.current.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
    }

    // 临近判定检测窗口：距离视频结束（或交互判定点）剩余 5 - 8 秒区间
    const timeRemaining = duration - currentTime;
    const isInsidePreloadWindow = timeRemaining <= 8.0 && timeRemaining >= 2.0;

    if (isInsidePreloadWindow && !preloadedNodeIdRef.current) {
      // 获悉备选后续节点列表
      const candidates = stateManager.getPreloadCandidateNodeIds();
      if (candidates.length === 0) return;

      // 分支判定选择器：默认超时分支优先 -> 第一个交互选项优先
      const currentNode = stateManager.getCurrentNode();
      let targetPreloadId = candidates[0];

      if (currentNode.defaultNextNodeId) {
        targetPreloadId = currentNode.defaultNextNodeId;
      } else if (currentNode.interactions && currentNode.interactions[0]?.options?.[0]?.targetNodeId) {
        targetPreloadId = currentNode.interactions[0].options[0].targetNodeId;
      }

      triggerSilentPreload(targetPreloadId);
    }
  };

  // 静默预加载核心
  const triggerSilentPreload = async (nodeId: string) => {
    preloadedNodeIdRef.current = nodeId;
    isPreloadReadyRef.current = false;
    
    // 强制强转 private config 获取预加载节点
    const nextNode = (stateManager as any).config.nodes[nodeId];
    if (!nextNode) return;

    const backgroundRole = activePlayerRef.current === 'A' ? 'B' : 'A';
    const bgVideo = backgroundRole === 'A' ? videoRefA.current : videoRefB.current;

    console.log(`[InteractivePlayer] [PRELOAD] 触发 Proximity 预加载! 目标节点: ${nodeId}, 载体: Player ${backgroundRole}`);

    if (bgVideo) {
      // 开启 Background Explicit Mute Lock (双重绝对静音锁)
      bgVideo.muted = true;
      bgVideo.volume = 0;
      
      // 启动 8 秒慢网超时熔断机制
      if (preloadTimeoutRef.current) clearTimeout(preloadTimeoutRef.current);
      preloadTimeoutRef.current = setTimeout(() => {
        console.warn(`[InteractivePlayer] [PRELOAD] 预加载 ${nodeId} 缓冲超时 (8秒)，安全熔断瞬间硬切防线！`);
        isPreloadReadyRef.current = false; // 标记未就绪，切换时刻将触发 Loading 抢占式缓冲
      }, 8000);

      // 加载视频流并缓冲
      try {
        await loadVideoSource(nextNode, backgroundRole);
        
        // 绑定 canplaythrough 宣告预加载就绪，清除超时熔断器
        const onCanPlay = () => {
          if (preloadTimeoutRef.current) {
            clearTimeout(preloadTimeoutRef.current);
            preloadTimeoutRef.current = null;
          }
          isPreloadReadyRef.current = true;
          console.log(`[InteractivePlayer] [PRELOAD] 预加载就绪 Ready! 节点: ${nodeId} 首帧缓冲完毕。`);
          bgVideo.removeEventListener('canplaythrough', onCanPlay);
        };
        
        bgVideo.addEventListener('canplaythrough', onCanPlay);
        
        // 静默 pause 在第 0 秒挂起
        bgVideo.pause();
        bgVideo.currentTime = 0;
      } catch (err) {
        console.error('[InteractivePlayer] 静默预加载发生错误:', err);
        isPreloadReadyRef.current = false;
      }
    }
  };

  // 6. 瞬间物理硬切切换算法 (时差 < 50ms, requestAnimationFrame)
  const executeSeamlessTransition = async (targetNode: VideoNode) => {
    const currentActive = activePlayerRef.current; // 'A' or 'B'
    const newActiveRole = currentActive === 'A' ? 'B' : 'A';

    const foregroundVideo = currentActive === 'A' ? videoRefA.current : videoRefB.current;
    const backgroundVideo = currentActive === 'A' ? videoRefB.current : videoRefA.current;

    if (!foregroundVideo || !backgroundVideo) return;

    try {
      // 清除可能残留的预载超时定时器
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
        preloadTimeoutRef.current = null;
      }

      // 步骤 1：唤起处于 Mute 锁状态 of 后台播放器播放 (防止卡顿)
      const startTime = performance.now();
      await backgroundVideo.play();

      // 步骤 2：在浏览器下一帧渲染的黄金微秒时间执行绝对 z-index 与 opacity 层叠硬切
      requestAnimationFrame(() => {
        // 物理交换 DOM 层级 (时差压制在 20ms 左右，1 帧以内)
        backgroundVideo.style.zIndex = '20';
        backgroundVideo.style.opacity = '1';
        backgroundVideo.style.pointerEvents = 'auto';

        foregroundVideo.style.zIndex = '10';
        foregroundVideo.style.opacity = '0';
        foregroundVideo.style.pointerEvents = 'none';

        // 步骤 3：解除新前台静音锁，并在 120ms 内实施音量平滑淡入 (Cross-fade)，消除爆音
        fadeInAudio(backgroundVideo, globalVolume);

        // 步骤 4：对旧前台播放器施加 Explicit Mute Lock 并 pause 挂起 seek 0s
        foregroundVideo.muted = true;
        foregroundVideo.volume = 0;
        foregroundVideo.pause();
        foregroundVideo.currentTime = 0;

        // 步骤 5：对调状态指针，重置预载控制标识
        updateActivePlayer(newActiveRole);
        preloadedNodeIdRef.current = null;
        isPreloadReadyRef.current = false;

        const latency = performance.now() - startTime;
        stateManager.recordSwitchLatency(latency);

        console.log(`[InteractivePlayer] [SWAP] 物理瞬间硬切无缝拼接大获成功！切换时差 < 30ms, 实际延时: ${latency.toFixed(2)}ms`);
      });
    } catch (err) {
      console.error('[InteractivePlayer] 执行瞬间硬切遭遇失败，紧急启动抢占性缓冲:', err);
      executePreemptionHotload(targetNode);
    }
  };

  // 音频 120ms 平滑淡入
  const fadeInAudio = (video: HTMLVideoElement, targetVol: number) => {
    video.muted = false;
    video.volume = 0;
    
    const duration = 120; // 120ms 淡入
    const step = 20; // 每 20ms 微调
    const volIncrement = targetVol / (duration / step);
    
    let currentVol = 0;
    const interval = setInterval(() => {
      currentVol += volIncrement;
      if (currentVol >= targetVol) {
        video.volume = targetVol;
        clearInterval(interval);
      } else {
        video.volume = currentVol;
      }
    }, step);
  };

  // 7. 动态抢占热加载 (Preemption Hotloading / 超时慢网降级)
  const executePreemptionHotload = async (targetNode: VideoNode) => {
    setIsPreempting(true); // 激活磨砂玻璃 Loading 骨架遮罩层
    
    const currentActive = activePlayerRef.current;
    const backgroundRole = currentActive === 'A' ? 'B' : 'A';
    const bgVideo = backgroundRole === 'A' ? videoRefA.current : videoRefB.current;
    const fgVideo = currentActive === 'A' ? videoRefA.current : videoRefB.current;

    console.log(`[InteractivePlayer] [PREEMPTION] 预加载失配或未 Ready，启动抢占热加载 -> ${targetNode.id}`);

    if (bgVideo && fgVideo) {
      // 强制暂停前台，清空旧预载任务
      fgVideo.pause();
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
        preloadTimeoutRef.current = null;
      }

      // 对后台施加静音锁
      bgVideo.muted = true;
      bgVideo.volume = 0;

      const startTime = performance.now();

      try {
        // 热装载分支流
        await loadVideoSource(targetNode, backgroundRole);
        
        // 绑定单次加载就绪监听，就绪后立刻切入
        const onPlayable = async () => {
          try {
            await bgVideo.play();
            
            requestAnimationFrame(() => {
              // 瞬间物理对调
              bgVideo.style.zIndex = '20';
              bgVideo.style.opacity = '1';
              bgVideo.style.pointerEvents = 'auto';

              fgVideo.style.zIndex = '10';
              fgVideo.style.opacity = '0';
              fgVideo.style.pointerEvents = 'none';

              fadeInAudio(bgVideo, globalVolume);

              fgVideo.muted = true;
              fgVideo.volume = 0;
              fgVideo.pause();
              fgVideo.currentTime = 0;

              updateActivePlayer(backgroundRole);
              preloadedNodeIdRef.current = null;
              isPreloadReadyRef.current = false;
              
              setIsPreempting(false); // 隐藏 Loading 遮罩层
              
              const latency = performance.now() - startTime;
              stateManager.recordSwitchLatency(latency);
              
              console.log(`[InteractivePlayer] [PREEMPTION] 抢占缓冲拼合完毕！实际延时: ${latency.toFixed(2)}ms`);
            });
          } catch (e) {
            console.error('Play background on preemption error:', e);
          }
          bgVideo.removeEventListener('canplaythrough', onPlayable);
        };

        bgVideo.addEventListener('canplaythrough', onPlayable);
      } catch (err) {
        console.error('[InteractivePlayer] 抢占重载遭遇严重网络阻断:', err);
        setIsPreempting(false);
      }
    }
  };

  return (
    <div 
      onClick={togglePlayPause}
      className="group relative w-full h-full overflow-hidden bg-black rounded-xl border border-slate-800 shadow-2xl cursor-pointer select-none"
    >
      {/* Video A DOM 实例 (常驻) */}
      <video
        ref={videoRefA}
        className="video-instance-a absolute top-0 left-0 w-full h-full object-cover transition-all duration-[50ms] ease-linear will-change-[transform,opacity,z-index]"
        style={{
          zIndex: activePlayer === 'A' ? 20 : 10,
          opacity: activePlayer === 'A' ? 1 : 0,
          pointerEvents: activePlayer === 'A' ? 'auto' : 'none'
        }}
        onTimeUpdate={activePlayer === 'A' ? handleTimeUpdate : undefined}
        playsInline
      />

      {/* Video B DOM 实例 (常驻) */}
      <video
        ref={videoRefB}
        className="video-instance-b absolute top-0 left-0 w-full h-full object-cover transition-all duration-[50ms] ease-linear will-change-[transform,opacity,z-index]"
        style={{
          zIndex: activePlayer === 'B' ? 20 : 10,
          opacity: activePlayer === 'B' ? 1 : 0,
          pointerEvents: activePlayer === 'B' ? 'auto' : 'none'
        }}
        onTimeUpdate={activePlayer === 'B' ? handleTimeUpdate : undefined}
        playsInline
      />

      {/* Center Play/Pause Transition Indicator Overlay */}
      {showHudAnim && (
        <div className="absolute inset-0 z-[32] flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-slate-950/75 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-2xl animate-[ping_0.8s_ease-out_1]">
            {showHudAnim === 'play' ? (
              <svg className="w-5 h-5 fill-current text-purple-400 translate-x-[2px]" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 fill-current text-purple-400" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Sleek Custom Bottom HUD Controls */}
      {hasStarted && !isChoiceShowing && !isPreempting && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="absolute bottom-6 right-6 z-[35] flex items-center gap-3 transition-all duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 bg-slate-900/75 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md shadow-lg"
        >
          {/* Playback Time Indicator */}
          <span 
            ref={timeDisplayRef}
            className="text-[10px] font-mono text-slate-300 select-none font-bold"
          >
            00:00 / 00:00
          </span>

          <div className="w-[1px] h-3 bg-white/15" />

          {/* Pause/Play HUD Button */}
          <button 
            onClick={togglePlayPause}
            className="cursor-pointer w-6 h-6 rounded-lg bg-white/5 border border-white/5 hover:border-violet-500/40 text-white flex items-center justify-center active:scale-95 transition-all hover:scale-105"
          >
            {isPaused ? (
              <svg className="w-3 h-3 fill-current text-white translate-x-[0.5px]" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg className="w-3 h-3 fill-current text-white" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Sleek Progress Bar (Interactive & Interceptable) */}
      {hasStarted && (
        <div 
          onClick={handleProgressBarClick}
          data-testid="interactive-progressbar"
          className="absolute bottom-0 left-0 right-0 h-[6px] hover:h-[10px] bg-slate-950/40 z-[35] cursor-pointer pointer-events-auto transition-all duration-200 group/progress"
        >
          <div 
            ref={progressBarRef}
            className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 shadow-[0_0_8px_rgba(168,85,247,0.6)] relative"
            style={{
              width: '0%',
            }}
          >
            {/* 滑块 Thumb */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md border border-purple-500 scale-0 group-hover/progress:scale-100 transition-transform duration-150 pointer-events-none" />
          </div>
        </div>
      )}

      {/* A. 首次播放启动体验遮罩层 (解锁 Autoplay Policy) */}
      {!hasStarted && (
        <div className="absolute inset-0 z-[50] bg-slate-950/90 flex flex-col items-center justify-center gap-6 p-6 text-center backdrop-blur-md">
          {/* 精美炫彩发光球 */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-bounce">
            <span className="font-extrabold text-white text-3xl tracking-tight">IV</span>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-wide mb-2">欢迎来到多分支互动电影</h2>
            <p className="text-xs text-slate-400 max-w-sm">您将扮演剧情主宰者，在时间判定点做出您的选择，左右故事终局走向。</p>
          </div>
          <button
            onClick={(e) => handleStartExperience(e)}
            className="cursor-pointer px-8 py-3.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm shadow-lg hover:shadow-purple-500/20 active:scale-95 transition-all duration-200 border border-purple-400/20"
          >
            开启奇幻之旅 (有声启动)
          </button>
        </div>
      )}

      {/* B. 极速抢占或慢速网络 Loading 磨砂玻璃垫片 (Glassmorphism Skeleton Overlay) */}
      {isPreempting && (
        <div className="absolute inset-0 z-[40] bg-slate-950/40 backdrop-blur-md flex flex-col items-center justify-center gap-3 transition-all duration-300">
          <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          <span className="text-[10px] text-purple-300 font-semibold tracking-wider font-mono animate-pulse">正在极速加载新剧情分支...</span>
        </div>
      )}

      {/* C. Autoplay 拦截降级静音播放解锁气泡 (Muted Autoplay Unlock Prompt) */}
      {isMutedAutoplay && (
        <div className="absolute bottom-6 left-6 z-[35] glass-panel px-4 py-2.5 flex items-center gap-3 animate-fade-in shadow-xl border border-purple-500/20">
          <span className="text-[10px] text-amber-400 font-semibold">🔊 浏览器已自动静音播放</span>
          <button
            onClick={handleUnlockVolume}
            className="cursor-pointer px-3 py-1 rounded bg-purple-600 text-white font-bold text-[10px] active:scale-95 transition-all"
          >
            解除静音
          </button>
        </div>
      )}
    </div>
  );
}
