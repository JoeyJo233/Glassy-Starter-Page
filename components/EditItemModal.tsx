import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Trash2, Check, Image as ImageIcon } from 'lucide-react';
import { BookmarkItem } from '../types';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: BookmarkItem | null;
  onSave: (item: BookmarkItem) => void;
  parentId?: string;
}

interface CropState {
  x: number;
  y: number;
  width: number;
  height: number;
}

type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se';

const EditItemModal: React.FC<EditItemModalProps> = ({ isOpen, onClose, item, onSave }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [storedIcon, setStoredIcon] = useState('');

  // Cropping State
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropState>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<DragMode>('move');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState<CropState>({ x: 0, y: 0, width: 0, height: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (item) {
        setTitle(item.title);
        setUrl(item.url || '');
        setStoredIcon(item.icon || '');
      } else {
        setTitle('');
        setUrl('');
        setStoredIcon('');
      }
      resetCropState();
    }
  }, [item, isOpen]);

  const resetCropState = () => {
    setTempImageSrc(null);
    setCrop({ x: 0, y: 0, width: 0, height: 0 });
    setIsDragging(false);
  };

  // Drag Logic Effect
  useEffect(() => {
    const handleWindowMove = (e: MouseEvent) => {
      if (!isDragging || !imageRef.current) return;
      e.preventDefault();

      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      const imgRect = imageRef.current.getBoundingClientRect();
      const maxImgWidth = imgRect.width;
      const maxImgHeight = imgRect.height;

      if (dragMode === 'move') {
          let newX = cropStart.x + dx;
          let newY = cropStart.y + dy;

          if (newX < 0) newX = 0;
          if (newX + cropStart.width > maxImgWidth) newX = maxImgWidth - cropStart.width;
          if (newY < 0) newY = 0;
          if (newY + cropStart.height > maxImgHeight) newY = maxImgHeight - cropStart.height;

          setCrop(prev => ({ ...prev, x: newX, y: newY }));

      } else {
          // RESIZING LOGIC (1:1 aspect ratio for icons)
          let anchorX = 0;
          let anchorY = 0;
          let newSize = 0;

          if (dragMode === 'se') {
              anchorX = cropStart.x;
              anchorY = cropStart.y;
              newSize = cropStart.width + Math.max(dx, dy);
          } else if (dragMode === 'sw') {
              anchorX = cropStart.x + cropStart.width;
              anchorY = cropStart.y;
              newSize = cropStart.width - dx;
          } else if (dragMode === 'ne') {
              anchorX = cropStart.x;
              anchorY = cropStart.y + cropStart.height;
              newSize = cropStart.width + dx;
          } else if (dragMode === 'nw') {
              anchorX = cropStart.x + cropStart.width;
              anchorY = cropStart.y + cropStart.height;
              newSize = cropStart.width - dx;
          }

          if (newSize < 50) newSize = 50;

          let maxAllowedSize = Infinity;
          if (dragMode === 'se') {
              maxAllowedSize = Math.min(maxImgWidth - anchorX, maxImgHeight - anchorY);
          } else if (dragMode === 'sw') {
              maxAllowedSize = Math.min(anchorX, maxImgHeight - anchorY);
          } else if (dragMode === 'ne') {
              maxAllowedSize = Math.min(maxImgWidth - anchorX, anchorY);
          } else if (dragMode === 'nw') {
              maxAllowedSize = Math.min(anchorX, anchorY);
          }

          if (newSize > maxAllowedSize) newSize = maxAllowedSize;

          let newX = 0;
          let newY = 0;

          if (dragMode === 'se') {
              newX = anchorX;
              newY = anchorY;
          } else if (dragMode === 'sw') {
              newX = anchorX - newSize;
              newY = anchorY;
          } else if (dragMode === 'ne') {
              newX = anchorX;
              newY = anchorY - newSize;
          } else if (dragMode === 'nw') {
              newX = anchorX - newSize;
              newY = anchorY - newSize;
          }

          setCrop({ x: newX, y: newY, width: newSize, height: newSize });
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setTempImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const size = Math.min(width, height) * 0.8;
    setCrop({
      x: (width - size) / 2,
      y: (height - size) / 2,
      width: size,
      height: size
    });
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
        const size = 128;

        canvas.width = size;
        canvas.height = size;
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
                size, 
                size
            );
            
            const base64 = canvas.toDataURL('image/png');
            setStoredIcon(base64);
            resetCropState();
        }
    }
  };

  const handleClearIcon = () => {
    setStoredIcon('');
    resetCropState();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Use stored custom icon OR auto-generated one
    const finalIcon = storedIcon || `https://www.google.com/s2/favicons?domain=${url}&sz=128`;
    
    const newItem: BookmarkItem = {
      id: item ? item.id : Date.now().toString(),
      type: 'link', 
      title,
      url,
      icon: finalIcon,
    };
    onSave(newItem);
    onClose();
  };

  if (!isOpen) return null;

  // Determine what to show in preview
  const autoIconUrl = url ? `https://www.google.com/s2/favicons?domain=${url}&sz=128` : '';
  const displayIcon = storedIcon || autoIconUrl;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden animate-slide-up p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">{item ? 'Edit Shortcut' : 'Add Shortcut'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Inputs */}
          <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. GitHub"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                required
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="https://example.com"
                />
            </div>
          </div>

          {/* Icon Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
            
            {/* Cropper UI */}
            {tempImageSrc ? (
                <div className="flex flex-col items-center space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="relative bg-gray-900 flex items-center justify-center p-4 rounded-xl max-h-[60vh] overflow-hidden">
                        <div className="relative shadow-2xl">
                            <img 
                                ref={imageRef}
                                src={tempImageSrc} 
                                alt="Crop Source"
                                onLoad={onImageLoad}
                                className="max-w-full max-h-[50vh] object-contain block pointer-events-none" 
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
                                    {/* Grid lines */}
                                    <div className="absolute inset-0 grid grid-cols-3 pointer-events-none">
                                        <div className="border-r border-dashed border-white/40 h-full"></div>
                                        <div className="border-r border-dashed border-white/40 h-full"></div>
                                    </div>
                                    <div className="absolute inset-0 grid grid-rows-3 pointer-events-none">
                                        <div className="border-b border-dashed border-white/40 w-full"></div>
                                        <div className="border-b border-dashed border-white/40 w-full"></div>
                                    </div>

                                    {/* Corner handles */}
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

                    <div className="flex w-full space-x-2">
                        <button 
                            type="button"
                            onClick={handleConfirmCrop}
                            className="flex-1 flex items-center justify-center py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <Check className="w-4 h-4 mr-1.5" />
                            Set Icon
                        </button>
                         <button 
                            type="button"
                            onClick={resetCropState}
                            className="flex-1 flex items-center justify-center py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            <X className="w-4 h-4 mr-1.5" />
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                /* Standard Preview & Actions */
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                        {displayIcon ? (
                             <img src={displayIcon} alt="Preview" className="w-10 h-10 object-contain" />
                        ) : (
                             <ImageIcon className="w-8 h-8 text-gray-300" />
                        )}
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                        <div className="flex space-x-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload
                            </button>
                            {/* Hidden Input */}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleFileChange} 
                            />

                            <button
                                type="button"
                                onClick={handleClearIcon}
                                title="Revert to auto-detection"
                                className="flex items-center px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Clear
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">
                            {storedIcon ? 'Custom icon uploaded.' : 'Using auto-detected icon.'}
                        </p>
                    </div>
                </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!!tempImageSrc} // Disable save while cropping
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors"
            >
              Save Shortcut
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemModal;