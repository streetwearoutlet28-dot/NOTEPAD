import { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  isPinned: boolean;
  onClose: () => void;
  onPin: () => void;
  onDuplicate: () => void;
  onSaveAsTemplate: () => void;
  onExportPDF: () => void;
}

export default function ContextMenu({
  x,
  y,
  isPinned,
  onClose,
  onPin,
  onDuplicate,
  onSaveAsTemplate,
  onExportPDF
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3F3F3F] rounded-xl shadow-lg py-1.5 min-w-[150px] z-[999] select-none font-sans"
      style={{ top: `${y}px`, left: `${x}px` }}
    >
      <button
        onClick={() => { onPin(); onClose(); }}
        className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-250 hover:bg-gray-100 dark:hover:bg-[#1E1E1E] flex items-center gap-2 cursor-pointer transition-colors"
      >
        <span>📌</span>
        <span>{isPinned ? 'Unpin note' : 'Pin to top'}</span>
      </button>
      <button
        onClick={() => { onDuplicate(); onClose(); }}
        className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-250 hover:bg-gray-100 dark:hover:bg-[#1E1E1E] flex items-center gap-2 cursor-pointer transition-colors"
      >
        <span>👯</span>
        <span>Duplicate</span>
      </button>
      <button
        onClick={() => { onSaveAsTemplate(); onClose(); }}
        className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-250 hover:bg-gray-100 dark:hover:bg-[#1E1E1E] flex items-center gap-2 cursor-pointer transition-colors"
      >
        <span>💾</span>
        <span>Save as template</span>
      </button>
      <div className="border-t border-gray-200 dark:border-[#3F3F3F] my-1" />
      <button
        onClick={() => { onExportPDF(); onClose(); }}
        className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-250 hover:bg-gray-100 dark:hover:bg-[#1E1E1E] flex items-center gap-2 cursor-pointer transition-colors"
      >
        <span>📄</span>
        <span>Export as PDF</span>
      </button>
    </div>
  );
}
