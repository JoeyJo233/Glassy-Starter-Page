import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { BookmarkItem, SearchEngineId, AppSettings } from './types';
import { DEFAULT_BACKGROUND, INITIAL_BOOKMARKS } from './constants';

import Clock from './components/Clock';
import SearchBar from './components/SearchBar';
import BookmarkGrid from './components/BookmarkGrid';
import SettingsModal from './components/SettingsModal';
import EditItemModal from './components/EditItemModal';
import FolderView from './components/FolderView';

type LegacySearchMenuSettings = {
  engineMenuOpacity?: number;
  engineMenuBlur?: number;
  dropdownOpacity?: number;
  dropdownBlur?: number;
};

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
    globalScale: 100,
    iconBackgroundOpacity: 80,
    iconBackgroundBlur: 0,
    searchMenuOpacity: 80,
    searchMenuBlur: 40,
    clockTextColor: '#f3f4f6',
    shortcutTextColor: '#f3f4f6'
  });

  const normalizeSettings = (
    rawSettings: Partial<AppSettings> & LegacySearchMenuSettings,
    defaults: AppSettings
  ): AppSettings => {
    const {
      engineMenuOpacity,
      engineMenuBlur,
      dropdownOpacity,
      dropdownBlur,
      ...rest
    } = rawSettings;

    return {
      ...defaults,
      ...rest,
      searchMenuOpacity:
        rawSettings.searchMenuOpacity ?? dropdownOpacity ?? engineMenuOpacity ?? defaults.searchMenuOpacity,
      searchMenuBlur:
        rawSettings.searchMenuBlur ?? dropdownBlur ?? engineMenuBlur ?? defaults.searchMenuBlur,
    };
  };

  // State: Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    const defaults = getDefaultSettings();
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return normalizeSettings(parsed, defaults);
      } catch (e) {
        console.warn('Failed to parse appSettings from localStorage, using defaults.', e);
      }
    }
    
    return defaults;
  });

  const handleResetSettings = () => {
    const defaults = getDefaultSettings();
    setSettings(defaults);
  };

  const handleRestoreBookmarks = (bookmarks: BookmarkItem[]) => {
    setItems(bookmarks);
  };

  const handleRestoreSettings = (importedSettings: Partial<AppSettings>, engine: SearchEngineId) => {
    // Merge imported settings with current wallpaper settings
    setSettings(prev => normalizeSettings({
      ...prev,
      ...importedSettings,
      // Keep current wallpaper
      backgroundImage: prev.backgroundImage,
      backgroundImageId: prev.backgroundImageId
    }, getDefaultSettings()));
    setCurrentEngineId(engine);
  };

  // State: Data
  const [items, setItems] = useState<BookmarkItem[]>(() => {
    const saved = localStorage.getItem('bookmarks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse bookmarks from localStorage, using defaults.', e);
      }
    }
    return INITIAL_BOOKMARKS;
  });

  const [currentEngineId, setCurrentEngineId] = useState<SearchEngineId>(() => {
     return (localStorage.getItem('currentEngine') as SearchEngineId) || 'google';
  });

  // State: UI
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editItem, setEditItem] = useState<{item: BookmarkItem | null, parentId?: string} | null>(null);
  const [openFolder, setOpenFolder] = useState<BookmarkItem | null>(null);

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

  // Track blob URL created for the active custom wallpaper so we can revoke it on change/unmount
  const blobUrlRef = useRef<string | null>(null);

  // wallpaperReady gates the initial page reveal so the wallpaper is always present on first paint
  const [wallpaperReady, setWallpaperReady] = useState(false);

  // For URL-based wallpapers: preload once on mount so the image is in cache before we reveal
  useEffect(() => {
    if (settings.backgroundImageId) return; // handled by the IndexedDB effect below
    const src = settings.backgroundImage;
    if (!src) { setWallpaperReady(true); return; }
    const img = new Image();
    img.onload = () => setWallpaperReady(true);
    img.onerror = () => setWallpaperReady(true);
    img.src = src;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolve custom wallpaper from IndexedDB when backgroundImageId is present
  // Note: Blob URLs don't persist across page reloads, so we must recreate them
  useEffect(() => {
    const resolveCustomWallpaper = async () => {
      if (!settings.backgroundImageId) return;

      try {
        const { getWallpaperBlob } = await import('./utils/wallpaperStore');
        const blob = await getWallpaperBlob(settings.backgroundImageId);
        if (!blob) {
          console.warn('Wallpaper blob not found for ID:', settings.backgroundImageId);
          setWallpaperReady(true);
          return;
        }
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        // Preload the blob image before revealing the page
        const img = new Image();
        img.onload = () => {
          setSettings(prev => ({ ...prev, backgroundImage: url }));
          setWallpaperReady(true);
        };
        img.onerror = () => {
          setSettings(prev => ({ ...prev, backgroundImage: url }));
          setWallpaperReady(true);
        };
        img.src = url;
      } catch (e) {
        console.warn('Failed to resolve custom wallpaper from IndexedDB', e);
        setWallpaperReady(true);
      }
    };
    resolveCustomWallpaper();
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
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
        className="min-h-screen w-full flex flex-col items-center justify-start pt-20 relative overflow-hidden bg-cover bg-center bg-no-repeat transition-opacity duration-500 ease-in-out"
        style={{ backgroundImage: `url(${settings.backgroundImage})`, opacity: wallpaperReady ? 1 : 0 }}
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
          textColor={settings.clockTextColor}
        />

        <SearchBar
          currentEngineId={currentEngineId}
          onEngineChange={setCurrentEngineId}
          maxHistoryItems={settings.maxHistoryItems}
          maxSuggestions={settings.maxSuggestions}
          searchBarOpacity={settings.searchBarOpacity}
          searchBarBlur={settings.searchBarBlur}
          searchBarOffsetY={settings.searchBarOffsetY}
          searchMenuOpacity={settings.searchMenuOpacity}
          searchMenuBlur={settings.searchMenuBlur}
        />

        <BookmarkGrid
          items={items}
          setItems={setItems}
          onOpenFolder={setOpenFolder}
          onEditItem={(item) => setEditItem({item})}
          onDeleteItem={handleDeleteItem}
          onAddItem={handleAddItem}
          offsetY={settings.shortcutsOffsetY}
          iconBackgroundOpacity={settings.iconBackgroundOpacity}
          iconBackgroundBlur={settings.iconBackgroundBlur}
          textColor={settings.shortcutTextColor}
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
        bookmarks={items}
        currentEngine={currentEngineId}
        onRestoreBookmarks={handleRestoreBookmarks}
        onRestoreSettings={handleRestoreSettings}
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
