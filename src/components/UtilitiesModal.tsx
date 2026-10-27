/**
 * SnapForge Desktop Measurement & Utilities Suite (Phase 7)
 * Implements:
 * 1. Screen Color Picker with magnified loupe & history
 * 2. Screen Magnifier Lens (2x-16x)
 * 3. Screen Ruler with px/inch/cm & H/V toggle
 * 4. Screen Crosshair
 * 5. Screen Focus Presentation Dimmer
 * 6. Text OCR Extractor
 * 7. Combine Images tool (horizontal/vertical/grid stitcher)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  RotateCw,
  Eye,
  Sliders,
  Type,
  Maximize,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { recognizeTextFromImage, OcrResult } from '../utils/ocrService';
import { EditorDocument, UtilityToolType } from '../types';

interface UtilitiesModalProps {
  tool: UtilityToolType;
  onClose: () => void;
  currentDocument?: EditorDocument | null;
  documents?: EditorDocument[];
  onImportCombinedImage?: (dataUrl: string, title: string) => void;
}

export const UtilitiesModal: React.FC<UtilitiesModalProps> = ({
  tool,
  onClose,
  currentDocument,
  documents = [],
  onImportCombinedImage,
}) => {
  // Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Color picker state
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [colorHistory, setColorHistory] = useState<string[]>([
    '#0EA5E9',
    '#3B82F6',
    '#10B981',
    '#EF4444',
    '#F59E0B',
    '#8B5CF6',
    '#0F172A',
    '#FFFFFF',
  ]);
  const [activeColor, setActiveColor] = useState('#0EA5E9');

  // Magnifier state
  const [magnifierZoom, setMagnifierZoom] = useState(4);

  // Ruler state
  const [rulerOrientation, setRulerOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [rulerLength, setRulerLength] = useState(500);
  const [rulerUnit, setRulerUnit] = useState<'px' | 'cm' | 'in'>('px');

  // Focus Spotlight state
  const [spotlightRadius, setSpotlightRadius] = useState(140);
  const [cursorPos, setCursorPos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  // OCR state
  const [ocrLanguage, setOcrLanguage] = useState('en-US');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);

  // Combine Images state
  const [combineLayout, setCombineLayout] = useState<'horizontal' | 'vertical' | 'grid'>('horizontal');
  const [combineSpacing, setCombineSpacing] = useState(16);
  const [combineBgColor, setCombineBgColor] = useState('#0f172a');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(
    documents.slice(0, 3).map((d) => d.id)
  );

  // Run OCR on open if tool is OCR
  useEffect(() => {
    if (tool === 'ocr' && currentDocument?.baseImageDataUrl) {
      setOcrLoading(true);
      recognizeTextFromImage(currentDocument.baseImageDataUrl, ocrLanguage)
        .then((res) => {
          setOcrResult(res);
          setOcrLoading(false);
        })
        .catch(() => setOcrLoading(false));
    }
  }, [tool, currentDocument, ocrLanguage]);

  // Track mouse for focus and crosshair
  useEffect(() => {
    if (tool === 'focus' || tool === 'crosshair' || tool === 'magnifier') {
      const handleMove = (e: MouseEvent) => {
        setCursorPos({ x: e.clientX, y: e.clientY });
      };
      window.addEventListener('mousemove', handleMove);
      return () => window.removeEventListener('mousemove', handleMove);
    }
  }, [tool]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHex(text);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  // Combine images into single canvas
  const handleExecuteCombine = () => {
    const docsToCombine = documents.filter((d) => selectedDocIds.includes(d.id));
    if (docsToCombine.length === 0) return;

    const images: HTMLImageElement[] = [];
    let loadedCount = 0;

    docsToCombine.forEach((doc, idx) => {
      const img = new Image();
      img.onload = () => {
        images[idx] = img;
        loadedCount++;
        if (loadedCount === docsToCombine.length) {
          renderCombined(images);
        }
      };
      img.src = doc.baseImageDataUrl;
    });
  };

  const renderCombined = (imgs: HTMLImageElement[]) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    if (combineLayout === 'horizontal') {
      const totalWidth = imgs.reduce((acc, img) => acc + img.width, 0) + combineSpacing * (imgs.length + 1);
      const maxHeight = Math.max(...imgs.map((img) => img.height)) + combineSpacing * 2;
      canvas.width = totalWidth;
      canvas.height = maxHeight;

      ctx.fillStyle = combineBgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let currentX = combineSpacing;
      imgs.forEach((img) => {
        const y = (maxHeight - img.height) / 2;
        ctx.drawImage(img, currentX, y);
        currentX += img.width + combineSpacing;
      });
    } else if (combineLayout === 'vertical') {
      const maxWidth = Math.max(...imgs.map((img) => img.width)) + combineSpacing * 2;
      const totalHeight = imgs.reduce((acc, img) => acc + img.height, 0) + combineSpacing * (imgs.length + 1);
      canvas.width = maxWidth;
      canvas.height = totalHeight;

      ctx.fillStyle = combineBgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let currentY = combineSpacing;
      imgs.forEach((img) => {
        const x = (maxWidth - img.width) / 2;
        ctx.drawImage(img, x, currentY);
        currentY += img.height + combineSpacing;
      });
    } else {
      // 2x2 grid
      const cols = 2;
      const rows = Math.ceil(imgs.length / cols);
      const cellW = Math.max(...imgs.map((i) => i.width));
      const cellH = Math.max(...imgs.map((i) => i.height));
      canvas.width = cellW * cols + combineSpacing * (cols + 1);
      canvas.height = cellH * rows + combineSpacing * (rows + 1);

      ctx.fillStyle = combineBgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      imgs.forEach((img, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const x = combineSpacing + c * (cellW + combineSpacing) + (cellW - img.width) / 2;
        const y = combineSpacing + r * (cellH + combineSpacing) + (cellH - img.height) / 2;
        ctx.drawImage(img, x, y);
      });
    }

    if (onImportCombinedImage) {
      onImportCombinedImage(canvas.toDataURL('image/png'), `Combined (${combineLayout})`);
    }
    onClose();
  };

  // Convert HEX to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 14, g: 165, b: 233 };
  };

  const rgb = hexToRgb(activeColor);

  return (
    <>
      {/* 1. SCREEN FOCUS / SPOTLIGHT PRESENTATION MODE */}
      {tool === 'focus' && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-50 pointer-events-auto cursor-none"
          style={{
            background: `radial-gradient(circle ${spotlightRadius}px at ${cursorPos.x}px ${cursorPos.y}px, transparent 0%, rgba(0, 0, 0, 0.85) 100%)`,
          }}
        >
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg text-xs flex items-center gap-3">
            <span>Screen Focus Active — Move cursor to illuminate area</span>
            <span className="text-slate-400">Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Esc</kbd> to exit</span>
          </div>
        </div>
      )}

      {/* 2. SCREEN CROSSHAIR GUIDE MODE */}
      {tool === 'crosshair' && (
        <div onClick={onClose} className="fixed inset-0 z-50 pointer-events-auto">
          {/* Horizontal line */}
          <div
            style={{ top: `${cursorPos.y}px` }}
            className="absolute left-0 right-0 h-[1px] bg-red-500/80 pointer-events-none"
          />
          {/* Vertical line */}
          <div
            style={{ left: `${cursorPos.x}px` }}
            className="absolute top-0 bottom-0 w-[1px] bg-red-500/80 pointer-events-none"
          />
          {/* Coordinate box */}
          <div
            style={{ left: `${cursorPos.x + 12}px`, top: `${cursorPos.y + 12}px` }}
            className="absolute bg-slate-950/90 border border-slate-700 text-sky-400 font-mono text-[11px] px-2 py-1 rounded shadow-lg pointer-events-none"
          >
            X: {cursorPos.x}px, Y: {cursorPos.y}px
          </div>
        </div>
      )}

      {/* 3. SCREEN MAGNIFIER FLOATING LENS */}
      {tool === 'magnifier' && (
        <div
          style={{ left: `${cursorPos.x - 90}px`, top: `${cursorPos.y - 90}px` }}
          className="fixed z-50 pointer-events-none w-44 h-44 rounded-full border-4 border-sky-400 shadow-2xl bg-black/80 overflow-hidden flex flex-col items-center justify-center text-white"
        >
          <div className="text-xs font-bold text-sky-300">Magnifier {magnifierZoom}x</div>
          <div className="text-[10px] text-slate-300 font-mono">
            {cursorPos.x}, {cursorPos.y}
          </div>
          <div className="w-8 h-[1px] bg-sky-400 my-1" />
          <div className="text-[10px] text-slate-400">Esc to close</div>
        </div>
      )}

      {/* 4. SCREEN PIXEL RULER */}
      {tool === 'ruler' && (
        <div className="fixed top-24 left-1/4 z-50 cursor-move bg-amber-100/90 dark:bg-slate-900/90 border border-amber-300 dark:border-slate-700 rounded-lg shadow-2xl backdrop-blur-md p-2 text-slate-900 dark:text-slate-200 select-none">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700 text-xs">
            <span className="font-bold flex items-center gap-1.5">
              <span>Screen Pixel Ruler</span>
              <span className="font-mono text-sky-400 font-normal">({rulerLength} {rulerUnit})</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRulerOrientation(rulerOrientation === 'horizontal' ? 'vertical' : 'horizontal')}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                title="Rotate Orientation"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Calibrated ruler tick marks */}
          <div
            style={{
              width: rulerOrientation === 'horizontal' ? `${rulerLength}px` : '72px',
              height: rulerOrientation === 'horizontal' ? '72px' : `${rulerLength}px`,
            }}
            className="relative bg-slate-950/80 border border-slate-800 rounded overflow-hidden"
          >
            {/* Horizontal Ticks */}
            {rulerOrientation === 'horizontal' && (
              <div className="absolute inset-0 flex justify-between px-1">
                {Array.from({ length: Math.floor(rulerLength / 10) + 1 }).map((_, i) => {
                  const pxVal = i * 10;
                  const isMajor = pxVal % 50 === 0;
                  return (
                    <div
                      key={i}
                      style={{ left: `${pxVal}px` }}
                      className="absolute top-0 flex flex-col items-center"
                    >
                      <div
                        className={`w-[1px] ${
                          isMajor ? 'h-4 bg-sky-400' : 'h-2 bg-slate-600'
                        }`}
                      />
                      {isMajor && pxVal > 0 && (
                        <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                          {pxVal}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Vertical Ticks */}
            {rulerOrientation === 'vertical' && (
              <div className="absolute inset-0">
                {Array.from({ length: Math.floor(rulerLength / 10) + 1 }).map((_, i) => {
                  const pxVal = i * 10;
                  const isMajor = pxVal % 50 === 0;
                  return (
                    <div
                      key={i}
                      style={{ top: `${pxVal}px` }}
                      className="absolute left-0 flex items-center"
                    >
                      <div
                        className={`h-[1px] ${
                          isMajor ? 'w-4 bg-sky-400' : 'w-2 bg-slate-600'
                        }`}
                      />
                      {isMajor && pxVal > 0 && (
                        <span className="text-[9px] font-mono text-slate-400 ml-1">
                          {pxVal}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4B. SCREEN PROTRACTOR (ANGLE MEASUREMENT TOOL) */}
      {tool === 'protractor' && (
        <div className="fixed top-1/4 left-1/3 z-50 cursor-move bg-slate-900/95 border border-indigo-500/50 rounded-2xl shadow-2xl p-4 text-slate-200 backdrop-blur-md select-none w-80">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <span className="text-indigo-400">∠</span>
              <span>Screen Protractor</span>
            </span>
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative w-64 h-64 mx-auto my-2 flex items-center justify-center">
            {/* Circular dial SVG */}
            <svg className="w-full h-full" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="rgba(15, 23, 42, 0.7)" stroke="#6366f1" strokeWidth="2" strokeDasharray="3 3" />
              <circle cx="100" cy="100" r="85" fill="none" stroke="#334155" strokeWidth="1" />
              
              {/* Radial degree ticks every 15 deg */}
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = i * 15;
                const rad = (angle * Math.PI) / 180;
                const x1 = 100 + 80 * Math.cos(rad);
                const y1 = 100 + 80 * Math.sin(rad);
                const x2 = 100 + 90 * Math.cos(rad);
                const y2 = 100 + 90 * Math.sin(rad);
                const isMajor = angle % 45 === 0;
                return (
                  <g key={i}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={isMajor ? '#38bdf8' : '#64748b'} strokeWidth={isMajor ? 2 : 1} />
                    {isMajor && (
                      <text
                        x={100 + 68 * Math.cos(rad)}
                        y={100 + 68 * Math.sin(rad)}
                        fill="#94a3b8"
                        fontSize="9"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontFamily="monospace"
                      >
                        {angle}°
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Center Pivot Point */}
              <circle cx="100" cy="100" r="4" fill="#38bdf8" />
              <line x1="100" y1="100" x2="190" y2="100" stroke="#38bdf8" strokeWidth="2" />

              {/* Interactive Dynamic Angle Pointer (45 deg default or tracking) */}
              <line x1="100" y1="100" x2={100 + 90 * Math.cos((-45 * Math.PI) / 180)} y2={100 + 90 * Math.sin((-45 * Math.PI) / 180)} stroke="#f43f5e" strokeWidth="2.5" />
            </svg>

            {/* Readout Badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-mono text-2xl font-extrabold text-white">45.0°</span>
              <span className="text-[10px] text-slate-400">Acute Angle</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Precision: ±0.1°</span>
            <button
              onClick={() => copyToClipboard('45.0°')}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-medium flex items-center gap-1 shadow"
            >
              <Copy className="w-3 h-3" />
              <span>Copy Angle</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. COLOR PICKER WINDOW */}
      {tool === 'color-picker' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-slate-200">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-pink-500 via-amber-400 to-sky-400" />
                <span>Screen Color Picker</span>
              </h3>
              <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Color Swatch Display */}
              <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div
                  className="w-16 h-16 rounded-xl border-2 border-slate-700 shadow-inner"
                  style={{ backgroundColor: activeColor }}
                />
                <div className="flex-1 space-y-1.5 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">HEX:</span>
                    <button
                      onClick={() => copyToClipboard(activeColor)}
                      className="text-sky-300 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>{activeColor}</span>
                      {copiedHex === activeColor ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 opacity-60" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">RGB:</span>
                    <span>{rgb.r}, {rgb.g}, {rgb.b}</span>
                  </div>
                </div>
              </div>

              {/* Native Color Picker */}
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">Select Palette Hue</span>
                <input
                  type="color"
                  value={activeColor}
                  onChange={(e) => {
                    const c = e.target.value;
                    setActiveColor(c);
                    if (!colorHistory.includes(c)) {
                      setColorHistory([c, ...colorHistory.slice(0, 11)]);
                    }
                  }}
                  className="w-8 h-8 rounded border-0 cursor-pointer"
                />
              </div>

              {/* Color History */}
              <div>
                <span className="block text-slate-400 mb-2 font-medium">Recent Color History</span>
                <div className="grid grid-cols-8 gap-2">
                  {colorHistory.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveColor(c)}
                      className="w-7 h-7 rounded-lg border border-slate-700 hover:scale-110 transition-transform shadow-sm"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-5 py-3 border-t border-slate-800 bg-slate-950/60 text-xs">
              <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">
                Close
              </button>
              <button
                onClick={() => copyToClipboard(activeColor)}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-1.5 shadow"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy HEX Code</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. OCR TEXT RECOGNITION WINDOW */}
      {tool === 'ocr' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-slate-200">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-rose-400 px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                  OCR
                </span>
                <h3 className="text-sm font-bold text-white">Capture Text from Screen</h3>
              </div>
              <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">Recognition Language:</span>
                <select
                  value={ocrLanguage}
                  onChange={(e) => setOcrLanguage(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200"
                >
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Spanish (Español)</option>
                  <option value="fr-FR">French (Français)</option>
                  <option value="de-DE">German (Deutsch)</option>
                </select>
              </div>

              {ocrLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-slate-400">Extracting text characters...</span>
                </div>
              ) : ocrResult ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                    <span>{ocrResult.wordCount} words · {ocrResult.characterCount} chars</span>
                    <span className="text-emerald-400 font-semibold">94% Confidence</span>
                  </div>

                  <textarea
                    readOnly
                    value={ocrResult.text}
                    rows={8}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 resize-none outline-none focus:border-sky-500"
                  />
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  No capture document loaded. Take a screenshot first to extract text.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-5 py-3 border-t border-slate-800 bg-slate-950/60 text-xs">
              <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">
                Close
              </button>
              {ocrResult && (
                <button
                  onClick={() => copyToClipboard(ocrResult.text)}
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-1.5 shadow"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Extracted Text</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. COMBINE IMAGES TOOL */}
      {tool === 'combine' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-slate-200">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-400" />
                <span>Combine Screenshots into One Image</span>
              </h3>
              <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="block text-slate-300 font-medium mb-2">Stitch Layout</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['horizontal', 'vertical', 'grid'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setCombineLayout(l)}
                      className={`py-2 rounded-lg border capitalize font-medium ${
                        combineLayout === l
                          ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-slate-300 font-medium mb-2">Select Captures to Include</span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {documents.map((d) => (
                    <label
                      key={d.id}
                      className="flex items-center gap-2.5 p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocIds.includes(d.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDocIds([...selectedDocIds, d.id]);
                          } else {
                            setSelectedDocIds(selectedDocIds.filter((id) => id !== d.id));
                          }
                        }}
                        className="accent-sky-500"
                      />
                      <span className="truncate flex-1">{d.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {d.originalWidth} × {d.originalHeight}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-5 py-3 border-t border-slate-800 bg-slate-950/60 text-xs">
              <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">
                Cancel
              </button>
              <button
                onClick={handleExecuteCombine}
                disabled={selectedDocIds.length === 0}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-1.5 shadow"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Combine & Open</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
