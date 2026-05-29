import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import InteractivePlayer from '../InteractivePlayer';
import InteractionContainer from '../InteractionContainer';
import DebugDrawer from '../DebugDrawer';
import { NodeStateManager } from '../../engine/NodeStateManager';
import type { StoryConfig } from '../../engine/types';

// Mock shaka-player to prevent JSDOM loading errors
vi.mock('shaka-player', () => {
  class Player {
    load = vi.fn().mockResolvedValue(undefined);
    destroy = vi.fn().mockResolvedValue(undefined);
    configure = vi.fn();
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
    static isBrowserSupported = vi.fn(() => true);
    static Severity = {
      FATAL: 1,
    };
  }

  return {
    default: {
      polyfill: {
        installAll: vi.fn(),
      },
      Player,
    },
  };
});

const mockConfig: StoryConfig = {
  startNodeId: 'main_intro',
  nodes: {
    main_intro: {
      id: 'main_intro',
      videoUrl: '/assets/intro.mp4',
      duration: 15,
      defaultNextNodeId: 'branch_a',
      interactions: [
        {
          timestamp: 10.0,
          type: 'choice',
          options: [
            { text: '探索神秘山谷 (分支 A)', targetNodeId: 'branch_a' },
            { text: '潜入深海遗迹 (分支 B)', targetNodeId: 'branch_b' }
          ]
        }
      ]
    },
    branch_a: {
      id: 'branch_a',
      videoUrl: '/assets/branch_a.mp4',
      duration: 10,
      interactions: []
    },
    branch_b: {
      id: 'branch_b',
      videoUrl: '/assets/branch_b.mp4',
      duration: 10,
      interactions: []
    }
  }
};

describe('Interactive Video Engine 全链路集成 UAT 测试 (FullStoryFlow)', () => {
  let stateManager: NodeStateManager;

  beforeEach(() => {
    stateManager = new NodeStateManager(mockConfig);
    
    // Mock HTMLVideoElement HTML5 functions which JSDOM does not fully implement
    vi.spyOn(HTMLVideoElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLVideoElement.prototype, 'pause').mockImplementation(() => {});
    vi.spyOn(HTMLVideoElement.prototype, 'load').mockImplementation(() => {});

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test('VLD-02 / D-06: 完整流转链路测试 - 手动点击分支 A 时触发瞬间无缝物理切换并打点量化时延', async () => {
    // 实例化并合并渲染所有核心解耦组件
    const { unmount } = render(
      <div className="relative w-[800px] h-[450px]">
        <InteractivePlayer stateManager={stateManager} />
        <InteractionContainer stateManager={stateManager} />
        <DebugDrawer
          stateManager={stateManager}
          currentNode={stateManager.getCurrentNode()}
          activePlayer="A"
          visitedNodeIds={['main_intro']}
        />
      </div>
    );

    const switchLatencySpy = vi.fn();
    stateManager.on('switchLatency', switchLatencySpy);

    // 1. 点击启动有声首播遮罩
    const startButton = screen.getByText('开启奇幻之旅 (有声启动)');
    act(() => {
      fireEvent.click(startButton);
    });

    // 此时首视频 intro.mp4 正在播放，遮罩消失，弹窗尚未展现
    expect(screen.queryByText('开启奇幻之旅 (有声启动)')).not.toBeInTheDocument();
    expect(screen.queryByTestId('interaction-overlay')).not.toBeInTheDocument();

    // 2. 模拟播放器进行 TimeUpdate tick，播放进度前进到 10.0 秒（到达交互触发时刻并触发预载）
    const videoA = document.querySelector('.video-instance-a') as HTMLVideoElement;
    act(() => {
      videoA.currentTime = 10.0;
      fireEvent.timeUpdate(videoA);
    });

    // 等待微任务清空，使 Proximity 预备逻辑在 videoB 上完成 load 并绑定 canplaythrough 监听器
    await act(async () => {
      await Promise.resolve();
    });

    // 触发预加载的 canplaythrough 事件，使后台播放器 B 的预载就绪
    const videoB = document.querySelector('.video-instance-b') as HTMLVideoElement;
    act(() => {
      fireEvent(videoB, new Event('canplaythrough'));
    });

    // 验证交互弹窗已展现并呈现两个分支选项
    expect(screen.getByTestId('interaction-overlay')).toBeInTheDocument();
    expect(screen.getByText('探索神秘山谷 (分支 A)')).toBeInTheDocument();
    expect(screen.getByText('潜入深海遗迹 (分支 B)')).toBeInTheDocument();

    // 3. 点击“探索神秘山谷 (分支 A)”按钮
    const buttonA = screen.getByText('探索神秘山谷 (分支 A)').closest('button')!;
    const buttonB = screen.getByText('潜入深海遗迹 (分支 B)').closest('button')!;

    act(() => {
      fireEvent.click(buttonA);
    });

    // 验证原子防并发锁定生效，加载状态正确改变且其他选项被禁用
    expect(screen.getByText('⚡ Loading Branch...')).toBeInTheDocument();
    expect(buttonB).toBeDisabled();

    // 4. 快进 200ms 的出场淡出动画时刻，触发底层对调切换，并清空微任务队列以完成 Promise，最后推进 requestAnimationFrame
    await act(async () => {
      vi.advanceTimersByTime(200);
      await Promise.resolve();
      vi.advanceTimersByTime(50);
    });

    // 验证状态机切换目标节点成功
    expect(stateManager.getCurrentNodeId()).toBe('branch_a');

    // 验证底层 InteractivePlayer 物理瞬间硬切完成，并且 switchLatency 事件被完美触发
    expect(switchLatencySpy).toHaveBeenCalledTimes(1);
    expect(switchLatencySpy).toHaveBeenCalledWith(expect.any(Number));

    // 验证 DebugDrawer 中的切换延迟 Benchmarking 卡片正确展示了物理切换延迟指标
    const latencyVal = switchLatencySpy.mock.calls[0][0] as number;
    expect(screen.getByText('📊 拼接延时监测 (Benchmarking)')).toBeInTheDocument();
    expect(screen.getByText(`⚡ ${latencyVal.toFixed(2)} ms`)).toBeInTheDocument();

    unmount();
  });

  test('VLD-02 / D-04 / D-05: 完整流转链路测试 - 交互未选择超时自动流转进入默认分支', async () => {
    const { unmount } = render(
      <div className="relative w-[800px] h-[450px]">
        <InteractivePlayer stateManager={stateManager} />
        <InteractionContainer stateManager={stateManager} />
      </div>
    );

    const switchLatencySpy = vi.fn();
    stateManager.on('switchLatency', switchLatencySpy);

    // 有声启动
    const startButton = screen.getByText('开启奇幻之旅 (有声启动)');
    act(() => {
      fireEvent.click(startButton);
    });

    // 进度 tick 到 10.0 秒触发交互点
    const videoA = document.querySelector('.video-instance-a') as HTMLVideoElement;
    act(() => {
      videoA.currentTime = 10.0;
      fireEvent.timeUpdate(videoA);
    });

    // 等待微任务清空，使 Proximity 预备逻辑在 videoB 上完成 load 并绑定 canplaythrough 监听器
    await act(async () => {
      await Promise.resolve();
    });

    // 触发预备视频 canplaythrough
    const videoB = document.querySelector('.video-instance-b') as HTMLVideoElement;
    act(() => {
      fireEvent(videoB, new Event('canplaythrough'));
    });

    expect(screen.getByTestId('interaction-overlay')).toBeInTheDocument();

    // 模拟 10 秒倒计时内用户没有任何手动选择动作
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // 200ms 出场淡出，清空微任务队列并推进 requestAnimationFrame 帧
    await act(async () => {
      vi.advanceTimersByTime(200);
      await Promise.resolve();
      vi.advanceTimersByTime(50);
    });

    // 验证状态机超时自动静默无缝切换进入了 defaultNextNodeId 分支 (branch_a)
    expect(stateManager.getCurrentNodeId()).toBe('branch_a');
    expect(switchLatencySpy).toHaveBeenCalledTimes(1);

    unmount();
  });
});
