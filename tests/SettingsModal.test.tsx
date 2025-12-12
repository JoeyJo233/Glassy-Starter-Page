import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsModal from '../components/SettingsModal';
import { AppSettings } from '../types';

describe('SettingsModal', () => {
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
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    settings: defaultSettings,
    onSave: vi.fn(),
    onResetDefaults: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('isOpen 为 false 时不应该渲染任何内容', () => {
    const { container } = render(<SettingsModal {...defaultProps} isOpen={false} />);
    
    // 当 isOpen 为 false 时，不应该渲染设置面板
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  it('isOpen 为 true 时应该渲染设置面板', () => {
    render(<SettingsModal {...defaultProps} />);
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('应该显示 Global Scale 滑块', () => {
    render(<SettingsModal {...defaultProps} />);
    
    expect(screen.getByText('Global Scale')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('Global Scale 滑块应该正确显示当前值', () => {
    const settingsWithScale = { ...defaultSettings, globalScale: 75 };
    render(<SettingsModal {...defaultProps} settings={settingsWithScale} />);
    
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('修改 Global Scale 滑块应该调用 onSave', () => {
    const onSave = vi.fn();
    render(<SettingsModal {...defaultProps} onSave={onSave} />);
    
    // 找到 Global Scale 滑块（第一个 range input）
    const sliders = screen.getAllByRole('slider');
    const globalScaleSlider = sliders[0];
    
    // 修改滑块值
    fireEvent.change(globalScaleSlider, { target: { value: '120' } });
    
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        globalScale: 120,
      })
    );
  });

  it('点击 Reset Defaults 按钮应该调用 onResetDefaults', () => {
    const onResetDefaults = vi.fn();
    render(<SettingsModal {...defaultProps} onResetDefaults={onResetDefaults} />);
    
    const resetButton = screen.getByRole('button', { name: /reset defaults/i });
    fireEvent.click(resetButton);
    
    expect(onResetDefaults).toHaveBeenCalled();
  });
});
