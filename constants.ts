import { BookmarkItem, SearchEngine } from './types';

export const DEFAULT_BACKGROUND = "https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=2070&auto=format&fit=crop";

export const SEARCH_ENGINES: SearchEngine[] = [
  {
    id: 'google',
    name: 'Google',
    icon: 'https://www.google.com/favicon.ico',
    searchUrl: 'https://www.google.com/search?q=',
    suggestionUrl: 'https://suggestqueries.google.com/complete/search?client=firefox&q=',
    useCorsProxy: true,
  },
  {
    id: 'bing',
    name: 'Bing',
    icon: 'https://www.bing.com/sa/simg/favicon-2x.ico',
    searchUrl: 'https://www.bing.com/search?q=',
    suggestionUrl: 'https://api.bing.com/osjson.aspx?query=',
    useCorsProxy: true,
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    icon: 'https://duckduckgo.com/favicon.ico',
    searchUrl: 'https://duckduckgo.com/?q=',
    suggestionUrl: 'https://duckduckgo.com/ac/?type=list&q=',
    useCorsProxy: true,
  },
  {
    id: 'yandex',
    name: 'Yandex',
    icon: 'https://yastatic.net/s3/home-static/_/37/37a02b5dc7a51abac55d8a5b6c865f0e.png',
    searchUrl: 'https://yandex.com/search/?text=',
    suggestionUrl: 'https://yandex.com/suggest/suggest-ya.cgi?v=4&json=1&part=',
    useCorsProxy: true,
  },
];

// CORS 代理配置 - 用于绕过浏览器跨域限制
export const CORS_PROXY = 'https://corsproxy.io/?';

export const INITIAL_BOOKMARKS: BookmarkItem[] = [
  {
    id: '1',
    type: 'link',
    title: 'GitHub',
    url: 'https://github.com',
    icon: 'https://github.githubassets.com/favicons/favicon.svg',
  },
  {
    id: '2',
    type: 'link',
    title: 'YouTube',
    url: 'https://youtube.com',
    icon: 'https://www.youtube.com/s/desktop/1326c749/img/favicon_144x144.png',
  },
  {
    id: '3',
    type: 'folder',
    title: 'Social',
    icon: '📁',
    children: [
      {
        id: '3-1',
        type: 'link',
        title: 'Twitter',
        url: 'https://twitter.com',
        icon: 'https://abs.twimg.com/favicons/twitter.2.ico',
      },
      {
        id: '3-2',
        type: 'link',
        title: 'Reddit',
        url: 'https://reddit.com',
        icon: 'https://www.redditstatic.com/desktop2x/img/favicon/favicon-96x96.png',
      }
    ]
  },
  {
    id: '4',
    type: 'link',
    title: 'ChatGPT',
    url: 'https://chat.openai.com',
    icon: 'https://chat.openai.com/favicon.ico',
  },
];