import type {
  StoryConfig,
  VideoNode,
  StateManagerEvents,
  NodeChangedCallback,
  InteractionTriggeredCallback,
  PlaybackFinishedCallback,
  SwitchLatencyCallback
} from './types';

export class NodeStateManager {
  private config: StoryConfig;
  private currentNodeId: string;
  private previousNodeId: string | null = null;
  
  // 存放当前节点已触发的交互事件索引，防止重复激活
  private triggeredInteractions: Set<number> = new Set();
  
  // 简易事件发布订阅系统
  private events: StateManagerEvents = {
    nodeChanged: [],
    interactionTriggered: [],
    playbackFinished: [],
    switchLatency: []
  };

  /**
   * 构造函数，载入配置并进行合法性校验
   */
  constructor(config: StoryConfig) {
    this.validateConfig(config);
    this.config = config;
    this.currentNodeId = config.startNodeId;
  }

  /**
   * 校验配置文件结构及路由的静态安全性
   */
  private validateConfig(config: StoryConfig): void {
    if (!config) {
      throw new Error('[NodeStateManager] 配置对象不能为空');
    }
    if (!config.startNodeId) {
      throw new Error('[NodeStateManager] 配置缺少启动节点 startNodeId');
    }
    if (!config.nodes || typeof config.nodes !== 'object') {
      throw new Error('[NodeStateManager] 配置缺少有效的 nodes 映射表');
    }
    if (!config.nodes[config.startNodeId]) {
      throw new Error(`[NodeStateManager] 启动节点 "${config.startNodeId}" 在 nodes 映射表中不存在`);
    }

    // 静态校验：悬空节点与基础路由检测
    const nodeIds = Object.keys(config.nodes);
    for (const id of nodeIds) {
      const node = config.nodes[id];
      if (!node.id || node.id !== id) {
        throw new Error(`[NodeStateManager] 节点 key "${id}" 与内部 id "${node.id}" 不匹配`);
      }
      if (!node.videoUrl) {
        throw new Error(`[NodeStateManager] 节点 "${id}" 缺少 videoUrl 属性`);
      }
      if (node.duration === undefined || node.duration <= 0) {
        throw new Error(`[NodeStateManager] 节点 "${id}" 的 duration 必须为大于0的数字`);
      }

      // 1. 校验默认跳转节点是否合法
      if (node.defaultNextNodeId) {
        if (!config.nodes[node.defaultNextNodeId]) {
          throw new Error(`[NodeStateManager] 节点 "${id}" 的默认跳转节点 "${node.defaultNextNodeId}" 不存在`);
        }
      }

      // 2. 校验交互选项的跳转节点是否合法
      if (Array.isArray(node.interactions)) {
        node.interactions.forEach((interaction, idx) => {
          if (interaction.timestamp === undefined || interaction.timestamp < 0 || interaction.timestamp > node.duration) {
            throw new Error(`[NodeStateManager] 节点 "${id}" 的第 ${idx} 个互动点触发时刻 invalid (必须在 0 到 duration 之间)`);
          }
          if (!Array.isArray(interaction.options) || interaction.options.length === 0) {
            throw new Error(`[NodeStateManager] 节点 "${id}" 在时刻 ${interaction.timestamp} 的互动点缺少有效的选项数组`);
          }

          interaction.options.forEach((option, optIdx) => {
            if (!option.text) {
              throw new Error(`[NodeStateManager] 节点 "${id}" 时刻 ${interaction.timestamp} 的选项 ${optIdx} 缺少展示文本`);
            }
            if (!option.targetNodeId || !config.nodes[option.targetNodeId]) {
              throw new Error(`[NodeStateManager] 节点 "${id}" 时刻 ${interaction.timestamp} 的选项 "${option.text}" 指向了不存在的目标节点 "${option.targetNodeId}"`);
            }
          });
        });
      }
    }

    // 3. 检测死循环（这里实现简单的无尽线性环路检测）
    this.detectStaticDeadLoops(config);
    console.log('[NodeStateManager] 配置文件静态安全自检 100% 通过！未检测到悬空分支与线性死循环。');
  }

  /**
   * 静态死循环检测：如果只存在 defaultNextNodeId 的单线循环，将会造成死循环
   */
  private detectStaticDeadLoops(config: StoryConfig): void {
    const nodeIds = Object.keys(config.nodes);

    for (const startId of nodeIds) {
      let currentId: string | undefined = startId;
      const path = new Set<string>();

      while (currentId) {
        if (path.has(currentId)) {
          throw new Error(`[NodeStateManager] 检测到静态无尽环路 (死循环): ${Array.from(path).join(' -> ')} -> ${currentId}`);
        }
        path.add(currentId);
        currentId = config.nodes[currentId].defaultNextNodeId;
      }
    }
  }

  /**
   * 获取当前播放节点的数据
   */
  public getCurrentNode(): VideoNode {
    return this.config.nodes[this.currentNodeId];
  }

  /**
   * 获取当前播放节点的 ID
   */
  public getCurrentNodeId(): string {
    return this.currentNodeId;
  }

  /**
   * 切换至指定节点
   */
  public transitionToNode(nodeId: string): void {
    if (!this.config.nodes[nodeId]) {
      console.error(`[NodeStateManager] 试图跳转至不存在的节点: ${nodeId}`);
      return;
    }
    
    this.previousNodeId = this.currentNodeId;
    this.currentNodeId = nodeId;
    this.triggeredInteractions.clear(); // 清除已触发互动标记集
    
    console.log(`[NodeStateManager] 节点发生切换: ${this.previousNodeId} -> ${this.currentNodeId}`);
    
    // 广播节点变更事件
    const currentNode = this.getCurrentNode();
    this.events.nodeChanged.forEach(callback => {
      try {
        callback(currentNode, this.previousNodeId);
      } catch (err) {
        console.error('[NodeStateManager] 执行 nodeChanged 监听回调报错:', err);
      }
    });
  }

  /**
   * 选择交互选项进行跳转
   */
  public selectOption(targetNodeId: string): void {
    this.transitionToNode(targetNodeId);
  }

  /**
   * 记录并广播切换延迟时差
   * @param latency 精确到毫秒的切换延时数值
   */
  public recordSwitchLatency(latency: number): void {
    console.log(`[NodeStateManager] 记录切换时延: ${latency.toFixed(2)}ms`);
    this.events.switchLatency.forEach(callback => {
      try {
        callback(latency);
      } catch (err) {
        console.error('[NodeStateManager] 执行 switchLatency 监听回调报错:', err);
      }
    });
  }

  /**
   * 时间轴 Tick 推动器（由底层播放器的 timeupdate 不间断驱动）
   * @param currentTime 当前播放的精确时刻（秒）
   */
  public tick(currentTime: number): void {
    const node = this.getCurrentNode();
    if (!node) return;

    // 1. 监测是否有互动点需要被触发
    if (Array.isArray(node.interactions)) {
      node.interactions.forEach((interaction, index) => {
        // 浮点容差条件：
        // A. 播放进度越过了交互点触发时刻 (currentTime >= timestamp)
        // B. 时间误差在合理阈值内 (为了防止跳度极大导致误触发，通常设定 2 秒容差)
        // C. 在当前节点生命周期中该交互尚未触发过 (防抖、防重复)
        const isTimeMatch = currentTime >= interaction.timestamp && currentTime < interaction.timestamp + 2.0;
        const isAlreadyTriggered = this.triggeredInteractions.has(index);

        if (isTimeMatch && !isAlreadyTriggered) {
          this.triggeredInteractions.add(index);
          console.log(`[NodeStateManager] [TICK] 激活交互点! 触发时刻: ${interaction.timestamp}s, 当前进度: ${currentTime.toFixed(3)}s`);
          
          // 广播交互点触发事件
          this.events.interactionTriggered.forEach(callback => {
            try {
              callback(interaction);
            } catch (err) {
              console.error('[NodeStateManager] 执行 interactionTriggered 监听回调报错:', err);
            }
          });
        }
      });
    }

    // 2. 监测是否视频自然播放完毕
    // 容差设定：如果当前时间非常接近或超出视频持续时间且还未跳转，触发默认跳转或自然结束
    const tolerance = 0.3; // 300ms 容差
    if (currentTime >= node.duration - tolerance) {
      if (node.defaultNextNodeId) {
        console.log(`[NodeStateManager] [TICK] 视频自然播放完结，执行 defaultNextNodeId 跳转到: ${node.defaultNextNodeId}`);
        this.transitionToNode(node.defaultNextNodeId);
      } else {
        // 没有后续节点，宣告整条播放链路结束
        const alreadyFinished = this.triggeredInteractions.has(-1);
        if (!alreadyFinished) {
          this.triggeredInteractions.add(-1);
          console.log(`[NodeStateManager] [TICK] 整条剧情链播放圆满结束，终点节点: ${this.currentNodeId}`);
          this.events.playbackFinished.forEach(callback => {
            try {
              callback(this.currentNodeId);
            } catch (err) {
              console.error('[NodeStateManager] 执行 playbackFinished 监听回调报错:', err);
            }
          });
        }
      }
    }
  }

  /**
   * 计算当前节点所有后续可能流转的目标节点 ID 列表（去重）
   * 用于给底层交替播放器（Phase 3）指示需要预加载的候选媒体资产
   */
  public getPreloadCandidateNodeIds(): string[] {
    const node = this.getCurrentNode();
    if (!node) return [];

    const candidates = new Set<string>();

    if (node.defaultNextNodeId) {
      candidates.add(node.defaultNextNodeId);
    }

    if (Array.isArray(node.interactions)) {
      node.interactions.forEach(interaction => {
        if (Array.isArray(interaction.options)) {
          interaction.options.forEach(opt => {
            if (opt.targetNodeId) {
              candidates.add(opt.targetNodeId);
            }
          });
        }
      });
    }

    return Array.from(candidates);
  }

  /**
   * 注册事件订阅
   */
  public on(event: 'nodeChanged', callback: NodeChangedCallback): void;
  public on(event: 'interactionTriggered', callback: InteractionTriggeredCallback): void;
  public on(event: 'playbackFinished', callback: PlaybackFinishedCallback): void;
  public on(event: 'switchLatency', callback: SwitchLatencyCallback): void;
  public on(event: any, callback: any): void {
    if (event in this.events) {
      (this.events as any)[event].push(callback);
    }
  }

  /**
   * 解绑事件订阅
   */
  public off(event: 'nodeChanged', callback: NodeChangedCallback): void;
  public off(event: 'interactionTriggered', callback: InteractionTriggeredCallback): void;
  public off(event: 'playbackFinished', callback: PlaybackFinishedCallback): void;
  public off(event: 'switchLatency', callback: SwitchLatencyCallback): void;
  public off(event: any, callback: any): void {
    if (event in this.events) {
      const list = (this.events as any)[event];
      const index = list.indexOf(callback);
      if (index !== -1) {
        list.splice(index, 1);
      }
    }
  }
}
