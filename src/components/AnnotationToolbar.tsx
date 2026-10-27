/**
 * Annotation Toolbar for SnapForge Editor
 * FastStone-style vector annotation tools with property inspector
 */

import React from 'react';
import {
  MousePointer,
  Type,
  ArrowRight,
  ArrowLeftRight,
  Minus,
  Square,
  Circle,
  MessageSquare,
  Hash,
  Highlighter,
  EyeOff,
  Sun,
  Stamp,
  RotateCcw,
  Trash2,
  ChevronUp,
  ChevronDown,
  Smile,
  ShieldAlert,
} from 'lucide-react';
import { AnnotationType, AnnotationDto } from '../types';

interface AnnotationToolbarProps {
  activeTool: AnnotationType;
  onChangeTool: (tool: AnnotationType) => void;
  selectedAnnotation: AnnotationDto | null;
  onUpdateSelectedAnnotation: (partial: Partial<AnnotationDto>) => void;
  onDeleteSelectedAnnotation: () => void;
  onReorderSelectedAnnotation: (direction: 'up' | 'down') => void;
  currentStepNumber: number;
  onResetStepNumber: () => void;
  // Current drawing defaults
  strokeColor: string;
  onChangeStrokeColor: (color: string) => void;
  fillColor: string;
  onChangeFillColor: (color: string) => void;
  strokeWidth: number;
  onChangeStrokeWidth: (width: number) => void;
  opacity: number;
  onChangeOpacity: (opacity: number) => void;
  fontSize: number;
  onChangeFontSize: (size: number) => void;
}

export const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
  activeTool,
  onChangeTool,
  selectedAnnotation,
  onUpdateSelectedAnnotation,
  onDeleteSelectedAnnotation,
  onReorderSelectedAnnotation,
  currentStepNumber,
  onResetStepNumber,
  strokeColor,
  onChangeStrokeColor,
  fillColor,
  onChangeFillColor,
  strokeWidth,
  onChangeStrokeWidth,
  opacity,
  onChangeOpacity,
  fontSize,
  onChangeFontSize,
}) => {
  const tools: { type: AnnotationType; label: string; icon: React.ReactNode }[] = [
    { type: 'select', label: 'Select / Move (V)', icon: <MousePointer className="w-4 h-4" /> },
    { type: 'text', label: 'Text Box (T)', icon: <Type className="w-4 h-4" /> },
    { type: 'arrow', label: 'Arrow (A)', icon: <ArrowRight className="w-4 h-4" /> },
    { type: 'double-arrow', label: 'Double Arrow', icon: <ArrowLeftRight className="w-4 h-4" /> },
    { type: 'line', label: 'Straight Line (L)', icon: <Minus className="w-4 h-4" /> },
    { type: 'rect', label: 'Rectangle (R)', icon: <Square className="w-4 h-4" /> },
    { type: 'ellipse', label: 'Ellipse / Circle (C)', icon: <Circle className="w-4 h-4" /> },
    { type: 'callout', label: 'Speech Callout (S)', icon: <MessageSquare className="w-4 h-4" /> },
    { type: 'step-number', label: `Step Badge (#${currentStepNumber})`, icon: <Hash className="w-4 h-4 text-rose-400" /> },
    { type: 'highlighter', label: 'Highlighter (H)', icon: <Highlighter className="w-4 h-4 text-yellow-400" /> },
    { type: 'pixelate', label: 'Pixelate Redact', icon: <EyeOff className="w-4 h-4 text-slate-400" /> },
    { type: 'spotlight', label: 'Spotlight Focus', icon: <Sun className="w-4 h-4 text-amber-300" /> },
    { type: 'watermark', label: 'Watermark Stamp', icon: <ShieldAlert className="w-4 h-4 text-sky-400" /> },
    { type: 'stamp', label: 'Stamp Icon', icon: <Stamp className="w-4 h-4 text-emerald-400" /> },
  ];

  const presetColors = [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#ffffff', // white
    '#000000', // black
  ];

  return (
    <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-200 gap-2 select-none">
      {/* Tool Selection Group */}
      <div className="flex items-center gap-1 overflow-x-auto py-0.5">
        {tools.map((t) => (
          <button
            key={t.type}
            onClick={() => onChangeTool(t.type)}
            title={t.label}
            className={`p-1.5 rounded transition-colors relative flex items-center justify-center ${
              activeTool === t.type
                ? 'bg-sky-500/25 text-sky-300 border border-sky-500/50 shadow-sm'
                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.icon}
          </button>
        ))}
      </div>

      <div className="h-5 w-[1px] bg-slate-800 hidden md:block" />

      {/* Property Controls */}
      <div className="flex items-center gap-3">
        {/* Stroke Color */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Color:</span>
          <div className="flex items-center gap-1">
            {presetColors.slice(0, 5).map((c) => (
              <button
                key={c}
                onClick={() => {
                  onChangeStrokeColor(c);
                  if (selectedAnnotation) onUpdateSelectedAnnotation({ strokeColor: c });
                }}
                className={`w-4 h-4 rounded-full border ${
                  strokeColor === c ? 'ring-2 ring-sky-400 border-white' : 'border-slate-700'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => {
                onChangeStrokeColor(e.target.value);
                if (selectedAnnotation) onUpdateSelectedAnnotation({ strokeColor: e.target.value });
              }}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
              title="Custom Stroke Color"
            />
          </div>
        </div>

        {/* Fill Color */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Fill:</span>
          <button
            onClick={() => {
              const nextFill = fillColor === 'transparent' ? strokeColor : 'transparent';
              onChangeFillColor(nextFill);
              if (selectedAnnotation) onUpdateSelectedAnnotation({ fillColor: nextFill });
            }}
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
              fillColor === 'transparent'
                ? 'border-slate-700 bg-slate-800/80 text-slate-400'
                : 'border-sky-500 bg-sky-500/20 text-sky-300'
            }`}
          >
            {fillColor === 'transparent' ? 'None' : 'Solid'}
          </button>
        </div>

        {/* Line Width */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Width:</span>
          <select
            value={strokeWidth}
            onChange={(e) => {
              const val = Number(e.target.value);
              onChangeStrokeWidth(val);
              if (selectedAnnotation) onUpdateSelectedAnnotation({ strokeWidth: val });
            }}
            className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-200 outline-none"
          >
            <option value={1}>1 px</option>
            <option value={2}>2 px</option>
            <option value={4}>4 px</option>
            <option value={6}>6 px</option>
            <option value={8}>8 px</option>
            <option value={12}>12 px</option>
          </select>
        </div>

        {/* Text / Badge options if applicable */}
        {(activeTool === 'text' || activeTool === 'callout' || selectedAnnotation?.type === 'text') && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Size:</span>
            <select
              value={fontSize}
              onChange={(e) => {
                const val = Number(e.target.value);
                onChangeFontSize(val);
                if (selectedAnnotation) onUpdateSelectedAnnotation({ fontSize: val });
              }}
              className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-200 outline-none"
            >
              <option value={12}>12 pt</option>
              <option value={14}>14 pt</option>
              <option value={18}>18 pt</option>
              <option value={24}>24 pt</option>
              <option value={32}>32 pt</option>
              <option value={48}>48 pt</option>
            </select>
          </div>
        )}

        {/* Step number reset */}
        {activeTool === 'step-number' && (
          <button
            onClick={onResetStepNumber}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700"
            title="Reset step badge count back to 1"
          >
            <RotateCcw className="w-3 h-3 text-rose-400" />
            <span>Reset #1</span>
          </button>
        )}

        {/* Selected Annotation Actions */}
        {selectedAnnotation && (
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            <button
              onClick={() => onReorderSelectedAnnotation('up')}
              title="Bring Forward"
              className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onReorderSelectedAnnotation('down')}
              title="Send Backward"
              className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDeleteSelectedAnnotation}
              title="Delete Selected (Del)"
              className="p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 ml-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
