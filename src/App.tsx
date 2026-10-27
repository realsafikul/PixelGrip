/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  CaptureMode,
  OutputKind,
  AppSettings,
  EditorDocument,
  CaptureResult,
} from './types';
import { CapturePanel } from './components/CapturePanel';
import { CaptureOverlay } from './components/CaptureOverlay';
import { TabbedEditor } from './components/TabbedEditor';
import { ScreenRecorderModal } from './components/ScreenRecorderModal';
import { UtilitiesModal } from './components/UtilitiesModal';
import { PinnedStickyNote } from './components/PinnedStickyNote';
import { SettingsModal } from './components/SettingsModal';
import {
  createSampleDesktopCanvas,
  createSampleScrollingPageCanvas,
  ScreenObjectZone,
} from './utils/sampleImages';
import { formatFilename } from './utils/filenameTemplate';
import { exportImagesToPdf } from './utils/pdfExport';
import {
  Camera,
  Layers,
  Monitor,
  Sparkles,
  Upload,
  Video,
  Eye,
  Sliders,
  Check,
} from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
  defaultOutput: 'Editor',
  outputFolder: 'Pictures/SnapForge',
  outputFormat: 'png',
  jpegQuality: 92,
  filenameTemplate: 'Capture_{yyyy}{MM}{dd}-{HH}{mm}{ss}',
  autoSaveWithoutDialog: false,
  copyToClipboardAfterCapture: true,
  playShutterSound: true,
  includeCursorInCapture: true,
  hotkeys: {
    'Full Screen': 'PrintScreen',
    'Rectangular Region': 'Ctrl+Shift+R',
    'Active Window': 'Ctrl+Shift+W',
    'Scrolling Window': 'Ctrl+Shift+S',
    'Screen Recorder': 'Ctrl+Shift+V',
  },
  recorder: {
    includeMic: true,
    includeSystemAudio: true,
    includeWebcam: false,
    webcamPosition: 'bottom-right',
    webcamShape: 'rounded',
    webcamSize: 'medium',
    showCursorRipples: true,
    frameRate: 30,
    videoQuality: 'high',
    countdownSeconds: 3,
  },
};

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('snapforge_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [outputKind, setOutputKind] = useState<OutputKind>(settings.defaultOutput);

  // Sample desktop fixtures for overlay testing
  const [sampleDesktop, setSampleDesktop] = useState<{
    dataUrl: string;
    objects: ScreenObjectZone[];
  } | null>(null);

  // Active documents in Tabbed Editor
  const [documents, setDocuments] = useState<EditorDocument[]>([]);
  const [activeDocId, setActiveDocId] = useState<string>('');

  // UI States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeCaptureMode, setActiveCaptureMode] = useState<CaptureMode | null>(null);
  const [captureFixedSize, setCaptureFixedSize] = useState<{ width: number; height: number } | undefined>();
  const [showRecorderModal, setShowRecorderModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeUtilityTool, setActiveUtilityTool] = useState<
    'color-picker' | 'magnifier' | 'ruler' | 'crosshair' | 'focus' | 'ocr' | 'combine' | null
  >(null);
  const [pinnedNotes, setPinnedNotes] = useState<
    { id: string; imageSrc: string; title: string }[]
  >([]);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize sample desktop and first sample capture document
  useEffect(() => {
    const desktop = createSampleDesktopCanvas();
    setSampleDesktop(desktop);

    // Initial default sample capture loaded into editor
    const initialDoc: EditorDocument = {
      id: 'doc-initial-1',
      title: 'Desktop Overview',
      baseImageDataUrl: desktop.dataUrl,
      originalWidth: 1440,
      originalHeight: 900,
      annotations: [
        {
          id: 'ann-welcome-1',
          type: 'callout',
          bounds: { x: 340, y: 140, width: 230, height: 60 },
          calloutTail: { x: 300, y: 220 },
          text: 'SnapForge Vector Layer Ready!',
          strokeColor: '#38bdf8',
          fillColor: '#ffffff',
          strokeWidth: 2,
          opacity: 1,
          fontSize: 13,
        },
        {
          id: 'ann-step-1',
          type: 'step-number',
          bounds: { x: 260, y: 190, width: 36, height: 36 },
          strokeColor: '#ffffff',
          fillColor: '#ef4444',
          strokeWidth: 2,
          opacity: 1,
          stepNumber: 1,
        },
      ],
      undoStack: [],
      redoStack: [],
      timestamp: new Date().toISOString(),
      isModified: false,
    };

    setDocuments([initialDoc]);
    setActiveDocId(initialDoc.id);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Play shutter sound via Web Audio API synth
  const playCameraShutterSound = () => {
    if (!settings.playShutterSound) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch {
      // AudioContext not allowed before user interaction
    }
  };

  // Trigger Capture
  const handleStartCapture = async (
    mode: CaptureMode,
    options?: { fixedSize?: { width: number; height: number } }
  ) => {
    setCaptureFixedSize(options?.fixedSize);

    // If Scrolling capture, generate scrolling canvas fixture
    if (mode === 'Scrolling') {
      const scrollFixture = createSampleScrollingPageCanvas();
      setSampleDesktop({
        dataUrl: scrollFixture,
        objects: [],
      });
    }

    setActiveCaptureMode(mode);
  };

  // Real browser display media capture
  const handleCaptureRealDisplay = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as MediaTrackConstraints,
      });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      await new Promise((r) => {
        video.onloadedmetadata = () => r(null);
      });

      // Allow 300ms for video frame to stabilize
      await new Promise((r) => setTimeout(r, 350));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Stop all tracks
      stream.getTracks().forEach((track) => track.stop());

      const dataUrl = canvas.toDataURL('image/png');
      handleCaptureComplete({
        id: `cap-real-${Date.now()}`,
        imageDataUrl: dataUrl,
        width: canvas.width,
        height: canvas.height,
        windowTitle: 'Live Screen Share',
        timestamp: new Date().toISOString(),
        dpiX: 96,
        dpiY: 96,
        mode: 'Fullscreen',
      });
    } catch (err) {
      console.warn('Real screen share prompt was cancelled or not supported:', err);
    }
  };

  // Completion handler from CaptureOverlay
  const handleCaptureComplete = async (result: CaptureResult) => {
    playCameraShutterSound();
    setActiveCaptureMode(null);

    // Copy to clipboard if enabled in settings
    if (settings.copyToClipboardAfterCapture || outputKind === 'Clipboard') {
      try {
        const res = await fetch(result.imageDataUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast('Capture copied to clipboard!');
      } catch (e) {
        console.warn('Could not copy to clipboard:', e);
      }
    }

    // Auto-save to file if requested
    if (outputKind === 'File') {
      const filename = formatFilename(settings.filenameTemplate, {
        mode: result.mode,
        windowTitle: result.windowTitle,
        appName: 'SnapForge',
        extension: settings.outputFormat,
      });
      const a = document.createElement('a');
      a.href = result.imageDataUrl;
      a.download = filename;
      a.click();
      showToast(`Saved to file: ${filename}`);
      return;
    }

    // Export directly to PDF
    if (outputKind === 'PDF') {
      await exportImagesToPdf([result.imageDataUrl], `SnapForge_${Date.now()}.pdf`);
      showToast('Exported capture to PDF document');
      return;
    }

    // Printer
    if (outputKind === 'Printer') {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`<img src="${result.imageDataUrl}" style="max-width:100%"/>`);
        win.document.close();
        win.print();
      }
      return;
    }

    // Default: Open in Tabbed Editor
    const newDoc: EditorDocument = {
      id: result.id,
      title: result.windowTitle || `Capture ${documents.length + 1}`,
      baseImageDataUrl: result.imageDataUrl,
      originalWidth: result.width,
      originalHeight: result.height,
      annotations: [],
      undoStack: [],
      redoStack: [],
      timestamp: result.timestamp,
      isModified: false,
    };

    setDocuments((prev) => [...prev, newDoc]);
    setActiveDocId(newDoc.id);
    setIsEditorOpen(true);
    showToast(`Captured ${result.width} × ${result.height} px into Editor`);
  };

  // Open file from disk
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.snf')) {
      // Load lossless SnapForge project file
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          const newDoc: EditorDocument = {
            id: `doc-${Date.now()}`,
            title: file.name.replace(/\.snf$/, ''),
            baseImageDataUrl: parsed.image,
            originalWidth: parsed.meta.originalWidth || 1200,
            originalHeight: parsed.meta.originalHeight || 800,
            annotations: parsed.annotations || [],
            undoStack: [],
            redoStack: [],
            timestamp: new Date().toISOString(),
            isModified: false,
          };
          setDocuments((prev) => [...prev, newDoc]);
          setActiveDocId(newDoc.id);
          setIsEditorOpen(true);
          showToast('Loaded .SNF project with editable vector layers!');
        } catch {
          showToast('Invalid .SNF project file format');
        }
      };
      reader.readAsText(file);
      return;
    }

    // Standard image file
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const newDoc: EditorDocument = {
          id: `doc-${Date.now()}`,
          title: file.name,
          baseImageDataUrl: dataUrl,
          originalWidth: img.width,
          originalHeight: img.height,
          annotations: [],
          undoStack: [],
          redoStack: [],
          timestamp: new Date().toISOString(),
          isModified: false,
        };
        setDocuments((prev) => [...prev, newDoc]);
        setActiveDocId(newDoc.id);
        setIsEditorOpen(true);
        showToast(`Loaded ${file.name} (${img.width} × ${img.height} px)`);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop image files onto application window
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const newDoc: EditorDocument = {
          id: `doc-${Date.now()}`,
          title: file.name,
          baseImageDataUrl: dataUrl,
          originalWidth: img.width,
          originalHeight: img.height,
          annotations: [],
          undoStack: [],
          redoStack: [],
          timestamp: new Date().toISOString(),
          isModified: false,
        };
        setDocuments((prev) => [...prev, newDoc]);
        setActiveDocId(newDoc.id);
        setIsEditorOpen(true);
        showToast(`Dropped image: ${file.name}`);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const currentDoc = documents.find((d) => d.id === activeDocId) || null;

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 flex flex-col select-none"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.snf"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* TOP DESKTOP CHROME BAR (FastStone Environment Header) */}
      <header className="h-12 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-5 flex items-center justify-between gap-8 z-30">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white whitespace-nowrap">
            SnapForge
          </span>
          <span className="text-slate-500 text-xs hidden sm:inline">·</span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Screen Capture, Annotation & Recorder Suite
          </span>
        </div>

        {/* Action button on right */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleCaptureRealDisplay}
            className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium flex items-center gap-1.5 shadow transition-colors"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Share / Capture Live Display</span>
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT: DESKTOP SIMULATOR & TESTING STAGE */}
      <main className="relative flex-1 overflow-hidden bg-[#090d16] flex items-center justify-center p-6">
        {/* Background Desktop Preview (1440 x 900 interactive canvas mockup) */}
        {sampleDesktop && (
          <div className="relative w-full max-w-[1440px] max-h-[860px] aspect-[16/10] rounded-xl overflow-hidden shadow-2xl border border-slate-800/80 bg-slate-900">
            <img
              src={sampleDesktop.dataUrl}
              alt="Desktop Simulation"
              className="w-full h-full object-contain pointer-events-none"
            />

            {/* Quick Interactive Tooltip Badges on Desktop */}
            <div className="absolute top-4 right-4 bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 backdrop-blur-md text-xs space-y-1.5 max-w-xs shadow-xl">
              <div className="flex items-center gap-2 text-sky-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SnapForge Ready</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Use the floating <strong>Capture Panel</strong> toolbar below to test Region loupe,
                Window object detection, Freehand lasso, Scrolling stitch, and Video recording.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* FASTSTONE FLOATING CAPTURE PANEL (Always accessible toolbar) */}
      <CapturePanel
        onStartCapture={handleStartCapture}
        onOpenRecorder={() => setShowRecorderModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenFile={() => fileInputRef.current?.click()}
        onOpenTool={(tool) => setActiveUtilityTool(tool)}
        outputKind={outputKind}
        onChangeOutputKind={setOutputKind}
        settings={settings}
        onUpdateSettings={(newPartial) => {
          const updated = { ...settings, ...newPartial };
          setSettings(updated);
          localStorage.setItem('snapforge_settings', JSON.stringify(updated));
        }}
        activeTabCount={documents.length}
        onToggleEditor={() => setIsEditorOpen(!isEditorOpen)}
        isEditorOpen={isEditorOpen}
      />

      {/* CAPTURE OVERLAY (Activated when user clicks any capture mode) */}
      {activeCaptureMode && sampleDesktop && (
        <CaptureOverlay
          mode={activeCaptureMode}
          desktopDataUrl={sampleDesktop.dataUrl}
          detectedObjects={sampleDesktop.objects}
          fixedSize={captureFixedSize}
          onComplete={handleCaptureComplete}
          onCancel={() => setActiveCaptureMode(null)}
        />
      )}

      {/* FULL TABBED EDITOR WINDOW */}
      {isEditorOpen && (
        <TabbedEditor
          documents={documents}
          activeDocId={activeDocId}
          onSelectDoc={setActiveDocId}
          onCloseDoc={(id) => {
            const remaining = documents.filter((d) => d.id !== id);
            setDocuments(remaining);
            if (activeDocId === id && remaining.length > 0) {
              setActiveDocId(remaining[0].id);
            }
          }}
          onNewDoc={() => {
            const nextIdx = documents.length + 1;
            const freshDesktop = createSampleDesktopCanvas();
            const newDoc: EditorDocument = {
              id: `doc-${Date.now()}`,
              title: `Workspace ${nextIdx}`,
              baseImageDataUrl: freshDesktop.dataUrl,
              originalWidth: 1440,
              originalHeight: 900,
              annotations: [],
              undoStack: [],
              redoStack: [],
              timestamp: new Date().toISOString(),
              isModified: false,
            };
            setDocuments((prev) => [...prev, newDoc]);
            setActiveDocId(newDoc.id);
          }}
          onUpdateDocument={(updated) => {
            setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          }}
          onPinToScreen={(doc) => {
            if (!pinnedNotes.some((n) => n.id === doc.id)) {
              setPinnedNotes((prev) => [
                ...prev,
                { id: doc.id, imageSrc: doc.baseImageDataUrl, title: doc.title },
              ]);
              showToast(`Pinned "${doc.title}" to screen`);
            }
          }}
          settings={settings}
          onCloseEditor={() => setIsEditorOpen(false)}
        />
      )}

      {/* SCREEN RECORDER & VIDEO TRIMMER MODAL */}
      {showRecorderModal && (
        <ScreenRecorderModal
          initialSettings={settings.recorder}
          onClose={() => setShowRecorderModal(false)}
        />
      )}

      {/* UTILITIES SUITE MODAL (Color Picker, Magnifier, Ruler, Crosshair, Focus, OCR, Combine) */}
      {activeUtilityTool && (
        <UtilitiesModal
          tool={activeUtilityTool}
          currentDocument={currentDoc}
          documents={documents}
          onClose={() => setActiveUtilityTool(null)}
          onImportCombinedImage={(dataUrl, title) => {
            const newDoc: EditorDocument = {
              id: `doc-comb-${Date.now()}`,
              title,
              baseImageDataUrl: dataUrl,
              originalWidth: 1400,
              originalHeight: 900,
              annotations: [],
              undoStack: [],
              redoStack: [],
              timestamp: new Date().toISOString(),
              isModified: false,
            };
            setDocuments((prev) => [...prev, newDoc]);
            setActiveDocId(newDoc.id);
            setIsEditorOpen(true);
            showToast('Combined screenshot opened in Editor');
          }}
        />
      )}

      {/* PINNED STICKY NOTES */}
      {pinnedNotes.map((note) => (
        <PinnedStickyNote
          key={note.id}
          id={note.id}
          imageSrc={note.imageSrc}
          title={note.title}
          onClose={() => setPinnedNotes((prev) => prev.filter((n) => n.id !== note.id))}
        />
      ))}

      {/* PREFERENCES & SETTINGS MODAL */}
      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onSave={(newSettings) => {
            setSettings(newSettings);
            localStorage.setItem('snapforge_settings', JSON.stringify(newSettings));
            showToast('Settings saved successfully');
          }}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
