import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import Clock from '../components/Clock';

describe('Clock', () => {
  beforeEach(() => {
    // 使用固定时间以确保测试稳定
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T14:30:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('应该渲染时间和日期', () => {
    render(<Clock />);

    // 验证时间显示（24小时制）
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('14:30');
    
    // 验证日期显示（格式：Mon, Jan 15）
    expect(screen.getByText(/Jan/)).toBeInTheDocument();
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  it('应该每秒更新时间', () => {
    render(<Clock />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('14:30');

    // 前进 1 分钟
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('14:31');
  });

  it('应该应用自定义字体大小', () => {
    render(
      <Clock 
        timeFontSize={80}
        dateFontSize={16}
      />
    );

    const timeElement = screen.getByRole('heading', { level: 1 });
    const dateElement = screen.getByText(/Jan/);

    expect(timeElement).toHaveStyle({ fontSize: '80px' });
    expect(dateElement).toHaveStyle({ fontSize: '16px' });
  });

  it('应该应用自定义偏移量', () => {
    render(
      <Clock 
        timeOffsetY={20}
        dateOffsetY={10}
      />
    );

    const timeElement = screen.getByRole('heading', { level: 1 });
    const dateElement = screen.getByText(/Jan/);

    expect(timeElement).toHaveStyle({ transform: 'translateY(20px)' });
    expect(dateElement).toHaveStyle({ transform: 'translateY(10px)' });
  });

  it('应该应用自定义文字颜色', () => {
    const customColor = 'rgb(255, 0, 0)';
    render(<Clock textColor={customColor} />);

    const timeElement = screen.getByRole('heading', { level: 1 });
    expect(timeElement).toHaveStyle({ color: customColor });
  });

  it('组件卸载时应该清除定时器', () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    
    const { unmount } = render(<Clock />);
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
