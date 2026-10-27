/**
 * PixelGrip Mini Window Mode (Section 2.1)
 * A sleek, high-density, compact Windows desktop interface optimized for everyday use.
 * Replaces oversized dashboards with immediate, one-click capture affordances.
 */

import React, { useState } from 'react';
import {
  Camera,
  Crop,
  Square,
  Layers,
  Lasso,
  Maximize2,
  Scroll,
  Video,
  Clock,
  Wrench,
  Settings,
  FolderOpen,
  Maximize,
  Minus,
  X,
  Volume2,
  VolumeX,
  ChevronDown,
  Sparkles,
  Check,
} from 'lucide-react';
import { CaptureMode, OutputKind, AppSettings, RecentCapture } from '../types';

interface MiniWindowProps {
  onStartCapture: (mode: CaptureMode, options?: { fixedSize?: { width: number; height: number } }) => void;
  onOpenRecorder: () => void;
  onOpenEditor: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenTool: (tool: any) => void;
  onOpenFile: () => void;
  outputKind: OutputKind;
  onChangeOutputKind: (kind: OutputKind) => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  recentCaptures: RecentCapture[];
  onMinimizeToTray: () => void;
  onCloseToTray: () => void;
  onExpandWorkspace: () => void;
}

export const MiniWindow: React.FC<MiniWindowProps> = ({
  onStartCapture,
  onOpenRecorder,
  onOpenEditor,
  onOpenHistory,
  onOpenSettings,
  onOpenTool,
  onOpenFile,
  outputKind,
  onChangeOutputKind,
  settings,
  onUpdateSettings,
  recentCaptures,
  onMinimizeToTray,
  onCloseToTray,
  onExpandWorkspace,
}) => {
  const [showOutputMenu, setShowOutputMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showDelayMenu, setShowDelayMenu] = useState(false);

  const delayOptions = [
    { label: 'No Delay (Instant)', sec: 0 },
    { label: '3 Seconds Delay', sec: 3 },
    { label: '5 Seconds Delay', sec: 5 },
    { label: '10 Seconds Delay', sec: 10 },
  ];

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl text-slate-200 select-none transition-all duration-200">
      {/* 1. Compact Windows-Style Title Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800 bg-slate-950/70 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <Camera className="w-3 h-3 text-white" />
          </div>
          <span className="font-extrabold tracking-tight text-white">PixelGrip</span>
          <span className="text-slate-500 text-[10px]">v1.0</span>
        </div>

        {/* Window controls (Minimize to tray, Expand to full workspace, Close to tray) */}
        <div className="flex items-center gap-1">
          <button
            onClick={onMinimizeToTray}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Minimize to System Tray"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onExpandWorkspace}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Expand Full Workspace"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onCloseToTray}
            className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400"
            title="Close to System Tray"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Fast Capture Button Strip */}
      <div className="p-3 space-y-3">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {/* Region */}
          <button
            onClick={() => onStartCapture('Rectangle')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 transition-colors group"
            title="Rectangular Region (Ctrl+Shift+R)"
          >
            <Crop className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Region</span>
          </button>

          {/* Active Window */}
          <button
            onClick={() => onStartCapture('ActiveWindow')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors group"
            title="Active Window (Ctrl+Shift+W)"
          >
            <Square className="w-4 h-4 mb-1 text-sky-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Window</span>
          </button>

          {/* Object */}
          <button
            onClick={() => onStartCapture('Object')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors group"
            title="Window / Object Detection"
          >
            <Layers className="w-4 h-4 mb-1 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Object</span>
          </button>

          {/* Full Screen */}
          <button
            onClick={() => onStartCapture('Fullscreen')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors group"
            title="Full Screen (PrintScreen)"
          >
            <Maximize2 className="w-4 h-4 mb-1 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Full</span>
          </button>

          {/* Freehand */}
          <button
            onClick={() => onStartCapture('Freehand')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors group"
            title="Freehand Lasso"
          >
            <Lasso className="w-4 h-4 mb-1 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Lasso</span>
          </button>

          {/* Scrolling */}
          <button
            onClick={() => onStartCapture('Scrolling')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors group"
            title="Scrolling Window (Auto-Stitch)"
          >
            <Scroll className="w-4 h-4 mb-1 text-rose-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Scroll</span>
          </button>

          {/* Video Recorder */}
          <button
            onClick={onOpenRecorder}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 transition-colors group"
            title="Screen Video Recorder (Ctrl+Shift+V)"
          >
            <Video className="w-4 h-4 mb-1 text-rose-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Record</span>
          </button>

          {/* Open Image File */}
          <button
            onClick={onOpenFile}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors group"
            title="Open Image from Disk"
          >
            <FolderOpen className="w-4 h-4 mb-1 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Open</span>
          </button>
        </div>

        {/* 3. Secondary Bar: Delay, Output Destination, Utilities, Editor */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5">
            {/* Delay Selector */}
            <div className="relative">
              <button
                onClick={() => setShowDelayMenu(!showDelayMenu)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700/60 text-[11px] font-medium flex items-center gap-1 text-slate-300"
                title="Capture Delay Countdown"
              >
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{settings.captureDelaySeconds > 0 ? `${settings.captureDelaySeconds}s Delay` : 'No Delay'}</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>

              {showDelayMenu && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl py-1 z-50">
                  {delayOptions.map((opt) => (
                    <button
                      key={opt.sec}
                      onClick={() => {
                        onUpdateSettings({ captureDelaySeconds: opt.sec });
                        setShowDelayMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white flex items-center justify-between"
                    >
                      <span>{opt.label}</span>
                      {settings.captureDelaySeconds === opt.sec && <Check className="w-3 h-3 text-sky-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Output Destination Selector */}
            <div className="relative">
              <button
                onClick={() => setShowOutputMenu(!showOutputMenu)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700/60 text-[11px] font-medium flex items-center gap-1"
                title="Output Destination"
              >
                <span className="text-slate-400">To:</span>
                <span className="font-semibold text-sky-400">{outputKind}</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>

              {showOutputMenu && (
                <div className="absolute top-full left-0 mt-1 w-36 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl py-1 z-50">
                  {(['Editor', 'Clipboard', 'File', 'PDF', 'Printer'] as OutputKind[]).map((kind) => (
                    <button
                      key={kind}
                      onClick={() => {
                        onChangeOutputKind(kind);
                        setShowOutputMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white flex items-center justify-between"
                    >
                      <span>{kind}</span>
                      {outputKind === kind && <Check className="w-3 h-3 text-sky-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Shutter sound */}
            <button
              onClick={() => onUpdateSettings({ playShutterSound: !settings.playShutterSound })}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title={settings.playShutterSound ? 'Shutter Sound On' : 'Shutter Sound Muted'}
            >
              {settings.playShutterSound ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Utilities dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-[11px] font-medium text-slate-300 flex items-center gap-1"
                title="Screen Measurement & Utilities"
              >
                <Wrench className="w-3 h-3 text-amber-400" />
                <span>Tools</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>

              {showToolsMenu && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl py-1 z-50 text-[11px]">
                  <button
                    onClick={() => {
                      setShowToolsMenu(false);
                      onOpenTool('color-picker');
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-pink-500 via-amber-400 to-sky-400" />
                    <span>Screen Color Picker</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowToolsMenu(false);
                      onOpenTool('ruler');
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2"
                  >
                    <Square className="w-3 h-3 text-emerald-400" />
                    <span>Screen Pixel Ruler</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowToolsMenu(false);
                      onOpenTool('protractor');
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Screen Protractor (Angle)</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowToolsMenu(false);
                      onOpenTool('magnifier');
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2"
                  >
                    <Maximize2 className="w-3 h-3 text-sky-400" />
                    <span>Screen Magnifier (2x-16x)</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowToolsMenu(false);
                      onOpenTool('ocr');
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2"
                  >
                    <span className="font-mono font-bold text-rose-400">OCR</span>
                    <span>Extract Text (OCR)</span>
                  </button>
                </div>
              )}
            </div>

            {/* History */}
            <button
              onClick={onOpenHistory}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-[11px] font-medium text-slate-300 flex items-center gap-1"
              title="Recent Captures History"
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span>History</span>
              {recentCaptures.length > 0 && (
                <span className="text-[10px] px-1 rounded bg-slate-900 font-mono text-sky-300 font-bold">
                  {recentCaptures.length}
                </span>
              )}
            </button>

            {/* Open Editor Button */}
            <button
              onClick={onOpenEditor}
              className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow"
            >
              <span>Editor</span>
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              title="Settings & Preferences"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
