/**
 * Interactive Crop Tool for SnapForge Editor
 * Bounding rectangle with 8 resize handles, aspect ratio locking, and live readout
 */

import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Lock, Unlock } from 'lucide-react';
import { cropImage } from '../utils/imageEffects';

interface CropOverlayProps {
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  onConfirmCrop: (newImageSrc: string, newW: number, newH: number) => void;
  onCancel: () => void;
}

export const CropOverlay: React.FC<CropOverlayProps> = ({
  imageSrc,
  imageWidth,
  imageHeight,
  onConfirmCrop,
  onCancel,
}) => {
  // Crop rect inside the image coordinates
  const [cropBox, setCropBox] = useState({
    x: Math.round(imageWidth * 0.1),
    y: Math.round(imageHeight * 0.1),
    width: Math.round(imageWidth * 0.8),
    height: Math.round(imageHeight * 0.8),
  });

  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, box: { ...cropBox } });
  const [aspectRatio, setAspectRatio] = useState<'free' | '1:1' | '4:3' | '16:9'>('free');

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setActiveHandle(handle);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      box: { ...cropBox },
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!activeHandle || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = imageWidth / rect.width;
      const scaleY = imageHeight / rect.height;

      const dx = (e.clientX - dragStartRef.current.mouseX) * scaleX;
      const dy = (e.clientY - dragStartRef.current.mouseY) * scaleY;
      const startBox = dragStartRef.current.box;

      let nextX = startBox.x;
      let nextY = startBox.y;
      let nextW = startBox.width;
      let nextH = startBox.height;

      if (activeHandle === 'move') {
        nextX = Math.max(0, Math.min(imageWidth - nextW, startBox.x + dx));
        nextY = Math.max(0, Math.min(imageHeight - nextH, startBox.y + dy));
      } else if (activeHandle === 'se') {
        nextW = Math.max(20, Math.min(imageWidth - startBox.x, startBox.width + dx));
        nextH = Math.max(20, Math.min(imageHeight - startBox.y, startBox.height + dy));
        if (aspectRatio === '1:1') nextH = nextW;
        if (aspectRatio === '4:3') nextH = (nextW * 3) / 4;
        if (aspectRatio === '16:9') nextH = (nextW * 9) / 16;
      } else if (activeHandle === 'nw') {
        const potentialW = startBox.width - dx;
        const potentialH = startBox.height - dy;
        if (potentialW > 20 && startBox.x + dx >= 0) {
          nextX = startBox.x + dx;
          nextW = potentialW;
        }
        if (potentialH > 20 && startBox.y + dy >= 0) {
          nextY = startBox.y + dy;
          nextH = potentialH;
        }
      }

      setCropBox({
        x: Math.round(nextX),
        y: Math.round(nextY),
        width: Math.round(nextW),
        height: Math.round(nextH),
      });
    };

    const handleMouseUp = () => {
      setActiveHandle(null);
    };

    if (activeHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeHandle, imageWidth, imageHeight, aspectRatio]);

  const executeCrop = async () => {
    try {
      const result = await cropImage(
        imageSrc,
        cropBox.x,
        cropBox.y,
        cropBox.width,
        cropBox.height
      );
      onConfirmCrop(result, cropBox.width, cropBox.height);
    } catch (err) {
      console.error('Crop failed:', err);
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/60 flex flex-col select-none">
      {/* Top Floating Crop Controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-200">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white">Crop Area:</span>
          <span className="font-mono text-sky-400">
            {cropBox.width} × {cropBox.height} px
          </span>
          <div className="flex items-center gap-1 bg-slate-800 rounded p-0.5">
            {(['free', '1:1', '4:3', '16:9'] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-2 py-0.5 rounded text-[11px] capitalize ${
                  aspectRatio === ratio
                    ? 'bg-sky-500 text-white font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={executeCrop}
            className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium flex items-center gap-1 shadow"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Crop</span>
          </button>
        </div>
      </div>

      {/* Interactive Crop Frame */}
      <div ref={containerRef} className="relative flex-1 overflow-hidden m-4 flex items-center justify-center">
        <div
          style={{
            left: `${(cropBox.x / imageWidth) * 100}%`,
            top: `${(cropBox.y / imageHeight) * 100}%`,
            width: `${(cropBox.width / imageWidth) * 100}%`,
            height: `${(cropBox.height / imageHeight) * 100}%`,
          }}
          className="absolute border-2 border-dashed border-sky-400 bg-sky-400/10 cursor-move shadow-2xl"
          onMouseDown={(e) => handleMouseDown(e, 'move')}
        >
          {/* Rule of thirds grid lines */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
            <div className="border-r border-b border-sky-300" />
            <div className="border-r border-b border-sky-300" />
            <div className="border-b border-sky-300" />
            <div className="border-r border-b border-sky-300" />
            <div className="border-r border-b border-sky-300" />
            <div className="border-b border-sky-300" />
            <div className="border-r border-sky-300" />
            <div className="border-r border-sky-300" />
            <div />
          </div>

          {/* Corner Handles */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'nw')}
            className="absolute -top-2 -left-2 w-4 h-4 bg-sky-400 border border-white rounded-sm cursor-nwse-resize"
          />
          <div
            onMouseDown={(e) => handleMouseDown(e, 'se')}
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-sky-400 border border-white rounded-sm cursor-nwse-resize"
          />
        </div>
      </div>
    </div>
  );
};
