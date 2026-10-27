/**
 * Settings Modal for SnapForge
 * Configures default outputs, filename templates, hotkeys, and image formats
 */

import React, { useState } from 'react';
import { X, Check, Keyboard, Folder, FileText, Sliders, Volume2 } from 'lucide-react';
import { AppSettings, OutputKind } from '../types';
import { formatFilename } from '../utils/filenameTemplate';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose,
}) => {
  const [form, setForm] = useState<AppSettings>({ ...settings });
  const [activeTab, setActiveTab] = useState<'general' | 'filename' | 'hotkeys'>('general');

  const previewFilename = formatFilename(form.filenameTemplate, {
    mode: 'Region',
    windowTitle: 'Chrome',
    appName: 'SnapForge',
    counter: 42,
    extension: form.outputFormat,
  });

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <span>PixelGrip Preferences & Settings</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-slate-800 bg-slate-900/90 px-6 gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-sky-400 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            General & Output
          </button>
          <button
            onClick={() => setActiveTab('filename')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'filename'
                ? 'border-sky-400 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Filename Template
          </button>
          <button
            onClick={() => setActiveTab('hotkeys')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'hotkeys'
                ? 'border-sky-400 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Hotkeys Map
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Default Output Destination</label>
                <select
                  value={form.defaultOutput}
                  onChange={(e) => setForm({ ...form, defaultOutput: e.target.value as OutputKind })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="Editor">To Editor (Review & Annotate)</option>
                  <option value="Clipboard">To Clipboard (Instant Copy)</option>
                  <option value="File">To File (Auto-save to disk)</option>
                  <option value="PDF">To PDF (Document export)</option>
                  <option value="Printer">To Printer</option>
                  <option value="Email">To Email</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Default Image Format</label>
                  <select
                    value={form.outputFormat}
                    onChange={(e) => setForm({ ...form, outputFormat: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white uppercase"
                  >
                    <option value="png">PNG (Lossless 24-bit)</option>
                    <option value="jpeg">JPEG (Compressed)</option>
                    <option value="webp">WEBP (High Efficiency)</option>
                    <option value="bmp">BMP (Windows Bitmap)</option>
                    <option value="pdf">PDF (Single Document)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">JPEG Quality ({form.jpegQuality}%)</label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={form.jpegQuality}
                    onChange={(e) => setForm({ ...form, jpegQuality: Number(e.target.value) })}
                    className="w-full mt-2 accent-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2.5 p-2 rounded hover:bg-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.autoSaveWithoutDialog}
                    onChange={(e) => setForm({ ...form, autoSaveWithoutDialog: e.target.checked })}
                    className="accent-sky-500 rounded"
                  />
                  <span>Auto-save captures without showing Save Dialog</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded hover:bg-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.copyToClipboardAfterCapture}
                    onChange={(e) => setForm({ ...form, copyToClipboardAfterCapture: e.target.checked })}
                    className="accent-sky-500 rounded"
                  />
                  <span>Always copy captured image to clipboard</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded hover:bg-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.playShutterSound}
                    onChange={(e) => setForm({ ...form, playShutterSound: e.target.checked })}
                    className="accent-sky-500 rounded"
                  />
                  <span>Play audio shutter feedback on capture</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'filename' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Filename Template Pattern</label>
                <input
                  type="text"
                  value={form.filenameTemplate}
                  onChange={(e) => setForm({ ...form, filenameTemplate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-white text-xs"
                />
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block">
                  Generated Filename Preview:
                </span>
                <div className="font-mono text-sky-400 text-xs bg-slate-900 p-2.5 rounded border border-slate-800 break-all">
                  {previewFilename}
                </div>
              </div>

              <div className="text-slate-400 text-[11px] space-y-1">
                <div className="font-semibold text-slate-300 mb-1">Available Tokens:</div>
                <div><code className="text-sky-300 font-mono">{"{yyyy}{MM}{dd}"}</code> - Year, Month, Day</div>
                <div><code className="text-sky-300 font-mono">{"{HH}{mm}{ss}"}</code> - Hours, Minutes, Seconds</div>
                <div><code className="text-sky-300 font-mono">{"{counter:000}"}</code> - Sequential counter padded with 3 digits</div>
                <div><code className="text-sky-300 font-mono">{"{mode}"}</code> - Capture mode name (e.g. Region, Fullscreen)</div>
                <div><code className="text-sky-300 font-mono">{"{window}"}</code> - Active window title</div>
              </div>
            </div>
          )}

          {activeTab === 'hotkeys' && (
            <div className="space-y-3">
              <span className="text-slate-400 block mb-2">Configure Global Capture Hotkeys:</span>
              {Object.entries(form.hotkeys).map(([action, key]) => (
                <div
                  key={action}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800"
                >
                  <span className="font-medium text-slate-300">{action}</span>
                  <input
                    type="text"
                    value={key}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        hotkeys: { ...form.hotkeys, [action]: e.target.value },
                      })
                    }
                    className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 font-mono text-sky-300 text-xs text-right w-36"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/60 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-1.5 shadow"
          >
            <Check className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
