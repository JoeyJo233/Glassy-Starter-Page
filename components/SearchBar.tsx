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
  searchMenuOpacity?: number;
  searchMenuBlur?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
    currentEngineId,
    onEngineChange,
    maxHistoryItems,
    maxSuggestions,
    searchBarOpacity = 40,
    searchBarBlur = 24,
    searchBarOffsetY = 0,
    textColor = 'rgb(243, 244, 246)',
    searchMenuOpacity = 80,
    searchMenuBlur = 40,
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showEngineMenu, setShowEngineMenu] = useState(false);
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse searchHistory from localStorage.', e);
      }
    }
    return [];
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const engineButtonRef = useRef<HTMLDivElement>(null);
  const engineDropdownRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const suggestCacheRef = useRef<Map<string, string[]>>(new Map());

  const currentEngine = SEARCH_ENGINES.find(e => e.id === currentEngineId) || SEARCH_ENGINES[0];

  // Derive colors from textColor prop
  const isDark = textColor === 'rgb(31, 41, 55)';
  const placeholderColor = isDark ? 'rgb(75, 85, 99)' : 'rgb(209, 213, 219)';
  const iconColor = isDark ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const inButton = engineButtonRef.current?.contains(event.target as Node);
      const inDropdown = engineDropdownRef.current?.contains(event.target as Node);
      if (!inButton && !inDropdown) {
        setShowEngineMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with debounce, AbortController, and per-engine cache
  useEffect(() => {
    const fetchSuggestions = async () => {
        if (!query.trim() || maxSuggestions === 0 || !currentEngine.suggestionUrl) {
            setSuggestions([]);
            return;
        }

        const cacheKey = `${currentEngine.id}:${query}`;
        const cached = suggestCacheRef.current.get(cacheKey);
        if (cached) {
            setSuggestions(cached);
            return;
        }

        // Cancel any in-flight request before starting a new one
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            let apiUrl = `${currentEngine.suggestionUrl}${encodeURIComponent(query)}`;
            if (currentEngine.useCorsProxy) {
                apiUrl = `${CORS_PROXY}${encodeURIComponent(apiUrl)}`;
            }

            const response = await fetch(apiUrl, { signal: controller.signal });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            let parsed: string[] = [];
            if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
                parsed = data[1] as string[];
            } else {
                console.warn('Unexpected API response format:', data);
            }

            const result = parsed.slice(0, maxSuggestions);
            // Cap cache at 100 entries to prevent unbounded growth
            if (suggestCacheRef.current.size >= 100) {
                const firstKey = suggestCacheRef.current.keys().next().value as string;
                suggestCacheRef.current.delete(firstKey);
            }
            suggestCacheRef.current.set(cacheKey, result);
            setSuggestions(result);

        } catch (e) {
            if ((e as Error).name === 'AbortError') return; // expected — don't update state
            console.error("获取搜索建议失败:", e);
            setSuggestions([]);
        }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query, currentEngine.id, currentEngine.suggestionUrl, currentEngine.useCorsProxy, maxSuggestions]);

  // Abort any pending request on unmount
  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
  }, []);

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
  const showSearchDropdown = showDropdown && !showEngineMenu;
  const sharedMenuStyle = {
    backgroundColor: `rgba(255, 255, 255, ${searchMenuOpacity / 100})`,
    backdropFilter: `blur(${searchMenuBlur}px)`,
    WebkitBackdropFilter: `blur(${searchMenuBlur}px)`,
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto z-50 mb-12">
      <div
        className="relative"
        style={{ transform: `translateY(${searchBarOffsetY}px)` }}
      >
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
          }}
        >
          {/* Engine Selector Button */}
          <div className="relative h-full" ref={engineButtonRef}>
            <button
              onClick={() => setShowEngineMenu(!showEngineMenu)}
              className="flex items-center justify-center h-full pl-4 pr-2 hover:opacity-70 transition-opacity outline-none"
              aria-label={`Select search engine: ${currentEngine.name}`}
              aria-expanded={showEngineMenu}
            >
              <img src={currentEngine.icon} alt={currentEngine.name} className="w-6 h-6 rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
              <ChevronDown className="w-4 h-4 ml-1 opacity-60" style={{ color: iconColor }} />
            </button>
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

        {/* Engine Dropdown — outside backdrop-filter parent to avoid blur inheritance */}
        {showEngineMenu && (
          <div
            ref={engineDropdownRef}
            className="absolute top-full left-0 mt-2 w-48 rounded-2xl shadow-2xl py-2 border border-white/40 overflow-hidden"
            style={sharedMenuStyle}
          >
            {SEARCH_ENGINES.map((engine) => (
              <button
                key={engine.id}
                onClick={() => {
                  onEngineChange(engine.id);
                  setShowEngineMenu(false);
                  inputRef.current?.focus();
                }}
                className={`flex items-center w-full px-4 py-3 hover:bg-black/5 transition-colors text-left ${
                  engine.id === currentEngineId ? 'bg-black/5' : ''
                }`}
              >
                <img src={engine.icon} alt={engine.name} className="w-5 h-5 mr-3 opacity-80" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
                <span className="text-gray-700 font-medium">{engine.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Suggestions / History Dropdown */}
        {showSearchDropdown && (
          <div
            className="absolute top-full left-0 mt-2 w-full rounded-2xl shadow-2xl border border-white/40 overflow-hidden py-2"
            style={sharedMenuStyle}
          >
              {/* History Section (Only when query is empty) */}
              {query === '' && displayHistory.map((item, idx) => (
                  <div
                      key={`hist-${idx}`}
                      onClick={() => handleSearch(item)}
                      className={`flex items-center justify-between px-4 py-3 hover:bg-black/5 cursor-pointer text-gray-700 group transition-colors ${
                          selectedIndex === idx ? 'bg-black/10' : ''
                      }`}
                  >
                      <div className="flex items-center">
                          <History className="w-4 h-4 mr-3 opacity-80" />
                          <span className="font-medium">{item}</span>
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
                      className={`flex items-center px-4 py-3 hover:bg-black/5 cursor-pointer text-gray-700 transition-colors ${
                          selectedIndex === idx ? 'bg-black/10' : ''
                      }`}
                  >
                      <Search className="w-4 h-4 mr-3 opacity-80" />
                      <span className="font-medium">{sug}</span>
                  </div>
              ))}
          </div>
        )}
      </div>

      <style>{`
        input::placeholder {
          color: ${placeholderColor};
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default SearchBar;
