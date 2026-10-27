# PixelGrip / SnapForge — Full AI Implementation Specification
## Goal
Upgrade the existing `PixelGrip-main` application into a polished, practical Windows-oriented screen-capture, annotation, image-editing, and screen-recording app inspired by the feature set listed in the supplied FastStone Capture release notes. Implement the requested capabilities in the existing project rather than creating a separate demo or replacing the application wholesale.

**Important:** The supplied release notes describe another product. Use them only as a feature reference. Do not copy its branding, proprietary assets, source code, or claim PixelGrip is FastStone. The project currently identifies itself as “SnapForge - Screen Capture & Recorder.”

## 1. Mandatory working method for any AI coding agent
1. Inspect the entire repository before changing code. Read `package.json`, `src/App.tsx`, all files in `src/components`, `src/types/index.ts`, `src/utils`, styles, and the included build-guide PDF if available.
2. Produce a short implementation plan grouped into: existing/working, existing/partial, missing, and blocked by browser limitations.
3. Preserve the current React + TypeScript + Vite architecture and existing visual identity unless a change is necessary.
4. Do not replace functioning features with mockups, static screenshots, sample-only interactions, or “coming soon” buttons. Every visible control must perform its advertised action or be clearly disabled with an explanation.
5. Implement in small, coherent stages. After each stage run the repository’s available checks, at minimum `npm run lint` and `npm run build` (or the package manager equivalent). Fix all new TypeScript/build errors before moving on.
6. Do not claim that a feature is complete unless you tested its real behavior. List any unimplemented features and platform restrictions honestly.
7. Keep changes maintainable: reusable components, typed models, clear utility functions, error handling, accessible labels, keyboard support, and concise comments for non-obvious logic.
8. Avoid introducing dependencies without a clear need. Check browser support and package compatibility before adding a library.
9. Do not expose API keys or secrets in client code. If OCR/AI features need a remote service, use a secure server-side endpoint or clearly document a local/offline alternative.
10. Finish with a change summary, files changed, commands/tests run, known limitations, and manual test instructions.

## 2. Current project baseline to preserve
The repository is a React 19 + TypeScript + Vite app. `src/App.tsx` coordinates capture flows, editor documents, settings, recorder modal, utility tools, pinned notes, and output actions. Existing components include:
- `CapturePanel.tsx`
- `CaptureOverlay.tsx`
- `CropOverlay.tsx`
- `AnnotationToolbar.tsx`
- `TabbedEditor.tsx`
- `ScreenRecorderModal.tsx`
- `UtilitiesModal.tsx`
- `PinnedStickyNote.tsx`
- `SettingsModal.tsx`
- `ImageEffectsModal.tsx`

Existing types include capture modes such as active window, window/object/menu, full screen, rectangle, freehand, fixed region, scrolling and auto-repeat; output kinds such as editor, clipboard, file, PDF, printer and email; annotation types such as text, curved text, arrows, lines, shapes, callouts, numbered steps, highlighter, blur, pixelate, spotlight, watermark and stamps; recorder settings for microphone, system audio, webcam, position, shape, size, cursor ripples, frame rate, quality and countdown. These type definitions do not by themselves prove the feature works: verify each implementation and connect any incomplete flows.

## 3. Product goals and UX
- Make a cohesive desktop-first app that remains usable at smaller window sizes.
- Main capture panel should provide clear, discoverable actions and show configured hotkeys.
- Editor should support multiple tabs/documents, zoom, fit-to-window, actual-size view, undo/redo, save/save-as, and a clear modified/unsaved indicator.
- Use dialogs for destructive actions, errors, and save confirmations. Show success/failure messages that reflect actual results.
- Provide settings with sensible defaults, persistence, reset-to-defaults, and an Apply/Save action.
- Support high-DPI and multi-monitor environments where the underlying platform permits it.
- Support Unicode file names and text. Avoid truncating long URLs or text in captions and text boxes.
- Include dark/light/native-style appearance options only if they can be applied consistently.
- All hotkeys must be configurable, conflict-checked, documented, and actually wired to the relevant action. Do not silently capture browser-reserved shortcuts.

## 4. Feature requirements from the supplied release-note reference

### A. Capture modes and capture workflow
Implement and test:
- Full-screen capture, active-window capture, window/object capture, menu capture, rectangular region, freehand region, fixed-size region, and delayed capture.
- Scrolling-window capture with a user-selectable/custom scroll area and refresh delay. Stitch screenshots reliably, avoid duplicated bands, and provide a cancel action. If true arbitrary desktop capture is not possible in a browser, clearly label the supported scope and use a desktop/native bridge for the full implementation.
- Auto-repeat capture at a user-defined interval, with start/stop controls, output naming, and protection against runaway capture.
- Repeat-last-capture and capture countdown/delay.
- Multi-monitor selection and correct display scaling. Do not assume the primary display is the only display.
- Optional cursor capture, with correct cursor positioning when scaling is involved.
- Small-region capture setting, including regions 5×5 pixels or smaller, if supported by the capture backend.
- Capture toolbar options: show/hide individual buttons, resize buttons, lock/unlock toolbar position, auto-hide, reset toolbar position, and configurable delay before the toolbar appears.
- Support using capture and screen recorder concurrently only if the chosen backend can truly support it; otherwise explain the limitation.

### B. Output destinations and file handling
- Send a capture to the editor, clipboard, file, PDF, printer, or email workflow as appropriate.
- Save and Save As; recent files; open image by dialog and drag/drop; open multiple files; close current tab; close saved tabs; Save All; Save All using one base name with sequential numbering.
- File rename (F2), delete file (Ctrl+Delete) with confirmation, and open containing folder when supported.
- Output format controls should match real encoders. Include PNG, JPEG with quality, WebP with quality/options, BMP where supported, and PDF. Do not offer formats that cannot actually be exported.
- Add PDF export settings: page size, orientation, margins, quality/resolution where applicable, multi-page output, and automatic pagination for long/wide images.
- Unicode-safe file names and file-name templates with date/time, sequential counter, computer/user variables only when safely available, and optional random alphanumeric suffix. Validate templates and prevent invalid paths.
- Auto-save folder setting with history/drop-down of previous folders; automatic save and automatic clipboard-copy options; preview-before-save option; prompt before discarding unsaved changes.
- Image batch operations: save multiple files, combine images into one canvas, join images side-by-side, convert images to multi-page PDF, and optionally batch resize/convert if consistent with the UI.
- Clipboard: copy image, paste image from clipboard when browser permissions permit, preserve alpha transparency, and display a clear permission/error message when unavailable.
- Print dialog with page size, orientation, margins, scaling, copies where supported, and optional header/footer, file name, date/time and page number.
- Email output must use a real supported integration such as the OS mail handler or a configured backend. If no mail service is configured, provide “save/attach manually” guidance rather than pretending an email was sent.
- External editor support: allow users to configure an executable/path only in a desktop build. In browser-only mode, offer download/open workflow instead.

### C. Editor, tabs, and image operations
- Multi-tab editor; open multiple recent files with Ctrl+Click or multi-select; create a new tab; duplicate current image to a new tab; close tab; close saved tabs.
- Zoom from 1% to 5000% where rendering performance allows, plus 25%, 50%, 75%, 100% (Ctrl+0), 200%, fit-to-window and fit-to-width. Keep selection and annotation coordinates correct at all zoom levels.
- Crop, freehand selection, canvas resize/expand, rotate by fixed angles and arbitrary degrees, flip, resize by pixels or percentage while optionally preserving aspect ratio, and remove/add canvas space.
- Image adjustments: brightness, contrast, gamma, lighting, sharpen, blur, negative, sepia, grayscale/oil/sketch effects only if implemented as real image transformations.
- Transparent-background tools with preview, tolerance, anti-aliasing and alpha-preserving export. Edge effects and optional transparent background.
- Watermark tool: image or text watermark, resize, position, opacity, and preview.
- Preserve transparency when copying/pasting and exporting.
- Add image statistics for a selection: pixel count, dimensions and unique color count where practical.
- Maintain image quality; avoid repeatedly resampling the source. Separate source pixels from display zoom.

### D. Annotation / Draw Mode
Support editing and moving annotation objects after they have been created. Maintain vector/object layers separately from the base image when feasible, so objects can be re-edited and exported to a lossless project format.
- Text boxes: resizable while typing, long text/URL wrapping or horizontal scrolling, font family, size up to 200 pt, bold/italic, fill, border style, opacity, alignment and color.
- Text callouts with adjustable tails; oval text boxes; curved text and text along a curve.
- Straight/curved lines, freehand pencil, polyline, L-line, arrows, double arrows, 3D-style arrows if supported, rectangles, rounded rectangles, ellipses, filled polygons, brackets and outlines.
- Highlighter with shape options (rectangle, rounded rectangle, oval), indent and optional border.
- Blur and pixelate selected regions, magnifier/loupe, spotlight, eraser, fill with color, color picker, and color sampling by right-click in color dialogs where appropriate.
- Number stamps, letter stamps, step markers (0–999), icons/emoji, mouse-pointer/click indicators, and optional left/right-click indicator.
- Rotate/flip image and emoji objects. Add line styles/dashes, custom colors, shadows, outline, opacity and alignment.
- Select one or multiple objects; group/align/distribute; copy/cut/paste/delete; bring forward/send backward; undo/redo; keyboard navigation; drag/drop repositioning. Show handles on selection.
- Undo/redo must cover every edit type, not only annotations. Avoid mutating history snapshots.
- Save editable project documents in a documented lossless project format that preserves source image and annotation objects; use a new extension/name rather than impersonating a proprietary format. Export a flattened PNG/JPEG/WebP/PDF separately.
- Optional auto-save of an editable project copy whenever annotations exist.
- Drawing tools should work with mouse, keyboard and touch where supported. Avoid unwanted pixel noise from line drawing/eraser behavior.

### E. Pin to screen / screenshot sticky notes
- Pin a captured image above other windows, move/resize it, set opacity/size, and keep it visible while the user works in another app.
- Draw/annotate directly on the pinned image and support step numbers.
- Context menu: hide at top/show, actual size, draw mode, close/unpin, copy, save, and send current/all pinned captures to the editor.
- Support multiple pinned captures and safe lifecycle cleanup.
- A normal browser tab cannot reliably create a true always-on-top window over unrelated desktop applications. Implement this using a desktop shell/native window API (for example, a carefully selected Electron/Tauri implementation) or mark it as a browser limitation and provide an honest fallback. Do not claim true always-on-top if it is only a page overlay.

### F. OCR / Capture Text
- Add “Capture Text” to extract editable text from an image/screenshot, with copy, select-all, search if practical, and export options.
- Support Windows 10/11 as a target but do not assume the browser automatically has Windows OCR access.
- Choose a real OCR engine: a local/browser OCR library, native OS OCR bridge, or secure backend. Explain language-pack and offline/online requirements.
- Show progress, confidence where available, preserve line breaks where possible, handle large images without freezing the UI, and return a helpful message when OCR is unavailable.
- Never silently send private screenshots to a third-party OCR service. Disclose the processing method and obtain consent before remote processing.

### G. Screen recorder and video editor
- Record screen/window/tab depending on browser or desktop backend; show a clear recording indicator and allow stop, pause and resume.
- Optional microphone, system audio, webcam, webcam position/shape/size, cursor ripples/highlighting, frame rate (15/24/30/60 where supported), quality, countdown and recording timer.
- Microphone, speaker/system-audio and webcam can be toggled before/during recording where the platform allows it; expose device selection and a live audio level indicator.
- Timer scheduling with start/end time; optional sleep after scheduled recording only in a trusted desktop app and only with explicit user consent.
- Default MP4 where the encoder supports it; otherwise use a truthful supported format (such as WebM) and offer a real conversion path. Do not merely rename a file extension.
- Recover interrupted recordings when possible; handle permissions, device disconnects, low disk space, and recording errors.
- Video editor: trim by dragging start/end edges, title page insertion, annotation overlays, zoom effects, frame stepping, export a video frame to image/clipboard, extract audio to M4A/MP3 when a real decoder/encoder exists, and convert/resize MP4/WMV only when a real transcoding engine exists.
- Preserve editable annotation objects/project data where practical.
- Add a discard confirmation and make the last recording easy to open, play, reveal/download, or edit.
- Never advertise sleep mode, system-audio capture, global hotkeys, MP4 conversion or system-wide recording if the current runtime cannot provide them.

### H. Utility tools
- Screen magnifier with smooth zoom and negative/invert mode.
- Screen color picker with zoom, RGB/HEX/decimal formats and configurable prefix/suffix; copy result automatically if selected.
- Screen ruler with calibration based on screen diagonal or known measurement; measurement copy-to-clipboard.
- Protractor and screen crosshair.
- Screen focus: dim outside the focus region; select region with mouse and keyboard shortcut where possible.
- Color picker should support sampling from the screen only with user permission and backend support.
- Scan/acquire images from scanner: integrate a real supported desktop scanner API or clearly explain browser limitation. Include batch scanning, crop/rotate/deskew, lighting/contrast correction, and output to PDF/TIFF/JPEG/PNG only if supported by the chosen backend.
- Image combining: side-by-side, vertical, custom layout, spacing/background, optional file names, preview, copy to clipboard and save.
- Optional workspaces: group editor tabs into named workspaces, each retaining recent folder and tabs.
- Optional OneNote/export integrations only if a supported API or native integration is configured.

### I. Settings and accessibility
Create organized settings sections:
- Capture: modes, cursor, delay, small captures, scrolling refresh, repeat interval, monitor choice, toolbar controls.
- Output/Auto Save: default destination, folder, history, filename template, format, quality, clipboard, confirmation.
- Editor: zoom behavior, tabs/workspaces, autosave project copy, default Draw tool, active-tab highlight, classic/native skin if implemented.
- Recorder: devices, audio, webcam, frame rate, quality, countdown, output format, timer, notifications, recovery.
- Hotkeys: editable mappings, collision detection, reset defaults.
- Language and theme if supported.
- Notifications: control-bar color/size, success/error display.
- Reset all settings with confirmation; settings must persist and migrate safely when the schema changes.
Accessibility: keyboard-operable controls, visible focus, readable contrast, ARIA labels, scalable UI, and no color-only status communication.

## 5. Platform architecture: browser versus real desktop application
The current repository is a Vite web app. A browser-only app has important limitations: it cannot freely capture arbitrary windows or all monitors, register unrestricted global hotkeys, guarantee always-on-top windows, access arbitrary file-system paths, control OS sleep, use all scanner APIs, or guarantee MP4/system-audio recording. The browser may provide user-approved display capture, clipboard, file picker, camera and microphone APIs, but support varies.

Before implementing features that require OS access, choose and document one of these approaches:
- **Browser-only:** implement only what the browser APIs genuinely support; display limitations clearly.
- **Desktop shell:** evaluate Electron or Tauri and add a narrow, typed native bridge for capture, global shortcuts, always-on-top pinning, file operations, scanner integration, system audio and power actions. Apply least privilege and validate all bridge inputs.
Do not mix the two approaches accidentally. Keep browser-safe functionality working if native integration is unavailable. Do not execute arbitrary commands from renderer content.

## 6. Data model and persistence
- Use typed models for capture settings, editor documents, annotations, recorder sessions, recent files, workspaces, pinned captures and project file metadata.
- Add versioned settings migration with defaults for newly added settings and validation for malformed local data.
- Store large image/video data in an appropriate storage mechanism (IndexedDB or native file system) rather than relying on localStorage. localStorage may store small settings only.
- Avoid saving giant base64 blobs repeatedly in history. Use object URLs carefully and revoke them when no longer needed.
- Keep annotation coordinates in original-image coordinate space and transform only for display.
- Implement bounded undo/redo history and clear history when documents close.
- Preserve file metadata, transparency, dimensions and timestamps where applicable.
- Add recovery/autosave for unsaved documents and recordings if technically possible.

## 7. Security, privacy, reliability
- Request screen, clipboard, microphone, webcam, and file permissions only when the user invokes the relevant feature.
- Provide a visible indicator whenever recording is active.
- Do not upload screen content or OCR images without clear consent.
- Never store secrets or API keys in client bundles.
- Validate file types and sizes; guard against malformed image/video files; handle denied permissions and unsupported formats.
- Prevent accidental deletion/overwrite with confirmation and safe default names.
- Clean up media tracks, audio contexts, timers, event listeners, object URLs and native windows on close/unmount.
- Handle cancellation, browser tab closure, permission denial, storage quota, and partial save failures.
- Keep keyboard shortcuts from firing while the user types in an input/editor unless intentionally designed.
- Add unit tests for filename templates, settings migration, geometry transforms, annotation serialization, undo/redo and export helpers; add integration/manual tests for permissions and capture.

## 8. Suggested implementation phases
**Phase 0 — Audit and baseline**
- Inventory every current feature and its actual implementation.
- Run lint/build and record baseline failures.
- Mark each reference feature as working, partial, missing, or platform-blocked.

**Phase 1 — Core editor and persistence**
- Reliable open/save/save-as, multi-tab, recent files, zoom, fit-to-width, Ctrl+0, undo/redo, dirty-state confirmation, Unicode file names, image import/export.
- Add versioned settings, robust filename templates and editable project format.

**Phase 2 — Capture and toolbar**
- Implement supported capture modes, delay, fixed-size, small-region setting, repeat-last, configurable toolbar and hotkeys.
- Add scrolling capture and multi-monitor support only using a real supported capture backend.

**Phase 3 — Annotation parity**
- Complete all annotation shapes, text/callouts, 0–999 steps, eraser, blur/pixelate, color sampling, grouping/alignment, flip/rotate, undo/redo and project serialization.

**Phase 4 — Image operations and batch tools**
- Crop/canvas/rotate/resize/adjustments/transparency/watermark, combine images, join side-by-side, batch save and PDF export/print.

**Phase 5 — Recorder and video tools**
- Permission/device selection, audio meters, webcam, pause/resume, timer, recovery, frame extraction, trimming and real transcoding only if supported.

**Phase 6 — OCR, pinning and utilities**
- OCR, always-on-top pinning, ruler, protractor, magnifier, crosshair, focus, scanner and workspaces. Choose native integration where browser constraints make it necessary.

**Phase 7 — QA and release**
- Test at different display scales and monitor configurations; verify every menu item, shortcut, export format and permission-denied path.
- Add user-facing documentation and known limitations.

## 9. Acceptance checklist
A feature is accepted only when its real behavior is verified:
- [ ] No dead buttons, fake progress, sample-only workflows, or false success toasts.
- [ ] `npm run lint` and `npm run build` pass.
- [ ] Existing functionality remains intact.
- [ ] Capture output matches selected mode and dimensions.
- [ ] Undo/redo restores the exact previous document state.
- [ ] Annotations remain correctly positioned after zoom, resize, crop, rotate and export.
- [ ] Transparency survives copy/paste and supported exports.
- [ ] Multi-file save, sequential naming, Unicode names and PDF pagination work.
- [ ] Settings persist after reload and migrate from old settings safely.
- [ ] Permissions-denied and unsupported-format cases show actionable messages.
- [ ] Recording stops cleanly and media tracks are released.
- [ ] Pinned captures and global shortcuts are not claimed unless desktop integration truly implements them.
- [ ] OCR and external services disclose whether data leaves the device.
- [ ] Tests and manual verification steps are documented.

## 10. Instructions for the AI agent before coding
Start by auditing the repository and return a concise feature matrix. Then implement the highest-value missing features in phases without asking the user to repeat details already in this specification. If the platform decision is essential, explain the concrete trade-off and recommend a default: keep the existing web app functional, and use a desktop shell only for OS-level features. Do not attempt to implement every feature in one giant rewrite. Make incremental, buildable changes, test them, and report what is genuinely complete versus blocked.
