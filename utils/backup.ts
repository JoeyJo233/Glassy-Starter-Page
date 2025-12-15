import { BookmarkItem, AppSettings, SearchEngineId, BookmarksBackup, SettingsBackup } from '../types';

const BOOKMARKS_BACKUP_VERSION = '1.0';
const SETTINGS_BACKUP_VERSION = '1.0';

/**
 * Export bookmarks to a JSON file
 */
export const exportBookmarks = (bookmarks: BookmarkItem[]): void => {
  const backup: BookmarksBackup = {
    version: BOOKMARKS_BACKUP_VERSION,
    timestamp: Date.now(),
    bookmarks
  };

  const dataStr = JSON.stringify(backup, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bookmarks-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Import bookmarks from a JSON file
 */
export const importBookmarks = (file: File): Promise<BookmarkItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backup: BookmarksBackup = JSON.parse(content);
        
        // Validate backup structure
        if (!backup.version || !backup.bookmarks || !Array.isArray(backup.bookmarks)) {
          throw new Error('Invalid backup file format');
        }
        
        // You can add version-specific migration logic here if needed
        if (backup.version !== BOOKMARKS_BACKUP_VERSION) {
          console.warn(`Backup version mismatch: ${backup.version} vs ${BOOKMARKS_BACKUP_VERSION}`);
        }
        
        resolve(backup.bookmarks);
      } catch (error) {
        reject(new Error(`Failed to parse backup file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Export settings (excluding wallpaper) to a JSON file
 */
export const exportSettings = (settings: AppSettings, currentEngine: SearchEngineId): void => {
  // Exclude wallpaper-related settings
  const { backgroundImage, backgroundImageId, ...settingsToBackup } = settings;
  
  const backup: SettingsBackup = {
    version: SETTINGS_BACKUP_VERSION,
    timestamp: Date.now(),
    settings: settingsToBackup,
    currentEngine
  };

  const dataStr = JSON.stringify(backup, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `settings-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Import settings from a JSON file
 */
export const importSettings = (file: File): Promise<{ settings: Partial<AppSettings>, currentEngine: SearchEngineId }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backup: SettingsBackup = JSON.parse(content);
        
        // Validate backup structure
        if (!backup.version || !backup.settings) {
          throw new Error('Invalid backup file format');
        }
        
        // Version-specific migration logic can be added here
        if (backup.version !== SETTINGS_BACKUP_VERSION) {
          console.warn(`Backup version mismatch: ${backup.version} vs ${SETTINGS_BACKUP_VERSION}`);
        }
        
        resolve({
          settings: backup.settings,
          currentEngine: backup.currentEngine || 'google'
        });
      } catch (error) {
        reject(new Error(`Failed to parse backup file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};
