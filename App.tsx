import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { BookmarkItem, SearchEngineId, AppSettings } from './types';
import { DEFAULT_BACKGROUND, INITIAL_BOOKMARKS } from './constants';

import Clock from './components/Clock';
import SearchBar from './components/SearchBar';
import BookmarkGrid from './components/BookmarkGrid';
import SettingsModal from './components/SettingsModal';
import EditItemModal from './components/EditItemModal';
import FolderView from './components/FolderView';

const App: React.FC = () => {
  const getDefaultSettings = (): AppSettings => ({
    backgroundImage: DEFAULT_BACKGROUND,
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
    globalScale: 100
  });

  // State: Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    const defaults = getDefaultSettings();
    
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge defaults with saved settings (saved settings override defaults)
      return {
        ...defaults,
        ...parsed
      };
    }
    
    return defaults;
  });

  const handleResetSettings = () => {
    const defaults = getDefaultSettings();
    setSettings(defaults);
  };

  // State: Data
  const [items, setItems] = useState<BookmarkItem[]>(() => {
    const saved = localStorage.getItem('bookmarks');
    return saved ? JSON.parse(saved) : INITIAL_BOOKMARKS;
  });

  const [currentEngineId, setCurrentEngineId] = useState<SearchEngineId>(() => {
     return (localStorage.getItem('currentEngine') as SearchEngineId) || 'google';
  });

  // State: UI
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editItem, setEditItem] = useState<{item: BookmarkItem | null, parentId?: string} | null>(null);
  const [openFolder, setOpenFolder] = useState<BookmarkItem | null>(null);

  // Calculate text color based on background image
  useEffect(() => {
    const calculateTextColor = () => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = settings.backgroundImage;
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Sample from center of image
          canvas.width = 100;
          canvas.height = 100;
          ctx.drawImage(img, 0, 0, 100, 100);
          
          // Get average color from center region
          const imageData = ctx.getImageData(0, 0, 100, 100);
          let r = 0, g = 0, b = 0;
          const pixels = imageData.data.length / 4;
          
          for (let i = 0; i < imageData.data.length; i += 4) {
            r += imageData.data[i];
            g += imageData.data[i + 1];
            b += imageData.data[i + 2];
          }
          
          r = r / pixels / 255;
          g = g / pixels / 255;
          b = b / pixels / 255;
          
          // Calculate luminance
          const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          
          // Adjust for opacity overlay
          const adjustedLuminance = luminance * (1 - settings.opacityLevel / 100);
          
          // Choose text color
          const textColor = adjustedLuminance > 0.4 ? 'rgb(31, 41, 55)' : 'rgb(243, 244, 246)';
          
          setSettings(prev => ({ ...prev, textColor }));
        } catch (e) {
          console.error('Failed to calculate text color:', e);
          // Fallback to light text
          setSettings(prev => ({ ...prev, textColor: 'rgb(243, 244, 246)' }));
        }
      };
      
      img.onerror = () => {
        // Fallback to light text if image fails to load
        setSettings(prev => ({ ...prev, textColor: 'rgb(243, 244, 246)' }));
      };
    };

    calculateTextColor();
  }, [settings.backgroundImage, settings.opacityLevel]);

  // Persistence Effects - wrap with try/catch to avoid crashes (especially for large base64 wallpapers)
  useEffect(() => {
    try {
      localStorage.setItem('appSettings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to persist appSettings (possibly quota exceeded).', e);
      // Fallback: try to persist without backgroundImage if it is a large data URL
      if (settings.backgroundImage?.startsWith('data:')) {
        try {
          const { backgroundImage, ...rest } = settings;
          localStorage.setItem('appSettings', JSON.stringify(rest));
          console.warn('Persisted appSettings without backgroundImage to avoid quota issues.');
        } catch (err) {
          console.warn('Fallback persistence for appSettings also failed.', err);
        }
      }
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('bookmarks', JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to persist bookmarks.', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem('currentEngine', currentEngineId);
    } catch (e) {
      console.warn('Failed to persist currentEngine.', e);
    }
  }, [currentEngineId]);

  // Resolve custom wallpaper from IndexedDB when backgroundImageId is present
  useEffect(() => {
    const resolveCustomWallpaper = async () => {
      if (!settings.backgroundImageId) return;
      // If already a blob URL, skip
      if (settings.backgroundImage && settings.backgroundImage.startsWith('blob:')) return;
      try {
        const { getWallpaperBlob } = await import('./utils/wallpaperStore');
        const blob = await getWallpaperBlob(settings.backgroundImageId);
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setSettings(prev => ({ ...prev, backgroundImage: url }));
      } catch (e) {
        console.warn('Failed to resolve custom wallpaper from IndexedDB', e);
      }
    };
    resolveCustomWallpaper();
  }, [settings.backgroundImageId]);

  // Handlers
  const handleAddItem = () => {
    setEditItem({ item: null });
  };

  const handleSaveItem = (newItem: BookmarkItem) => {
    if (editItem?.item) {
        // Edit existing
        setItems(prev => prev.map(i => i.id === newItem.id ? newItem : i));
    } else {
        // Add new
        setItems(prev => [...prev, newItem]);
    }
    setEditItem(null);
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdateFolder = (updatedFolder: BookmarkItem) => {
    setItems(prev => prev.map(i => i.id === updatedFolder.id ? updatedFolder : i));
    if (openFolder?.id === updatedFolder.id) {
        setOpenFolder(updatedFolder);
    }
  };

  const handleRemoveFromFolder = (item: BookmarkItem) => {
      if (!openFolder) return;
      
      // 1. Remove from current folder
      const updatedChildren = openFolder.children?.filter(c => c.id !== item.id) || [];
      const updatedFolder = { ...openFolder, children: updatedChildren };
      
      // 2. Update folder in root list AND append item to root list
      setItems(prev => {
          const newItems = prev.map(i => i.id === updatedFolder.id ? updatedFolder : i);
          return [...newItems, item];
      });

      // Update open folder state
      setOpenFolder(updatedFolder);
  };

  return (
    <div
        className="min-h-screen w-full flex flex-col items-center justify-start pt-20 relative overflow-hidden transition-all duration-700 ease-in-out bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${settings.backgroundImage})` }}
    >
      {/* Background Overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none transition-all duration-500"
        style={{
            backgroundColor: `rgba(0,0,0,${settings.opacityLevel / 100})`,
            backdropFilter: `blur(${settings.blurLevel}px)`
        }}
      />

      {/* Main Content */}
      <div 
        className="z-10 w-full flex flex-col items-center px-4 origin-top transition-transform duration-300"
        style={{ transform: `scale(${(settings.globalScale ?? 100) / 100})` }}
      >
        <Clock 
          timeFontSize={settings.timeFontSize}
          dateFontSize={settings.dateFontSize}
          timeOffsetY={settings.timeOffsetY}
          dateOffsetY={settings.dateOffsetY}
          textColor={settings.textColor}
        />

        <SearchBar
          currentEngineId={currentEngineId}
          onEngineChange={setCurrentEngineId}
          maxHistoryItems={settings.maxHistoryItems}
          maxSuggestions={settings.maxSuggestions}
          searchBarOpacity={settings.searchBarOpacity}
          searchBarBlur={settings.searchBarBlur}
          searchBarOffsetY={settings.searchBarOffsetY}
          textColor={settings.textColor}
        />

        <BookmarkGrid
          items={items}
          setItems={setItems}
          onOpenFolder={setOpenFolder}
          onEditItem={(item) => setEditItem({item})}
          onDeleteItem={handleDeleteItem}
          onAddItem={handleAddItem}
          offsetY={settings.shortcutsOffsetY}
          textColor={settings.textColor}
        />
      </div>

      {/* Settings Trigger */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3 bg-white/20 backdrop-blur-md rounded-full text-white/80 hover:bg-white/40 hover:text-white hover:rotate-90 transition-all shadow-lg"
      >
        <SettingsIcon className="w-6 h-6" />
      </button>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
        onResetDefaults={handleResetSettings}
      />

      <EditItemModal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        item={editItem?.item || null}
        onSave={handleSaveItem}
      />

      {openFolder && (
        <FolderView
            folder={openFolder}
            isOpen={!!openFolder}
            onClose={() => setOpenFolder(null)}
            onUpdateFolder={handleUpdateFolder}
            onEditItem={(item) => setEditItem({item})}
            onRemoveFromFolder={handleRemoveFromFolder}
        />
      )}

      {/* Signature / Footer */}
      <div className="fixed bottom-4 left-0 w-full text-center text-white/30 text-xs pointer-events-none z-0">
        GlassyStart
      </div>
    </div>
  );
};

export default App;