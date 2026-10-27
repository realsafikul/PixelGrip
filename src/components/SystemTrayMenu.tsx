/**
 * PixelGrip System Tray & Taskbar Notification Area Controller
 * Implements Section 3 of the specification:
 * - Persistent notification area tray icon
 * - Tray context menu with quick capture actions, recording status, recent captures, and quit
 * - Close-to-tray & minimize-to-tray restore triggers
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Square,
  Crop,
  Maximize2,
  Video,
  Clock,
  Settings,
  Power,
  ChevronUp,
  FolderOpen,
  Check,
} from 'lucide-react';
import { CaptureMode } from '../types';

interface SystemTrayMenuProps {
  isRecordingActive: boolean;
  onOpenApp: () => void;
  onCaptureMode: (mode: CaptureMode) => void;
  onOpenRecorder: () => void;
  onStopRecorder: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onQuitApp: () => void;
  isWindowHidden: boolean;
  onRestoreWindow: () => void;
}

export const SystemTrayMenu: React.FC<SystemTrayMenuProps> = ({
  isRecordingActive,
  onOpenApp,
  onCaptureMode,
  onOpenRecorder,
  onStopRecorder,
  onOpenHistory,
  onOpenSettings,
  onQuitApp,
  isWindowHidden,
  onRestoreWindow,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close tray menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={menuRef} className="fixed bottom-2 right-4 z-50 select-none">
      {/* Tray Notification Icon Button */}
      <div className="flex items-center gap-2">
        {isWindowHidden && (
          <button
            onClick={onRestoreWindow}
            className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xl border border-sky-400 flex items-center gap-1.5 animate-bounce"
            title="Restore PixelGrip window"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Restore PixelGrip</span>
          </button>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-1.5 rounded-lg border transition-all duration-200 flex items-center gap-1.5 shadow-lg ${
            isRecordingActive
              ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
              : 'bg-slate-900/95 hover:bg-slate-800 border-slate-700/80 text-sky-400'
          }`}
          title="PixelGrip System Tray (Right-click or click for actions)"
        >
          <Camera className="w-4 h-4" />
          {isRecordingActive && (
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          )}
        </button>
      </div>

      {/* Tray Context Menu Popup (Windows 11 / 10 taskbar style) */}
      {isOpen && (
        <div className="absolute bottom-10 right-0 w-64 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl p-1.5 text-xs text-slate-200 backdrop-blur-md z-50 space-y-0.5">
          {/* Header */}
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[10px]">
                PG
              </div>
              <span className="font-bold text-white tracking-wide">PixelGrip System Tray</span>
            </div>
            {isRecordingActive ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Recording
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">Idle</span>
            )}
          </div>

          {/* Quick Actions */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenApp();
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between"
          >
            <span>Open PixelGrip Window</span>
            <span className="text-[10px] text-slate-400">Ctrl+Shift+P</span>
          </button>

          <div className="h-[1px] bg-slate-800 my-1" />

          <button
            onClick={() => {
              setIsOpen(false);
              onCaptureMode('Fullscreen');
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Capture Full Screen</span>
            </div>
            <span className="text-[10px] text-slate-400">PrtScn</span>
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              onCaptureMode('Rectangle');
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Crop className="w-3.5 h-3.5 text-sky-400" />
              <span>Capture Region</span>
            </div>
            <span className="text-[10px] text-slate-400">Ctrl+Shift+R</span>
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              onCaptureMode('ActiveWindow');
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Square className="w-3.5 h-3.5 text-emerald-400" />
              <span>Capture Active Window</span>
            </div>
            <span className="text-[10px] text-slate-400">Ctrl+Shift+W</span>
          </button>

          <div className="h-[1px] bg-slate-800 my-1" />

          {/* Recording Toggle */}
          {isRecordingActive ? (
            <button
              onClick={() => {
                setIsOpen(false);
                onStopRecorder();
              }}
              className="w-full text-left px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold flex items-center gap-2 border border-rose-500/30"
            >
              <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              <span>Stop Screen Recording</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenRecorder();
              }}
              className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Video className="w-3.5 h-3.5 text-rose-400" />
                <span>Start Screen Recording</span>
              </div>
              <span className="text-[10px] text-slate-400">Ctrl+Shift+V</span>
            </button>
          )}

          <div className="h-[1px] bg-slate-800 my-1" />

          {/* History & Settings */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenHistory();
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Recent Captures</span>
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              onOpenSettings();
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Settings & Preferences</span>
          </button>

          <div className="h-[1px] bg-slate-800 my-1" />

          {/* Quit */}
          <button
            onClick={() => {
              setIsOpen(false);
              onQuitApp();
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center gap-2"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Quit PixelGrip</span>
          </button>
        </div>
      )}
    </div>
  );
};
