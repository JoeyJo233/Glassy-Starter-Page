import React, { useState } from 'react';
import { BookmarkItem } from '../types';
import { X, Plus, Edit2, ExternalLink, Trash2 } from 'lucide-react';

interface FolderViewProps {
  folder: BookmarkItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdateFolder: (updatedFolder: BookmarkItem) => void;
  onEditItem: (item: BookmarkItem) => void;
  onRemoveFromFolder: (item: BookmarkItem) => void;
}

const FolderView: React.FC<FolderViewProps> = ({ 
    folder, 
    isOpen, 
    onClose, 
    onUpdateFolder, 
    onEditItem,
    onRemoveFromFolder 
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: BookmarkItem } | null>(null);

  if (!isOpen) return null;

  const handleRemoveFromFolder = (itemId: string) => {
    const updatedChildren = folder.children?.filter(c => c.id !== itemId) || [];
    onUpdateFolder({ ...folder, children: updatedChildren });
  };

  const handleEditFolderTitle = () => {
    const newTitle = prompt("Rename Folder", folder.title);
    if (newTitle) onUpdateFolder({ ...folder, title: newTitle });
  };

  // Drag handlers for items inside folder
  const handleDragStart = (e: React.DragEvent, item: BookmarkItem) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
        id: item.id,
        fromFolderId: folder.id,
        type: 'folder-item'
    }));
  };

  // Handle dropping ON the backdrop (move out of folder)
  const handleBackdropDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const dataString = e.dataTransfer.getData('application/json');
      if (!dataString) return;

      try {
          const data = JSON.parse(dataString);
          if (data.type === 'folder-item' && data.fromFolderId === folder.id) {
             const item = folder.children?.find(c => c.id === data.id);
             if (item) {
                 onRemoveFromFolder(item);
             }
          }
      } catch (err) {
          console.error("Drop error", err);
      }
  };

  const handleDragOverBackdrop = (e: React.DragEvent) => {
      e.preventDefault(); // Allow drop
      // We could add a visual cue here to show "Drop to remove"
  };
  
  const isImageUrl = (url?: string) => {
    return url && (url.startsWith('http') || url.startsWith('data:image'));
  };

  return (
    <div 
        className="fixed inset-0 z-[90] flex items-start justify-center pt-80"
        onDrop={handleBackdropDrop}
        onDragOver={handleDragOverBackdrop}
    >
       {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-all duration-300" onClick={onClose} />

      {/* Content */}
      <div className="relative w-full max-w-2xl bg-white/20 backdrop-blur-2xl border border-white/30 rounded-3xl p-8 shadow-2xl animate-slide-up flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-8">
            <h2 
                className="text-3xl font-bold text-white cursor-pointer hover:underline decoration-white/50 underline-offset-4"
                onClick={handleEditFolderTitle}
            >
                {folder.title}
            </h2>
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-5 gap-6 w-full">
            {folder.children?.map(item => (
                <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    className="group flex flex-col items-center cursor-pointer"
                    onClick={() => item.url && window.open(item.url, '_self')}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContextMenu({x: e.clientX, y: e.clientY, item});
                    }}
                >
                     <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center overflow-hidden mb-2 transition-transform group-hover:scale-105 active:scale-95">
                        {isImageUrl(item.icon) ? (
                            <img src={item.icon} alt={item.title} className="w-10 h-10 object-contain" />
                        ) : (
                            <span className="text-2xl">{item.icon || '🔗'}</span>
                        )}
                    </div>
                    <span className="text-sm text-white text-center font-medium line-clamp-1 w-full">{item.title}</span>
                </div>
            ))}
        </div>
        
        {folder.children?.length === 0 && (
             <p className="text-white/60 italic">Folder is empty</p>
        )}

        {/* Small context menu for inside folder */}
        {contextMenu && (
        <div
          className="fixed z-[110] w-48 bg-white rounded-lg shadow-xl text-gray-800 py-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{contextMenu.item.title}</div>
          <button
            onClick={() => {
              if (contextMenu.item.url) window.open(contextMenu.item.url, '_blank');
              setContextMenu(null);
            }}
            className="flex items-center w-full px-4 py-2 hover:bg-gray-100 text-sm"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open New Tab
          </button>
          <button
            onClick={() => {
                handleRemoveFromFolder(contextMenu.item.id);
                setContextMenu(null);
            }}
            className="flex items-center w-full px-4 py-2 hover:bg-red-50 text-red-600 text-sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove
          </button>
           {/* Backdrop to close menu */}
           <div className="fixed inset-0 z-[-1]" onClick={() => setContextMenu(null)}></div>
        </div>
      )}

      </div>
    </div>
  );
};

export default FolderView;