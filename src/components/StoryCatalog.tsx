import React from 'react';
import type { StoryConfig, VideoNode } from '../engine/types';
import { NodeStateManager } from '../engine/NodeStateManager';

interface StoryCatalogProps {
  stateManager: NodeStateManager;
  currentNode: VideoNode;
  visitedNodeIds: string[];
}

export default function StoryCatalog({
  stateManager,
  currentNode,
  visitedNodeIds
}: StoryCatalogProps) {
  const config = (stateManager as any).config as StoryConfig;
  const nodes = config.nodes;

  // 点击章节节点跳转
  const handleCatalogJump = (nodeId: string) => {
    if (currentNode.id === nodeId) return;
    console.log(`[StoryCatalog] 点击目录章节跳转 -> ${nodeId}`);
    stateManager.transitionToNode(nodeId);
  };

  // 递归树渲染引擎
  const renderNodeTree = (nodeId: string, depth: number = 0, optionText?: string): React.ReactNode => {
    const node = nodes[nodeId];
    if (!node) return null;

    const isActive = currentNode.id === nodeId;
    const isVisited = visitedNodeIds.includes(nodeId);
    const isLocked = !isVisited && !isActive;

    // 核心样式控制
    let itemBg = 'hover:bg-slate-900/50 text-slate-400 border-transparent hover:text-slate-200';
    let dotColor = 'bg-slate-700';
    let textGrad = 'text-slate-300';

    if (isActive) {
      itemBg = 'bg-gradient-to-r from-violet-600/20 via-fuchsia-600/15 to-pink-500/10 border-fuchsia-500/50 text-white shadow-[0_0_15px_rgba(217,70,239,0.1)]';
      dotColor = 'bg-fuchsia-400 animate-pulse shadow-md shadow-fuchsia-500';
      textGrad = 'bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent font-extrabold';
    } else if (isVisited) {
      itemBg = 'bg-slate-900/30 border-purple-500/30 text-purple-200 hover:bg-slate-900/60 hover:border-purple-500/50';
      dotColor = 'bg-purple-500';
      textGrad = 'text-purple-300 font-semibold';
    } else if (isLocked) {
      itemBg = 'bg-slate-950/20 border-slate-900/40 text-slate-500 hover:bg-slate-900/30 hover:border-slate-800/80';
      dotColor = 'bg-slate-800';
      textGrad = 'text-slate-500 font-normal';
    }

    // 收集所有子分支节点
    const children: Array<{ targetId: string; optText: string }> = [];
    if (Array.isArray(node.interactions)) {
      node.interactions.forEach(inter => {
        if (Array.isArray(inter.options)) {
          inter.options.forEach(opt => {
            if (opt.targetNodeId && nodes[opt.targetNodeId]) {
              children.push({
                targetId: opt.targetNodeId,
                optText: opt.text
              });
            }
          });
        }
      });
    }

    return (
      <div key={nodeId} className="flex flex-col relative select-none">
        {/* 连接垂直虚线，只在有子分支且非最后一层时渲染 */}
        {children.length > 0 && (
          <div 
            className="absolute left-4.5 top-8 bottom-2 w-[1px] border-l border-dashed border-slate-800 pointer-events-none"
            style={{ left: `${depth * 24 + 18}px` }}
          />
        )}

        {/* 目录项容器 */}
        <div 
          style={{ paddingLeft: `${depth * 24}px` }} 
          className="py-1 flex flex-col gap-1"
        >
          {/* 上游分支选择选项文本标签 (如果是子节点，列出促使流转到该节点的选项信息) */}
          {optionText && (
            <div className="pl-6 text-[10px] text-slate-500 font-sans italic flex items-center gap-1.5 leading-none mb-1">
              <span className="w-1.5 h-1.5 border-b border-l border-slate-700 inline-block -translate-y-0.5"></span>
              <span>路径选择: {optionText}</span>
            </div>
          )}

          {/* 节点点击条 */}
          <div
            onClick={() => handleCatalogJump(nodeId)}
            className={`cursor-pointer group relative flex items-center justify-between px-3 py-2.5 rounded-xl border backdrop-blur-sm transition-all duration-200 active:scale-98 ${itemBg}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {/* 节点呼吸灯小圆点 */}
              <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
              <div className="flex flex-col min-w-0 text-left">
                <span className={`text-[11px] font-bold font-mono tracking-wide truncate ${textGrad}`}>
                  {nodeId}
                </span>
                <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                  时长: {node.duration} 秒
                </span>
              </div>
            </div>

            {/* 右侧指示小贴片 */}
            <div className="flex items-center gap-1.5 font-mono text-[9px] shrink-0 ml-2">
              {isActive ? (
                <span className="bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">
                  🎥 正在播
                </span>
              ) : isVisited ? (
                <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded-full">
                  已体验
                </span>
              ) : (
                <span className="bg-slate-950/60 text-slate-600 border border-slate-900 px-1.5 py-0.5 rounded-full group-hover:text-slate-400 group-hover:border-slate-800 transition-colors">
                  未解锁
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 递归渲染子节点 */}
        {children.length > 0 && (
          <div className="flex flex-col mt-0.5">
            {children.map(child => renderNodeTree(child.targetId, depth + 1, child.optText))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="glass-panel w-full flex flex-col gap-4 overflow-hidden relative p-5 max-h-[675px]">
      {/* 磨砂玻璃彩色发光圈 */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/5 blur-2xl rounded-full pointer-events-none -mr-12 -mt-12"></div>

      {/* 目录 Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-900 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 animate-ping shrink-0" />
          <div>
            <h2 className="text-xs font-extrabold text-white tracking-widest uppercase">
              📖 剧本分支目录
            </h2>
            <p className="text-[9px] text-slate-500 font-mono mt-0.5">STORYLINE BRANCH OUTLINE</p>
          </div>
        </div>
        <div className="text-[9px] text-slate-400 bg-slate-950/80 border border-slate-900 rounded px-2 py-0.5 font-mono">
          共 {Object.keys(nodes).length} 个节点
        </div>
      </div>

      {/* 目录可滚动主体列表 */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {renderNodeTree(config.startNodeId)}
      </div>

      {/* 底部使用指南说明 */}
      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-900 shrink-0">
        <span className="text-[10px] font-bold text-purple-400 block mb-1">💡 结构化讲解引导：</span>
        <p className="text-[9.5px] text-slate-500 leading-relaxed font-sans">
          左侧为手机端演示模拟器。您可以直接点击右侧目录中的任意分支节点（包括灰色的未解锁节点）实现瞬移，方便在大屏汇报或功能演示时直观把控、极速讲透全部走向。
        </p>
      </div>
    </div>
  );
}
