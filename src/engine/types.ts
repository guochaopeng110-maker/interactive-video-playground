export interface VideoInteractionOption {
  text: string;
  targetNodeId: string;
}

export interface VideoInteraction {
  timestamp: number; // 触发交互弹窗的时刻（秒）
  type: 'choice' | string; // 目前首期仅支持 'choice'
  title?: string; // 交互弹窗标题（非固定，由配置驱动）
  options: VideoInteractionOption[];
}

export interface VideoNode {
  id: string;
  videoUrl: string;
  duration: number; // 视频时长（秒）
  defaultNextNodeId?: string; // 视频播放结束后的默认跳转节点ID（若不选择分支）
  interactions: VideoInteraction[]; // 视频中的交互时间点列表
}

export interface StoryConfig {
  startNodeId: string;
  nodes: Record<string, VideoNode>;
}

// 状态机抛出的事件回调类型
export type NodeChangedCallback = (currentNode: VideoNode, previousNodeId: string | null) => void;
export type InteractionTriggeredCallback = (interaction: VideoInteraction) => void;
export type PlaybackFinishedCallback = (finalNodeId: string) => void;
export type SwitchLatencyCallback = (latency: number) => void;

export interface StateManagerEvents {
  nodeChanged: NodeChangedCallback[];
  interactionTriggered: InteractionTriggeredCallback[];
  playbackFinished: PlaybackFinishedCallback[];
  switchLatency: SwitchLatencyCallback[];
}
