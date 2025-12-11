import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FolderView from '../components/FolderView';
import { BookmarkItem } from '../types';

describe('FolderView', () => {
  const mockFolder: BookmarkItem = {
    id: 'folder-1',
    type: 'folder',
    title: 'My Folder',
    icon: '📁',
    children: [
      {
        id: 'child-1',
        type: 'link',
        title: 'Twitter',
        url: 'https://twitter.com',
        icon: 'https://twitter.com/favicon.ico',
      },
      {
        id: 'child-2',
        type: 'link',
        title: 'Reddit',
        url: 'https://reddit.com',
        icon: '🔴',
      },
    ],
  };

  const defaultProps = {
    folder: mockFolder,
    isOpen: true,
    onClose: vi.fn(),
    onUpdateFolder: vi.fn(),
    onEditItem: vi.fn(),
    onRemoveFromFolder: vi.fn(),
  };

  it('isOpen 为 false 时不应该渲染任何内容', () => {
    const { container } = render(<FolderView {...defaultProps} isOpen={false} />);

    expect(container.firstChild).toBeNull();
  });

  it('应该渲染文件夹标题', () => {
    render(<FolderView {...defaultProps} />);

    expect(screen.getByText('My Folder')).toBeInTheDocument();
  });

  it('应该渲染所有子项目', () => {
    render(<FolderView {...defaultProps} />);

    expect(screen.getByText('Twitter')).toBeInTheDocument();
    expect(screen.getByText('Reddit')).toBeInTheDocument();
  });

  it('应该显示关闭按钮', () => {
    render(<FolderView {...defaultProps} />);

    // X 按钮存在
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('点击关闭按钮应该调用 onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<FolderView {...defaultProps} onClose={onClose} />);

    // 找到 X 关闭按钮（在标题旁边）
    const closeButtons = screen.getAllByRole('button');
    // 第一个按钮应该是关闭按钮
    await user.click(closeButtons[0]);

    expect(onClose).toHaveBeenCalled();
  });

  it('点击背景应该调用 onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(<FolderView {...defaultProps} onClose={onClose} />);

    // 点击背景遮罩
    const backdrop = container.querySelector('.absolute.inset-0.bg-black\\/20');
    if (backdrop) {
      await user.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('点击子项目应该调用 window.open 导航到 URL', async () => {
    const user = userEvent.setup();
    
    // Mock window.open
    const mockOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
    
    render(<FolderView {...defaultProps} />);

    await user.click(screen.getByText('Twitter'));

    // 验证 window.open 被调用
    expect(mockOpen).toHaveBeenCalledWith('https://twitter.com', '_self');
    
    mockOpen.mockRestore();
  });

  it('右键点击子项目应该显示上下文菜单', async () => {
    const user = userEvent.setup();
    render(<FolderView {...defaultProps} />);

    const twitterItem = screen.getByText('Twitter');
    await user.pointer({ target: twitterItem, keys: '[MouseRight]' });

    expect(screen.getByText('Open New Tab')).toBeInTheDocument();
    expect(screen.getByText('Remove')).toBeInTheDocument();
  });

  it('点击上下文菜单中的 Remove 应该从文件夹中移除项目', async () => {
    const user = userEvent.setup();
    const onUpdateFolder = vi.fn();
    render(<FolderView {...defaultProps} onUpdateFolder={onUpdateFolder} />);

    // 右键打开菜单
    const twitterItem = screen.getByText('Twitter');
    await user.pointer({ target: twitterItem, keys: '[MouseRight]' });

    // 点击 Remove
    await user.click(screen.getByText('Remove'));

    // 验证 onUpdateFolder 被调用，且 children 中不再包含 Twitter
    expect(onUpdateFolder).toHaveBeenCalledWith(
      expect.objectContaining({
        children: expect.not.arrayContaining([
          expect.objectContaining({ id: 'child-1' }),
        ]),
      })
    );
  });

  it('点击文件夹标题应该允许重命名', async () => {
    const user = userEvent.setup();
    const onUpdateFolder = vi.fn();
    
    // Mock prompt
    const mockPrompt = vi.spyOn(window, 'prompt').mockReturnValue('New Name');
    
    render(<FolderView {...defaultProps} onUpdateFolder={onUpdateFolder} />);

    await user.click(screen.getByText('My Folder'));

    expect(mockPrompt).toHaveBeenCalledWith('Rename Folder', 'My Folder');
    expect(onUpdateFolder).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'New Name' })
    );

    mockPrompt.mockRestore();
  });

  it('取消重命名时不应该调用 onUpdateFolder', async () => {
    const user = userEvent.setup();
    const onUpdateFolder = vi.fn();
    
    // Mock prompt 返回 null（用户点击取消）
    const mockPrompt = vi.spyOn(window, 'prompt').mockReturnValue(null);
    
    render(<FolderView {...defaultProps} onUpdateFolder={onUpdateFolder} />);

    await user.click(screen.getByText('My Folder'));

    expect(onUpdateFolder).not.toHaveBeenCalled();

    mockPrompt.mockRestore();
  });

  it('空文件夹应该显示提示信息', () => {
    const emptyFolder: BookmarkItem = {
      id: 'empty-folder',
      type: 'folder',
      title: 'Empty Folder',
      icon: '📁',
      children: [],
    };

    render(<FolderView {...defaultProps} folder={emptyFolder} />);

    expect(screen.getByText('Folder is empty')).toBeInTheDocument();
  });

  it('应该正确渲染图片图标', () => {
    render(<FolderView {...defaultProps} />);

    const twitterIcon = screen.getByAltText('Twitter');
    expect(twitterIcon).toHaveAttribute('src', 'https://twitter.com/favicon.ico');
  });

  it('应该正确渲染 emoji 图标', () => {
    render(<FolderView {...defaultProps} />);

    expect(screen.getByText('🔴')).toBeInTheDocument();
  });
});
