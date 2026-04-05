<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GlassyStart

A glassmorphism-style browser new tab extension built with React + Vite. Features a customizable clock, search bar with multi-engine support, bookmark grid with folder support, and a wallpaper manager.

## Features

- **Wallpaper** — upload custom wallpapers (stored in IndexedDB, supports 4K), or choose from presets
- **Search** — Google, Bing, DuckDuckGo, Yandex with search history and suggestions
- **Bookmarks** — drag-to-reorder grid, folders, custom icons with crop tool
- **Appearance** — blur/opacity overlays, glassmorphism search bar, clock/text colors
- **Layout** — global scale, per-element Y offsets, font sizes
- **Data** — export/import bookmarks and settings as JSON

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the app:
   ```bash
   npm run dev
   ```

## Build & Install as Chrome Extension

```bash
npm run build
```

Then load the `dist/` folder as an unpacked Chrome extension (`chrome://extensions/` → Developer mode → Load unpacked).

See [INSTALL.md](INSTALL.md) for detailed instructions.

## Notes

- Fonts (Inter) load from Google Fonts; system fallback is used offline
- Default backgrounds and search suggestion APIs require a network connection
- Custom wallpapers are stored locally in IndexedDB and work fully offline
