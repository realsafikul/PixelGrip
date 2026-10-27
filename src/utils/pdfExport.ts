/**
 * PDF Export Utility
 * Handles single-image and multi-image compilation into standard PDF documents
 */

import { jsPDF } from 'jspdf';
import { loadImage } from './imageEffects';

export async function exportImagesToPdf(
  imageSources: string[],
  fileName = 'SnapForge_Capture.pdf',
  orientation: 'portrait' | 'landscape' | 'auto' = 'auto'
): Promise<void> {
  if (imageSources.length === 0) return;

  const firstImg = await loadImage(imageSources[0]);
  const isLandscape =
    orientation === 'auto'
      ? firstImg.width > firstImg.height
      : orientation === 'landscape';

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < imageSources.length; i++) {
    if (i > 0) {
      const img = await loadImage(imageSources[i]);
      const imgLandscape =
        orientation === 'auto'
          ? img.width > img.height
          : orientation === 'landscape';
      pdf.addPage('a4', imgLandscape ? 'landscape' : 'portrait');
    }

    const curImg = await loadImage(imageSources[i]);
    const curPageW = pdf.internal.pageSize.getWidth();
    const curPageH = pdf.internal.pageSize.getHeight();

    const margin = 20;
    const maxW = curPageW - margin * 2;
    const maxH = curPageH - margin * 2;

    const ratio = Math.min(maxW / curImg.width, maxH / curImg.height, 1);
    const renderW = curImg.width * ratio;
    const renderH = curImg.height * ratio;

    const posX = (curPageW - renderW) / 2;
    const posY = (curPageH - renderH) / 2;

    pdf.addImage(imageSources[i], 'PNG', posX, posY, renderW, renderH);
  }

  pdf.save(fileName);
}
