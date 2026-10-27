/**
 * Image Processing & Effects Engine for SnapForge
 * Includes Resize, Crop, Rotate, Flip, Color Filters, Unsharp Mask,
 * Drop Shadow, Torn Edge, Fade Edge, Border Frame, and Annotation Flattening
 */

import { AnnotationDto } from '../types';

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Interactive Crop
 */
export async function cropImage(
  imageSrc: string,
  cropX: number,
  cropY: number,
  cropWidth: number,
  cropHeight: number
): Promise<string> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(cropWidth));
  canvas.height = Math.max(1, Math.round(cropHeight));
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(
    img,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas.toDataURL('image/png');
}

/**
 * Resize Image with bicubic / high quality smoothing
 */
export async function resizeImage(
  imageSrc: string,
  newWidth: number,
  newHeight: number
): Promise<string> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(newWidth));
  canvas.height = Math.max(1, Math.round(newHeight));
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

/**
 * Rotate or Flip
 */
export async function transformImage(
  imageSrc: string,
  angleDeg: number, // 90, -90, 180
  flipH = false,
  flipV = false
): Promise<string> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const is90or270 = Math.abs(angleDeg) === 90 || Math.abs(angleDeg) === 270;

  canvas.width = is90or270 ? img.height : img.width;
  canvas.height = is90or270 ? img.width : img.height;
  const ctx = canvas.getContext('2d')!;

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((angleDeg * Math.PI) / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  return canvas.toDataURL('image/png');
}

export interface ColorFilterOptions {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  gamma: number; // 0.2 to 3.0 (default 1.0)
  sharpen: boolean; // unsharp mask
  grayscale: boolean;
  invert: boolean;
  sepia: boolean;
}

/**
 * Apply Color & Pixel Adjustments (Sharpen unsharp mask, brightness, contrast, gamma)
 */
export async function applyColorAdjustments(
  imageSrc: string,
  options: ColorFilterOptions
): Promise<string> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  const brightness = options.brightness * 2.55;
  const contrastFactor =
    (259 * (options.contrast * 2.55 + 255)) / (255 * (259 - options.contrast * 2.55));
  const gamma = options.gamma || 1.0;
  const gammaCorrection = 1 / gamma;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Brightness
    if (options.brightness !== 0) {
      r += brightness;
      g += brightness;
      b += brightness;
    }

    // Contrast
    if (options.contrast !== 0) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // Gamma
    if (gamma !== 1.0) {
      r = 255 * Math.pow(Math.max(0, r) / 255, gammaCorrection);
      g = 255 * Math.pow(Math.max(0, g) / 255, gammaCorrection);
      b = 255 * Math.pow(Math.max(0, b) / 255, gammaCorrection);
    }

    // Saturation
    if (options.saturation !== 0) {
      const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
      const satFactor = 1 + options.saturation / 100;
      r = gray + (r - gray) * satFactor;
      g = gray + (g - gray) * satFactor;
      b = gray + (b - gray) * satFactor;
    }

    // Grayscale
    if (options.grayscale) {
      const avg = 0.299 * r + 0.587 * g + 0.114 * b;
      r = avg;
      g = avg;
      b = avg;
    }

    // Sepia
    if (options.sepia) {
      const tr = 0.393 * r + 0.769 * g + 0.189 * b;
      const tg = 0.349 * r + 0.686 * g + 0.168 * b;
      const tb = 0.272 * r + 0.534 * g + 0.131 * b;
      r = tr;
      g = tg;
      b = tb;
    }

    // Invert
    if (options.invert) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  // Sharpen via 3x3 convolution unsharp mask
  if (options.sharpen) {
    const weights = [
      0, -0.5, 0,
      -0.5, 3, -0.5,
      0, -0.5, 0,
    ];
    const side = Math.round(Math.sqrt(weights.length));
    const halfSide = Math.floor(side / 2);
    const src = new Uint8ClampedArray(data);
    const sw = canvas.width;
    const sh = canvas.height;

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const dstOff = (y * sw + x) * 4;
        let r = 0,
          g = 0,
          b = 0;

        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            const scy = Math.min(sh - 1, Math.max(0, y + cy - halfSide));
            const scx = Math.min(sw - 1, Math.max(0, x + cx - halfSide));
            const srcOff = (scy * sw + scx) * 4;
            const wt = weights[cy * side + cx];
            r += src[srcOff] * wt;
            g += src[srcOff + 1] * wt;
            b += src[srcOff + 2] * wt;
          }
        }
        data[dstOff] = Math.min(255, Math.max(0, r));
        data[dstOff + 1] = Math.min(255, Math.max(0, g));
        data[dstOff + 2] = Math.min(255, Math.max(0, b));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * FastStone Classic Torn Edge Effect
 */
export async function applyTornEdgeEffect(
  imageSrc: string,
  sides: { top: boolean; right: boolean; bottom: boolean; left: boolean } = {
    top: false,
    right: true,
    bottom: true,
    left: false,
  },
  tearDepth = 14
): Promise<string> {
  const img = await loadImage(imageSrc);
  const padding = 24;
  const canvas = document.createElement('canvas');
  canvas.width = img.width + padding * 2;
  canvas.height = img.height + padding * 2;
  const ctx = canvas.getContext('2d')!;

  // Temporary canvas to draw the torn shape mask
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = img.width;
  maskCanvas.height = img.height;
  const mctx = maskCanvas.getContext('2d')!;

  mctx.beginPath();
  mctx.moveTo(0, 0);

  // Top edge
  if (sides.top) {
    for (let x = 0; x < img.width; x += 8) {
      const offset = (Math.sin(x * 0.4) + Math.cos(x * 0.8)) * tearDepth * 0.5;
      mctx.lineTo(x, Math.max(0, offset + tearDepth / 2));
    }
    mctx.lineTo(img.width, 0);
  } else {
    mctx.lineTo(img.width, 0);
  }

  // Right edge
  if (sides.right) {
    for (let y = 0; y < img.height; y += 8) {
      const offset = (Math.sin(y * 0.3) + Math.cos(y * 0.7)) * tearDepth * 0.5;
      mctx.lineTo(img.width - Math.max(0, offset + tearDepth / 2), y);
    }
    mctx.lineTo(img.width, img.height);
  } else {
    mctx.lineTo(img.width, img.height);
  }

  // Bottom edge
  if (sides.bottom) {
    for (let x = img.width; x > 0; x -= 8) {
      const offset = (Math.sin(x * 0.35) + Math.cos(x * 0.9)) * tearDepth * 0.5;
      mctx.lineTo(x, img.height - Math.max(0, offset + tearDepth / 2));
    }
    mctx.lineTo(0, img.height);
  } else {
    mctx.lineTo(0, img.height);
  }

  // Left edge
  if (sides.left) {
    for (let y = img.height; y > 0; y -= 8) {
      const offset = (Math.sin(y * 0.45) + Math.cos(y * 0.65)) * tearDepth * 0.5;
      mctx.lineTo(Math.max(0, offset + tearDepth / 2), y);
    }
    mctx.lineTo(0, 0);
  } else {
    mctx.lineTo(0, 0);
  }

  mctx.closePath();
  mctx.fillStyle = '#ffffff';
  mctx.fill();

  // Draw shadow on destination canvas
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetX = 6;
  ctx.shadowOffsetY = 6;
  ctx.drawImage(maskCanvas, padding, padding);
  ctx.restore();

  // Composite the original image masked by the torn polygon
  mctx.globalCompositeOperation = 'source-in';
  mctx.drawImage(img, 0, 0);

  ctx.drawImage(maskCanvas, padding, padding);

  return canvas.toDataURL('image/png');
}

/**
 * Drop Shadow Effect
 */
export async function applyDropShadow(
  imageSrc: string,
  blur = 20,
  offset = 8,
  opacity = 0.45
): Promise<string> {
  const img = await loadImage(imageSrc);
  const padding = blur * 2 + offset;
  const canvas = document.createElement('canvas');
  canvas.width = img.width + padding * 2;
  canvas.height = img.height + padding * 2;
  const ctx = canvas.getContext('2d')!;

  ctx.save();
  ctx.shadowColor = `rgba(0, 0, 0, ${opacity})`;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = offset;
  ctx.shadowOffsetY = offset;
  ctx.fillRect(padding, padding, img.width, img.height);
  ctx.restore();

  ctx.drawImage(img, padding, padding);
  return canvas.toDataURL('image/png');
}

/**
 * Border & Frame Effect
 */
export async function applyBorderFrame(
  imageSrc: string,
  borderColor = '#3b82f6',
  borderWidth = 8,
  padding = 0,
  backgroundColor = '#ffffff'
): Promise<string> {
  const img = await loadImage(imageSrc);
  const totalMargin = borderWidth + padding;
  const canvas = document.createElement('canvas');
  canvas.width = img.width + totalMargin * 2;
  canvas.height = img.height + totalMargin * 2;
  const ctx = canvas.getContext('2d')!;

  // Fill outer border
  ctx.fillStyle = borderColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Fill inner matting if padding > 0
  if (padding > 0) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(borderWidth, borderWidth, canvas.width - borderWidth * 2, canvas.height - borderWidth * 2);
  }

  ctx.drawImage(img, totalMargin, totalMargin);
  return canvas.toDataURL('image/png');
}

/**
 * Caption Bar Effect
 */
export async function applyCaption(
  imageSrc: string,
  text: string,
  position: 'top' | 'bottom' = 'bottom',
  bgColor = '#1e293b',
  textColor = '#ffffff',
  fontSize = 18
): Promise<string> {
  const img = await loadImage(imageSrc);
  const barHeight = fontSize * 2.2;
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height + barHeight;
  const ctx = canvas.getContext('2d')!;

  const imgY = position === 'top' ? barHeight : 0;
  const barY = position === 'top' ? 0 : img.height;

  ctx.drawImage(img, 0, imgY);

  // Draw caption strip
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, barY, canvas.width, barHeight);

  // Draw text
  ctx.fillStyle = textColor;
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, barY + barHeight / 2);

  return canvas.toDataURL('image/png');
}

/**
 * Render complete flattened image with all vector annotations
 */
export async function renderFlattenedCanvas(
  baseImageSrc: string,
  annotations: AnnotationDto[]
): Promise<HTMLCanvasElement> {
  const img = await loadImage(baseImageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;

  // Base image
  ctx.drawImage(img, 0, 0);

  // Render annotations in order
  for (const ann of annotations) {
    ctx.save();
    ctx.globalAlpha = ann.opacity ?? 1;

    switch (ann.type) {
      case 'rect': {
        if (ann.fillColor && ann.fillColor !== 'transparent') {
          ctx.fillStyle = ann.fillColor;
          ctx.fillRect(ann.bounds.x, ann.bounds.y, ann.bounds.width, ann.bounds.height);
        }
        if (ann.strokeColor && ann.strokeWidth > 0) {
          ctx.strokeStyle = ann.strokeColor;
          ctx.lineWidth = ann.strokeWidth;
          ctx.strokeRect(ann.bounds.x, ann.bounds.y, ann.bounds.width, ann.bounds.height);
        }
        break;
      }
      case 'rounded-rect': {
        const r = Math.min(16, ann.bounds.width / 2, ann.bounds.height / 2);
        ctx.beginPath();
        ctx.roundRect(ann.bounds.x, ann.bounds.y, ann.bounds.width, ann.bounds.height, r);
        if (ann.fillColor && ann.fillColor !== 'transparent') {
          ctx.fillStyle = ann.fillColor;
          ctx.fill();
        }
        if (ann.strokeColor && ann.strokeWidth > 0) {
          ctx.strokeStyle = ann.strokeColor;
          ctx.lineWidth = ann.strokeWidth;
          ctx.stroke();
        }
        break;
      }
      case 'ellipse': {
        ctx.beginPath();
        const rx = ann.bounds.width / 2;
        const ry = ann.bounds.height / 2;
        ctx.ellipse(
          ann.bounds.x + rx,
          ann.bounds.y + ry,
          Math.abs(rx),
          Math.abs(ry),
          0,
          0,
          Math.PI * 2
        );
        if (ann.fillColor && ann.fillColor !== 'transparent') {
          ctx.fillStyle = ann.fillColor;
          ctx.fill();
        }
        if (ann.strokeColor && ann.strokeWidth > 0) {
          ctx.strokeStyle = ann.strokeColor;
          ctx.lineWidth = ann.strokeWidth;
          ctx.stroke();
        }
        break;
      }
      case 'arrow':
      case 'double-arrow': {
        const x1 = ann.bounds.x;
        const y1 = ann.bounds.y;
        const x2 = ann.bounds.x + ann.bounds.width;
        const y2 = ann.bounds.y + ann.bounds.height;

        ctx.strokeStyle = ann.strokeColor;
        ctx.fillStyle = ann.strokeColor;
        ctx.lineWidth = ann.strokeWidth;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Arrow head at end
        drawArrowHead(ctx, x1, y1, x2, y2, ann.strokeWidth * 3 + 8);
        if (ann.type === 'double-arrow') {
          drawArrowHead(ctx, x2, y2, x1, y1, ann.strokeWidth * 3 + 8);
        }
        break;
      }
      case 'line': {
        ctx.strokeStyle = ann.strokeColor;
        ctx.lineWidth = ann.strokeWidth;
        ctx.beginPath();
        if (ann.points && ann.points.length > 1) {
          ctx.moveTo(ann.points[0].x, ann.points[0].y);
          for (let p = 1; p < ann.points.length; p++) {
            ctx.lineTo(ann.points[p].x, ann.points[p].y);
          }
        } else {
          ctx.moveTo(ann.bounds.x, ann.bounds.y);
          ctx.lineTo(ann.bounds.x + ann.bounds.width, ann.bounds.y + ann.bounds.height);
        }
        ctx.stroke();
        break;
      }
      case 'highlighter': {
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = ann.fillColor || 'rgba(250, 204, 21, 0.45)';
        ctx.fillRect(ann.bounds.x, ann.bounds.y, ann.bounds.width, ann.bounds.height);
        break;
      }
      case 'blur':
      case 'pixelate': {
        // Pixelate or blur the underlying region
        const bx = Math.max(0, Math.floor(ann.bounds.x));
        const by = Math.max(0, Math.floor(ann.bounds.y));
        const bw = Math.min(canvas.width - bx, Math.floor(ann.bounds.width));
        const bh = Math.min(canvas.height - by, Math.floor(ann.bounds.height));

        if (bw > 2 && bh > 2) {
          const regionData = ctx.getImageData(bx, by, bw, bh);
          const rPixels = regionData.data;
          const sampleSize = ann.type === 'pixelate' ? 12 : 6;

          for (let y = 0; y < bh; y += sampleSize) {
            for (let x = 0; x < bw; x += sampleSize) {
              const pIndex = (y * bw + x) * 4;
              const pr = rPixels[pIndex];
              const pg = rPixels[pIndex + 1];
              const pb = rPixels[pIndex + 2];

              for (let sy = 0; sy < sampleSize && y + sy < bh; sy++) {
                for (let sx = 0; sx < sampleSize && x + sx < bw; sx++) {
                  const sIndex = ((y + sy) * bw + (x + sx)) * 4;
                  rPixels[sIndex] = pr;
                  rPixels[sIndex + 1] = pg;
                  rPixels[sIndex + 2] = pb;
                }
              }
            }
          }
          ctx.putImageData(regionData, bx, by);

          // Subtle outline around redaction
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.lineWidth = 1;
          ctx.strokeRect(bx, by, bw, bh);
        }
        break;
      }
      case 'spotlight': {
        // Darken canvas everywhere except this region
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.beginPath();
        // Outer box (whole canvas)
        ctx.rect(0, 0, canvas.width, canvas.height);
        // Cutout inner ellipse or rect
        ctx.arc(
          ann.bounds.x + ann.bounds.width / 2,
          ann.bounds.y + ann.bounds.height / 2,
          Math.max(ann.bounds.width, ann.bounds.height) / 2,
          0,
          Math.PI * 2,
          true
        );
        ctx.fill();
        break;
      }
      case 'step-number': {
        const radius = Math.max(16, ann.strokeWidth * 4 + 14);
        const cx = ann.bounds.x + radius;
        const cy = ann.bounds.y + radius;

        ctx.fillStyle = ann.fillColor || '#ef4444';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${radius * 1.1}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(ann.stepNumber ?? 1), cx, cy);
        break;
      }
      case 'callout': {
        const x = ann.bounds.x;
        const y = ann.bounds.y;
        const w = ann.bounds.width;
        const h = ann.bounds.height;
        const tail = ann.calloutTail || { x: x + w / 2, y: y + h + 24 };

        // Draw balloon bubble
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 10);
        ctx.fillStyle = ann.fillColor || '#ffffff';
        ctx.fill();

        // Draw speech tail
        ctx.beginPath();
        ctx.moveTo(x + w * 0.4, y + h);
        ctx.lineTo(tail.x, tail.y);
        ctx.lineTo(x + w * 0.6, y + h);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = ann.strokeColor || '#0284c7';
        ctx.lineWidth = ann.strokeWidth || 2;
        ctx.stroke();

        // Text inside balloon
        if (ann.text) {
          ctx.fillStyle = '#0f172a';
          ctx.font = `${ann.bold ? 'bold ' : ''}${ann.fontSize || 14}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(ann.text, x + w / 2, y + h / 2);
        }
        break;
      }
      case 'text':
      case 'curved-text': {
        if (ann.text) {
          const fontSize = ann.fontSize || 20;
          ctx.font = `${ann.bold ? 'bold ' : ''}${ann.italic ? 'italic ' : ''}${fontSize}px ${
            ann.fontFamily || 'sans-serif'
          }`;
          ctx.fillStyle = ann.strokeColor || '#000000';
          ctx.textBaseline = 'top';

          if (ann.fillColor && ann.fillColor !== 'transparent') {
            const metrics = ctx.measureText(ann.text);
            ctx.fillStyle = ann.fillColor;
            ctx.fillRect(
              ann.bounds.x - 4,
              ann.bounds.y - 2,
              metrics.width + 8,
              fontSize * 1.3
            );
            ctx.fillStyle = ann.strokeColor || '#000000';
          }
          ctx.fillText(ann.text, ann.bounds.x, ann.bounds.y);
        }
        break;
      }
      case 'watermark': {
        const text = ann.text || 'CONFIDENTIAL';
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((-35 * Math.PI) / 180);
        ctx.font = `bold 64px system-ui, sans-serif`;
        ctx.fillStyle = ann.strokeColor || 'rgba(239, 68, 68, 0.2)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 0, 0);
        ctx.restore();
        break;
      }
      case 'stamp': {
        const icon = ann.stampIcon || 'checkmark';
        const cx = ann.bounds.x + ann.bounds.width / 2;
        const cy = ann.bounds.y + ann.bounds.height / 2;
        const size = Math.min(ann.bounds.width, ann.bounds.height);

        ctx.save();
        ctx.translate(cx, cy);
        if (icon === 'checkmark') {
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = size * 0.12;
          ctx.beginPath();
          ctx.moveTo(-size * 0.25, 0);
          ctx.lineTo(-size * 0.05, size * 0.2);
          ctx.lineTo(size * 0.25, -size * 0.2);
          ctx.stroke();
        } else if (icon === 'cross') {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = size * 0.12;
          ctx.beginPath();
          ctx.moveTo(-size * 0.2, -size * 0.2);
          ctx.lineTo(size * 0.2, size * 0.2);
          ctx.moveTo(size * 0.2, -size * 0.2);
          ctx.lineTo(-size * 0.2, size * 0.2);
          ctx.stroke();
        } else if (icon === 'warning') {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${size * 0.65}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('!', 0, 0);
        }
        ctx.restore();
        break;
      }
    }

    ctx.restore();
  }

  return canvas;
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  headLength: number
) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);
  ctx.save();
  ctx.fillStyle = ctx.strokeStyle;
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLength * Math.cos(angle - Math.PI / 6),
    toY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    toX - headLength * Math.cos(angle + Math.PI / 6),
    toY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
