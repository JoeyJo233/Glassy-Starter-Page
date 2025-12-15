export type SearchEngineId = 'google' | 'bing' | 'duckduckgo' | 'baidu' | 'yandex';

export interface SearchEngine {
  id: SearchEngineId;
  name: string;
  icon: string; // URL or Lucide component name logic
  searchUrl: string;
  suggestionUrl?: string;
  useCorsProxy?: boolean; // 是否需要使用 CORS 代理
}

export type ItemType = 'link' | 'folder';

export interface BookmarkItem {
  id: string;
  type: ItemType;
  title: string;
  url?: string;
  icon?: string; // Emoji or image URL
  children?: BookmarkItem[]; // For folders
}

export interface AppSettings {
  backgroundImage: string;
  backgroundImageId?: string; // IndexedDB id for custom wallpapers
  blurLevel: number; // 0 to 20
  opacityLevel: number; // 0 to 100
  maxHistoryItems: number;
  maxSuggestions: number;
  searchBarOpacity: number; // 0 to 100 - 搜索栏透明度
  searchBarBlur: number; // 0 to 30 - 搜索栏模糊度 (px)
  timeFontSize: number; // 40 to 120 - 时间字体大小 (px)
  dateFontSize: number; // 12 to 40 - 日期字体大小 (px)
  timeOffsetY: number; // -100 to 200 - 时间纵向偏移 (px)
  dateOffsetY: number; // -100 to 200 - 日期纵向偏移 (px)
  searchBarOffsetY: number; // -100 to 200 - 搜索栏纵向偏移 (px)
  shortcutsOffsetY: number; // -100 to 200 - 快捷方式纵向偏移 (px)
  globalScale: number; // 50 to 150 - 全局缩放百分比
}

export interface DragItem {
  id: string;
  index: number;
  type: ItemType;
  folderId?: string; // If inside a folder
}