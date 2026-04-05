<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GlassyStart

**English** | [中文](#中文)

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

---

# 中文

[English](#glassystart) | **中文**

基于 React + Vite 构建的毛玻璃风格浏览器新标签页扩展。包含可自定义时钟、多搜索引擎支持、带文件夹功能的书签网格以及壁纸管理器。

## 功能特性

- **壁纸** — 上传自定义壁纸（存储于 IndexedDB，支持 4K），或从预设中选择
- **搜索** — 支持 Google、Bing、DuckDuckGo、Yandex，含搜索历史和搜索建议
- **书签** — 拖拽排序网格、文件夹、带裁切工具的自定义图标
- **外观** — 模糊/透明度叠层、毛玻璃搜索栏、时钟和文字颜色
- **布局** — 全局缩放、各元素纵向偏移、字体大小
- **数据** — 书签和设置的 JSON 导入/导出

## 本地运行

**前置条件：** Node.js

1. 安装依赖：
   ```bash
   npm install
   ```
2. 启动应用：
   ```bash
   npm run dev
   ```

## 构建并安装为 Chrome 扩展

```bash
npm run build
```

然后将 `dist/` 文件夹作为未打包扩展加载（`chrome://extensions/` → 开启开发者模式 → 加载已解压的扩展程序）。

详细安装说明请参阅 [INSTALL.md](INSTALL.md)。

## 注意事项

- 字体（Inter）从 Google Fonts 加载，离线时使用系统备用字体
- 默认背景和搜索建议 API 需要网络连接
- 自定义壁纸存储于本地 IndexedDB，完全支持离线使用
