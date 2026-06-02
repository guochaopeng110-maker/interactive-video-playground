import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import InteractionContainer from '../InteractionContainer';
import { NodeStateManager } from '../../engine/NodeStateManager';
import type { StoryConfig, VideoInteraction } from '../../engine/types';

// Mock NodeStateManager
const mockConfig: StoryConfig = {
  startNodeId: 'node_start',
  nodes: {
    node_start: {
      id: 'node_start',
      videoUrl: 'start.mp4',
      duration: 15,
      defaultNextNodeId: 'node_next',
      interactions: [
        {
          timestamp: 10,
          type: 'choice',
          options: [
            { text: '分支 A', targetNodeId: 'node_branch_a' },
            { text: '分支 B', targetNodeId: 'node_branch_b' }
          ]
        }
      ]
    },
    node_next: {
      id: 'node_next',
      videoUrl: 'next.mp4',
      duration: 10,
      interactions: []
    },
    node_branch_a: {
      id: 'node_branch_a',
      videoUrl: 'branch_a.mp4',
      duration: 10,
      interactions: []
    },
    node_branch_b: {
      id: 'node_branch_b',
      videoUrl: 'branch_b.mp4',
      duration: 10,
      interactions: []
    }
  }
};

describe('InteractionContainer 单元测试', () => {
  let stateManager: NodeStateManager;

  beforeEach(() => {
    stateManager = new NodeStateManager(mockConfig);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test('UI-01: 等待交互触发时，不渲染弹窗面板 (为 null)', () => {
    const { container } = render(<InteractionContainer stateManager={stateManager} />);
    expect(container.firstChild).toBeNull();
  });

  test('UI-02: 监听到 interactionTriggered 事件时展示选择卡片，监听到 nodeChanged 时隐藏选择卡片，且卸载时完美注销订阅', () => {
    const onSpy = vi.spyOn(stateManager, 'on');
    const offSpy = vi.spyOn(stateManager, 'off');

    const { unmount } = render(<InteractionContainer stateManager={stateManager} />);

    // 验证是否正确订阅了事件
    expect(onSpy).toHaveBeenCalledWith('interactionTriggered', expect.any(Function));
    expect(onSpy).toHaveBeenCalledWith('nodeChanged', expect.any(Function));

    // 触发交互事件
    const interaction: VideoInteraction = mockConfig.nodes.node_start.interactions[0];
    act(() => {
      // 模拟状态机分发事件
      (stateManager as any).events.interactionTriggered.forEach((cb: any) => cb(interaction));
    });

    // 弹窗应该展现
    expect(screen.getByTestId('interaction-overlay')).toBeInTheDocument();
    expect(screen.getByText('分支 A')).toBeInTheDocument();
    expect(screen.getByText('分支 B')).toBeInTheDocument();

    // 模拟节点变更事件
    act(() => {
      (stateManager as any).events.nodeChanged.forEach((cb: any) => cb(mockConfig.nodes.node_branch_a));
    });

    // 弹窗应该隐藏
    expect(screen.queryByTestId('interaction-overlay')).not.toBeInTheDocument();

    // 卸载组件，验证是否解绑订阅
    unmount();
    expect(offSpy).toHaveBeenCalledWith('interactionTriggered', expect.any(Function));
    expect(offSpy).toHaveBeenCalledWith('nodeChanged', expect.any(Function));
  });

  test('UI-03: 超时安全自动流转机制 (10秒内未做选择，系统安全超时自动流转至 defaultNextNodeId)', () => {
    render(<InteractionContainer stateManager={stateManager} />);

    const selectOptionSpy = vi.spyOn(stateManager, 'selectOption');
    const interaction: VideoInteraction = mockConfig.nodes.node_start.interactions[0];

    act(() => {
      (stateManager as any).events.interactionTriggered.forEach((cb: any) => cb(interaction));
    });

    // 快进 10 秒
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // 验证是否在 200ms 的出场动画后调用了 selectOption
    expect(selectOptionSpy).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(selectOptionSpy).toHaveBeenCalledWith('node_next');
  });

  test('UI-04: 原子防重复锁定状态 (点击选项时高亮加载，置灰其它选项，且阻止二次并发点击)', () => {
    render(<InteractionContainer stateManager={stateManager} />);

    const selectOptionSpy = vi.spyOn(stateManager, 'selectOption');
    const interaction: VideoInteraction = mockConfig.nodes.node_start.interactions[0];

    act(() => {
      (stateManager as any).events.interactionTriggered.forEach((cb: any) => cb(interaction));
    });

    const buttonA = screen.getByText('分支 A').closest('button')!;
    const buttonB = screen.getByText('分支 B').closest('button')!;

    act(() => {
      fireEvent.click(buttonA);
    });

    // 检查按钮 A 显示 "⚡ Loading Branch..." 状态，且其它按钮置灰并禁用
    expect(screen.getByText('⚡ Loading Branch...')).toBeInTheDocument();
    expect(buttonB).toBeDisabled();

    // 尝试二次点击按钮 B，以及再次点击按钮 A，验证是否被拦截
    act(() => {
      fireEvent.click(buttonB);
    });

    // 快进 200ms
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // 验证最终只调用了一次 selectOption 且目标是 node_branch_a
    expect(selectOptionSpy).toHaveBeenCalledTimes(1);
    expect(selectOptionSpy).toHaveBeenCalledWith('node_branch_a');
  });

  test('UI-05: 倒计时进度条初始化状态与硬件加速 transition 属性', () => {
    render(<InteractionContainer stateManager={stateManager} />);

    const interaction: VideoInteraction = mockConfig.nodes.node_start.interactions[0];

    act(() => {
      (stateManager as any).events.interactionTriggered.forEach((cb: any) => cb(interaction));
    });

    const bar = screen.getByTestId('countdown-bar');
    // 初始状态应该为 100%
    expect(bar.style.width).toBe('100%');
    expect(bar.style.transition).toBe('none');

    // 推进 requestAnimationFrame
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // 状态修改为 0% 配合 CSS linear transition 达成 0-render 线性倒计时
    expect(bar.style.width).toBe('0%');
    expect(bar.style.transition).toBe('width 10s linear');
  });

  test('UI-06: 弹窗标题应支持配置驱动，并提供默认兜底标题', () => {
    render(<InteractionContainer stateManager={stateManager} />);

    // 1. 无 title 时使用默认兜底标题
    const defaultInteraction: VideoInteraction = mockConfig.nodes.node_start.interactions[0];
    act(() => {
      (stateManager as any).events.interactionTriggered.forEach((cb: any) => cb(defaultInteraction));
    });
    expect(screen.getByText('前方的道路发生了分叉，请做出您的抉择：')).toBeInTheDocument();

    // 2. 模拟切换重置
    act(() => {
      (stateManager as any).events.nodeChanged.forEach((cb: any) => cb(mockConfig.nodes.node_branch_a));
    });

    // 3. 有 title 时使用配置标题
    const customInteraction: VideoInteraction = {
      timestamp: 10,
      type: 'choice',
      title: '你决定如何应对眼前的强敌？',
      options: [
        { text: '分支 A', targetNodeId: 'node_branch_a' }
      ]
    };
    act(() => {
      (stateManager as any).events.interactionTriggered.forEach((cb: any) => cb(customInteraction));
    });
    expect(screen.getByText('你决定如何应对眼前的强敌？')).toBeInTheDocument();
    expect(screen.queryByText('前方的道路发生了分叉，请做出您的抉择：')).not.toBeInTheDocument();
  });
});
