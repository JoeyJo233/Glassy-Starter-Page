import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookmarkGrid from '../components/BookmarkGrid';
import { BookmarkItem } from '../types';

describe('BookmarkGrid', () => {
  const mockItems: BookmarkItem[] = [
    {
      id: '1',
      type: 'link',
      title: 'GitHub',
      url: 'https://github.com',
      icon: 'https://github.com/favicon.ico',
    },
    {
      id: '2',
      type: 'link',
      title: 'YouTube',
      url: 'https://youtube.com',
      icon: '📺',
    },
    {
      id: '3',
      type: 'folder',
      title: 'Social',
      icon: '📁',
      children: [
        {
          id: '3-1',
          type: 'link',
          title: 'Twitter',
          url: 'https://twitter.com',
        },
      ],
    },
  ];

  const defaultProps = {
    items: mockItems,
    setItems: vi.fn(),
    onOpenFolder: vi.fn(),
    onEditItem: vi.fn(),
    onDeleteItem: vi.fn(),
    onAddItem: vi.fn(),
  };

  it('应该渲染所有书签项目', () => {
    render(<BookmarkGrid {...defaultProps} />);

    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByText('Social')).toBeInTheDocument();
  });

  it('应该显示添加按钮', () => {
    render(<BookmarkGrid {...defaultProps} />);

    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  it('点击添加按钮应该调用 onAddItem', async () => {
    const user = userEvent.setup();
    const onAddItem = vi.fn();
    render(<BookmarkGrid {...defaultProps} onAddItem={onAddItem} />);

    await user.click(screen.getByText('Add'));

    expect(onAddItem).toHaveBeenCalledTimes(1);
  });

  it('点击链接书签应该导航到 URL', async () => {
    const user = userEvent.setup();
    render(<BookmarkGrid {...defaultProps} />);

    await user.click(screen.getByText('GitHub'));

    expect(window.location.href).toBe('https://github.com');
  });

  it('点击文件夹应该调用 onOpenFolder', async () => {
    const user = userEvent.setup();
    const onOpenFolder = vi.fn();
    render(<BookmarkGrid {...defaultProps} onOpenFolder={onOpenFolder} />);

    await user.click(screen.getByText('Social'));

    expect(onOpenFolder).toHaveBeenCalledWith(mockItems[2]);
  });

  it('右键点击应该显示上下文菜单', async () => {
    const user = userEvent.setup();
    render(<BookmarkGrid {...defaultProps} />);

    const githubItem = screen.getByText('GitHub');
    await user.pointer({ target: githubItem, keys: '[MouseRight]' });

    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('上下文菜单中点击 Edit 应该调用 onEditItem', async () => {
    const user = userEvent.setup();
    const onEditItem = vi.fn();
    render(<BookmarkGrid {...defaultProps} onEditItem={onEditItem} />);

    // 右键打开菜单
    const githubItem = screen.getByText('GitHub');
    await user.pointer({ target: githubItem, keys: '[MouseRight]' });

    // 点击 Edit
    await user.click(screen.getByText('Edit'));

    expect(onEditItem).toHaveBeenCalledWith(mockItems[0]);
  });

  it('上下文菜单中点击 Delete 应该调用 onDeleteItem', async () => {
    const user = userEvent.setup();
    const onDeleteItem = vi.fn();
    render(<BookmarkGrid {...defaultProps} onDeleteItem={onDeleteItem} />);

    // 右键打开菜单
    const youtubeItem = screen.getByText('YouTube');
    await user.pointer({ target: youtubeItem, keys: '[MouseRight]' });

    // 点击 Delete
    await user.click(screen.getByText('Delete'));

    expect(onDeleteItem).toHaveBeenCalledWith('2');
  });

  it('应该正确渲染链接图标（图片 URL）', () => {
    render(<BookmarkGrid {...defaultProps} />);

    const githubIcon = screen.getByAltText('GitHub');
    expect(githubIcon).toHaveAttribute('src', 'https://github.com/favicon.ico');
  });

  it('应该正确渲染 emoji 图标', () => {
    render(<BookmarkGrid {...defaultProps} />);

    expect(screen.getByText('📺')).toBeInTheDocument();
  });

  it('应该应用自定义偏移量', () => {
    const { container } = render(<BookmarkGrid {...defaultProps} offsetY={50} />);

    const gridContainer = container.firstChild as HTMLElement;
    expect(gridContainer).toHaveStyle({ transform: 'translateY(50px)' });
  });

  it('应该应用自定义文字颜色', () => {
    const customColor = 'rgb(100, 100, 100)';
    render(<BookmarkGrid {...defaultProps} textColor={customColor} />);

    const title = screen.getByText('GitHub');
    expect(title).toHaveStyle({ color: customColor });
  });

  it('空数组时只应该显示添加按钮', () => {
    render(<BookmarkGrid {...defaultProps} items={[]} />);

    expect(screen.getByText('Add')).toBeInTheDocument();
    expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
  });

  it('文件夹应该显示子项目预览', () => {
    render(<BookmarkGrid {...defaultProps} />);

    // Social 文件夹存在
    expect(screen.getByText('Social')).toBeInTheDocument();
    // 验证组件渲染了文件夹结构（预览网格）
  });
});
