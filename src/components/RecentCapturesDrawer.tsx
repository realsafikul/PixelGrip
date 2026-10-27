/**
 * Recent Captures History Drawer (Section 10)
 * Displays thumbnail list, dimensions, timestamp, file size,
 * one-click open in editor, clipboard copy, download, and delete.
 */

import React, { useState } from 'react';
import {
  X,
  Trash2,
  Copy,
  Download,
  FolderOpen,
  Search,
  Check,
  Calendar,
  Layers,
} from 'lucide-react';
import { RecentCapture } from '../types';

interface RecentCapturesDrawerProps {
  captures: RecentCapture[];
  onOpenInEditor: (capture: RecentCapture) => void;
  onDeleteCapture: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export const RecentCapturesDrawer: React.FC<RecentCapturesDrawerProps> = ({
  captures,
  onOpenInEditor,
  onDeleteCapture,
  onClearAll,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = captures.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.mode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = async (capture: RecentCapture) => {
    try {
      const res = await fetch(capture.imageDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopiedId(capture.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (e) {
      console.warn('Copy error:', e);
    }
  };

  const handleDownload = (capture: RecentCapture) => {
    const a = document.createElement('a');
    a.href = capture.imageDataUrl;
    a.download = `${capture.title.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 md:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-slate-200 select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          <h3 className="font-bold text-sm text-white">Recent Captures ({captures.length})</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search captures..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Thumbnails List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No captures found. Take a screenshot to populate history!
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="group bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 transition-all shadow-sm space-y-2"
            >
              <div
                onClick={() => onOpenInEditor(item)}
                className="relative aspect-video bg-black/60 rounded-lg overflow-hidden cursor-pointer border border-slate-800/80 group-hover:opacity-95"
              >
                <img src={item.imageDataUrl} alt={item.title} className="w-full h-full object-contain" />
                <div className="absolute top-1.5 right-1.5 bg-slate-900/90 text-sky-400 text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700/60">
                  {item.width} × {item.height}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="truncate flex-1 pr-2">
                  <div className="font-semibold text-slate-200 truncate">{item.title}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>·</span>
                    <span className="text-sky-400 capitalize">{item.mode}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleCopy(item)}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                    title="Copy Image to Clipboard"
                  >
                    {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDownload(item)}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                    title="Download File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteCapture(item.id)}
                    className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                    title="Delete Capture"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {captures.length > 0 && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono text-[11px]">{captures.length} captures saved</span>
          <button
            onClick={() => {
              if (confirm('Clear all capture history? (Saved files will not be deleted)')) {
                onClearAll();
              }
            }}
            className="text-red-400 hover:text-red-300 text-[11px] hover:underline"
          >
            Clear History
          </button>
        </div>
      )}
    </div>
  );
};
