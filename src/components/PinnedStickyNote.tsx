/**
 * FastStone "Pin to Screen" Sticky Note
 * Borderless topmost floating window showing the capture with opacity control,
 * dragging, and quick close
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Sliders, GripHorizontal, Maximize2 } from 'lucide-react';

interface PinnedStickyNoteProps {
  id: string;
  imageSrc: string;
  title: string;
  onClose: () => void;
}

export const PinnedStickyNote: React.FC<PinnedStickyNoteProps> = ({
  imageSrc,
  title,
  onClose,
}) => {
  const [position, setPosition] = useState({ x: 30, y: 180 });
  const [opacity, setOpacity] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ mouseX: 0, mouseY: 0, startX: 30, startY: 180 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.mouseX;
      const dy = e.clientY - dragRef.current.mouseY;
      setPosition({
        x: Math.max(0, dragRef.current.startX + dx),
        y: Math.max(0, dragRef.current.startY + dy),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        opacity,
      }}
      className="fixed z-50 shadow-2xl rounded-xl border border-slate-700 bg-slate-900/95 overflow-hidden w-80 text-slate-200 select-none backdrop-blur-sm"
    >
      {/* Top Header Bar */}
      <div
        onMouseDown={handleMouseDown}
        className="cursor-move flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 text-xs"
      >
        <div className="flex items-center gap-1.5 truncate text-slate-300">
          <GripHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <span className="truncate font-semibold text-[11px]">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Opacity slider */}
          <input
            type="range"
            min="0.3"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-14 accent-sky-500 h-1 cursor-pointer"
            title={`Opacity: ${Math.round(opacity * 100)}%`}
          />
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Pinned Image Body */}
      <div className="p-1.5 bg-black/40">
        <img src={imageSrc} alt={title} className="w-full h-auto rounded object-contain max-h-72" />
      </div>
    </div>
  );
};
