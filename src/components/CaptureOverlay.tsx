/**
 * Capture Overlay Engine (SnapForge)
 * Implements RegionEngine (loupe + crosshairs + size readout),
 * FixedRegionEngine, FreehandEngine, ObjectEngine (UI hover bounds),
 * and ScrollingEngine (multi-frame stitcher)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CaptureMode, CaptureResult, Point } from '../types';
import { cropImage, loadImage } from '../utils/imageEffects';
import { ScreenObjectZone } from '../utils/sampleImages';
import { X, Play, Camera, Check } from 'lucide-react';

interface CaptureOverlayProps {
  mode: CaptureMode;
  desktopDataUrl: string;
  detectedObjects: ScreenObjectZone[];
  onComplete: (result: CaptureResult) => void;
  onCancel: () => void;
  fixedSize?: { width: number; height: number };
}

export const CaptureOverlay: React.FC<CaptureOverlayProps> = ({
  mode,
  desktopDataUrl,
  detectedObjects,
  onComplete,
  onCancel,
  fixedSize = { width: 640, height: 480 },
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);

  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startPos, setStartPos] = useState<Point | null>(null);
  const [freehandPoints, setFreehandPoints] = useState<Point[]>([]);
  const [hoveredObject, setHoveredObject] = useState<ScreenObjectZone | null>(null);
  const [colorUnderCursor, setColorUnderCursor] = useState({ hex: '#000000', r: 0, g: 0, b: 0 });

  // Scrolling stitch progress
  const [isScrollingCapture, setIsScrollingCapture] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Esc key cancels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  // Handle Fullscreen immediate capture
  useEffect(() => {
    if (mode === 'Fullscreen' || mode === 'ActiveWindow') {
      const finish = async () => {
        const img = await loadImage(desktopDataUrl);
        if (mode === 'ActiveWindow') {
          // Snap the active window object if present, else center 80%
          const target = detectedObjects[0] || {
            bounds: { x: img.width * 0.1, y: img.height * 0.1, width: img.width * 0.8, height: img.height * 0.8 },
            name: 'Active Application Window',
          };
          const cropped = await cropImage(
            desktopDataUrl,
            target.bounds.x,
            target.bounds.y,
            target.bounds.width,
            target.bounds.height
          );
          onComplete({
            id: `cap-${Date.now()}`,
            imageDataUrl: cropped,
            width: target.bounds.width,
            height: target.bounds.height,
            windowTitle: target.name,
            timestamp: new Date().toISOString(),
            dpiX: 96,
            dpiY: 96,
            mode,
          });
        } else {
          onComplete({
            id: `cap-${Date.now()}`,
            imageDataUrl: desktopDataUrl,
            width: img.width,
            height: img.height,
            windowTitle: 'Full Desktop',
            timestamp: new Date().toISOString(),
            dpiX: 96,
            dpiY: 96,
            mode: 'Fullscreen',
          });
        }
      };
      finish();
    }
  }, [mode, desktopDataUrl, detectedObjects, onComplete]);

  // Update loupe canvas on mouse move
  const updateLoupe = useCallback(
    (canvas: HTMLCanvasElement, x: number, y: number) => {
      const loupeCanvas = loupeCanvasRef.current;
      if (!loupeCanvas) return;
      const lctx = loupeCanvas.getContext('2d');
      if (!lctx) return;

      const loupeSize = 130;
      loupeCanvas.width = loupeSize;
      loupeCanvas.height = loupeSize;

      // Extract pixel under cursor
      const ctx = canvas.getContext('2d');
      if (ctx) {
        try {
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2])
            .toString(16)
            .slice(1)
            .toUpperCase()}`;
          setColorUnderCursor({ hex, r: pixel[0], g: pixel[1], b: pixel[2] });
        } catch {
          // ignore
        }
      }

      // Draw 5x magnified region
      lctx.imageSmoothingEnabled = false;
      const sampleRadius = 13;
      lctx.drawImage(
        canvas,
        x - sampleRadius,
        y - sampleRadius,
        sampleRadius * 2,
        sampleRadius * 2,
        0,
        0,
        loupeSize,
        loupeSize
      );

      // Loupe crosshair lines
      lctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
      lctx.lineWidth = 1;
      const mid = loupeSize / 2;
      lctx.beginPath();
      lctx.moveTo(mid, 0);
      lctx.lineTo(mid, loupeSize);
      lctx.moveTo(0, mid);
      lctx.lineTo(loupeSize, mid);
      lctx.stroke();

      // Center pixel box
      const pixelSize = loupeSize / (sampleRadius * 2);
      lctx.strokeStyle = '#ffff00';
      lctx.strokeRect(mid - pixelSize / 2, mid - pixelSize / 2, pixelSize, pixelSize);
    },
    []
  );

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Scale coordinates based on desktop image natural dimensions vs client viewport
    const scaleX = 1440 / rect.width;
    const scaleY = 900 / rect.height;

    const currentX = Math.round((e.clientX - rect.left) * scaleX);
    const currentY = Math.round((e.clientY - rect.top) * scaleY);
    setMousePos({ x: currentX, y: currentY });

    if (canvasRef.current) {
      updateLoupe(canvasRef.current, currentX, currentY);
    }

    // Object/Window detection mode
    if (mode === 'Object' || mode === 'Window') {
      const match = detectedObjects.find(
        (obj) =>
          currentX >= obj.bounds.x &&
          currentX <= obj.bounds.x + obj.bounds.width &&
          currentY >= obj.bounds.y &&
          currentY <= obj.bounds.y + obj.bounds.height
      );
      setHoveredObject(match || null);
    }

    // Freehand recording points
    if (isMouseDown && mode === 'Freehand') {
      setFreehandPoints((prev) => [...prev, { x: currentX, y: currentY }]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // only left click
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = 1440 / rect.width;
    const scaleY = 900 / rect.height;
    const currentX = Math.round((e.clientX - rect.left) * scaleX);
    const currentY = Math.round((e.clientY - rect.top) * scaleY);

    if (mode === 'Object' && hoveredObject) {
      // Snap object directly
      handleCaptureObject(hoveredObject);
      return;
    }

    if (mode === 'FixedRegion') {
      handleCaptureFixedRegion(currentX, currentY);
      return;
    }

    setIsMouseDown(true);
    setStartPos({ x: currentX, y: currentY });
    if (mode === 'Freehand') {
      setFreehandPoints([{ x: currentX, y: currentY }]);
    }
  };

  const handleMouseUp = async () => {
    if (!isMouseDown) return;
    setIsMouseDown(false);

    if (mode === 'Rectangle' && startPos) {
      const x = Math.min(startPos.x, mousePos.x);
      const y = Math.min(startPos.y, mousePos.y);
      const w = Math.abs(mousePos.x - startPos.x);
      const h = Math.abs(mousePos.y - startPos.y);

      if (w > 5 && h > 5) {
        const cropped = await cropImage(desktopDataUrl, x, y, w, h);
        onComplete({
          id: `cap-${Date.now()}`,
          imageDataUrl: cropped,
          width: w,
          height: h,
          windowTitle: `Rectangular Region (${w} × ${h})`,
          timestamp: new Date().toISOString(),
          dpiX: 96,
          dpiY: 96,
          mode: 'Rectangle',
        });
      }
    } else if (mode === 'Freehand' && freehandPoints.length > 5) {
      // Freehand polygon mask capture
      const minX = Math.min(...freehandPoints.map((p) => p.x));
      const maxX = Math.max(...freehandPoints.map((p) => p.x));
      const minY = Math.min(...freehandPoints.map((p) => p.y));
      const maxY = Math.max(...freehandPoints.map((p) => p.y));
      const w = Math.max(10, maxX - minX);
      const h = Math.max(10, maxY - minY);

      const img = await loadImage(desktopDataUrl);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Clip path
      ctx.beginPath();
      ctx.moveTo(freehandPoints[0].x - minX, freehandPoints[0].y - minY);
      for (let i = 1; i < freehandPoints.length; i++) {
        ctx.lineTo(freehandPoints[i].x - minX, freehandPoints[i].y - minY);
      }
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(img, minX, minY, w, h, 0, 0, w, h);

      onComplete({
        id: `cap-${Date.now()}`,
        imageDataUrl: canvas.toDataURL('image/png'),
        width: w,
        height: h,
        windowTitle: `Freehand Region (${w} × ${h})`,
        timestamp: new Date().toISOString(),
        dpiX: 96,
        dpiY: 96,
        mode: 'Freehand',
      });
    }
  };

  const handleCaptureObject = async (obj: ScreenObjectZone) => {
    const cropped = await cropImage(desktopDataUrl, obj.bounds.x, obj.bounds.y, obj.bounds.width, obj.bounds.height);
    onComplete({
      id: `cap-${Date.now()}`,
      imageDataUrl: cropped,
      width: obj.bounds.width,
      height: obj.bounds.height,
      windowTitle: obj.name,
      timestamp: new Date().toISOString(),
      dpiX: 96,
      dpiY: 96,
      mode: 'Object',
    });
  };

  const handleCaptureFixedRegion = async (centerX: number, centerY: number) => {
    const x = Math.max(0, centerX - fixedSize.width / 2);
    const y = Math.max(0, centerY - fixedSize.height / 2);
    const cropped = await cropImage(desktopDataUrl, x, y, fixedSize.width, fixedSize.height);
    onComplete({
      id: `cap-${Date.now()}`,
      imageDataUrl: cropped,
      width: fixedSize.width,
      height: fixedSize.height,
      windowTitle: `Fixed Region (${fixedSize.width} × ${fixedSize.height})`,
      timestamp: new Date().toISOString(),
      dpiX: 96,
      dpiY: 96,
      mode: 'FixedRegion',
    });
  };

  // Scrolling window capture execution
  const executeScrollingCapture = async () => {
    setIsScrollingCapture(true);
    setScrollProgress(10);

    // Multi-stage auto-stitch simulation
    for (let p = 20; p <= 90; p += 25) {
      await new Promise((r) => setTimeout(r, 400));
      setScrollProgress(p);
    }

    // Stitch complete sample document
    const img = await loadImage(desktopDataUrl);
    // Expand height simulating multi-page stitch
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 2400;
    const ctx = canvas.getContext('2d')!;

    // Background & content rows
    ctx.drawImage(img, 0, 0, 1200, 900);
    ctx.drawImage(img, 0, 100, 1200, 800, 0, 800, 1200, 800);
    ctx.drawImage(img, 0, 200, 1200, 800, 0, 1600, 1200, 800);

    setScrollProgress(100);
    await new Promise((r) => setTimeout(r, 300));

    onComplete({
      id: `cap-${Date.now()}`,
      imageDataUrl: canvas.toDataURL('image/png'),
      width: 1200,
      height: 2400,
      windowTitle: 'Scrolling Window (Stitched Panorama 1200 × 2400)',
      timestamp: new Date().toISOString(),
      dpiX: 96,
      dpiY: 96,
      mode: 'Scrolling',
    });
  };

  // Render base image to hidden canvas for pixel sampling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
    };
    img.src = desktopDataUrl;
  }, [desktopDataUrl]);

  // Rectangle selection bounds
  const rectSelection =
    startPos && isMouseDown && mode === 'Rectangle'
      ? {
          x: Math.min(startPos.x, mousePos.x),
          y: Math.min(startPos.y, mousePos.y),
          width: Math.abs(mousePos.x - startPos.x),
          height: Math.abs(mousePos.y - startPos.y),
        }
      : null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className="fixed inset-0 z-50 overflow-hidden cursor-crosshair select-none bg-black/40 backdrop-blur-[0.5px]"
    >
      {/* Underlying frozen desktop snapshot */}
      <img
        src={desktopDataUrl}
        alt="Frozen screen"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />

      {/* Hidden canvas for pixel extraction & magnifier */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Banner Guide */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 text-slate-100 border border-slate-700/80 px-4 py-2 rounded-lg shadow-2xl flex items-center gap-4 text-xs z-50">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-white">
            {mode === 'Rectangle' && 'Drag to select capture region'}
            {mode === 'Object' && 'Hover over any window/object and click'}
            {mode === 'FixedRegion' && `Click to capture fixed size (${fixedSize.width} × ${fixedSize.height})`}
            {mode === 'Freehand' && 'Drag freehand lasso path around object'}
            {mode === 'Scrolling' && 'Ready to capture scrolling page'}
          </span>
        </div>
        <div className="text-slate-400">Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200">Esc</kbd> to cancel</div>
        <button
          onClick={onCancel}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrolling capture trigger modal */}
      {mode === 'Scrolling' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl text-center max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-2">Scrolling Window Capture</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              SnapForge will automatically scroll down the window, capture consecutive frames,
              detect overlapping rows, and stitch them into a seamless high-resolution image.
            </p>

            {isScrollingCapture ? (
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Scrolling & stitching rows...</span>
                  <span className="font-mono text-sky-400">{scrollProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${scrollProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-end gap-3">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={executeScrollingCapture}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium flex items-center gap-2 shadow"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Auto-Scroll</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hover Highlight Box for Window / Object Mode */}
      {mode === 'Object' && hoveredObject && (
        <div
          style={{
            left: `${(hoveredObject.bounds.x / 1440) * 100}%`,
            top: `${(hoveredObject.bounds.y / 900) * 100}%`,
            width: `${(hoveredObject.bounds.width / 1440) * 100}%`,
            height: `${(hoveredObject.bounds.height / 900) * 100}%`,
          }}
          className="absolute border-2 border-red-500 bg-red-500/15 pointer-events-none transition-all duration-75"
        >
          <div className="absolute -top-7 left-0 bg-red-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded shadow">
            {hoveredObject.name} ({hoveredObject.bounds.width} × {hoveredObject.bounds.height})
          </div>
        </div>
      )}

      {/* Rectangle Selection Box */}
      {rectSelection && (
        <div
          style={{
            left: `${(rectSelection.x / 1440) * 100}%`,
            top: `${(rectSelection.y / 900) * 100}%`,
            width: `${(rectSelection.width / 1440) * 100}%`,
            height: `${(rectSelection.height / 900) * 100}%`,
          }}
          className="absolute border-2 border-sky-400 bg-sky-400/10 pointer-events-none"
        >
          {/* Dimension badge */}
          <div className="absolute -top-6 left-0 bg-sky-600 text-white text-[11px] font-mono px-2 py-0.5 rounded shadow">
            {rectSelection.width} × {rectSelection.height} px
          </div>
        </div>
      )}

      {/* Fixed Size Bounding Box following cursor */}
      {mode === 'FixedRegion' && (
        <div
          style={{
            left: `${((mousePos.x - fixedSize.width / 2) / 1440) * 100}%`,
            top: `${((mousePos.y - fixedSize.height / 2) / 900) * 100}%`,
            width: `${(fixedSize.width / 1440) * 100}%`,
            height: `${(fixedSize.height / 900) * 100}%`,
          }}
          className="absolute border-2 border-purple-400 bg-purple-400/15 pointer-events-none"
        >
          <div className="absolute -top-6 left-0 bg-purple-600 text-white text-[11px] font-mono px-2 py-0.5 rounded shadow">
            Fixed Size: {fixedSize.width} × {fixedSize.height} px
          </div>
        </div>
      )}

      {/* Freehand SVG path */}
      {mode === 'Freehand' && freehandPoints.length > 1 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <polyline
            points={freehandPoints
              .map((p) => `${(p.x / 1440) * window.innerWidth},${(p.y / 900) * window.innerHeight}`)
              .join(' ')}
            fill="rgba(245, 158, 11, 0.2)"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />
        </svg>
      )}

      {/* Floating Magnifier Loupe Crosshair (FastStone style) */}
      <div
        style={{
          left: `${Math.min(window.innerWidth - 170, (mousePos.x / 1440) * window.innerWidth + 20)}px`,
          top: `${Math.min(window.innerHeight - 220, (mousePos.y / 900) * window.innerHeight + 20)}px`,
        }}
        className="absolute pointer-events-none bg-slate-950/95 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-slate-200"
      >
        <div className="relative w-[130px] h-[130px] rounded-lg overflow-hidden border border-slate-700 bg-black">
          <canvas ref={loupeCanvasRef} className="w-full h-full" />
        </div>

        {/* Loupe Coordinates & Color readout */}
        <div className="mt-2 space-y-1 text-[10px] font-mono">
          <div className="flex items-center justify-between text-slate-400">
            <span>Pos (X, Y):</span>
            <span className="text-slate-100 font-bold">
              {mousePos.x}, {mousePos.y}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm border border-slate-600"
                style={{ backgroundColor: colorUnderCursor.hex }}
              />
              <span>Color:</span>
            </div>
            <span className="text-sky-300 font-bold">{colorUnderCursor.hex}</span>
          </div>
          <div className="text-slate-400 text-right">
            RGB: {colorUnderCursor.r}, {colorUnderCursor.g}, {colorUnderCursor.b}
          </div>
        </div>
      </div>
    </div>
  );
};
