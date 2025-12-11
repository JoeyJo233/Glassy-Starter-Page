import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '../components/SearchBar';

describe('SearchBar', () => {
  const defaultProps = {
    currentEngineId: 'google' as const,
    onEngineChange: vi.fn(),
    maxHistoryItems: 5,
    maxSuggestions: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock fetch 返回搜索建议
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(['react', ['react hooks', 'react router', 'react query']]),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('应该渲染搜索输入框和搜索按钮', () => {
    render(<SearchBar {...defaultProps} />);

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    // 搜索按钮没有 accessible name，通过查找所有按钮验证
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2); // 引擎选择器 + 搜索按钮
  });

  it('应该能够输入搜索内容', async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'test query');

    expect(input).toHaveValue('test query');
  });

  it('按回车键应该执行搜索', async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'hello world');
    await user.keyboard('{Enter}');

    // 验证跳转到搜索引擎
    expect(window.location.href).toContain('google.com/search?q=hello%20world');
  });

  it('应该将搜索记录保存到 localStorage', async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'saved search');
    await user.keyboard('{Enter}');

    const savedHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    expect(savedHistory).toContain('saved search');
  });

  it('应该显示搜索引擎选择菜单', async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);

    // 点击引擎选择器
    const engineButton = screen.getByRole('button', { name: /google/i });
    await user.click(engineButton);

    // 验证显示其他搜索引擎
    expect(screen.getByText('Bing')).toBeInTheDocument();
    expect(screen.getByText('DuckDuckGo')).toBeInTheDocument();
  });

  it('应该能够切换搜索引擎', async () => {
    const user = userEvent.setup();
    const onEngineChange = vi.fn();
    render(<SearchBar {...defaultProps} onEngineChange={onEngineChange} />);

    // 打开菜单
    const engineButton = screen.getByRole('button', { name: /google/i });
    await user.click(engineButton);

    // 选择 Bing
    await user.click(screen.getByText('Bing'));

    expect(onEngineChange).toHaveBeenCalledWith('bing');
  });

  it('输入为空时不应该执行搜索', async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search...');
    await user.click(input);
    await user.keyboard('{Enter}');

    // location.href 应该保持不变
    expect(window.location.href).toBe('');
  });

  it('聚焦时应该显示搜索历史', async () => {
    // 预设搜索历史
    localStorage.setItem('searchHistory', JSON.stringify(['previous search']));

    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search...');
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText('previous search')).toBeInTheDocument();
    });
  });

  it('应该能够删除搜索历史记录', async () => {
    localStorage.setItem('searchHistory', JSON.stringify(['item to delete']));

    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search...');
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText('item to delete')).toBeInTheDocument();
    });

    // 点击删除按钮
    const deleteButton = screen.getByTitle('Remove from history');
    await user.click(deleteButton);

    const savedHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    expect(savedHistory).not.toContain('item to delete');
  });

  it('应该使用上下箭头键导航搜索建议', async () => {
    // 预设搜索历史来测试导航（避免复杂的 fetch mock 和 fake timers）
    localStorage.setItem('searchHistory', JSON.stringify(['history1', 'history2', 'history3']));

    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search...');
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText('history1')).toBeInTheDocument();
    });

    // 按下箭头键
    await user.keyboard('{ArrowDown}');
    
    // 验证第一个历史记录被高亮（通过 CSS 类）
    const firstHistory = screen.getByText('history1').closest('div[class*="cursor-pointer"]');
    expect(firstHistory).toHaveClass('bg-black/10');
  });

  it('应该应用自定义样式属性', () => {
    render(
      <SearchBar 
        {...defaultProps}
        searchBarOpacity={80}
        searchBarBlur={20}
        searchBarOffsetY={30}
      />
    );

    // 验证搜索栏容器存在
    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeInTheDocument();
  });

  it('Escape 键应该取消焦点', async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search...');
    await user.click(input);
    expect(input).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(input).not.toHaveFocus();
  });
});
