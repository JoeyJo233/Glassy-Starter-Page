# GlassyStart - 安装说明

## 如何在Chrome中使用

### 方法一：作为Chrome扩展（推荐，完全离线）

1. 打开Chrome浏览器
2. 在地址栏输入：`chrome://extensions/`
3. 打开右上角的"开发者模式"开关
4. 点击"加载已解压的扩展程序"
5. 选择项目中的 `dist` 文件夹
6. 完成！现在打开新标签页就可以看到GlassyStart了

### 方法二：设置本地文件为主页

1. 在文件管理器中找到 `dist/index.html` 文件
2. 复制完整的文件路径
3. 打开Chrome设置 → 外观 → 主页按钮
4. 启用"显示主页按钮"并粘贴文件路径

## 功能特点

✅ **完全离线可用** - 所有资源都已打包到本地
✅ **样式完全一致** - Tailwind CSS已内联，字体已配置
✅ **毛玻璃效果** - backdrop-blur正常工作
✅ **动画效果** - fade-in和slide-up动画完整保留
✅ **Inter字体** - 字体已正确加载

## 技术说明

### 构建配置改进：
- ✅ 使用本地Tailwind CSS v3替代CDN
- ✅ 配置PostCSS处理样式
- ✅ 设置相对路径（`base: './'`）以支持离线使用
- ✅ 移除在线importmap，使用标准模块打包
- ✅ 优化构建输出

### 开发命令：
```bash
npm run dev     # 开发模式（端口3000）
npm run build   # 生产构建
npm run preview # 预览构建结果
```

## 注意事项

- 字体使用Google Fonts的Inter，在线时自动加载，离线时使用系统备用字体
- CORS代理功能需要网络连接才能获取搜索建议
- 背景图片URL需要网络连接才能加载（可以在设置中上传本地图片）

---

如需重新构建，请运行：
```bash
npm run build
```
