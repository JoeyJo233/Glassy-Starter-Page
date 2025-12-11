import React, { useRef, useState } from 'react';
import { BookmarkItem } from '../types';
import { Plus, X, FolderOpen, Edit2, ExternalLink, Trash2 } from 'lucide-react';

interface BookmarkGridProps {
  items: BookmarkItem[];
  setItems: (items: BookmarkItem[]) => void;
  onOpenFolder: (folder: BookmarkItem) => void;
  onEditItem: (item: BookmarkItem) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: () => void;
  offsetY?: number;
  textColor?: string;
}

const BookmarkGrid: React.FC<BookmarkGridProps> = ({
  items,
  setItems,
  onOpenFolder,
  onEditItem,
  onDeleteItem,
  onAddItem,
  offsetY = 0,
  textColor = 'rgb(243, 244, 246)'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedItem, setDraggedItem] = useState<BookmarkItem | null>(null);
  const [dragTarget, setDragTarget] = useState<{ id: string, action: 'merge' | 'reorder-before' | 'reorder-after' } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: BookmarkItem } | null>(null);

  const handleDragStart = (e: React.DragEvent, item: BookmarkItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
        id: item.id,
        type: 'grid-item'
    }));
  };

  const handleDragOver = (e: React.DragEvent, item: BookmarkItem) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === item.id) return;

    // Calculate drop zone
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Define a "Merge Zone" in the center of the item (50% of width/height)
    const isCenter = 
        x > rect.width * 0.25 && 
        x < rect.width * 0.75 && 
        y > rect.height * 0.25 && 
        y < rect.height * 0.75;

    // Logic:
    // If target is folder -> Merge if center
    // If target is link -> Merge (create folder) if center
    // If edge -> Reorder (Insert before or after)
    
    const canMerge = !(draggedItem.type === 'folder' && item.type === 'folder');

    if (isCenter && canMerge) {
        setDragTarget({ id: item.id, action: 'merge' });
    } else {
        // Check if we are on the left or right side for reordering
        if (x > rect.width / 2) {
             setDragTarget({ id: item.id, action: 'reorder-after' });
        } else {
             setDragTarget({ id: item.id, action: 'reorder-before' });
        }
    }
  };

  const handleDragLeave = () => {
    setDragTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetItem: BookmarkItem) => {
    e.preventDefault();
    setDragTarget(null);

    if (!draggedItem || draggedItem.id === targetItem.id) return;

    const newItems = [...items];
    const draggedIdx = newItems.findIndex(i => i.id === draggedItem.id);
    
    if (draggedIdx === -1) return;

    // Recalculate zone here to be precise
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const isCenter = 
        x > rect.width * 0.25 && 
        x < rect.width * 0.75 && 
        y > rect.height * 0.25 && 
        y < rect.height * 0.75;
    
    const canMerge = !(draggedItem.type === 'folder' && targetItem.type === 'folder');
    const isMerge = isCenter && canMerge;

    if (isMerge) {
        // --- Merge Logic (Create/Add to Folder) ---
        // Remove dragged item from current position
        const [draggedObj] = newItems.splice(draggedIdx, 1);
        // Recalculate target index as splice might have shifted it
        const targetIdx = newItems.findIndex(i => i.id === targetItem.id);

        if (targetItem.type === 'folder') {
            // Add to existing folder
            newItems[targetIdx] = {
                ...targetItem,
                children: [...(targetItem.children || []), draggedObj]
            };
        } else {
            // Create new folder
            const newFolder: BookmarkItem = {
                id: `folder-${Date.now()}`,
                type: 'folder',
                title: 'New Folder',
                icon: '📁',
                children: [targetItem, draggedObj]
            };
            newItems[targetIdx] = newFolder;
        }
    } else {
        // --- Reorder Logic (Insert Before/After) ---
        const insertAfter = x > rect.width / 2;

        // Remove dragged item
        const [draggedObj] = newItems.splice(draggedIdx, 1);
        
        // Recalculate target index
        const targetIdx = newItems.findIndex(i => i.id === targetItem.id);
        
        // Insert at target index or index + 1
        if (insertAfter) {
            newItems.splice(targetIdx + 1, 0, draggedObj);
        } else {
            newItems.splice(targetIdx, 0, draggedObj);
        }
    }

    setItems(newItems);
    setDraggedItem(null);
  };

  const handleRightClick = (e: React.MouseEvent, item: BookmarkItem) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    const offsetX = rect ? e.clientX - rect.left : e.clientX;
    const offsetY = rect ? e.clientY - rect.top : e.clientY;
    setContextMenu({ x: offsetX, y: offsetY, item });
  };

  const closeContextMenu = () => setContextMenu(null);

  const isImageUrl = (url?: string) => {
    return url && (url.startsWith('http') || url.startsWith('data:image'));
  };

  return (
    <div 
      ref={containerRef}
      className="w-full max-w-4xl mx-auto px-4 pb-20 relative"
      onClick={closeContextMenu}
      style={{ transform: `translateY(${offsetY}px)` }}
    >
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6 justify-items-center">
        {items.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDragOver={(e) => handleDragOver(e, item)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, item)}
            onContextMenu={(e) => handleRightClick(e, item)}
            className={`
              group relative flex flex-col items-center justify-center p-2 rounded-xl
              w-24 h-28 cursor-pointer transition-all duration-200
              ${dragTarget?.id === item.id && dragTarget.action === 'merge' ? 'scale-110 bg-white/20 ring-2 ring-white/50' : 'hover:bg-white/10'}
            `}
            onClick={() => {
              if (item.type === 'folder') onOpenFolder(item);
              else if (item.url) window.location.href = item.url;
            }}
          >
            {/* Insertion Indicator */}
            {dragTarget?.id === item.id && dragTarget.action.startsWith('reorder') && (
                <div 
                    className={`absolute top-2 bottom-2 w-1 bg-white/60 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] z-20 pointer-events-none animate-pulse
                    ${dragTarget.action === 'reorder-before' ? 'left-[-6px]' : 'right-[-6px]'}
                    `}
                ></div>
            )}

            <div className="relative w-14 h-14 bg-white/80 rounded-2xl shadow-lg flex items-center justify-center overflow-hidden mb-2 transition-transform group-hover:-translate-y-1">
              {item.type === 'folder' ? (
                <div className="grid grid-cols-2 gap-0.5 w-8 h-8 opacity-80">
                  {item.children?.slice(0, 4).map((child, idx) => (
                     <div key={idx} className="bg-gray-400 rounded-sm w-full h-full overflow-hidden flex items-center justify-center">
                        {isImageUrl(child.icon) ? (
                          <img src={child.icon} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px]">{child.icon || ''}</span>
                        )}
                     </div>
                  ))}
                  {(!item.children || item.children.length === 0) && <FolderOpen className="w-full h-full text-gray-500" />}
                </div>
              ) : (
                isImageUrl(item.icon) ? (
                  <img src={item.icon} alt={item.title} className="w-10 h-10 object-contain" />
                ) : (
                  <span className="text-2xl">{item.icon || '🔗'}</span>
                )
              )}
            </div>
            <span className="text-sm font-medium drop-shadow-md text-center line-clamp-1 w-full px-1" style={{ color: textColor }}>
              {item.title}
            </span>
          </div>
        ))}

        {/* Add Button */}
        <button
          onClick={onAddItem}
          className="flex flex-col items-center justify-center w-24 h-28 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-dashed border-white/40 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <Plus className="w-6 h-6" style={{ color: textColor }} />
          </div>
          <span className="text-sm font-medium mt-2" style={{ color: textColor, opacity: 0.8 }}>Add</span>
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="absolute z-[100] w-48 bg-white/90 backdrop-blur-xl rounded-lg shadow-2xl border border-white/20 overflow-hidden text-gray-800 py-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => {
              if (contextMenu.item.type === 'folder') onOpenFolder(contextMenu.item);
              else if (contextMenu.item.url) window.open(contextMenu.item.url, '_blank');
              closeContextMenu();
            }}
            className="flex items-center w-full px-4 py-2 hover:bg-black/5 text-sm"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open
          </button>
          <button
            onClick={() => {
               onEditItem(contextMenu.item);
               closeContextMenu();
            }}
            className="flex items-center w-full px-4 py-2 hover:bg-black/5 text-sm"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </button>
          <div className="h-px bg-gray-200 my-1 mx-2"></div>
          <button
            onClick={() => {
              onDeleteItem(contextMenu.item.id);
              closeContextMenu();
            }}
            className="flex items-center w-full px-4 py-2 hover:bg-red-50 text-red-600 text-sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default BookmarkGrid;