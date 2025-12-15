import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, History, X } from 'lucide-react';
import { SearchEngineId } from '../types';
import { SEARCH_ENGINES, CORS_PROXY } from '../constants';

interface SearchBarProps {
  currentEngineId: SearchEngineId;
  onEngineChange: (id: SearchEngineId) => void;
  maxHistoryItems: number;
  maxSuggestions: number;
  searchBarOpacity?: number;
  searchBarBlur?: number;
  searchBarOffsetY?: number;
  textColor?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
    currentEngineId, 
    onEngineChange,
    maxHistoryItems,
    maxSuggestions,
    searchBarOpacity = 40,
    searchBarBlur = 24,
    searchBarOffsetY = 0,
    textColor = 'rgb(243, 244, 246)'
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showEngineMenu, setShowEngineMenu] = useState(false);
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentEngine = SEARCH_ENGINES.find(e => e.id === currentEngineId) || SEARCH_ENGINES[0];

  // Derive colors from textColor prop
  const isDark = textColor === 'rgb(31, 41, 55)';
  const placeholderColor = isDark ? 'rgb(75, 85, 99)' : 'rgb(209, 213, 219)';
  const iconColor = isDark ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowEngineMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    const fetchSuggestions = async () => {
        // Clear suggestions if query is empty or disabled
        if (!query.trim() || maxSuggestions === 0 || !currentEngine.suggestionUrl) {
            setSuggestions([]);
            return;
        }

        try {
            // 构建建议 API URL
            let apiUrl = `${currentEngine.suggestionUrl}${encodeURIComponent(query)}`;
            
            // 如果需要使用 CORS 代理
            if (currentEngine.useCorsProxy) {
                apiUrl = `${CORS_PROXY}${encodeURIComponent(apiUrl)}`;
            }

            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            let parsed: string[] = [];

            // 统一解析：所有搜索引擎都使用 OpenSearch 格式
            // 格式: [query, [suggestion1, suggestion2, ...], ...]
            if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
                parsed = data[1] as string[];
            } else {
                console.warn('Unexpected API response format:', data);
            }

            setSuggestions(parsed.slice(0, maxSuggestions));

        } catch (e) {
            console.error("获取搜索建议失败:", e);
            setSuggestions([]);
        }
    };

    const timer = setTimeout(() => {
        fetchSuggestions();
    }, 300); // 300ms 防抖

    return () => clearTimeout(timer);
  }, [query, currentEngine.id, currentEngine.suggestionUrl, currentEngine.useCorsProxy, maxSuggestions]);

  // Reset selected index when query or suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query, suggestions]);


  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Save to history (filtering duplicates and limiting length based on setting)
    const newHistory = [searchQuery, ...history.filter(h => h !== searchQuery)].slice(0, maxHistoryItems);
    setHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));

    window.location.href = `${currentEngine.searchUrl}${encodeURIComponent(searchQuery)}`;
  };

  const handleDeleteHistory = (e: React.MouseEvent, itemToDelete: string) => {
    e.stopPropagation();
    const newHistory = history.filter(h => h !== itemToDelete);
    setHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = query === '' ? displayHistory : suggestions;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && items[selectedIndex]) {
        handleSearch(items[selectedIndex]);
      } else {
        handleSearch(query);
      }
    } else if (e.key === 'Escape') {
      setSelectedIndex(-1);
      inputRef.current?.blur();
    }
  };

  const displayHistory = history.slice(0, maxHistoryItems);
  
  // Show dropdown if focused AND (has history OR (has query AND has suggestions))
  const showDropdown = isFocused && (
    (query === '' && displayHistory.length > 0) || 
    (query !== '' && suggestions.length > 0)
  );

  return (
    <div className="relative w-full max-w-2xl mx-auto z-50 mb-12">
      <div
        className={`
          flex items-center w-full h-14 backdrop-blur-xl
          rounded-full border border-white/40 shadow-lg
          transition-all duration-300
          ${isFocused ? 'ring-4 ring-white/20' : 'hover:brightness-110'}
        `}
        style={{
          backgroundColor: `rgba(255, 255, 255, ${searchBarOpacity / 100})`,
          backdropFilter: `blur(${searchBarBlur}px)`,
          WebkitBackdropFilter: `blur(${searchBarBlur}px)`,
          transform: `translateY(${searchBarOffsetY}px)`
        }}
      >
        {/* Engine Selector */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowEngineMenu(!showEngineMenu)}
            className="flex items-center justify-center h-full pl-4 pr-2 hover:opacity-70 transition-opacity outline-none"
          >
            <img src={currentEngine.icon} alt={currentEngine.name} className="w-6 h-6 rounded-sm" />
            <ChevronDown className="w-4 h-4 ml-1 opacity-60" style={{ color: iconColor }} />
          </button>

          {showEngineMenu && (
            <div className="absolute top-14 left-0 w-48 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl py-2 border border-white/50 overflow-hidden">
              {SEARCH_ENGINES.map((engine) => (
                <button
                  key={engine.id}
                  onClick={() => {
                    onEngineChange(engine.id);
                    setShowEngineMenu(false);
                    inputRef.current?.focus();
                  }}
                  className="flex items-center w-full px-4 py-3 hover:bg-black/5 transition-colors text-left"
                >
                  <img src={engine.icon} alt={engine.name} className="w-5 h-5 mr-3" />
                  <span className="text-gray-800 font-medium">{engine.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          className="flex-1 h-full bg-transparent border-none outline-none text-lg px-2"
          style={{ 
            color: textColor,
            '--placeholder-color': placeholderColor
          } as React.CSSProperties & { '--placeholder-color': string }}
        />

        {/* Search Icon / Action */}
        <button
          onClick={() => handleSearch(query)}
          className="pr-4 pl-2 opacity-60 hover:opacity-100 hover:scale-110 transition-all"
          style={{ color: iconColor }}
        >
          <Search className="w-6 h-6" />
        </button>
      </div>

      <style>{`
        input::placeholder {
          color: ${placeholderColor};
          opacity: 1;
        }
      `}</style>

      {/* Suggestions / History Dropdown */}
      {showDropdown && (
        <div
      className="absolute top-16 left-0 w-full bg-white/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/40 overflow-hidden py-2"
          style={{
            transform: `translateY(${searchBarOffsetY}px)`,
          }}
        >
            {/* History Section (Only when query is empty) */}
            {query === '' && displayHistory.map((item, idx) => (
                <div
                    key={`hist-${idx}`}
                    onClick={() => handleSearch(item)}
                    className={`flex items-center justify-between px-6 py-3 hover:bg-black/5 cursor-pointer text-gray-700 group transition-colors ${
                        selectedIndex === idx ? 'bg-black/10' : ''
                    }`}
                >
                    <div className="flex items-center">
                        <History className="w-4 h-4 mr-4 opacity-50" />
                        <span>{item}</span>
                    </div>
                    <button
                        onClick={(e) => handleDeleteHistory(e, item)}
                        onMouseDown={(e) => e.preventDefault()}
                        className="p-1.5 rounded-full hover:bg-black/10 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"
                        title="Remove from history"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ))}
            
            {/* Suggestions Section (When query exists) */}
            {query !== '' && suggestions.map((sug, idx) => (
                <div
                    key={`sug-${idx}`}
                    onClick={() => handleSearch(sug)}
                    className={`flex items-center px-6 py-3 hover:bg-black/5 cursor-pointer text-gray-700 transition-colors ${
                        selectedIndex === idx ? 'bg-black/10' : ''
                    }`}
                >
                    <Search className="w-4 h-4 mr-4 opacity-50" />
                    <span className={idx === 0 ? "font-semibold" : ""}>{sug}</span>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;