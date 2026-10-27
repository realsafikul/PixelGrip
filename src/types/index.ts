/**
 * SnapForge Data Models & Interfaces
 * FastStone-Style Screen Capture and Recorder Architecture
 */

export type CaptureMode =
  | 'ActiveWindow'
  | 'Window'
  | 'Object'
  | 'Menu'
  | 'Fullscreen'
  | 'Rectangle'
  | 'Freehand'
  | 'FixedRegion'
  | 'Scrolling'
  | 'AutoRepeat';

export type OutputKind =
  | 'Editor'
  | 'Clipboard'
  | 'File'
  | 'PDF'
  | 'Printer'
  | 'Email';

export interface CaptureOptions {
  mode: CaptureMode;
  delayMs: number;
  includeCursor: boolean;
  fixedSize?: { width: number; height: number };
  maxScrollHeight?: number;
}

export interface CaptureResult {
  id: string;
  imageDataUrl: string;
  width: number;
  height: number;
  windowTitle?: string;
  appName?: string;
  timestamp: string;
  dpiX: number;
  dpiY: number;
  mode: CaptureMode;
}

export type AnnotationType =
  | 'select'
  | 'text'
  | 'curved-text'
  | 'arrow'
  | 'double-arrow'
  | 'line'
  | 'rect'
  | 'rounded-rect'
  | 'ellipse'
  | 'callout'
  | 'step-number'
  | 'highlighter'
  | 'blur'
  | 'pixelate'
  | 'spotlight'
  | 'watermark'
  | 'stamp';

export interface Point {
  x: number;
  y: number;
}

export interface RectBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnnotationDto {
  id: string;
  type: AnnotationType;
  bounds: RectBounds;
  text?: string;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  arrowHeadStyle?: 'simple' | 'filled' | 'stealth';
  calloutTail?: Point;
  stepNumber?: number;
  stampIcon?: string;
  curveRadius?: number;
  rotation?: number;
  points?: Point[]; // for freehand or polygon lines
  extra?: Record<string, string>;
}

export interface EditorDocument {
  id: string;
  title: string;
  baseImageDataUrl: string;
  originalWidth: number;
  originalHeight: number;
  annotations: AnnotationDto[];
  undoStack: AnnotationDto[][];
  redoStack: AnnotationDto[][];
  timestamp: string;
  isModified: boolean;
}

export interface RecorderSettings {
  includeMic: boolean;
  includeSystemAudio: boolean;
  includeWebcam: boolean;
  webcamPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  webcamShape: 'circle' | 'rounded';
  webcamSize: 'small' | 'medium' | 'large';
  showCursorRipples: boolean;
  frameRate: 15 | 24 | 30 | 60;
  videoQuality: 'high' | 'medium' | 'low';
  countdownSeconds: number;
}

export interface AppSettings {
  defaultOutput: OutputKind;
  outputFolder: string;
  outputFormat: 'png' | 'jpeg' | 'webp' | 'bmp' | 'pdf';
  jpegQuality: number;
  filenameTemplate: string;
  autoSaveWithoutDialog: boolean;
  copyToClipboardAfterCapture: boolean;
  playShutterSound: boolean;
  includeCursorInCapture: boolean;
  hotkeys: Record<string, string>;
  recorder: RecorderSettings;
}
