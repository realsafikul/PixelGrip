/**
 * Filename Template Engine
 * Supports tokens: {yyyy}{MM}{dd}-{HH}{mm}{ss}, {counter:000}, {window}, {app}, {mode}
 */

let globalCounter = 1;

export function formatFilename(
  template: string,
  options?: {
    mode?: string;
    windowTitle?: string;
    appName?: string;
    counter?: number;
    extension?: string;
  }
): string {
  const now = new Date();
  const counter = options?.counter ?? globalCounter++;
  const mode = options?.mode || 'Screen';
  const windowTitle = options?.windowTitle || 'Desktop';
  const appName = options?.appName || 'PixelGrip';
  const extension = options?.extension ? `.${options.extension.replace(/^\./, '')}` : '.png';

  const pad = (n: number, width = 2) => String(n).padStart(width, '0');

  let result = template
    .replace(/\{yyyy\}/g, String(now.getFullYear()))
    .replace(/\{MM\}/g, pad(now.getMonth() + 1))
    .replace(/\{dd\}/g, pad(now.getDate()))
    .replace(/\{HH\}/g, pad(now.getHours()))
    .replace(/\{mm\}/g, pad(now.getMinutes()))
    .replace(/\{ss\}/g, pad(now.getSeconds()))
    .replace(/\{mode\}/g, mode)
    .replace(/\{window\}/g, sanitizeFilename(windowTitle))
    .replace(/\{app\}/g, sanitizeFilename(appName));

  // Handle {counter:000}, {counter:00}, {counter}
  result = result.replace(/\{counter(?::(0+))?\}/g, (_, zeros) => {
    const width = zeros ? zeros.length : 3;
    return pad(counter, width);
  });

  result = sanitizeFilename(result);

  if (!result.endsWith(extension)) {
    result += extension;
  }

  return result;
}

export function sanitizeFilename(name: string): string {
  // Remove illegal characters for file systems: < > : " / \ | ? *
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/\s+/g, ' ').trim();
}
