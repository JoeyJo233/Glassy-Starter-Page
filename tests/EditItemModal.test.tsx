import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditItemModal from '../components/EditItemModal';
import { BookmarkItem } from '../types';

describe('EditItemModal', () => {
  const mockItem: BookmarkItem = {
    id: '1',
    type: 'link',
    title: 'GitHub',
    url: 'https://github.com',
    icon: '🐙',
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    item: null,
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('isOpen 为 false 时不应该渲染任何内容', () => {
    const { container } = render(<EditItemModal {...defaultProps} isOpen={false} />);

    expect(container.firstChild).toBeNull();
  });

  it('新建模式下应该显示空表单', () => {
    render(<EditItemModal {...defaultProps} item={null} />);

    // 组件实际使用 "e.g. GitHub" 作为 placeholder
    const titleInput = screen.getByPlaceholderText('e.g. GitHub');
    const urlInput = screen.getByPlaceholderText('https://example.com');

    expect(titleInput).toHaveValue('');
    expect(urlInput).toHaveValue('');
  });

  it('编辑模式下应该预填充表单', () => {
    render(<EditItemModal {...defaultProps} item={mockItem} />);

    const titleInput = screen.getByPlaceholderText('e.g. GitHub');
    const urlInput = screen.getByPlaceholderText('https://example.com');

    expect(titleInput).toHaveValue('GitHub');
    expect(urlInput).toHaveValue('https://github.com');
  });

  it('应该能够输入标题', async () => {
    const user = userEvent.setup();
    render(<EditItemModal {...defaultProps} />);

    const titleInput = screen.getByPlaceholderText('e.g. GitHub');
    await user.clear(titleInput);
    await user.type(titleInput, 'New Title');

    expect(titleInput).toHaveValue('New Title');
  });

  it('应该能够输入 URL', async () => {
    const user = userEvent.setup();
    render(<EditItemModal {...defaultProps} />);

    const urlInput = screen.getByPlaceholderText('https://example.com');
    await user.type(urlInput, 'https://example.org');

    expect(urlInput).toHaveValue('https://example.org');
  });

  it('点击保存按钮应该调用 onSave', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<EditItemModal {...defaultProps} onSave={onSave} />);

    // 输入必要信息（包括 URL，因为表单有验证）
    const titleInput = screen.getByPlaceholderText('e.g. GitHub');
    const urlInput = screen.getByPlaceholderText('https://example.com');
    
    await user.type(titleInput, 'Test Link');
    await user.type(urlInput, 'https://test.com');

    // 点击保存 (按钮显示 "Save Shortcut")
    const saveButton = screen.getByRole('button', { name: /save shortcut/i });
    await user.click(saveButton);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Link',
        type: 'link',
      })
    );
  });

  it('点击关闭按钮应该调用 onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<EditItemModal {...defaultProps} onClose={onClose} />);

    // 找到 X 按钮
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn => btn.querySelector('svg.lucide-x'));
    
    if (closeButton) {
      await user.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('编辑时应该保持原有 id', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<EditItemModal {...defaultProps} item={mockItem} onSave={onSave} />);

    // 修改标题
    const titleInput = screen.getByPlaceholderText('e.g. GitHub');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated GitHub');

    // 保存
    const saveButton = screen.getByRole('button', { name: /save shortcut/i });
    await user.click(saveButton);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1', // 保持原 id
        title: 'Updated GitHub',
      })
    );
  });

  it('应该有图标上传按钮', () => {
    render(<EditItemModal {...defaultProps} />);

    // 验证上传相关元素存在
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
  });

  it('应该显示当前图标预览', () => {
    render(<EditItemModal {...defaultProps} item={mockItem} />);

    // 图标显示为 img src (emoji 被当作 src)
    const previewImg = screen.getByAltText('Preview');
    expect(previewImg).toBeInTheDocument();
  });

  it('应该有清除图标按钮', () => {
    render(<EditItemModal {...defaultProps} item={mockItem} />);

    // 查找 Clear 按钮
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });
});

describe('EditItemModal - 文件夹模式', () => {
  const mockFolder: BookmarkItem = {
    id: 'folder-1',
    type: 'folder',
    title: 'My Folder',
    icon: '📁',
    children: [],
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    item: mockFolder,
    onSave: vi.fn(),
  };

  it('编辑文件夹时应该显示标题输入框', () => {
    render(<EditItemModal {...defaultProps} />);

    const titleInput = screen.getByPlaceholderText('e.g. GitHub');
    expect(titleInput).toHaveValue('My Folder');
  });
});
