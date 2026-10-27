/**
 * FastStone-Style Floating Capture Panel (SnapForge)
 * Sleek, draggable, high-density toolbar with iconic capture mode buttons,
 * output destination selector, utilities dropdown, and settings
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Crop,
  Square,
  Maximize2,
  Scroll,
  Video,
  Wrench,
  Settings,
  FolderOpen,
  Check,
  ChevronDown,
  Volume2,
  VolumeX,
  Layers,
  Sparkles,
  Lasso,
  Clock,
  Eye,
  GripHorizontal,
} from 'lucide-react';
import { CaptureMode, OutputKind, AppSettings } from '../types';

interface CapturePanelProps {
  onStartCapture: (mode: CaptureMode, options?: { fixedSize?: { width: number; height: number } }) => void;
  onOpenRecorder: () => void;
  onOpenSettings: () => void;
  onOpenFile: () => void;
  onOpenTool: (toolName: 'color-picker' | 'magnifier' | 'ruler' | 'crosshair' | 'focus' | 'ocr' | 'combine') => void;
  outputKind: OutputKind;
  onChangeOutputKind: (kind: OutputKind) => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  activeTabCount: number;
  onToggleEditor: () => void;
  isEditorOpen: boolean;
}

export const CapturePanel: React.FC<CapturePanelProps> = ({
  onStartCapture,
  onOpenRecorder,
  onOpenSettings,
  onOpenFile,
  onOpenTool,
  outputKind,
  onChangeOutputKind,
  settings,
  onUpdateSettings,
  activeTabCount,
  onToggleEditor,
  isEditorOpen,
}) => {
  // Dragging state
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 24, y: 76 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 24,
    startY: 76,
  });

  // Dropdowns
  const [showOutputMenu, setShowOutputMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showFixedSizes, setShowFixedSizes] = useState(false);

  // Auto-repeat state
  const [autoRepeatActive, setAutoRepeatActive] = useState(false);
  const [autoRepeatInterval, setAutoRepeatInterval] = useState(5);
  const autoRepeatTimerRef = useRef<number | null>(null);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag from handle
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      dragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        startX: position.x,
        startY: position.y,
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 420, dragStartRef.current.startX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 80, dragStartRef.current.startY + dy)),
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

  // Auto-repeat timer
  useEffect(() => {
    if (autoRepeatActive) {
      autoRepeatTimerRef.current = window.setInterval(() => {
        onStartCapture('Rectangle');
      }, autoRepeatInterval * 1000);
    } else if (autoRepeatTimerRef.current) {
      clearInterval(autoRepeatTimerRef.current);
    }
    return () => {
      if (autoRepeatTimerRef.current) clearInterval(autoRepeatTimerRef.current);
    };
  }, [autoRepeatActive, autoRepeatInterval, onStartCapture]);

  const fixedSizes = [
    { label: '320 × 240 (SD)', width: 320, height: 240 },
    { label: '640 × 480 (VGA)', width: 640, height: 480 },
    { label: '800 × 600 (SVGA)', width: 800, height: 600 },
    { label: '1280 × 720 (HD)', width: 1280, height: 720 },
    { label: '1920 × 1080 (FHD)', width: 1920, height: 1080 },
  ];

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
      className="fixed z-50 select-none shadow-2xl rounded-xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-md text-slate-200 transition-shadow duration-200"
    >
      <div className="flex items-center px-2 py-1.5 gap-1 text-xs">
        {/* Drag Handle & Brand Mark */}
        <div
          className="drag-handle cursor-grab active:cursor-grabbing flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Drag capture panel"
        >
          <GripHorizontal className="w-4 h-4" />
          <span className="font-extrabold text-xs tracking-wide bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">PIXELGRIP</span>
        </div>

        <div className="w-[1px] h-5 bg-slate-700/60 mx-0.5" />

        {/* 1. Active Window */}
        <button
          onClick={() => onStartCapture('ActiveWindow')}
          title="Capture Active Window (Alt+PrtScn / Ctrl+Shift+W)"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors relative group"
        >
          <Square className="w-4 h-4 text-sky-400" />
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-950 text-slate-200 text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap border border-slate-800 z-50">
            Active Window
          </span>
        </button>

        {/* 2. Window / Object */}
        <button
          onClick={() => onStartCapture('Object')}
          title="Capture Window / Object (UI Automation Hover)"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors relative group"
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-950 text-slate-200 text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap border border-slate-800 z-50">
            Window / Object
          </span>
        </button>

        {/* 3. Rectangular Region */}
        <button
          onClick={() => onStartCapture('Rectangle')}
          title="Capture Rectangular Region (Ctrl+Shift+R)"
          className="p-1.5 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 transition-colors relative group border border-sky-500/40"
        >
          <Crop className="w-4 h-4" />
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-950 text-slate-200 text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap border border-slate-800 z-50">
            Rectangle Region
          </span>
        </button>

        {/* 4. Freehand Region */}
        <button
          onClick={() => onStartCapture('Freehand')}
          title="Capture Freehand Region (Lasso)"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors relative group"
        >
          <Lasso className="w-4 h-4 text-amber-400" />
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-950 text-slate-200 text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap border border-slate-800 z-50">
            Freehand Region
          </span>
        </button>

        {/* 5. Fixed-Size Region */}
        <div className="relative">
          <button
            onClick={() => setShowFixedSizes(!showFixedSizes)}
            title="Capture Fixed-Size Region"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-0.5 relative group"
          >
            <Square className="w-4 h-4 text-purple-400" />
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-950 text-slate-200 text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap border border-slate-800 z-50">
              Fixed Region
            </span>
          </button>

          {showFixedSizes && (
            <div className="absolute top-full left-0 mt-1.5 w-44 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl py-1 z-50">
              <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-400">
                Preset Dimensions
              </div>
              {fixedSizes.map((sz) => (
                <button
                  key={sz.label}
                  onClick={() => {
                    setShowFixedSizes(false);
                    onStartCapture('FixedRegion', { fixedSize: { width: sz.width, height: sz.height } });
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-xs text-slate-300 hover:text-white flex items-center justify-between"
                >
                  <span>{sz.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 6. Fullscreen */}
        <button
          onClick={() => onStartCapture('Fullscreen')}
          title="Capture Full Screen (PrtScn)"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors relative group"
        >
          <Maximize2 className="w-4 h-4 text-indigo-400" />
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-950 text-slate-200 text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap border border-slate-800 z-50">
            Full Screen
          </span>
        </button>

        {/* 7. Scrolling Window / Page */}
        <button
          onClick={() => onStartCapture('Scrolling')}
          title="Capture Scrolling Window / Page (Auto-Stitch)"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors relative group"
        >
          <Scroll className="w-4 h-4 text-rose-400" />
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-950 text-slate-200 text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap border border-slate-800 z-50">
            Scrolling Capture
          </span>
        </button>

        {/* 8. Auto Repeat Timer */}
        <button
          onClick={() => setAutoRepeatActive(!autoRepeatActive)}
          title={`Auto-Repeat Capture (Every ${autoRepeatInterval}s)`}
          className={`p-1.5 rounded transition-colors relative group ${
            autoRepeatActive ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-950 text-slate-200 text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap border border-slate-800 z-50">
            {autoRepeatActive ? `Auto-Repeat Active (${autoRepeatInterval}s)` : 'Auto Repeat'}
          </span>
        </button>

        {/* 9. Screen Recorder */}
        <button
          onClick={onOpenRecorder}
          title="Screen Video Recorder (Microphone, Audio, Webcam PiP)"
          className="p-1.5 rounded bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/50 transition-colors flex items-center gap-1 relative group"
        >
          <Video className="w-4 h-4 text-rose-400" />
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-950 text-slate-200 text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap border border-slate-800 z-50">
            Screen Recorder
          </span>
        </button>

        <div className="w-[1px] h-5 bg-slate-700/60 mx-0.5" />

        {/* Output Destination Selector */}
        <div className="relative">
          <button
            onClick={() => setShowOutputMenu(!showOutputMenu)}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200"
            title="Capture Destination Output"
          >
            <span className="text-[11px] font-medium text-slate-400">To:</span>
            <span className="text-[11px] font-semibold text-sky-400">{outputKind}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showOutputMenu && (
            <div className="absolute top-full left-0 mt-1.5 w-40 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl py-1 z-50">
              {(['Editor', 'Clipboard', 'File', 'PDF', 'Printer', 'Email'] as OutputKind[]).map((kind) => (
                <button
                  key={kind}
                  onClick={() => {
                    onChangeOutputKind(kind);
                    setShowOutputMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-xs text-slate-300 hover:text-white flex items-center justify-between"
                >
                  <span>{kind}</span>
                  {outputKind === kind && <Check className="w-3.5 h-3.5 text-sky-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Utilities Menu */}
        <div className="relative">
          <button
            onClick={() => setShowToolsMenu(!showToolsMenu)}
            title="Screen Utilities & Tools"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-0.5 relative group"
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-950 text-slate-200 text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap border border-slate-800 z-50">
              Utilities
            </span>
          </button>

          {showToolsMenu && (
            <div className="absolute top-full right-0 mt-1.5 w-52 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl py-1 z-50">
              <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-400">
                Screen Utilities
              </div>
              <button
                onClick={() => {
                  setShowToolsMenu(false);
                  onOpenTool('color-picker');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-2"
              >
                <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-pink-500 via-amber-400 to-sky-400" />
                <span>Screen Color Picker</span>
              </button>
              <button
                onClick={() => {
                  setShowToolsMenu(false);
                  onOpenTool('magnifier');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-2"
              >
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                <span>Screen Magnifier (2x-16x)</span>
              </button>
              <button
                onClick={() => {
                  setShowToolsMenu(false);
                  onOpenTool('ruler');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-2"
              >
                <Square className="w-3.5 h-3.5 text-emerald-400" />
                <span>Screen Pixel Ruler</span>
              </button>
              <button
                onClick={() => {
                  setShowToolsMenu(false);
                  onOpenTool('crosshair');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-2"
              >
                <Crop className="w-3.5 h-3.5 text-purple-400" />
                <span>Screen Crosshair</span>
              </button>
              <button
                onClick={() => {
                  setShowToolsMenu(false);
                  onOpenTool('focus');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>Screen Focus (Spotlight)</span>
              </button>
              <button
                onClick={() => {
                  setShowToolsMenu(false);
                  onOpenTool('ocr');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-2"
              >
                <span className="font-mono text-xs font-bold text-rose-400">OCR</span>
                <span>Capture Text (OCR)</span>
              </button>
              <button
                onClick={() => {
                  setShowToolsMenu(false);
                  onOpenTool('combine');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-2"
              >
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                <span>Combine Images...</span>
              </button>
            </div>
          )}
        </div>

        {/* Open Image File */}
        <button
          onClick={onOpenFile}
          title="Open Image from Disk / Drag & Drop"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors relative group"
        >
          <FolderOpen className="w-4 h-4 text-amber-400" />
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-950 text-slate-200 text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap border border-slate-800 z-50">
            Open Image
          </span>
        </button>

        {/* Shutter sound toggle */}
        <button
          onClick={() => onUpdateSettings({ playShutterSound: !settings.playShutterSound })}
          title={settings.playShutterSound ? 'Shutter Sound On' : 'Shutter Sound Off'}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          {settings.playShutterSound ? (
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>

        {/* Toggle Editor Window */}
        <button
          onClick={onToggleEditor}
          title="Toggle Tabbed Editor Window"
          className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
            isEditorOpen
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <span>Editor</span>
          {activeTabCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-slate-950/80 text-[10px] font-bold flex items-center justify-center text-sky-300">
              {activeTabCount}
            </span>
          )}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title="Preferences & Settings"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
