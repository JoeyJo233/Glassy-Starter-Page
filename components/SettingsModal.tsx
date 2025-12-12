import React, { useRef, useState, useEffect } from 'react';
import { X, Upload, Trash2, Check, Image as ImageIcon } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onResetDefaults: () => void;
}

const PRESET_BACKGROUNDS = [
  "https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=2000&auto=format&fit=crop",
];

interface CropState {
  x: number;
  y: number;
  width: number;
  height: number;
}

type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, onResetDefaults }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Modal Width Resize State
  const MIN_MODAL_WIDTH = 320;
  const MAX_MODAL_WIDTH = 800;
  const DEFAULT_MODAL_WIDTH = 420;
  
  const [modalWidth, setModalWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('settingsModalWidth');
      return saved ? Math.max(MIN_MODAL_WIDTH, Math.min(MAX_MODAL_WIDTH, parseInt(saved))) : DEFAULT_MODAL_WIDTH;
    } catch (e) {
      return DEFAULT_MODAL_WIDTH;
    }
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  // Save modal width to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('settingsModalWidth', modalWidth.toString());
    } catch (e) {
      console.warn("LocalStorage full or disabled", e);
    }
  }, [modalWidth]);

  // Modal Resize Logic
  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing) return;
      e.preventDefault();
      
      // Calculate new width (dragging left edge, so width increases when moving left)
      const deltaX = resizeStartX.current - e.clientX;
      let newWidth = resizeStartWidth.current + deltaX;
      
      // Clamp to min/max
      newWidth = Math.max(MIN_MODAL_WIDTH, Math.min(MAX_MODAL_WIDTH, newWidth));
      setModalWidth(newWidth);
    };

    const handleResizeUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeUp);
    };
  }, [isResizing]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = modalWidth;
  };

  // Custom Wallpapers State
  const [customWallpapers, setCustomWallpapers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('customWallpapers');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('customWallpapers', JSON.stringify(customWallpapers));
    } catch (e) {
      console.warn("LocalStorage full or disabled", e);
    }
  }, [customWallpapers]);

  // Cropping State
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  
  // Crop Box State (relative to the displayed image pixels)
  const [crop, setCrop] = useState<CropState>({ x: 0, y: 0, width: 0, height: 0 });
  
  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<DragMode>('move');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 }); // Mouse position on screen
  const [cropStart, setCropStart] = useState<CropState>({ x: 0, y: 0, width: 0, height: 0 }); // Crop state at drag start

  // --- Drag Logic Effect ---
  useEffect(() => {
    const handleWindowMove = (e: MouseEvent) => {
      if (!isDragging || !imageRef.current) return;
      e.preventDefault();

      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      const imgRect = imageRef.current.getBoundingClientRect();
      const maxImgWidth = imgRect.width;
      const maxImgHeight = imgRect.height;
      const aspect = 16 / 9;

      if (dragMode === 'move') {
          let newX = cropStart.x + dx;
          let newY = cropStart.y + dy;

          // Clamp X
          if (newX < 0) newX = 0;
          if (newX + cropStart.width > maxImgWidth) newX = maxImgWidth - cropStart.width;

          // Clamp Y
          if (newY < 0) newY = 0;
          if (newY + cropStart.height > maxImgHeight) newY = maxImgHeight - cropStart.height;

          setCrop(prev => ({ ...prev, x: newX, y: newY }));

      } else {
          // RESIZING LOGIC
          // Determine the fixed anchor point based on the corner being dragged
          let anchorX = 0;
          let anchorY = 0;
          let newWidth = 0;

          // 1. Determine Initial Anchor and Raw New Width
          if (dragMode === 'se') {
              anchorX = cropStart.x;
              anchorY = cropStart.y;
              newWidth = cropStart.width + dx;
          } else if (dragMode === 'sw') {
              anchorX = cropStart.x + cropStart.width;
              anchorY = cropStart.y;
              newWidth = cropStart.width - dx;
          } else if (dragMode === 'ne') {
              anchorX = cropStart.x;
              anchorY = cropStart.y + cropStart.height;
              newWidth = cropStart.width + dx;
          } else if (dragMode === 'nw') {
              anchorX = cropStart.x + cropStart.width;
              anchorY = cropStart.y + cropStart.height;
              newWidth = cropStart.width - dx;
          }

          // 2. Minimum Width Constraint
          if (newWidth < 100) newWidth = 100;

          // 3. Boundary Constraints (Max Width based on Anchor)
          let maxAllowedWidth = Infinity;

          if (dragMode === 'se') {
              const spaceRight = maxImgWidth - anchorX;
              const spaceBottom = maxImgHeight - anchorY;
              maxAllowedWidth = Math.min(spaceRight, spaceBottom * aspect);
          } else if (dragMode === 'sw') {
              const spaceLeft = anchorX;
              const spaceBottom = maxImgHeight - anchorY;
              maxAllowedWidth = Math.min(spaceLeft, spaceBottom * aspect);
          } else if (dragMode === 'ne') {
              const spaceRight = maxImgWidth - anchorX;
              const spaceTop = anchorY;
              maxAllowedWidth = Math.min(spaceRight, spaceTop * aspect);
          } else if (dragMode === 'nw') {
              const spaceLeft = anchorX;
              const spaceTop = anchorY;
              maxAllowedWidth = Math.min(spaceLeft, spaceTop * aspect);
          }

          if (newWidth > maxAllowedWidth) newWidth = maxAllowedWidth;

          // 4. Calculate New Height and Position
          const newHeight = newWidth / aspect;
          let newX = 0;
          let newY = 0;

          if (dragMode === 'se') {
              newX = anchorX;
              newY = anchorY;
          } else if (dragMode === 'sw') {
              newX = anchorX - newWidth;
              newY = anchorY;
          } else if (dragMode === 'ne') {
              newX = anchorX;
              newY = anchorY - newHeight;
          } else if (dragMode === 'nw') {
              newX = anchorX - newWidth;
              newY = anchorY - newHeight;
          }

          setCrop({ x: newX, y: newY, width: newWidth, height: newHeight });
      }
    };
    
    const handleWindowUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleWindowMove);
      window.addEventListener('mouseup', handleWindowUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleWindowMove);
      window.removeEventListener('mouseup', handleWindowUp);
    };
  }, [isDragging, dragStart, dragMode, cropStart]);

  // --- Helper Functions ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImageSrc(reader.result as string);
        // Reset crop will happen in onImageLoad
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const aspect = 16 / 9;
    
    // Default to max possible size centered
    let boxWidth = width;
    let boxHeight = width / aspect;
    
    if (boxHeight > height) {
      boxHeight = height;
      boxWidth = height * aspect;
    }
    
    // Scale down slightly (90%) for better initial visual
    boxWidth *= 0.9;
    boxHeight *= 0.9;

    setCrop({
      x: (width - boxWidth) / 2,
      y: (height - boxHeight) / 2,
      width: boxWidth,
      height: boxHeight
    });
  };

  const handleDeleteCustom = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    const newWallpapers = customWallpapers.filter(w => w !== url);
    setCustomWallpapers(newWallpapers);
    if (settings.backgroundImage === url) {
      onSave({ ...settings, backgroundImage: PRESET_BACKGROUNDS[0] });
    }
  };

  const handleDragStart = (e: React.MouseEvent, mode: DragMode) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    setDragMode(mode);
    setDragStart({ x: e.clientX, y: e.clientY });
    setCropStart({ ...crop });
  };

  const handleConfirmCrop = () => {
    if (imageRef.current && tempImageSrc) {
        const img = imageRef.current;
        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;

        const canvas = document.createElement('canvas');
        const targetWidth = 1920;
        const targetHeight = 1080;

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(
                img, 
                crop.x * scaleX, 
                crop.y * scaleY, 
                crop.width * scaleX, 
                crop.height * scaleY, 
                0, 
                0, 
                targetWidth, 
                targetHeight
            );
            
            const base64 = canvas.toDataURL('image/jpeg', 0.85);
            setCustomWallpapers(prev => [base64, ...prev]);
            onSave({ ...settings, backgroundImage: base64 });
            setTempImageSrc(null);
        }
    }
  };

  const handleCancelCrop = () => {
    setTempImageSrc(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 裁剪界面 - 全屏覆盖 */}
      {tempImageSrc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancelCrop} />
          
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col z-50 max-h-[90vh]">
            {/* Cropper UI remains the same as before */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
               <h3 className="text-xl font-semibold text-gray-800">Adjust Wallpaper</h3>
               <button onClick={handleCancelCrop}><X className="w-5 h-5 text-gray-500 hover:text-gray-700" /></button>
            </div>

            <div className="flex-1 overflow-hidden bg-gray-900 flex items-center justify-center p-8 select-none">
                <div className="relative shadow-2xl">
                    <img 
                        ref={imageRef}
                        src={tempImageSrc} 
                        alt="Crop Source"
                        onLoad={onImageLoad}
                        className="max-w-full max-h-[60vh] object-contain block pointer-events-none" 
                        draggable={false}
                    />
                    {crop.width > 0 && (
                        <div 
                            className="absolute cursor-move border-2 border-blue-500 z-10"
                            style={{
                                left: crop.x,
                                top: crop.y,
                                width: crop.width,
                                height: crop.height,
                                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)' 
                            }}
                            onMouseDown={(e) => handleDragStart(e, 'move')}
                        >
                            <div className="absolute inset-0 grid grid-cols-3 pointer-events-none">
                                <div className="border-r border-dashed border-white/40 h-full"></div>
                                <div className="border-r border-dashed border-white/40 h-full"></div>
                            </div>
                            <div className="absolute inset-0 grid grid-rows-3 pointer-events-none">
                                <div className="border-b border-dashed border-white/40 w-full"></div>
                                <div className="border-b border-dashed border-white/40 w-full"></div>
                            </div>

                            <div 
                                className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-blue-500 border border-white rounded-full cursor-nw-resize z-20 hover:scale-125 transition-transform"
                                onMouseDown={(e) => handleDragStart(e, 'nw')}
                            ></div>
                            <div 
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 border border-white rounded-full cursor-ne-resize z-20 hover:scale-125 transition-transform"
                                onMouseDown={(e) => handleDragStart(e, 'ne')}
                            ></div>
                            <div 
                                className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-blue-500 border border-white rounded-full cursor-sw-resize z-20 hover:scale-125 transition-transform"
                                onMouseDown={(e) => handleDragStart(e, 'sw')}
                            ></div>
                            <div 
                                className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-blue-500 border border-white rounded-full cursor-se-resize z-20 hover:scale-125 transition-transform"
                                onMouseDown={(e) => handleDragStart(e, 'se')}
                            ></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button onClick={handleCancelCrop} className="px-6 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors">Cancel</button>
                <button onClick={handleConfirmCrop} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center"><Check className="w-4 h-4 mr-2" /> Set Wallpaper</button>
            </div>
          </div>
        </div>
      )}

      {/* 设置侧边栏 - 从右侧滑出 */}
      <div 
        className={`fixed top-0 right-0 h-full bg-white/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: `${modalWidth}px` }}
      >
        {/* 左侧拖拽调整大小手柄 */}
        <div
          className="absolute left-0 top-0 w-2 h-full cursor-ew-resize group z-50"
          onMouseDown={handleResizeStart}
        >
          {/* 视觉指示条 */}
          <div className="absolute left-0 top-0 w-1 h-full bg-transparent group-hover:bg-blue-400/50 transition-colors" />
          {/* 中间拖拽指示器 */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-gray-300 group-hover:bg-blue-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-all" />
        </div>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-5 border-b border-gray-200/50">
            <h2 className="text-xl font-semibold text-gray-800">Settings</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={onResetDefaults}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-100 transition-colors"
              >
                Reset Defaults
              </button>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-200/50 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Presets */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preset Backgrounds</label>
                <div className="grid grid-cols-3 gap-3 mb-4">
                {PRESET_BACKGROUNDS.map((url, idx) => (
                    <button
                    key={idx}
                    onClick={() => onSave({ ...settings, backgroundImage: url })}
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all group ${settings.backgroundImage === url ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-transparent hover:border-gray-300'}`}
                    >
                    <img src={url} className="w-full h-full object-cover" alt="preset" />
                    </button>
                ))}
                </div>
            </div>

            {/* Custom Wallpapers */}
            <div>
                 <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">My Wallpapers</label>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs flex items-center text-blue-600 hover:text-blue-700 font-medium"
                    >
                        <Upload className="w-3 h-3 mr-1" />
                        Upload New
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                 </div>

                 {customWallpapers.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                        {customWallpapers.map((url, idx) => (
                            <div 
                                key={`custom-${idx}`} 
                                onClick={() => onSave({ ...settings, backgroundImage: url })}
                                className={`relative aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition-all group ${settings.backgroundImage === url ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-transparent hover:border-gray-300'}`}
                            >
                                <img src={url} className="w-full h-full object-cover" alt="custom" />
                                <button
                                    onClick={(e) => handleDeleteCustom(e, url)}
                                    className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                 ) : (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-gray-400 cursor-pointer transition-colors"
                    >
                        <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-sm">Click to upload image</span>
                    </div>
                 )}
            </div>

            <hr className="border-gray-200" />

            {/* Appearance Controls */}
            <style>{`
              /* 滑块样式优化 */
              input[type='range'] {
                -webkit-appearance: none;
                appearance: none;
                background: transparent;
                cursor: pointer;
                height: 20px;
              }
              
              /* 轨道样式 */
              input[type='range']::-webkit-slider-runnable-track {
                height: 8px;
                background: linear-gradient(to right, #3b82f6 0%, #8b5cf6 100%);
                border-radius: 9999px;
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
              }
              
              input[type='range']::-moz-range-track {
                height: 8px;
                background: linear-gradient(to right, #3b82f6 0%, #8b5cf6 100%);
                border-radius: 9999px;
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
              }
              
              /* 滑块按钮样式 */
              input[type='range']::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                height: 20px;
                width: 20px;
                border-radius: 50%;
                background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.1);
                cursor: pointer;
                transition: all 0.2s ease;
                margin-top: -6px;
              }
              
              input[type='range']::-moz-range-thumb {
                height: 20px;
                width: 20px;
                border-radius: 50%;
                background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.1);
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
              }
              
              /* 悬停效果 */
              input[type='range']::-webkit-slider-thumb:hover {
                transform: scale(1.2);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6), 0 0 0 2px rgba(59, 130, 246, 0.2);
              }
              
              input[type='range']::-moz-range-thumb:hover {
                transform: scale(1.2);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6), 0 0 0 2px rgba(59, 130, 246, 0.2);
              }
              
              /* 激活效果 */
              input[type='range']:active::-webkit-slider-thumb {
                transform: scale(1.1);
                box-shadow: 0 2px 6px rgba(59, 130, 246, 0.5), 0 0 0 3px rgba(59, 130, 246, 0.3);
              }
              
              input[type='range']:active::-moz-range-thumb {
                transform: scale(1.1);
                box-shadow: 0 2px 6px rgba(59, 130, 246, 0.5), 0 0 0 3px rgba(59, 130, 246, 0.3);
              }
            `}</style>
            <div className="space-y-5">
                <div>
                    <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        <label>Global Scale</label>
                        <span className="text-blue-600 font-semibold">{settings.globalScale ?? 100}%</span>
                    </div>
                    <input
                    type="range"
                    min="50"
                    max="150"
                    value={settings.globalScale ?? 100}
                    onChange={(e) => onSave({...settings, globalScale: parseInt(e.target.value)})}
                    className="w-full"
                    />
                </div>
                <div>
                    <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        <label>Overlay Opacity</label>
                        <span className="text-blue-600 font-semibold">{settings.opacityLevel}%</span>
                    </div>
                    <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.opacityLevel}
                    onChange={(e) => onSave({...settings, opacityLevel: parseInt(e.target.value)})}
                    className="w-full"
                    />
                </div>
                <div>
                    <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        <label>Blur Amount</label>
                        <span className="text-blue-600 font-semibold">{settings.blurLevel}px</span>
                    </div>
                    <input
                    type="range"
                    min="0"
                    max="20"
                    value={settings.blurLevel}
                    onChange={(e) => onSave({...settings, blurLevel: parseInt(e.target.value)})}
                    className="w-full"
                    />
                </div>
                 <div>
                    <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        <label>Max Search History</label>
                        <span className="text-blue-600 font-semibold">{settings.maxHistoryItems} items</span>
                    </div>
                    <input
                    type="range"
                    min="0"
                    max="10"
                    value={settings.maxHistoryItems ?? 5}
                    onChange={(e) => onSave({...settings, maxHistoryItems: parseInt(e.target.value)})}
                    className="w-full"
                    />
                </div>
                 <div>
                    <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        <label>Max Search Suggestions</label>
                        <span className="text-blue-600 font-semibold">{settings.maxSuggestions} items</span>
                    </div>
                    <input
                    type="range"
                    min="0"
                    max="10"
                    value={settings.maxSuggestions ?? 5}
                    onChange={(e) => onSave({...settings, maxSuggestions: parseInt(e.target.value)})}
                    className="w-full"
                    />
                </div>
            </div>

            <hr className="border-gray-200" />

            {/* Search Bar & Clock Controls */}
            <div className="space-y-5">
                <div>
                    <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        <label>Search Bar Opacity</label>
                        <span className="text-blue-600 font-semibold">{settings.searchBarOpacity ?? 40}%</span>
                    </div>
                    <input
                    type="range"
                min="0"
                max="100"
                    value={settings.searchBarOpacity ?? 40}
                    onChange={(e) => onSave({...settings, searchBarOpacity: parseInt(e.target.value)})}
                    className="w-full"
                    />
                </div>
                <div>
                    <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        <label>Search Bar Blur</label>
                        <span className="text-blue-600 font-semibold">{settings.searchBarBlur ?? 24}px</span>
                    </div>
                    <input
                    type="range"
                min="0"
                max="30"
                    value={settings.searchBarBlur ?? 24}
                    onChange={(e) => onSave({...settings, searchBarBlur: parseInt(e.target.value)})}
                    className="w-full"
                    />
                </div>
              <div>
                <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                  <label>Time Position</label>
                  <span className="text-blue-600 font-semibold">{settings.timeOffsetY ?? 0}px</span>
                </div>
                <input
                type="range"
                min="-100"
                max="200"
                value={settings.timeOffsetY ?? 0}
                onChange={(e) => onSave({...settings, timeOffsetY: parseInt(e.target.value)})}
                className="w-full"
                />
              </div>
                <div>
                    <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        <label>Time Font Size</label>
                        <span className="text-blue-600 font-semibold">{settings.timeFontSize ?? 96}px</span>
                    </div>
                    <input
                    type="range"
                    min="40"
                    max="160"
                    value={settings.timeFontSize ?? 96}
                    onChange={(e) => onSave({...settings, timeFontSize: parseInt(e.target.value)})}
                    className="w-full"
                    />
                </div>
                <div>
                    <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                      <label>Date Position</label>
                      <span className="text-blue-600 font-semibold">{settings.dateOffsetY ?? 0}px</span>
                    </div>
                    <input
                    type="range"
                    min="-100"
                    max="200"
                    value={settings.dateOffsetY ?? 0}
                    onChange={(e) => onSave({...settings, dateOffsetY: parseInt(e.target.value)})}
                    className="w-full"
                    />
                </div>
                  <div>
                    <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                      <label>Date Font Size</label>
                      <span className="text-blue-600 font-semibold">{settings.dateFontSize ?? 24}px</span>
                    </div>
                    <input
                    type="range"
                    min="12"
                    max="48"
                    value={settings.dateFontSize ?? 24}
                    onChange={(e) => onSave({...settings, dateFontSize: parseInt(e.target.value)})}
                    className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                      <label>Search Bar Position</label>
                      <span className="text-blue-600 font-semibold">{settings.searchBarOffsetY ?? 0}px</span>
                    </div>
                    <input
                    type="range"
                    min="-100"
                    max="200"
                    value={settings.searchBarOffsetY ?? 0}
                    onChange={(e) => onSave({...settings, searchBarOffsetY: parseInt(e.target.value)})}
                    className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                      <label>Shortcuts Position</label>
                      <span className="text-blue-600 font-semibold">{settings.shortcutsOffsetY ?? 0}px</span>
                    </div>
                    <input
                    type="range"
                    min="-100"
                    max="200"
                    value={settings.shortcutsOffsetY ?? 0}
                    onChange={(e) => onSave({...settings, shortcutsOffsetY: parseInt(e.target.value)})}
                    className="w-full"
                    />
                  </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsModal;