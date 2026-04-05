import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsModal from '../components/SettingsModal';
import { AppSettings } from '../types';

vi.mock('../utils/wallpaperStore', () => ({
  listWallpapers: vi.fn(async () => []),
  saveWallpaper: vi.fn(async (blob: Blob, name: string) => ({ id: 'id-1', name, createdAt: Date.now(), url: 'blob:mock' })),
  deleteWallpaper: vi.fn(async () => {}),
  getWallpaperBlob: vi.fn(async () => new Blob()),
}));

vi.mock('../utils/backup', () => ({
  exportBookmarks: vi.fn(),
  importBookmarks: vi.fn(),
  exportSettings: vi.fn(),
  importSettings: vi.fn(),
}));

const defaultSettings: AppSettings = {
  backgroundImage: 'https://example.com/bg.jpg',
  blurLevel: 0,
  opacityLevel: 25,
  maxHistoryItems: 5,
  maxSuggestions: 5,
  searchBarOpacity: 55,
  searchBarBlur: 24,
  timeFontSize: 110,
  dateFontSize: 22,
  timeOffsetY: 0,
  dateOffsetY: -20,
  searchBarOffsetY: -20,
  shortcutsOffsetY: -20,
  globalScale: 100,
  iconBackgroundOpacity: 80,
  iconBackgroundBlur: 0,
  searchMenuOpacity: 80,
  searchMenuBlur: 40,
  clockTextColor: '#f3f4f6',
  shortcutTextColor: '#f3f4f6',
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  settings: defaultSettings,
  onSave: vi.fn(),
  onResetDefaults: vi.fn(),
  bookmarks: [],
  currentEngine: 'google' as const,
  onRestoreBookmarks: vi.fn(),
  onRestoreSettings: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Basic Rendering ───────────────────────────────────────────────────────

describe('SettingsModal — 基础渲染', () => {
  it('isOpen 为 false 时不应该渲染任何内容', () => {
    render(<SettingsModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  it('isOpen 为 true 时应该渲染设置面板', () => {
    render(<SettingsModal {...defaultProps} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('应该显示 Reset Defaults 按钮', () => {
    render(<SettingsModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /reset defaults/i })).toBeInTheDocument();
  });

  it('点击 Reset Defaults 按钮应该调用 onResetDefaults', () => {
    const onResetDefaults = vi.fn();
    render(<SettingsModal {...defaultProps} onResetDefaults={onResetDefaults} />);

    fireEvent.click(screen.getByRole('button', { name: /reset defaults/i }));

    expect(onResetDefaults).toHaveBeenCalled();
  });

  it('点击关闭按钮应该调用 onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SettingsModal {...defaultProps} onClose={onClose} />);

    const closeBtn = document.querySelector('button .lucide-x')?.closest('button') as HTMLElement;
    if (closeBtn) await user.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });
});

// ─── Tab Navigation ────────────────────────────────────────────────────────

describe('SettingsModal — Tab 导航', () => {
  it('应该渲染 5 个 Tab 按钮', () => {
    render(<SettingsModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Wallpaper' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Appearance' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Layout' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Data' })).toBeInTheDocument();
  });

  it('默认应该显示 Wallpaper tab 内容', () => {
    render(<SettingsModal {...defaultProps} />);
    expect(screen.getByText('Preset Backgrounds')).toBeInTheDocument();
  });

  it('切换到 Appearance tab 应该显示对应内容', async () => {
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Appearance' }));

    expect(screen.getByText('Overlay Opacity')).toBeInTheDocument();
    expect(screen.getByText('Blur Amount')).toBeInTheDocument();
    expect(screen.getByText('Search Bar Opacity')).toBeInTheDocument();
    expect(screen.getByText('Icon Background Opacity')).toBeInTheDocument();
  });

  it('切换到 Layout tab 应该显示对应内容', async () => {
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Layout' }));

    expect(screen.getByText('Global Scale')).toBeInTheDocument();
    expect(screen.getByText('Time Position')).toBeInTheDocument();
    expect(screen.getByText('Search Bar Position')).toBeInTheDocument();
  });

  it('切换到 Search tab 应该显示对应内容', async () => {
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(screen.getByText('Max Search History')).toBeInTheDocument();
    expect(screen.getByText('Max Search Suggestions')).toBeInTheDocument();
  });

  it('切换到 Data tab 应该显示对应内容', async () => {
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Data' }));

    expect(screen.getByText('Bookmarks')).toBeInTheDocument();
  });

  it('切换 tab 后不应该显示其他 tab 的内容', async () => {
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Layout' }));

    // Layout tab 显示
    expect(screen.getByText('Global Scale')).toBeInTheDocument();
    // Wallpaper tab 内容不显示
    expect(screen.queryByText('Preset Backgrounds')).not.toBeInTheDocument();
  });
});

// ─── Appearance Tab ────────────────────────────────────────────────────────

describe('SettingsModal — Appearance Tab', () => {
  async function openAppearanceTab() {
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'Appearance' }));
    return user;
  }

  it('应该显示当前 Overlay Opacity 值', async () => {
    await openAppearanceTab();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('修改 Overlay Opacity 滑块应该调用 onSave', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} onSave={onSave} />);
    await user.click(screen.getByRole('button', { name: 'Appearance' }));

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '50' } });

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ opacityLevel: 50 }));
  });

  it('应该显示当前 Blur Amount 值', async () => {
    await openAppearanceTab();
    // Both Blur Amount and Icon Background Blur default to 0px
    const zeroValues = screen.getAllByText('0px');
    expect(zeroValues.length).toBeGreaterThanOrEqual(1);
  });

  it('修改 Blur Amount 滑块应该调用 onSave', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} onSave={onSave} />);
    await user.click(screen.getByRole('button', { name: 'Appearance' }));

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[1], { target: { value: '10' } });

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ blurLevel: 10 }));
  });

  it('应该显示 Icon Background Opacity', async () => {
    await openAppearanceTab();
    expect(screen.getByText('Icon Background Opacity')).toBeInTheDocument();
    expect(screen.getAllByText('80%').length).toBeGreaterThanOrEqual(1);
  });

  it('应该显示 Text Colors 区域', async () => {
    await openAppearanceTab();
    expect(screen.getByText('Text Colors')).toBeInTheDocument();
    expect(screen.getByText('Time & Date Color')).toBeInTheDocument();
    expect(screen.getByText('Shortcut Caption Color')).toBeInTheDocument();
  });

  it('应该显示统一后的搜索菜单样式设置', async () => {
    await openAppearanceTab();
    expect(screen.getByText('Search Menus Opacity')).toBeInTheDocument();
    expect(screen.getByText('Search Menus Blur')).toBeInTheDocument();
    expect(screen.queryByText('Engine Menu Opacity')).not.toBeInTheDocument();
    expect(screen.queryByText('Suggestions Opacity')).not.toBeInTheDocument();
  });

  it('修改 Icon Background Opacity 应该调用 onSave', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} onSave={onSave} />);
    await user.click(screen.getByRole('button', { name: 'Appearance' }));

    const sliders = screen.getAllByRole('slider');
    // Icon Background Opacity is the 5th slider (0-indexed: opacity, blur, searchBarOpacity, searchBarBlur, iconBgOpacity)
    fireEvent.change(sliders[4], { target: { value: '60' } });

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ iconBackgroundOpacity: 60 }));
  });
});

// ─── Layout Tab ────────────────────────────────────────────────────────────

describe('SettingsModal — Layout Tab', () => {
  async function openLayoutTab(customSettings?: Partial<AppSettings>) {
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} settings={{ ...defaultSettings, ...customSettings }} />);
    await user.click(screen.getByRole('button', { name: 'Layout' }));
    return user;
  }

  it('应该显示 Global Scale 滑块', async () => {
    await openLayoutTab();
    expect(screen.getByText('Global Scale')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('Global Scale 滑块应该正确显示当前值', async () => {
    await openLayoutTab({ globalScale: 75 });
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('修改 Global Scale 滑块应该调用 onSave', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} onSave={onSave} />);
    await user.click(screen.getByRole('button', { name: 'Layout' }));

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '120' } });

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ globalScale: 120 }));
  });

  it('应该显示时间/日期位置相关滑块', async () => {
    await openLayoutTab();
    expect(screen.getByText('Time Position')).toBeInTheDocument();
    expect(screen.getByText('Time Font Size')).toBeInTheDocument();
    expect(screen.getByText('Date Position')).toBeInTheDocument();
    expect(screen.getByText('Date Font Size')).toBeInTheDocument();
  });

  it('修改 Time Position 应该调用 onSave', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} onSave={onSave} />);
    await user.click(screen.getByRole('button', { name: 'Layout' }));

    const sliders = screen.getAllByRole('slider');
    // Time Position is the 2nd slider after Global Scale
    fireEvent.change(sliders[1], { target: { value: '30' } });

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ timeOffsetY: 30 }));
  });

  it('应该显示分区标签 Clock 和 Search & Shortcuts', async () => {
    await openLayoutTab();
    expect(screen.getByText('Clock')).toBeInTheDocument();
    expect(screen.getByText('Search & Shortcuts')).toBeInTheDocument();
  });
});

// ─── Search Tab ────────────────────────────────────────────────────────────

describe('SettingsModal — Search Tab', () => {
  async function openSearchTab(customSettings?: Partial<AppSettings>) {
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} settings={{ ...defaultSettings, ...customSettings }} />);
    await user.click(screen.getByRole('button', { name: 'Search' }));
    return user;
  }

  it('应该显示 Max Search History', async () => {
    await openSearchTab();
    expect(screen.getByText('Max Search History')).toBeInTheDocument();
    // Both history and suggestions default to 5, so two "5 items" spans exist
    const itemLabels = screen.getAllByText('5 items');
    expect(itemLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('应该显示 Max Search Suggestions', async () => {
    await openSearchTab();
    expect(screen.getByText('Max Search Suggestions')).toBeInTheDocument();
  });

  it('修改 Max Search History 应该调用 onSave', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} onSave={onSave} />);
    await user.click(screen.getByRole('button', { name: 'Search' }));

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '8' } });

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ maxHistoryItems: 8 }));
  });

  it('修改 Max Search Suggestions 应该调用 onSave', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} onSave={onSave} />);
    await user.click(screen.getByRole('button', { name: 'Search' }));

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[1], { target: { value: '3' } });

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ maxSuggestions: 3 }));
  });
});

// ─── Data Tab ──────────────────────────────────────────────────────────────

describe('SettingsModal — Data Tab', () => {
  async function openDataTab() {
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'Data' }));
    return user;
  }

  it('应该显示 Bookmarks 区域', async () => {
    await openDataTab();
    expect(screen.getByText('Bookmarks')).toBeInTheDocument();
  });

  it('应该显示 Export 和 Import 按钮（各两个）', async () => {
    await openDataTab();
    // Two Export buttons: one for bookmarks, one for settings
    expect(screen.getAllByRole('button', { name: 'Export' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Import' })).toHaveLength(2);
  });

  it('应该显示 Settings 备份区域', async () => {
    await openDataTab();
    // "Settings" heading appears both in h2 (header) and h4 (data section)
    const settingsHeadings = screen.getAllByText('Settings');
    expect(settingsHeadings.length).toBeGreaterThanOrEqual(2);
  });

  it('应该显示书签操作说明文字', async () => {
    await openDataTab();
    expect(screen.getByText('Export or import all shortcuts and folders')).toBeInTheDocument();
  });

  it('点击第一个 Export 应该调用 exportBookmarks', async () => {
    const { exportBookmarks } = await import('../utils/backup');
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'Data' }));

    // First Export button is bookmarks export
    const exportButtons = screen.getAllByRole('button', { name: 'Export' });
    await user.click(exportButtons[0]);

    expect(exportBookmarks).toHaveBeenCalledWith([]);
  });

  it('Import 成功后应显示 Append / Overwrite / Cancel 确认 UI', async () => {
    const { importBookmarks } = await import('../utils/backup');
    const mockImported = [{ id: 'x1', type: 'link' as const, title: 'X', url: 'https://x.com' }];
    (importBookmarks as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockImported);

    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'Data' }));

    const fileInput = document.querySelector('input[type="file"][accept=".json"]') as HTMLInputElement;
    const file = new File(['{}'], 'bookmarks.json', { type: 'application/json' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/1 bookmark ready to import/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Append' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Overwrite' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });
  });

  it('点击 Overwrite 应以 imported 数组调用 onRestoreBookmarks', async () => {
    const { importBookmarks } = await import('../utils/backup');
    const mockImported = [{ id: 'x1', type: 'link' as const, title: 'X', url: 'https://x.com' }];
    (importBookmarks as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockImported);

    const onRestoreBookmarks = vi.fn();
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} onRestoreBookmarks={onRestoreBookmarks} />);
    await user.click(screen.getByRole('button', { name: 'Data' }));

    const fileInput = document.querySelector('input[type="file"][accept=".json"]') as HTMLInputElement;
    const file = new File(['{}'], 'bookmarks.json', { type: 'application/json' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Overwrite' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Overwrite' }));

    expect(onRestoreBookmarks).toHaveBeenCalledWith(mockImported);
    expect(screen.queryByRole('button', { name: 'Append' })).not.toBeInTheDocument();
  });

  it('点击 Append 应以合并后数组调用 onRestoreBookmarks', async () => {
    const { importBookmarks } = await import('../utils/backup');
    const existing = [{ id: 'e1', type: 'link' as const, title: 'Existing', url: 'https://e.com' }];
    const mockImported = [{ id: 'x1', type: 'link' as const, title: 'X', url: 'https://x.com' }];
    (importBookmarks as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockImported);

    const onRestoreBookmarks = vi.fn();
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} bookmarks={existing} onRestoreBookmarks={onRestoreBookmarks} />);
    await user.click(screen.getByRole('button', { name: 'Data' }));

    const fileInput = document.querySelector('input[type="file"][accept=".json"]') as HTMLInputElement;
    const file = new File(['{}'], 'bookmarks.json', { type: 'application/json' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Append' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Append' }));

    expect(onRestoreBookmarks).toHaveBeenCalledWith([...existing, ...mockImported]);
  });

  it('点击 Cancel 应关闭确认 UI 且不调用 onRestoreBookmarks', async () => {
    const { importBookmarks } = await import('../utils/backup');
    const mockImported = [{ id: 'x1', type: 'link' as const, title: 'X', url: 'https://x.com' }];
    (importBookmarks as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockImported);

    const onRestoreBookmarks = vi.fn();
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} onRestoreBookmarks={onRestoreBookmarks} />);
    await user.click(screen.getByRole('button', { name: 'Data' }));

    const fileInput = document.querySelector('input[type="file"][accept=".json"]') as HTMLInputElement;
    const file = new File(['{}'], 'bookmarks.json', { type: 'application/json' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onRestoreBookmarks).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Append' })).not.toBeInTheDocument();
  });
});

// ─── Wallpaper Tab ─────────────────────────────────────────────────────────

describe('SettingsModal — Wallpaper Tab', () => {
  it('应该显示 5 个预设背景图', async () => {
    render(<SettingsModal {...defaultProps} />);

    await waitFor(() => {
      const presets = screen.getAllByAltText('preset');
      expect(presets).toHaveLength(5);
    });
  });

  it('点击预设背景应该调用 onSave', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} onSave={onSave} />);

    const presets = screen.getAllByAltText('preset');
    await user.click(presets[0]);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        backgroundImage: expect.stringContaining('unsplash.com'),
        backgroundImageId: undefined,
      })
    );
  });

  it('没有自定义壁纸时应该显示上传提示', async () => {
    render(<SettingsModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Click to upload image')).toBeInTheDocument();
    });
  });

  it('应该显示 Upload New 按钮', async () => {
    render(<SettingsModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Upload New')).toBeInTheDocument();
    });
  });
});
