/**
 * Sample Desktop & Application Screen Fixtures for SnapForge
 * Used for testing region capture, window/object detection, scrolling stitch, and editor tools
 */

export interface ScreenObjectZone {
  id: string;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
}

export function createSampleDesktopCanvas(): { dataUrl: string; objects: ScreenObjectZone[] } {
  const canvas = document.createElement('canvas');
  canvas.width = 1440;
  canvas.height = 900;
  const ctx = canvas.getContext('2d')!;

  // Desktop Wallpaper - deep refined slate gradient
  const grad = ctx.createLinearGradient(0, 0, 1440, 900);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(0.5, '#1e293b');
  grad.addColorStop(1, '#090d16');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1440, 900);

  // Subtle geometric grid background
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 1440; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 900);
    ctx.stroke();
  }
  for (let y = 0; y < 900; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1440, y);
    ctx.stroke();
  }

  const objects: ScreenObjectZone[] = [];

  // Window 1: Code IDE (Left side)
  const ideBounds = { x: 80, y: 70, width: 780, height: 720 };
  objects.push({ id: 'ide-window', name: 'VS Code Editor [Main Window]', bounds: ideBounds });

  // Window Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#181825';
  ctx.beginPath();
  ctx.roundRect(ideBounds.x, ideBounds.y, ideBounds.width, ideBounds.height, 10);
  ctx.fill();
  ctx.restore();

  // IDE Title bar
  const titleBarBounds = { x: ideBounds.x, y: ideBounds.y, width: ideBounds.width, height: 42 };
  objects.push({ id: 'ide-titlebar', name: 'Window Titlebar [Controls]', bounds: titleBarBounds });
  ctx.fillStyle = '#11111b';
  ctx.beginPath();
  ctx.roundRect(ideBounds.x, ideBounds.y, ideBounds.width, 42, [10, 10, 0, 0]);
  ctx.fill();

  // Window controls (Red, Yellow, Green dots)
  const dots = ['#ef4444', '#f59e0b', '#10b981'];
  dots.forEach((color, idx) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(ideBounds.x + 24 + idx * 20, ideBounds.y + 21, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  // Window title text
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SnapForge.Native / CaptureEngine.cs — Visual Studio Code', ideBounds.x + ideBounds.width / 2, ideBounds.y + 26);

  // IDE Sidebar
  const sidebarBounds = { x: ideBounds.x, y: ideBounds.y + 42, width: 200, height: ideBounds.height - 42 };
  objects.push({ id: 'ide-sidebar', name: 'File Explorer Sidebar [Tree]', bounds: sidebarBounds });
  ctx.fillStyle = '#1e1e2e';
  ctx.fillRect(sidebarBounds.x, sidebarBounds.y, sidebarBounds.width, sidebarBounds.height);

  ctx.fillStyle = '#64748b';
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('EXPLORER', sidebarBounds.x + 16, sidebarBounds.y + 24);

  const files = [
    '▼ SnapForge.Native',
    '    PInvoke.cs',
    '    WindowHelper.cs',
    '    DpiAwareness.cs',
    '▼ SnapForge.Capture',
    '  ▶ RegionEngine.cs',
    '  ▶ ScrollingEngine.cs',
    '▼ SnapForge.Annotations',
    '    CalloutBubble.cs',
    '    StepBadge.cs',
  ];
  files.forEach((f, i) => {
    ctx.fillStyle = i === 1 ? '#38bdf8' : '#cbd5e1';
    ctx.font = '12px "Consolas", monospace';
    ctx.fillText(f, sidebarBounds.x + 16, sidebarBounds.y + 54 + i * 24);
  });

  // IDE Editor Area
  const editorAreaBounds = {
    x: ideBounds.x + 200,
    y: ideBounds.y + 42,
    width: ideBounds.width - 200,
    height: ideBounds.height - 42,
  };
  objects.push({ id: 'ide-code-area', name: 'Code Editor [Editor Document]', bounds: editorAreaBounds });

  ctx.fillStyle = '#181825';
  ctx.fillRect(editorAreaBounds.x, editorAreaBounds.y, editorAreaBounds.width, editorAreaBounds.height);

  // Code lines
  const codeLines = [
    '// Phase 1: Capture Panel and Region Loupe Engine',
    'public sealed class RegionCaptureEngine : ICaptureEngine',
    '{',
    '    private readonly MagnifierLoupe _loupe = new(zoomFactor: 4.0);',
    '',
    '    public async Task<CaptureResult> CaptureRegionAsync(Rect targetArea)',
    '    {',
    '        using var screenDC = NativeMethods.GetDC(IntPtr.Zero);',
    '        var bitmap = new BitmapSource(targetArea.Width, targetArea.Height);',
    '        NativeMethods.BitBlt(bitmap.DC, 0, 0, targetArea.Width, targetArea.Height,',
    '                             screenDC, targetArea.X, targetArea.Y, CopyPixelOperation.SourceCopy);',
    '        return new CaptureResult(bitmap, "VS Code", DateTime.UtcNow);',
    '    }',
    '}',
  ];

  codeLines.forEach((line, index) => {
    // Line number
    ctx.fillStyle = '#475569';
    ctx.font = '12px "Consolas", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(String(index + 1), editorAreaBounds.x + 36, editorAreaBounds.y + 36 + index * 22);

    // Code text
    ctx.textAlign = 'left';
    if (line.startsWith('//')) {
      ctx.fillStyle = '#6ee7b7';
    } else if (line.includes('class') || line.includes('public') || line.includes('private') || line.includes('async')) {
      ctx.fillStyle = '#f43f5e';
    } else if (line.includes('"')) {
      ctx.fillStyle = '#fde047';
    } else {
      ctx.fillStyle = '#e2e8f0';
    }
    ctx.fillText(line, editorAreaBounds.x + 50, editorAreaBounds.y + 36 + index * 22);
  });

  // Window 2: Analytics Dashboard (Right side)
  const dashBounds = { x: 890, y: 120, width: 480, height: 600 };
  objects.push({ id: 'analytics-window', name: 'SnapForge Analytics [Floating Window]', bounds: dashBounds });

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(dashBounds.x, dashBounds.y, dashBounds.width, dashBounds.height, 10);
  ctx.fill();
  ctx.restore();

  // Dashboard Header
  const dashHeaderBounds = { x: dashBounds.x, y: dashBounds.y, width: dashBounds.width, height: 48 };
  objects.push({ id: 'analytics-header', name: 'Dashboard Header [Metrics]', bounds: dashHeaderBounds });
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(dashBounds.x, dashBounds.y, dashBounds.width, 48, [10, 10, 0, 0]);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Capture Performance & Output Stream', dashBounds.x + 20, dashBounds.y + 30);

  // Metric Cards
  const card1 = { x: dashBounds.x + 20, y: dashBounds.y + 70, width: 210, height: 110 };
  const card2 = { x: dashBounds.x + 250, y: dashBounds.y + 70, width: 210, height: 110 };
  objects.push({ id: 'kpi-card-1', name: 'Metric Card [Frame Latency]', bounds: card1 });
  objects.push({ id: 'kpi-card-2', name: 'Metric Card [Buffer Memory]', bounds: card2 });

  // Draw Card 1
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(card1.x, card1.y, card1.width, card1.height, 8);
  ctx.fill();
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Frame Capture Latency', card1.x + 16, card1.y + 30);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 28px "Consolas", monospace';
  ctx.fillText('1.8 ms', card1.x + 16, card1.y + 70);

  // Draw Card 2
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(card2.x, card2.y, card2.width, card2.height, 8);
  ctx.fill();
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Peak Resident RAM', card2.x + 16, card2.y + 30);
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 28px "Consolas", monospace';
  ctx.fillText('48.2 MB', card2.x + 16, card2.y + 70);

  // Chart inside dashboard
  const chartBounds = { x: dashBounds.x + 20, y: dashBounds.y + 200, width: 440, height: 260 };
  objects.push({ id: 'chart-container', name: 'Render Pipeline Chart [Time Series]', bounds: chartBounds });
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(chartBounds.x, chartBounds.y, chartBounds.width, chartBounds.height, 8);
  ctx.fill();

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('60 FPS Video Frame Cadence', chartBounds.x + 16, chartBounds.y + 30);

  // Draw chart line
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  const points = [
    [0, 180], [40, 150], [80, 160], [120, 110], [160, 130],
    [200, 90], [240, 100], [280, 70], [320, 80], [360, 50], [400, 60]
  ];
  points.forEach(([px, py], idx) => {
    const rx = chartBounds.x + 20 + px;
    const ry = chartBounds.y + 60 + py;
    if (idx === 0) ctx.moveTo(rx, ry);
    else ctx.lineTo(rx, ry);
  });
  ctx.stroke();

  // Taskbar on bottom
  const taskbarBounds = { x: 0, y: 852, width: 1440, height: 48 };
  objects.push({ id: 'windows-taskbar', name: 'Windows Taskbar [Shell Surface]', bounds: taskbarBounds });
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(0, 852, 1440, 48);

  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(36, 876, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('Start', 60, 880);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('10:42 AM  |  SnapForge Ready', 1420, 880);

  return { dataUrl: canvas.toDataURL('image/png'), objects };
}

/**
 * Creates a tall, scrollable web page canvas (1200 x 3200 px) for testing the Scrolling Capture & Stitching engine
 */
export function createSampleScrollingPageCanvas(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 3200;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 1200, 3200);

  // Top Sticky Header
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1200, 72);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SnapForge Documentation & Architecture Guide', 48, 44);

  // Section 1: Hero
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.fillText('High-Performance Screen Capture Architecture', 64, 160);
  ctx.fillStyle = '#64748b';
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('Complete specification and engineering roadmap for lightweight desktop tools.', 64, 205);

  // Card 1: Key Decisions
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.05)';
  ctx.shadowBlur = 10;
  ctx.fillRect(64, 260, 1072, 340);
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(64, 260, 1072, 340);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('1. Architectural Foundations', 96, 310);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = '#334155';
  const textLines1 = [
    '• Capture APIs: GDI (BitBlt/PrintWindow) for pristine stills; Desktop Media APIs for 60fps video.',
    '• Object Detection: UI Automation traversal to highlight nested child controls.',
    '• Global Hotkeys: Configurable keys with conflict resolution and overlay suppression.',
    '• Memory Target: Under 15 MB footprint, under 80 MB RAM at idle with instant wake-up.',
    '• Lossless Project Format: Complete .snf format storing vector layers alongside pixel maps.',
  ];
  textLines1.forEach((t, i) => ctx.fillText(t, 96, 355 + i * 40));

  // Section 2: Scrolling Stitching Mechanics (y = 660)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(64, 660, 1072, 420);
  ctx.strokeRect(64, 660, 1072, 420);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('2. Scrolling Window & Web Page Stitching Algorithm', 96, 710);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = '#334155';
  const textLines2 = [
    'Step A: Identify scrollable target viewport (browser window, document, or nested panel).',
    'Step B: Capture initial viewport frame into memory buffer.',
    'Step C: Send incremental scroll commands (PageDown or smooth mouse wheel delta).',
    'Step D: Wait 150-250ms for repainting, capture subsequent frame.',
    'Step E: Find vertical overlap between Frame N and Frame N+1 using row hash correlation.',
    'Step F: Detect and trim sticky headers and pinned navigation bars.',
    'Step G: Stitch slice rows onto master panoramic canvas until page end is reached.',
  ];
  textLines2.forEach((t, i) => ctx.fillText(t, 96, 755 + i * 42));

  // Section 3: Annotations & Drawing Engine (y = 1140)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(64, 1140, 1072, 440);
  ctx.strokeRect(64, 1140, 1072, 440);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('3. Vector Annotation & Redaction Engine', 96, 1190);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = '#334155';
  const textLines3 = [
    '• 8-handle bounding selection boxes with uniform rotation and scale.',
    '• FastStone step number badges with automatic sequential numbering (1, 2, 3...).',
    '• Interactive speech callouts with movable pointer tails.',
    '• Multiply blend highlighter tool for highlighting code and documentation.',
    '• Sensitive data redaction with configurable Gaussian blur and pixelation grid.',
    '• Spotlight presentation tool darkening peripheral background.',
  ];
  textLines3.forEach((t, i) => ctx.fillText(t, 96, 1235 + i * 42));

  // Section 4: Video Recorder & Audio Mixing (y = 1640)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(64, 1640, 1072, 440);
  ctx.strokeRect(64, 1640, 1072, 440);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('4. Screen Recorder & Webcam PiP Synthesis', 96, 1690);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = '#334155';
  const textLines4 = [
    '• Hardware accelerated MediaRecorder video encoding at 30/60 fps.',
    '• Multi-track audio synchronization mixing system output and microphone input.',
    '• Live webcam Picture-in-Picture compositing in selected corner.',
    '• Real-time cursor highlighting and animated click ripple indicator.',
    '• Built-in trimmer and animated GIF converter with palette optimization.',
  ];
  textLines4.forEach((t, i) => ctx.fillText(t, 96, 1735 + i * 42));

  // Section 5: Utility Instruments (y = 2140)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(64, 2140, 1072, 440);
  ctx.strokeRect(64, 2140, 1072, 440);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('5. Precision Desktop Measurement Utilities', 96, 2190);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = '#334155';
  const textLines5 = [
    '• Magnifying Color Picker: Live loupe under cursor with instant HEX/RGB/HSL copy.',
    '• Floating Screen Magnifier: Zoom lens with 2x to 16x magnification.',
    '• Screen Ruler: Draggable pixel ruler with horizontal and vertical orientations.',
    '• Screen Crosshair: Full desktop guide lines with pixel offset counters.',
    '• Pinned Sticky Note: Float any capture topmost with opacity control.',
  ];
  textLines5.forEach((t, i) => ctx.fillText(t, 96, 2235 + i * 42));

  // Footer (y = 2640)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 2640, 1200, 560);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('SnapForge Screen Suite', 64, 2720);
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Production-ready screen capture, recording and annotation engine.', 64, 2760);
  ctx.fillText('End of long document — all 3,200 vertical pixels rendered.', 64, 3050);

  return canvas.toDataURL('image/png');
}
