
import type { VideoNode, StoryConfig } from '../engine/types';
import { NodeStateManager } from '../engine/NodeStateManager';

interface StoryNodeGraphProps {
  stateManager: NodeStateManager;
  currentNode: VideoNode;
  visitedNodeIds: string[];
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
  depth: number;
  node: VideoNode;
}

export default function StoryNodeGraph({
  stateManager,
  currentNode,
  visitedNodeIds
}: StoryNodeGraphProps) {
  const config = (stateManager as any).config as StoryConfig;
  const nodes = config.nodes;

  // 画布尺寸
  const width = 280;
  const height = 220;

  // 1. BFS 动态计算剧情树的节点绝对定位与连线关系
  const positions: Record<string, NodePosition> = {};
  const connections: Array<{ from: string; to: string }> = [];

  const startNodeId = config.startNodeId;
  const queue: Array<{ id: string; depth: number }> = [{ id: startNodeId, depth: 0 }];
  const visited = new Set<string>([startNodeId]);
  const nodeDepths: Record<string, number> = { [startNodeId]: 0 };

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    const node = nodes[id];
    if (!node) continue;

    const nextIds = new Set<string>();
    if (node.defaultNextNodeId) {
      nextIds.add(node.defaultNextNodeId);
    }
    if (node.interactions) {
      node.interactions.forEach((inter) => {
        if (inter.options) {
          inter.options.forEach((opt) => {
            if (opt.targetNodeId) {
              nextIds.add(opt.targetNodeId);
            }
          });
        }
      });
    }

    nextIds.forEach((nextId) => {
      // 避免重复记录连线
      if (!connections.some(c => c.from === id && c.to === nextId)) {
        connections.push({ from: id, to: nextId });
      }

      if (!visited.has(nextId) && nodes[nextId]) {
        visited.add(nextId);
        nodeDepths[nextId] = depth + 1;
        queue.push({ id: nextId, depth: depth + 1 });
      }
    });
  }

  // 2. 按 depth 进行层级分组
  const depthGroups: Record<number, string[]> = {};
  Object.entries(nodeDepths).forEach(([id, depth]) => {
    if (!depthGroups[depth]) {
      depthGroups[depth] = [];
    }
    depthGroups[depth].push(id);
  });

  const totalDepths = Object.keys(depthGroups).length;

  // 3. 分配对称而紧凑的 (x, y) 坐标比率，并乘以容器宽高
  Object.entries(depthGroups).forEach(([depthStr, ids]) => {
    const depth = parseInt(depthStr, 10);
    const count = ids.length;

    // y 坐标（纵向，层级越深越靠下，0.2 到 0.8 区间）
    const yRatio = totalDepths > 1 ? (depth / (totalDepths - 1)) * 0.55 + 0.22 : 0.5;
    const y = yRatio * height;

    ids.forEach((id, idx) => {
      // x 坐标（横向，相同层级水平平分，0.15 到 0.85 区间）
      const xRatio = count > 1 ? (idx / (count - 1)) * 0.65 + 0.175 : 0.5;
      const x = xRatio * width;

      positions[id] = {
        id,
        x,
        y,
        depth,
        node: nodes[id]
      };
    });
  });

  // 节点卡片双击/单击跳转交互
  const handleNodeJump = (nodeId: string) => {
    if (currentNode.id === nodeId) return;
    console.log(`[StoryNodeGraph] 双击/点击节点触发瞬移跳转 -> ${nodeId}`);
    stateManager.transitionToNode(nodeId);
  };

  return (
    <div className="relative p-2 bg-slate-950/40 rounded-xl border border-slate-900 overflow-hidden flex flex-col items-center">
      <div className="w-full flex items-center justify-between px-2 mb-2">
        <span className="text-[10px] text-slate-500 font-mono tracking-wider font-semibold uppercase">📊 剧情拓扑小地图</span>
        <span className="text-[9px] text-purple-400/80 font-mono">双击节点可快捷跳转</span>
      </div>

      <div 
        className="relative overflow-hidden select-none bg-slate-950/80 rounded-lg border border-slate-900/60 shadow-inner"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {/* SVG 背景连线层 */}
        <svg className="absolute inset-0 z-0 w-full h-full pointer-events-none">
          <defs>
            {/* 连线渐变色 (已激活路径) */}
            <linearGradient id="active-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>

            {/* 连线渐变色 (未激活路径) */}
            <linearGradient id="inactive-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0.1" />
            </linearGradient>

            {/* 有向箭头标识 */}
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#d946ef" />
            </marker>

            <marker
              id="arrow-inactive"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#475569" fillOpacity="0.4" />
            </marker>
          </defs>

          {/* 渲染路径线 */}
          {connections.map((conn, idx) => {
            const pFrom = positions[conn.from];
            const pTo = positions[conn.to];
            if (!pFrom || !pTo) return null;

            // 判定此路径是否已经走过：源节点被访问过，且目标节点也被访问过（或目标就是当前活跃节点）
            const isPathUnlocked =
              visitedNodeIds.includes(conn.from) &&
              (visitedNodeIds.includes(conn.to) || currentNode.id === conn.to);

            return (
              <line
                key={idx}
                x1={pFrom.x}
                y1={pFrom.y}
                x2={pTo.x}
                y2={pTo.y}
                stroke={isPathUnlocked ? 'url(#active-line-grad)' : 'url(#inactive-line-grad)'}
                strokeWidth={isPathUnlocked ? '2.5' : '1.5'}
                strokeDasharray={isPathUnlocked ? 'none' : '3 3'}
                markerEnd={isPathUnlocked ? 'url(#arrow-active)' : 'url(#arrow-inactive)'}
                className={isPathUnlocked ? 'animate-[pulse_2s_infinite]' : ''}
              />
            );
          })}
        </svg>

        {/* HTML 节点卡片绝对定位层 */}
        {Object.values(positions).map((pos) => {
          const isActive = currentNode.id === pos.id;
          const isVisited = visitedNodeIds.includes(pos.id);
          const isLocked = !isVisited && !isActive;

          // 选项个数
          const branchCount = pos.node.interactions?.[0]?.options?.length || 0;

          // 核心样式逻辑
          let nodeBg = 'bg-slate-900/90 border-slate-800 text-slate-400 hover:border-slate-700';
          let borderGlow = '';

          if (isActive) {
            nodeBg = 'bg-gradient-to-br from-violet-600/30 via-fuchsia-600/20 to-pink-500/20 border-fuchsia-500/80 text-white shadow-[0_0_15px_rgba(217,70,239,0.45)]';
            borderGlow = 'absolute inset-0 rounded-lg animate-ping border border-pink-500/50 opacity-40 pointer-events-none scale-105';
          } else if (isVisited) {
            nodeBg = 'bg-slate-900/95 border-purple-500/60 text-purple-200 shadow-[0_0_6px_rgba(139,92,246,0.15)] hover:border-purple-400/80 hover:bg-slate-800/80';
          } else if (isLocked) {
            nodeBg = 'bg-slate-950/70 border-slate-900 text-slate-600 opacity-45 cursor-not-allowed';
          }

          return (
            <div
              key={pos.id}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
            >
              {/* 激活状态扩圈脉冲特效 */}
              {isActive && <div className={borderGlow}></div>}

              {/* 节点气泡 */}
              <div
                onDoubleClick={() => !isLocked && handleNodeJump(pos.id)}
                onClick={() => !isLocked && handleNodeJump(pos.id)}
                className={`cursor-pointer px-2.5 py-1.5 rounded-lg border text-[10px] font-bold font-mono tracking-wide transition-all duration-200 select-none backdrop-blur-sm ${nodeBg}`}
              >
                <div className="flex items-center gap-1">
                  {/* 小圆点呼吸灯 */}
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? 'bg-fuchsia-400 animate-pulse shadow-md shadow-fuchsia-500' :
                    isVisited ? 'bg-purple-500' : 'bg-slate-700'
                  }`}></span>
                  <span>{pos.id}</span>
                </div>
              </div>

              {/* Tooltip 精美悬浮卡片 */}
              {!isLocked && (
                <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-48 bg-slate-950/95 border border-slate-800 p-2.5 rounded-xl shadow-2xl backdrop-blur-xl opacity-0 scale-90 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-200 z-[9999] text-left">
                  <div className="text-[10px] text-white font-extrabold mb-1 font-mono border-b border-slate-900 pb-1">
                    节点: {pos.id}
                  </div>
                  <div className="text-[9px] text-slate-400 space-y-0.5 font-sans">
                    <p className="truncate"><span className="text-slate-500 font-mono">资产:</span> {pos.node.videoUrl}</p>
                    <p><span className="text-slate-500 font-mono">时长:</span> {pos.node.duration}s</p>
                    <p><span className="text-slate-500 font-mono">下一跳转:</span> {pos.node.defaultNextNodeId ? <span className="text-purple-400 font-mono">{pos.node.defaultNextNodeId}</span> : <span className="text-slate-600">无(分支选择)</span>}</p>
                    <p><span className="text-slate-500 font-mono">分叉选项:</span> {branchCount > 0 ? <span className="text-pink-400 font-bold">{branchCount} 个分叉</span> : <span className="text-slate-600">无分叉(单线)</span>}</p>
                    {isActive ? (
                      <p className="text-fuchsia-400 font-extrabold text-center pt-1 border-t border-slate-900/60 mt-1 animate-pulse">🎥 正在前台播放</p>
                    ) : (
                      <p className="text-purple-400 font-bold text-center pt-1 border-t border-slate-900/60 mt-1">🖱 点击立即切入</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
