/**
 * SnapForge Tabbed Editor Window (Phase 4 & Phase 5)
 * Multi-tab workspaces, zoom & pan canvas, vector annotation engine,
 * undo/redo history, image effects, and lossless .snf project format
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Undo2,
  Redo2,
  Crop,
  Sliders,
  Download,
  Copy,
  Printer,
  Pin,
  Save,
  Check,
  ChevronDown,
} from 'lucide-react';
import {
  EditorDocument,
  AnnotationDto,
  AnnotationType,
  Point,
  RectBounds,
  AppSettings,
} from '../types';
import { AnnotationToolbar } from './AnnotationToolbar';
import { CropOverlay } from './CropOverlay';
import { ImageEffectsModal } from './ImageEffectsModal';
import {
  transformImage,
  renderFlattenedCanvas,
} from '../utils/imageEffects';
import { exportImagesToPdf } from '../utils/pdfExport';
import { formatFilename } from '../utils/filenameTemplate';

interface TabbedEditorProps {
  documents: EditorDocument[];
  activeDocId: string;
  onSelectDoc: (id: string) => void;
  onCloseDoc: (id: string) => void;
  onNewDoc: () => void;
  onUpdateDocument: (doc: EditorDocument) => void;
  onPinToScreen: (doc: EditorDocument) => void;
  settings: AppSettings;
  onCloseEditor: () => void;
}

export const TabbedEditor: React.FC<TabbedEditorProps> = ({
  documents,
  activeDocId,
  onSelectDoc,
  onCloseDoc,
  onNewDoc,
  onUpdateDocument,
  onPinToScreen,
  settings,
  onCloseEditor,
}) => {
  const currentDoc = documents.find((d) => d.id === activeDocId) || documents[0];

  // Canvas viewport state
  const [zoom, setZoom] = useState(1); // 1 = 100%
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<Point>({ x: 0, y: 0 });

  // Annotation tool state
  const [activeTool, setActiveTool] = useState<AnnotationType>('select');
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [currentStepNumber, setCurrentStepNumber] = useState(1);

  // Styling defaults
  const [strokeColor, setStrokeColor] = useState('#ef4444');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [opacity, setOpacity] = useState(1);
  const [fontSize, setFontSize] = useState(18);

  // Modals
  const [isCropActive, setIsCropActive] = useState(false);
  const [showEffectsModal, setShowEffectsModal] = useState(false);
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStartPos, setDrawStartPos] = useState<Point | null>(null);
  const [currentDrawBounds, setCurrentDrawBounds] = useState<RectBounds | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Undo / Redo helpers
  const pushUndo = useCallback(
    (newAnnotations: AnnotationDto[]) => {
      if (!currentDoc) return;
      onUpdateDocument({
        ...currentDoc,
        annotations: newAnnotations,
        undoStack: [...currentDoc.undoStack, currentDoc.annotations],
        redoStack: [],
        isModified: true,
      });
    },
    [currentDoc, onUpdateDocument]
  );

  const handleUndo = () => {
    if (!currentDoc || currentDoc.undoStack.length === 0) return;
    const previous = currentDoc.undoStack[currentDoc.undoStack.length - 1];
    const newUndoStack = currentDoc.undoStack.slice(0, -1);
    onUpdateDocument({
      ...currentDoc,
      annotations: previous,
      undoStack: newUndoStack,
      redoStack: [...currentDoc.redoStack, currentDoc.annotations],
    });
    setSelectedAnnotationId(null);
  };

  const handleRedo = () => {
    if (!currentDoc || currentDoc.redoStack.length === 0) return;
    const next = currentDoc.redoStack[currentDoc.redoStack.length - 1];
    const newRedoStack = currentDoc.redoStack.slice(0, -1);
    onUpdateDocument({
      ...currentDoc,
      annotations: next,
      undoStack: [...currentDoc.undoStack, currentDoc.annotations],
      redoStack: newRedoStack,
    });
  };

  // Keyboard shortcuts (Delete, Undo, Redo, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotationId) {
        if (!currentDoc) return;
        pushUndo(currentDoc.annotations.filter((a) => a.id !== selectedAnnotationId));
        setSelectedAnnotationId(null);
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        handleRedo();
      } else if (e.key === 'Escape') {
        setSelectedAnnotationId(null);
        setActiveTool('select');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotationId, currentDoc, pushUndo]);

  // Canvas Mouse Coordinates relative to base image natural size
  const getImageCoordinates = (e: React.MouseEvent): Point => {
    const container = containerRef.current;
    if (!container || !currentDoc) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2 + pan.x;
    const cy = rect.height / 2 + pan.y;

    const imgW = currentDoc.originalWidth * zoom;
    const imgH = currentDoc.originalHeight * zoom;

    const imgLeft = cx - imgW / 2;
    const imgTop = cy - imgH / 2;

    const mouseX = (e.clientX - rect.left - imgLeft) / zoom;
    const mouseY = (e.clientY - rect.top - imgTop) / zoom;

    return {
      x: Math.round(mouseX),
      y: Math.round(mouseY),
    };
  };

  // Mouse Down on Canvas
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Middle click or space = Pan
    if (e.button === 1 || e.altKey) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    if (e.button !== 0 || !currentDoc) return;
    const pt = getImageCoordinates(e);

    if (activeTool === 'select') {
      // Hit test annotations (reverse order to pick top layer)
      const hit = [...currentDoc.annotations].reverse().find((ann) => {
        return (
          pt.x >= ann.bounds.x - 4 &&
          pt.x <= ann.bounds.x + ann.bounds.width + 4 &&
          pt.y >= ann.bounds.y - 4 &&
          pt.y <= ann.bounds.y + ann.bounds.height + 4
        );
      });
      setSelectedAnnotationId(hit ? hit.id : null);
      return;
    }

    // Creating new annotation
    setIsDrawing(true);
    setDrawStartPos(pt);

    if (activeTool === 'step-number') {
      // Immediate single click stamp
      const radius = strokeWidth * 4 + 14;
      const newAnn: AnnotationDto = {
        id: `ann-${Date.now()}`,
        type: 'step-number',
        bounds: { x: pt.x - radius, y: pt.y - radius, width: radius * 2, height: radius * 2 },
        strokeColor: '#ffffff',
        fillColor: strokeColor,
        strokeWidth: 2,
        opacity: 1,
        stepNumber: currentStepNumber,
      };
      pushUndo([...currentDoc.annotations, newAnn]);
      setCurrentStepNumber((n) => n + 1);
      setIsDrawing(false);
      return;
    }

    if (activeTool === 'text') {
      const defaultText = prompt('Enter annotation text:', 'Annotation note') || '';
      if (defaultText.trim()) {
        const newAnn: AnnotationDto = {
          id: `ann-${Date.now()}`,
          type: 'text',
          bounds: { x: pt.x, y: pt.y, width: 220, height: 40 },
          text: defaultText,
          strokeColor,
          fillColor,
          strokeWidth,
          opacity: 1,
          fontSize,
        };
        pushUndo([...currentDoc.annotations, newAnn]);
        setSelectedAnnotationId(newAnn.id);
      }
      setIsDrawing(false);
      return;
    }

    if (activeTool === 'callout') {
      const calloutText = prompt('Enter speech callout text:', 'Step details here') || '';
      if (calloutText.trim()) {
        const newAnn: AnnotationDto = {
          id: `ann-${Date.now()}`,
          type: 'callout',
          bounds: { x: pt.x, y: pt.y, width: 180, height: 54 },
          calloutTail: { x: pt.x + 90, y: pt.y + 80 },
          text: calloutText,
          strokeColor,
          fillColor: fillColor === 'transparent' ? '#ffffff' : fillColor,
          strokeWidth: 2,
          opacity: 1,
          fontSize: 13,
        };
        pushUndo([...currentDoc.annotations, newAnn]);
        setSelectedAnnotationId(newAnn.id);
      }
      setIsDrawing(false);
      return;
    }

    if (activeTool === 'stamp') {
      const newAnn: AnnotationDto = {
        id: `ann-${Date.now()}`,
        type: 'stamp',
        bounds: { x: pt.x - 24, y: pt.y - 24, width: 48, height: 48 },
        stampIcon: 'checkmark',
        strokeColor: '#ffffff',
        fillColor: '#22c55e',
        strokeWidth: 3,
        opacity: 1,
      };
      pushUndo([...currentDoc.annotations, newAnn]);
      setIsDrawing(false);
      return;
    }

    if (activeTool === 'watermark') {
      const wmText = prompt('Enter watermark text:', 'CONFIDENTIAL') || '';
      if (wmText.trim()) {
        const newAnn: AnnotationDto = {
          id: `ann-${Date.now()}`,
          type: 'watermark',
          bounds: { x: 0, y: 0, width: currentDoc.originalWidth, height: currentDoc.originalHeight },
          text: wmText,
          strokeColor: 'rgba(239, 68, 68, 0.25)',
          fillColor: 'transparent',
          strokeWidth: 1,
          opacity: 0.6,
        };
        pushUndo([...currentDoc.annotations, newAnn]);
      }
      setIsDrawing(false);
      return;
    }

    setCurrentDrawBounds({ x: pt.x, y: pt.y, width: 0, height: 0 });
  };

  // Mouse Move on Canvas
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    if (!isDrawing || !drawStartPos) return;
    const pt = getImageCoordinates(e);

    const x = Math.min(drawStartPos.x, pt.x);
    const y = Math.min(drawStartPos.y, pt.y);
    const width = Math.abs(pt.x - drawStartPos.x);
    const height = Math.abs(pt.y - drawStartPos.y);

    setCurrentDrawBounds({ x, y, width, height });
  };

  // Mouse Up on Canvas
  const handleCanvasMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!isDrawing || !drawStartPos || !currentDrawBounds || !currentDoc) {
      setIsDrawing(false);
      return;
    }

    setIsDrawing(false);

    if (currentDrawBounds.width > 5 || currentDrawBounds.height > 5) {
      const newAnn: AnnotationDto = {
        id: `ann-${Date.now()}`,
        type: activeTool,
        bounds: currentDrawBounds,
        strokeColor,
        fillColor: activeTool === 'highlighter' ? 'rgba(250, 204, 21, 0.45)' : fillColor,
        strokeWidth,
        opacity,
        fontSize,
      };
      pushUndo([...currentDoc.annotations, newAnn]);
      setSelectedAnnotationId(newAnn.id);
    }

    setCurrentDrawBounds(null);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((z) => Math.max(0.15, Math.min(6, z * factor)));
  };

  // Transforms (Rotate CW, CCW, Flip H, Flip V)
  const handleRotate = async (angle: number) => {
    if (!currentDoc) return;
    const newBase = await transformImage(currentDoc.baseImageDataUrl, angle);
    const is90 = Math.abs(angle) === 90;
    onUpdateDocument({
      ...currentDoc,
      baseImageDataUrl: newBase,
      originalWidth: is90 ? currentDoc.originalHeight : currentDoc.originalWidth,
      originalHeight: is90 ? currentDoc.originalWidth : currentDoc.originalHeight,
      isModified: true,
    });
  };

  const handleFlip = async (flipH: boolean, flipV: boolean) => {
    if (!currentDoc) return;
    const newBase = await transformImage(currentDoc.baseImageDataUrl, 0, flipH, flipV);
    onUpdateDocument({
      ...currentDoc,
      baseImageDataUrl: newBase,
      isModified: true,
    });
  };

  // Copy to Clipboard (instant PNG blob)
  const handleCopyToClipboard = async () => {
    if (!currentDoc) return;
    try {
      const canvas = await renderFlattenedCanvas(currentDoc.baseImageDataUrl, currentDoc.annotations);
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopyFeedback(true);
          setTimeout(() => setCopyFeedback(false), 2000);
        }
      });
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  // Save / Export Actions
  const handleExportFlattened = async (format: 'png' | 'jpeg' | 'webp' | 'pdf' | 'snf') => {
    if (!currentDoc) return;

    if (format === 'snf') {
      // Phase 5: Lossless Project Format (.snf) JSON
      const projectData = {
        meta: {
          app: 'SnapForge',
          version: '1.0',
          createdAt: new Date().toISOString(),
          originalWidth: currentDoc.originalWidth,
          originalHeight: currentDoc.originalHeight,
        },
        image: currentDoc.baseImageDataUrl,
        annotations: currentDoc.annotations,
      };
      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentDoc.title || 'SnapForge_Project'}.snf`;
      a.click();
      return;
    }

    if (format === 'pdf') {
      const canvas = await renderFlattenedCanvas(currentDoc.baseImageDataUrl, currentDoc.annotations);
      await exportImagesToPdf([canvas.toDataURL('image/png')], `${currentDoc.title}.pdf`);
      return;
    }

    const canvas = await renderFlattenedCanvas(currentDoc.baseImageDataUrl, currentDoc.annotations);
    const mime = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const dataUrl = canvas.toDataURL(mime, settings.jpegQuality / 100);

    const filename = formatFilename(settings.filenameTemplate, {
      mode: 'Editor',
      windowTitle: currentDoc.title,
      appName: 'SnapForge',
      extension: format,
    });

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
    setShowSaveDropdown(false);
  };

  const selectedAnnotation = currentDoc?.annotations.find((a) => a.id === selectedAnnotationId) || null;

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 flex flex-col select-none text-slate-200">
      {/* 1. TOP HEADER & TABS BAR */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs">
        {/* Left: Tab list */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-2xl py-0.5">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => onSelectDoc(doc.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors border text-xs ${
                doc.id === activeDocId
                  ? 'bg-slate-800 text-white border-slate-700 shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 border-transparent hover:bg-slate-850 hover:text-slate-200'
              }`}
            >
              <span className="truncate max-w-[140px] font-medium">{doc.title}</span>
              {documents.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseDoc(doc.id);
                  }}
                  className="p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={onNewDoc}
            title="New Canvas / Sample Document"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Quick Actions (Save, Copy, Pin, Close Editor) */}
        <div className="flex items-center gap-2">
          {/* Copy to Clipboard */}
          <button
            onClick={handleCopyToClipboard}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 text-xs font-medium border border-slate-700"
            title="Copy Flattened Image to Clipboard"
          >
            {copyFeedback ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copyFeedback ? 'Copied!' : 'Copy'}</span>
          </button>

          {/* Pin to Screen */}
          {currentDoc && (
            <button
              onClick={() => onPinToScreen(currentDoc)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
              title="Pin Screenshot on Top (Sticky Note)"
            >
              <Pin className="w-3.5 h-3.5 text-amber-400" />
            </button>
          )}

          {/* Save / Export Menu */}
          <div className="relative">
            <button
              onClick={() => setShowSaveDropdown(!showSaveDropdown)}
              className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-1 text-xs shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save As</span>
              <ChevronDown className="w-3 h-3 opacity-75" />
            </button>

            {showSaveDropdown && (
              <div className="absolute top-full right-0 mt-1.5 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl py-1 z-50 text-xs">
                <button
                  onClick={() => handleExportFlattened('png')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white"
                >
                  Save as PNG (Lossless)
                </button>
                <button
                  onClick={() => handleExportFlattened('jpeg')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white"
                >
                  Save as JPEG (Compressed)
                </button>
                <button
                  onClick={() => handleExportFlattened('webp')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white"
                >
                  Save as WEBP
                </button>
                <button
                  onClick={() => handleExportFlattened('pdf')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white"
                >
                  Export to PDF Document
                </button>
                <div className="h-[1px] bg-slate-800 my-1" />
                <button
                  onClick={() => handleExportFlattened('snf')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-sky-400 hover:text-sky-300 font-medium"
                >
                  Save .SNF Project (Lossless)
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onCloseEditor}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Minimize Editor to Capture Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. SUB-TOOLBAR (Image operations: Crop, Effects, Rotate, Undo, Redo, Zoom) */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-1">
          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={!currentDoc || currentDoc.undoStack.length === 0}
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-40 text-slate-300"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!currentDoc || currentDoc.redoStack.length === 0}
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-40 text-slate-300"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-slate-800 mx-1" />

          {/* Interactive Crop */}
          <button
            onClick={() => setIsCropActive(true)}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
            title="Crop Image"
          >
            <Crop className="w-3.5 h-3.5 text-sky-400" />
            <span>Crop</span>
          </button>

          {/* Image Effects & Resize */}
          <button
            onClick={() => setShowEffectsModal(true)}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
            title="Image Adjustments, Torn Edge, Frame & Resize"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>Effects / Resize</span>
          </button>

          <div className="w-[1px] h-4 bg-slate-800 mx-1" />

          {/* Rotate CW / CCW */}
          <button
            onClick={() => handleRotate(90)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
            title="Rotate 90° Clockwise"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleRotate(-90)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
            title="Rotate 90° Counter-Clockwise"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Flip H / V */}
          <button
            onClick={() => handleFlip(true, false)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
            title="Flip Horizontal"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFlip(false, true)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
            title="Flip Vertical"
          >
            <FlipVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.2, z - 0.2))}
            className="p-1 rounded hover:bg-slate-800 text-slate-300"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-xs w-12 text-center text-slate-300">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(5, z + 0.2))}
            className="p-1 rounded hover:bg-slate-800 text-slate-300"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-medium"
            title="100% Native Resolution"
          >
            100%
          </button>
        </div>
      </div>

      {/* 3. ANNOTATION TOOLS STRIP */}
      <AnnotationToolbar
        activeTool={activeTool}
        onChangeTool={(tool) => {
          setActiveTool(tool);
          if (tool !== 'select') setSelectedAnnotationId(null);
        }}
        selectedAnnotation={selectedAnnotation}
        onUpdateSelectedAnnotation={(partial) => {
          if (!currentDoc || !selectedAnnotationId) return;
          const updated = currentDoc.annotations.map((a) =>
            a.id === selectedAnnotationId ? { ...a, ...partial } : a
          );
          pushUndo(updated);
        }}
        onDeleteSelectedAnnotation={() => {
          if (!currentDoc || !selectedAnnotationId) return;
          pushUndo(currentDoc.annotations.filter((a) => a.id !== selectedAnnotationId));
          setSelectedAnnotationId(null);
        }}
        onReorderSelectedAnnotation={(direction) => {
          if (!currentDoc || !selectedAnnotationId) return;
          const idx = currentDoc.annotations.findIndex((a) => a.id === selectedAnnotationId);
          if (idx === -1) return;
          const newAnns = [...currentDoc.annotations];
          if (direction === 'up' && idx < newAnns.length - 1) {
            [newAnns[idx], newAnns[idx + 1]] = [newAnns[idx + 1], newAnns[idx]];
          } else if (direction === 'down' && idx > 0) {
            [newAnns[idx], newAnns[idx - 1]] = [newAnns[idx - 1], newAnns[idx]];
          }
          pushUndo(newAnns);
        }}
        currentStepNumber={currentStepNumber}
        onResetStepNumber={() => setCurrentStepNumber(1)}
        strokeColor={strokeColor}
        onChangeStrokeColor={setStrokeColor}
        fillColor={fillColor}
        onChangeFillColor={setFillColor}
        strokeWidth={strokeWidth}
        onChangeStrokeWidth={setStrokeWidth}
        opacity={opacity}
        onChangeOpacity={setOpacity}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
      />

      {/* 4. MAIN CANVAS VIEWPORT */}
      <div
        ref={containerRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onWheel={handleWheel}
        className="relative flex-1 overflow-hidden bg-slate-950 flex items-center justify-center cursor-default select-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {currentDoc && (
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              width: `${currentDoc.originalWidth}px`,
              height: `${currentDoc.originalHeight}px`,
            }}
            className="relative shadow-2xl transition-transform duration-75 origin-center bg-transparent"
          >
            {/* Base Screenshot Image */}
            <img
              src={currentDoc.baseImageDataUrl}
              alt="Screenshot Base"
              className="w-full h-full object-contain pointer-events-none"
            />

            {/* SVG Vector Annotations Layer */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ overflow: 'visible' }}
            >
              {currentDoc.annotations.map((ann) => {
                const isSelected = ann.id === selectedAnnotationId;
                return (
                  <g key={ann.id} opacity={ann.opacity ?? 1}>
                    {ann.type === 'rect' && (
                      <rect
                        x={ann.bounds.x}
                        y={ann.bounds.y}
                        width={ann.bounds.width}
                        height={ann.bounds.height}
                        fill={ann.fillColor || 'transparent'}
                        stroke={ann.strokeColor}
                        strokeWidth={ann.strokeWidth}
                      />
                    )}

                    {ann.type === 'rounded-rect' && (
                      <rect
                        x={ann.bounds.x}
                        y={ann.bounds.y}
                        width={ann.bounds.width}
                        height={ann.bounds.height}
                        rx={10}
                        ry={10}
                        fill={ann.fillColor || 'transparent'}
                        stroke={ann.strokeColor}
                        strokeWidth={ann.strokeWidth}
                      />
                    )}

                    {ann.type === 'ellipse' && (
                      <ellipse
                        cx={ann.bounds.x + ann.bounds.width / 2}
                        cy={ann.bounds.y + ann.bounds.height / 2}
                        rx={ann.bounds.width / 2}
                        ry={ann.bounds.height / 2}
                        fill={ann.fillColor || 'transparent'}
                        stroke={ann.strokeColor}
                        strokeWidth={ann.strokeWidth}
                      />
                    )}

                    {(ann.type === 'arrow' || ann.type === 'double-arrow') && (
                      <line
                        x1={ann.bounds.x}
                        y1={ann.bounds.y}
                        x2={ann.bounds.x + ann.bounds.width}
                        y2={ann.bounds.y + ann.bounds.height}
                        stroke={ann.strokeColor}
                        strokeWidth={ann.strokeWidth}
                        markerEnd="url(#arrow-head)"
                      />
                    )}

                    {ann.type === 'line' && (
                      <line
                        x1={ann.bounds.x}
                        y1={ann.bounds.y}
                        x2={ann.bounds.x + ann.bounds.width}
                        y2={ann.bounds.y + ann.bounds.height}
                        stroke={ann.strokeColor}
                        strokeWidth={ann.strokeWidth}
                      />
                    )}

                    {ann.type === 'highlighter' && (
                      <rect
                        x={ann.bounds.x}
                        y={ann.bounds.y}
                        width={ann.bounds.width}
                        height={ann.bounds.height}
                        fill={ann.fillColor || 'rgba(250, 204, 21, 0.45)'}
                        style={{ mixBlendMode: 'multiply' }}
                      />
                    )}

                    {ann.type === 'step-number' && (
                      <g>
                        <circle
                          cx={ann.bounds.x + ann.bounds.width / 2}
                          cy={ann.bounds.y + ann.bounds.height / 2}
                          r={ann.bounds.width / 2}
                          fill={ann.fillColor || '#ef4444'}
                          stroke="#ffffff"
                          strokeWidth="2.5"
                        />
                        <text
                          x={ann.bounds.x + ann.bounds.width / 2}
                          y={ann.bounds.y + ann.bounds.height / 2}
                          fill="#ffffff"
                          fontSize={ann.bounds.width * 0.55}
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontFamily="system-ui, sans-serif"
                        >
                          {ann.stepNumber ?? 1}
                        </text>
                      </g>
                    )}

                    {ann.type === 'text' && ann.text && (
                      <text
                        x={ann.bounds.x}
                        y={ann.bounds.y + (ann.fontSize || 18)}
                        fill={ann.strokeColor}
                        fontSize={ann.fontSize || 18}
                        fontWeight="bold"
                        fontFamily="system-ui, sans-serif"
                      >
                        {ann.text}
                      </text>
                    )}

                    {ann.type === 'callout' && (
                      <g>
                        <rect
                          x={ann.bounds.x}
                          y={ann.bounds.y}
                          width={ann.bounds.width}
                          height={ann.bounds.height}
                          rx={8}
                          fill={ann.fillColor || '#ffffff'}
                          stroke={ann.strokeColor}
                          strokeWidth={ann.strokeWidth}
                        />
                        <polygon
                          points={`${ann.bounds.x + ann.bounds.width * 0.4},${ann.bounds.y + ann.bounds.height} ${ann.calloutTail?.x || ann.bounds.x + ann.bounds.width / 2},${ann.calloutTail?.y || ann.bounds.y + ann.bounds.height + 20} ${ann.bounds.x + ann.bounds.width * 0.6},${ann.bounds.y + ann.bounds.height}`}
                          fill={ann.fillColor || '#ffffff'}
                          stroke={ann.strokeColor}
                          strokeWidth={ann.strokeWidth}
                        />
                        <text
                          x={ann.bounds.x + ann.bounds.width / 2}
                          y={ann.bounds.y + ann.bounds.height / 2}
                          fill="#0f172a"
                          fontSize={ann.fontSize || 13}
                          fontWeight="500"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontFamily="system-ui, sans-serif"
                        >
                          {ann.text}
                        </text>
                      </g>
                    )}

                    {/* Bounding box when selected */}
                    {isSelected && (
                      <rect
                        x={ann.bounds.x - 4}
                        y={ann.bounds.y - 4}
                        width={ann.bounds.width + 8}
                        height={ann.bounds.height + 8}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                      />
                    )}
                  </g>
                );
              })}

              {/* Drawing preview box */}
              {isDrawing && currentDrawBounds && (
                <rect
                  x={currentDrawBounds.x}
                  y={currentDrawBounds.y}
                  width={currentDrawBounds.width}
                  height={currentDrawBounds.height}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray="4 2"
                />
              )}
            </svg>
          </div>
        )}

        {/* Interactive Crop Overlay if triggered */}
        {isCropActive && currentDoc && (
          <CropOverlay
            imageSrc={currentDoc.baseImageDataUrl}
            imageWidth={currentDoc.originalWidth}
            imageHeight={currentDoc.originalHeight}
            onConfirmCrop={(croppedSrc, w, h) => {
              setIsCropActive(false);
              onUpdateDocument({
                ...currentDoc,
                baseImageDataUrl: croppedSrc,
                originalWidth: w,
                originalHeight: h,
                isModified: true,
              });
            }}
            onCancel={() => setIsCropActive(false)}
          />
        )}
      </div>

      {/* 5. BOTTOM STATUS BAR (Dimensions, DPI, Coordinates) */}
      {currentDoc && (
        <div className="flex items-center justify-between px-4 py-1 bg-slate-950 border-t border-slate-800 text-[11px] font-mono text-slate-400">
          <div>
            Canvas: {currentDoc.originalWidth} × {currentDoc.originalHeight} px (96 DPI)
          </div>
          <div className="flex items-center gap-4">
            <span>Layers: {currentDoc.annotations.length}</span>
            <span>Zoom: {Math.round(zoom * 100)}%</span>
            <span>Undo: {currentDoc.undoStack.length}</span>
          </div>
        </div>
      )}

      {/* Effects & Adjustments Modal */}
      {showEffectsModal && currentDoc && (
        <ImageEffectsModal
          imageSrc={currentDoc.baseImageDataUrl}
          originalWidth={currentDoc.originalWidth}
          originalHeight={currentDoc.originalHeight}
          onApply={(newSrc, nw, nh) => {
            onUpdateDocument({
              ...currentDoc,
              baseImageDataUrl: newSrc,
              originalWidth: nw ?? currentDoc.originalWidth,
              originalHeight: nh ?? currentDoc.originalHeight,
              isModified: true,
            });
          }}
          onClose={() => setShowEffectsModal(false)}
        />
      )}
    </div>
  );
};
