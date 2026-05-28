import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 导入状态机与类型
import { NodeStateManager } from './engine/NodeStateManager';
import type { StoryConfig } from './engine/types';

// ==========================================
// 🚀 PHASE 2 核心状态机 - 冒烟沙盒测试脚本
// ==========================================
(function runEngineSandbox() {
  console.group('%c🎯 互动视频引擎 (Phase 2) - 纯逻辑沙盒自检开始', 'color: #9333ea; font-weight: bold; font-size: 14px;');

  // 1. 定义一份严格的测试互动拓扑配置
  const sandboxConfig: StoryConfig = {
    startNodeId: "sandbox_intro",
    nodes: {
      sandbox_intro: {
        id: "sandbox_intro",
        videoUrl: "/assets/intro.mp4",
        duration: 8.0, // 缩短时长方便快速模拟
        defaultNextNodeId: "sandbox_branch_a",
        interactions: [
          {
            timestamp: 4.0, // 设定在第 4.0 秒弹出选项
            type: "choice",
            options: [
              { text: "前往冰封极地 (分支 A)", targetNodeId: "sandbox_branch_a" },
              { text: "前往熔岩炼狱 (分支 B)", targetNodeId: "sandbox_branch_b" }
            ]
          }
        ]
      },
      sandbox_branch_a: {
        id: "sandbox_branch_a",
        videoUrl: "/assets/branch_a.mp4",
        duration: 5.0,
        interactions: []
      },
      sandbox_branch_b: {
        id: "sandbox_branch_b",
        videoUrl: "/assets/branch_b.mp4",
        duration: 5.0,
        interactions: []
      }
    }
  };

  try {
    // 2. 状态机实例化
    console.log('%c[STEP 1] 正在实例化 NodeStateManager 并自检配置...', 'color: #3b82f6;');
    const manager = new NodeStateManager(sandboxConfig);
    
    // 3. 验证预加载候选计算
    const candidates = manager.getPreloadCandidateNodeIds();
    console.log('%c[STEP 2] 获取当前初始节点下的预加载候选列表:', 'color: #3b82f6;', candidates);

    // 4. 注册事件监听器
    console.log('%c[STEP 3] 注册状态机核心事件订阅监听...', 'color: #3b82f6;');
    
    manager.on('nodeChanged', (node, prevId) => {
      console.log(`%c[EVENT] 🔄 节点切换完成: %c${prevId} -> ${node.id}`, 'color: #10b981;', 'color: #f59e0b; font-weight: bold;');
      console.log(`%c        └─ 新视频地址: ${node.videoUrl} | 下级预加载分支:`, 'color: #64748b;', manager.getPreloadCandidateNodeIds());
    });

    manager.on('interactionTriggered', (interaction) => {
      console.log('%c[EVENT] ⚡ 触达互动视频判定点!', 'color: #ec4899; font-weight: bold;');
      console.log('%c        └─ 选项列表:', 'color: #64748b;', interaction.options.map(o => o.text));
      
      // 模拟用户行为：在触发互动 1.5 秒后，用户做出了选择，点击了“分支 B”
      console.log('%c[SIMULATOR] 模拟用户思考中... (1.5秒后自动选择分支 B)', 'color: #a855f7; font-style: italic;');
      setTimeout(() => {
        console.log('%c[SIMULATOR] 用户选择了: 熔岩炼狱 (分支 B)', 'color: #a855f7; font-weight: bold;');
        manager.selectOption("sandbox_branch_b");
      }, 1500);
    });

    manager.on('playbackFinished', (finalId) => {
      console.log(`%c[EVENT] 🎉 恭喜! 整条剧情故事线成功播放完结。终点站: %c${finalId}`, 'color: #10b981; font-weight: bold;', 'color: #f59e0b; font-weight: bold;');
      console.groupEnd();
    });

    // 5. 模拟视频时间轴的 Tick 推进 (250ms 一次 tick，步长 0.5s)
    console.log('%c[STEP 4] 开启播放时间模拟器 (每 250ms tick 0.5s)...', 'color: #3b82f6;');
    let virtualTime = 0.0;
    
    const playbackTimer = setInterval(() => {
      virtualTime += 0.5;
      
      // 驱动状态机 tick
      manager.tick(virtualTime);
      
      // 检查如果跳转到了 sandbox_branch_b，我们从新节点 0 秒开始模拟
      const currentId = manager.getCurrentNodeId();
      const node = manager.getCurrentNode();
      
      // 如果跳转了，且模拟器时间还未复位，我们将模拟器时间重置到新节点起点
      if (currentId === 'sandbox_branch_b' && virtualTime > 5.0) {
        console.log('%c[SIMULATOR] 模拟器时间轴同步复位到分支视频起点 0.0s', 'color: #a855f7; font-style: italic;');
        virtualTime = 0.0;
      }
      
      // 当 branch_b 播放完，清除定时器
      if (currentId === 'sandbox_branch_b' && virtualTime >= node.duration) {
        clearInterval(playbackTimer);
      }
      
      // 兜底防无尽
      if (virtualTime > 25.0) {
        clearInterval(playbackTimer);
        console.warn('[SIMULATOR] 模拟超时兜底退出');
        console.groupEnd();
      }
    }, 250);

  } catch (error) {
    console.error('%c[ERROR] ❌ 状态机沙盒运行报错:', 'color: #ef4444;', error);
    console.groupEnd();
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
