import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsModal from '../components/SettingsModal';
import { AppSettings } from '../types';
import * as wallpaperStore from '../utils/wallpaperStore';

// Mock wallpaperStore module
vi.mock('../utils/wallpaperStore', () => ({
  listWallpapers: vi.fn(),
  saveWallpaper: vi.fn(),
  deleteWallpaper: vi.fn(),
  getWallpaperBlob: vi.fn(),
}));

// Mock canvas toBlob
HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
  callback(new Blob(['mock-image-data'], { type: 'image/png' }));
});

describe('Wallpaper Integration Tests', () => {
  const defaultSettings: AppSettings = {
    backgroundImage: 'https://example.com/bg.jpg',
    backgroundImageId: undefined,
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

  const mockWallpapers = [
    { id: 'wallpaper-1', name: 'test1.png', createdAt: Date.now() - 1000, url: 'blob:mock-url-1' },
    { id: 'wallpaper-2', name: 'test2.png', createdAt: Date.now(), url: 'blob:mock-url-2' },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    settings: defaultSettings,
    onSave: vi.fn(),
    onResetDefaults: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    vi.mocked(wallpaperStore.listWallpapers).mockResolvedValue([]);
    vi.mocked(wallpaperStore.saveWallpaper).mockResolvedValue({
      id: 'new-wallpaper-id',
      name: 'uploaded.png',
      createdAt: Date.now(),
      url: 'blob:new-mock-url',
    });
    vi.mocked(wallpaperStore.deleteWallpaper).mockResolvedValue();
    vi.mocked(wallpaperStore.getWallpaperBlob).mockResolvedValue(new Blob(['test'], { type: 'image/png' }));
  });

  describe('Add Wallpaper Workflow', () => {
    it('should display upload button', async () => {
      render(<SettingsModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Upload New')).toBeInTheDocument();
      });
    });

    it('should display empty state message when no custom wallpapers', async () => {
      vi.mocked(wallpaperStore.listWallpapers).mockResolvedValue([]);
      
      render(<SettingsModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Click to upload image')).toBeInTheDocument();
      });
    });

    it('should open crop interface after uploading file', async () => {
      const user = userEvent.setup();
      render(<SettingsModal {...defaultProps} />);
      
      // Find hidden file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeTruthy();
      
      // Create mock file
      const file = new File(['test-image'], 'test.png', { type: 'image/png' });
      
      // Trigger file selection
      await user.upload(fileInput, file);
      
      // Should display crop interface
      await waitFor(() => {
        expect(screen.getByText('Adjust Wallpaper')).toBeInTheDocument();
      });
    });

    it('should save wallpaper and update settings after confirming crop', async () => {
      const onSave = vi.fn();
      const user = userEvent.setup();
      
      render(<SettingsModal {...defaultProps} onSave={onSave} />);
      
      // Upload file
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test-image'], 'test.png', { type: 'image/png' });
      await user.upload(fileInput, file);
      
      // Wait for crop interface to appear
      await waitFor(() => {
        expect(screen.getByText('Adjust Wallpaper')).toBeInTheDocument();
      });
      
      // Simulate image load to initialize crop area
      const cropImage = screen.getByAltText('Crop Source') as HTMLImageElement;
      // Set image dimensions
      Object.defineProperty(cropImage, 'width', { value: 800 });
      Object.defineProperty(cropImage, 'height', { value: 600 });
      Object.defineProperty(cropImage, 'naturalWidth', { value: 1920 });
      Object.defineProperty(cropImage, 'naturalHeight', { value: 1080 });
      fireEvent.load(cropImage);
      
      // Wait for crop area to initialize
      await waitFor(() => {
        const cropArea = document.querySelector('.cursor-move');
        expect(cropArea).toBeTruthy();
      });
      
      // Click confirm button
      const confirmButton = screen.getByRole('button', { name: /set wallpaper/i });
      await user.click(confirmButton);
      
      // Verify saveWallpaper was called
      await waitFor(() => {
        expect(wallpaperStore.saveWallpaper).toHaveBeenCalled();
      });
      
      // Verify onSave was called with new wallpaper info
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            backgroundImage: 'blob:new-mock-url',
            backgroundImageId: 'new-wallpaper-id',
          })
        );
      });
    });

    it('should close crop interface when cancelling', async () => {
      const user = userEvent.setup();
      render(<SettingsModal {...defaultProps} />);
      
      // Upload file
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test-image'], 'test.png', { type: 'image/png' });
      await user.upload(fileInput, file);
      
      // Wait for crop interface to appear
      await waitFor(() => {
        expect(screen.getByText('Adjust Wallpaper')).toBeInTheDocument();
      });
      
      // Click cancel button
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      // Crop interface should close
      await waitFor(() => {
        expect(screen.queryByText('Adjust Wallpaper')).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete Wallpaper', () => {
    it('should display uploaded wallpaper list', async () => {
      vi.mocked(wallpaperStore.listWallpapers).mockResolvedValue(mockWallpapers);
      
      render(<SettingsModal {...defaultProps} />);
      
      await waitFor(() => {
        // Should display two wallpaper images
        const images = screen.getAllByAltText(/test|custom/i);
        expect(images.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should delete wallpaper when clicking delete button', async () => {
      const onSave = vi.fn();
      vi.mocked(wallpaperStore.listWallpapers).mockResolvedValue(mockWallpapers);
      
      render(<SettingsModal {...defaultProps} onSave={onSave} />);
      
      await waitFor(() => {
        expect(screen.getAllByTitle('Delete wallpaper').length).toBeGreaterThan(0);
      });
      
      // Click the first delete button
      const deleteButtons = screen.getAllByTitle('Delete wallpaper');
      fireEvent.click(deleteButtons[0]);
      
      // Verify deleteWallpaper was called
      await waitFor(() => {
        expect(wallpaperStore.deleteWallpaper).toHaveBeenCalledWith('wallpaper-1');
      });
    });

    it('should switch to preset wallpaper when deleting current wallpaper', async () => {
      const onSave = vi.fn();
      const settingsWithCustomBg = {
        ...defaultSettings,
        backgroundImage: 'blob:mock-url-1',
        backgroundImageId: 'wallpaper-1',
      };
      
      vi.mocked(wallpaperStore.listWallpapers).mockResolvedValue(mockWallpapers);
      
      render(<SettingsModal {...defaultProps} settings={settingsWithCustomBg} onSave={onSave} />);
      
      await waitFor(() => {
        expect(screen.getAllByTitle('Delete wallpaper').length).toBeGreaterThan(0);
      });
      
      // Click delete on the currently used wallpaper
      const deleteButtons = screen.getAllByTitle('Delete wallpaper');
      fireEvent.click(deleteButtons[0]);
      
      // Verify onSave was called and backgroundImageId was cleared
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            backgroundImageId: undefined,
          })
        );
      });
    });
  });

  describe('Switch Wallpaper', () => {
    it('should switch background when clicking preset wallpaper', async () => {
      const onSave = vi.fn();
      render(<SettingsModal {...defaultProps} onSave={onSave} />);
      
      // Find preset wallpaper buttons (images in Preset Backgrounds section)
      const presetImages = screen.getAllByAltText('preset');
      expect(presetImages.length).toBe(5);
      
      // Click the second preset wallpaper
      fireEvent.click(presetImages[1]);
      
      // Verify onSave was called
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          backgroundImage: expect.stringContaining('unsplash.com'),
          backgroundImageId: undefined,
        })
      );
    });

    it('should switch background when clicking custom wallpaper', async () => {
      const onSave = vi.fn();
      vi.mocked(wallpaperStore.listWallpapers).mockResolvedValue(mockWallpapers);
      
      render(<SettingsModal {...defaultProps} onSave={onSave} />);
      
      await waitFor(() => {
        const customImages = screen.getAllByAltText(/test/i);
        expect(customImages.length).toBeGreaterThan(0);
      });
      
      // Click the first custom wallpaper
      const customImages = screen.getAllByAltText(/test/i);
      fireEvent.click(customImages[0]);
      
      // Verify onSave was called with correct id
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          backgroundImage: 'blob:mock-url-1',
          backgroundImageId: 'wallpaper-1',
        })
      );
    });

    it('should have highlighted border on currently selected wallpaper', async () => {
      const settingsWithCustomBg = {
        ...defaultSettings,
        backgroundImage: 'blob:mock-url-2',
        backgroundImageId: 'wallpaper-2',
      };
      
      vi.mocked(wallpaperStore.listWallpapers).mockResolvedValue(mockWallpapers);
      
      render(<SettingsModal {...defaultProps} settings={settingsWithCustomBg} />);
      
      await waitFor(() => {
        // Find selected wallpaper container (should have border-blue-500 class)
        const selectedWallpaper = document.querySelector('.border-blue-500');
        expect(selectedWallpaper).toBeTruthy();
      });
    });

    it('should clear backgroundImageId when switching from custom to preset wallpaper', async () => {
      const onSave = vi.fn();
      const settingsWithCustomBg = {
        ...defaultSettings,
        backgroundImage: 'blob:mock-url-1',
        backgroundImageId: 'wallpaper-1',
      };
      
      render(<SettingsModal {...defaultProps} settings={settingsWithCustomBg} onSave={onSave} />);
      
      // Click preset wallpaper
      const presetImages = screen.getAllByAltText('preset');
      fireEvent.click(presetImages[0]);
      
      // Verify backgroundImageId was cleared
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          backgroundImageId: undefined,
        })
      );
    });
  });

  describe('Download Wallpaper', () => {
    it('should display download button', async () => {
      vi.mocked(wallpaperStore.listWallpapers).mockResolvedValue(mockWallpapers);
      
      render(<SettingsModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getAllByTitle('Download wallpaper').length).toBeGreaterThan(0);
      });
    });

    it('should trigger download when clicking download button', async () => {
      vi.mocked(wallpaperStore.listWallpapers).mockResolvedValue(mockWallpapers);
      
      render(<SettingsModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getAllByTitle('Download wallpaper').length).toBeGreaterThan(0);
      });
      
      // Mock URL.createObjectURL and revokeObjectURL (after render)
      const mockObjectURL = 'blob:download-url';
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockObjectURL);
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      
      // Click download button
      const downloadButtons = screen.getAllByTitle('Download wallpaper');
      fireEvent.click(downloadButtons[0]);
      
      // Verify getWallpaperBlob was called
      await waitFor(() => {
        expect(wallpaperStore.getWallpaperBlob).toHaveBeenCalledWith('wallpaper-1');
      });
      
      // Cleanup
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });
  });
});
