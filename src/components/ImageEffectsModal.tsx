/**
 * Image Effects Modal (SnapForge)
 * Handles Resize, Color Adjustments (Brightness, Contrast, Gamma, Sharpen),
 * and Edge Effects (Torn Edge, Drop Shadow, Fade Edge, Frame Border, Caption)
 */

import React, { useState } from 'react';
import { X, Check, Sliders, Scissors, Maximize, Frame, Type } from 'lucide-react';
import {
  resizeImage,
  applyColorAdjustments,
  applyTornEdgeEffect,
  applyDropShadow,
  applyBorderFrame,
  applyCaption,
  ColorFilterOptions,
} from '../utils/imageEffects';

interface ImageEffectsModalProps {
  imageSrc: string;
  originalWidth: number;
  originalHeight: number;
  initialTab?: 'adjustments' | 'edge-effects' | 'resize' | 'caption';
  onApply: (newImageSrc: string, newWidth?: number, newHeight?: number) => void;
  onClose: () => void;
}

export const ImageEffectsModal: React.FC<ImageEffectsModalProps> = ({
  imageSrc,
  originalWidth,
  originalHeight,
  initialTab = 'adjustments',
  onApply,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'adjustments' | 'edge-effects' | 'resize' | 'caption'>(
    initialTab
  );

  // Resize state
  const [resizeWidth, setResizeWidth] = useState(originalWidth);
  const [resizeHeight, setResizeHeight] = useState(originalHeight);
  const [keepAspect, setKeepAspect] = useState(true);

  // Color adjustments state
  const [colorOpts, setColorOpts] = useState<ColorFilterOptions>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    gamma: 1.0,
    sharpen: false,
    grayscale: false,
    invert: false,
    sepia: false,
  });

  // Edge effects state
  const [edgeType, setEdgeType] = useState<'torn' | 'shadow' | 'border'>('torn');
  const [tornSides, setTornSides] = useState({ top: false, right: true, bottom: true, left: false });
  const [shadowBlur, setShadowBlur] = useState(20);
  const [shadowOffset, setShadowOffset] = useState(8);
  const [borderColor, setBorderColor] = useState('#3b82f6');
  const [borderWidth, setBorderWidth] = useState(8);

  // Caption state
  const [captionText, setCaptionText] = useState('SnapForge Captured Document');
  const [captionPosition, setCaptionPosition] = useState<'top' | 'bottom'>('bottom');
  const [captionBg, setCaptionBg] = useState('#0f172a');
  const [captionColor, setCaptionColor] = useState('#ffffff');
  const [captionSize, setCaptionSize] = useState(16);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleApplyChanges = async () => {
    setIsProcessing(true);
    try {
      if (activeTab === 'resize') {
        const result = await resizeImage(imageSrc, resizeWidth, resizeHeight);
        onApply(result, resizeWidth, resizeHeight);
      } else if (activeTab === 'adjustments') {
        const result = await applyColorAdjustments(imageSrc, colorOpts);
        onApply(result);
      } else if (activeTab === 'edge-effects') {
        let result = imageSrc;
        if (edgeType === 'torn') {
          result = await applyTornEdgeEffect(imageSrc, tornSides);
        } else if (edgeType === 'shadow') {
          result = await applyDropShadow(imageSrc, shadowBlur, shadowOffset);
        } else if (edgeType === 'border') {
          result = await applyBorderFrame(imageSrc, borderColor, borderWidth);
        }
        onApply(result);
      } else if (activeTab === 'caption') {
        const result = await applyCaption(
          imageSrc,
          captionText,
          captionPosition,
          captionBg,
          captionColor,
          captionSize
        );
        onApply(result);
      }
      onClose();
    } catch (err) {
      console.error('Failed to apply image effects:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/50">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <span>Image Processing & Effects</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-slate-800 bg-slate-900/80 px-5 gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('adjustments')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'adjustments'
                ? 'border-sky-400 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Colors & Sharpen</span>
          </button>
          <button
            onClick={() => setActiveTab('edge-effects')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'edge-effects'
                ? 'border-sky-400 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Torn Edge & Shadow</span>
          </button>
          <button
            onClick={() => setActiveTab('resize')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'resize'
                ? 'border-sky-400 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Maximize className="w-3.5 h-3.5" />
            <span>Resize Canvas</span>
          </button>
          <button
            onClick={() => setActiveTab('caption')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'caption'
                ? 'border-sky-400 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Caption Bar</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs">
          {/* TAB 1: Adjustments */}
          {activeTab === 'adjustments' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Brightness</span>
                  <span className="font-mono text-sky-400">{colorOpts.brightness}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={colorOpts.brightness}
                  onChange={(e) => setColorOpts({ ...colorOpts, brightness: Number(e.target.value) })}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Contrast</span>
                  <span className="font-mono text-sky-400">{colorOpts.contrast}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={colorOpts.contrast}
                  onChange={(e) => setColorOpts({ ...colorOpts, contrast: Number(e.target.value) })}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Saturation</span>
                  <span className="font-mono text-sky-400">{colorOpts.saturation}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={colorOpts.saturation}
                  onChange={(e) => setColorOpts({ ...colorOpts, saturation: Number(e.target.value) })}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Gamma Correction</span>
                  <span className="font-mono text-sky-400">{colorOpts.gamma.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={colorOpts.gamma}
                  onChange={(e) => setColorOpts({ ...colorOpts, gamma: Number(e.target.value) })}
                  className="w-full accent-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={colorOpts.sharpen}
                    onChange={(e) => setColorOpts({ ...colorOpts, sharpen: e.target.checked })}
                    className="accent-sky-500 rounded"
                  />
                  <span>Unsharp Mask (Sharpen)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={colorOpts.grayscale}
                    onChange={(e) => setColorOpts({ ...colorOpts, grayscale: e.target.checked })}
                    className="accent-sky-500 rounded"
                  />
                  <span>Grayscale</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={colorOpts.sepia}
                    onChange={(e) => setColorOpts({ ...colorOpts, sepia: e.target.checked })}
                    className="accent-sky-500 rounded"
                  />
                  <span>Sepia Vintage</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={colorOpts.invert}
                    onChange={(e) => setColorOpts({ ...colorOpts, invert: e.target.checked })}
                    className="accent-sky-500 rounded"
                  />
                  <span>Invert Colors</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: Edge Effects */}
          {activeTab === 'edge-effects' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setEdgeType('torn')}
                  className={`flex-1 py-2 rounded border text-xs font-medium transition-colors ${
                    edgeType === 'torn'
                      ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                      : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  Torn Edge (FastStone)
                </button>
                <button
                  onClick={() => setEdgeType('shadow')}
                  className={`flex-1 py-2 rounded border text-xs font-medium transition-colors ${
                    edgeType === 'shadow'
                      ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                      : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  Drop Shadow
                </button>
                <button
                  onClick={() => setEdgeType('border')}
                  className={`flex-1 py-2 rounded border text-xs font-medium transition-colors ${
                    edgeType === 'border'
                      ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                      : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  Frame Border
                </button>
              </div>

              {edgeType === 'torn' && (
                <div className="space-y-3 bg-slate-950/40 p-4 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-300">Torn Sides:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tornSides.top}
                        onChange={(e) => setTornSides({ ...tornSides, top: e.target.checked })}
                      />
                      <span>Top Edge</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tornSides.right}
                        onChange={(e) => setTornSides({ ...tornSides, right: e.target.checked })}
                      />
                      <span>Right Edge</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tornSides.bottom}
                        onChange={(e) => setTornSides({ ...tornSides, bottom: e.target.checked })}
                      />
                      <span>Bottom Edge</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tornSides.left}
                        onChange={(e) => setTornSides({ ...tornSides, left: e.target.checked })}
                      />
                      <span>Left Edge</span>
                    </label>
                  </div>
                </div>
              )}

              {edgeType === 'shadow' && (
                <div className="space-y-3 bg-slate-950/40 p-4 rounded-lg border border-slate-800">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Shadow Blur</span>
                      <span className="font-mono text-sky-400">{shadowBlur} px</span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="40"
                      value={shadowBlur}
                      onChange={(e) => setShadowBlur(Number(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Shadow Offset</span>
                      <span className="font-mono text-sky-400">{shadowOffset} px</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="30"
                      value={shadowOffset}
                      onChange={(e) => setShadowOffset(Number(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>
                </div>
              )}

              {edgeType === 'border' && (
                <div className="space-y-3 bg-slate-950/40 p-4 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span>Border Color</span>
                    <input
                      type="color"
                      value={borderColor}
                      onChange={(e) => setBorderColor(e.target.value)}
                      className="w-6 h-6 rounded border-0 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Border Width</span>
                      <span className="font-mono text-sky-400">{borderWidth} px</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="32"
                      value={borderWidth}
                      onChange={(e) => setBorderWidth(Number(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Resize */}
          {activeTab === 'resize' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={resizeWidth}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setResizeWidth(val);
                      if (keepAspect && originalWidth > 0) {
                        setResizeHeight(Math.round((val / originalWidth) * originalHeight));
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={resizeHeight}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setResizeHeight(val);
                      if (keepAspect && originalHeight > 0) {
                        setResizeWidth(Math.round((val / originalHeight) * originalWidth));
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 font-mono text-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepAspect}
                  onChange={(e) => setKeepAspect(e.target.checked)}
                  className="accent-sky-500"
                />
                <span>Maintain aspect ratio ({((originalWidth / originalHeight) || 1).toFixed(2)}:1)</span>
              </label>

              <div className="flex gap-2 pt-2">
                {[0.5, 0.75, 1.25, 1.5, 2].map((factor) => (
                  <button
                    key={factor}
                    onClick={() => {
                      setResizeWidth(Math.round(originalWidth * factor));
                      setResizeHeight(Math.round(originalHeight * factor));
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono text-xs"
                  >
                    {Math.round(factor * 100)}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Caption */}
          {activeTab === 'caption' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">Caption Text</label>
                <input
                  type="text"
                  value={captionText}
                  onChange={(e) => setCaptionText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Position</label>
                  <select
                    value={captionPosition}
                    onChange={(e) => setCaptionPosition(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="bottom">Bottom Strip</option>
                    <option value="top">Top Strip</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Font Size</label>
                  <input
                    type="number"
                    min="12"
                    max="48"
                    value={captionSize}
                    onChange={(e) => setCaptionSize(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 font-mono text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span>Background Color</span>
                  <input
                    type="color"
                    value={captionBg}
                    onChange={(e) => setCaptionBg(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Text Color</span>
                  <input
                    type="color"
                    value={captionColor}
                    onChange={(e) => setCaptionColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyChanges}
            disabled={isProcessing}
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium flex items-center gap-1.5 shadow"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Processing...' : 'Apply Effect'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
