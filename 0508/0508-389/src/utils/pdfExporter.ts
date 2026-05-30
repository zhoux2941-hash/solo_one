import jsPDF from 'jspdf';
import type { PatternElement, SymmetryMode } from '@/store/editorStore';
import { computeTransformMatrix, computeSymmetryMatrices } from '@/utils/canvasRenderer';

interface TransformEntry {
  matrix: DOMMatrix;
  svgPath: string;
}

export function exportToPDF(
  elements: PatternElement[],
  symmetryMode: SymmetryMode,
  canvasWidth: number,
  canvasHeight: number
): void {
  const mmWidth = 210;
  const mmHeight = 297;
  const pdfScale = Math.min((mmWidth - 20) / canvasWidth, (mmHeight - 40) / canvasHeight);
  const offsetX = (mmWidth - canvasWidth * pdfScale) / 2;
  const offsetY = (mmHeight - canvasHeight * pdfScale) / 2;
  const canvasToPdfMatrix = new DOMMatrix();
  canvasToPdfMatrix.translateSelf(offsetX, offsetY);
  canvasToPdfMatrix.scaleSelf(pdfScale, pdfScale);
  const doc = new jsPDF('portrait', 'mm', 'a4');
  doc.setDrawColor(26, 35, 50);
  doc.setLineWidth(0.1);
  const allEntries: TransformEntry[] = [];
  elements.forEach((element) => {
    const symmetryMats = computeSymmetryMatrices(element, symmetryMode, canvasWidth, canvasHeight);
    symmetryMats.forEach((m) => allEntries.push({ matrix: m, svgPath: element.svgPath }));
  });
  elements.forEach((element) => {
    allEntries.push({ matrix: computeTransformMatrix(element), svgPath: element.svgPath });
  });
  allEntries.forEach(({ matrix, svgPath }) => {
    const pdfMatrix = matrix.preMultiplySelf(new DOMMatrix().translateSelf(offsetX, offsetY).scaleSelf(pdfScale, pdfScale));
    const pathData = svgPathToPDFPaths(svgPath, pdfMatrix);
    pathData.forEach((subPath) => {
      if (subPath.length < 2) return;
      doc.moveTo(subPath[0].x, subPath[0].y);
      for (let i = 1; i < subPath.length; i++) {
        doc.lineTo(subPath[i].x, subPath[i].y);
      }
    });
  });
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('蜡染纹样设计 - 线稿模板', mmWidth / 2, 10, { align: 'center' });
  doc.save('蜡染纹样.pdf');
}

function svgPathToPDFPaths(svgPath: string, transformMatrix: DOMMatrix): { x: number; y: number }[][] {
  const commands = svgPath.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];
  const subPaths: { x: number; y: number }[][] = [];
  let currentPath: { x: number; y: number }[] = [];
  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;
  const transformPoint = (px: number, py: number): { x: number; y: number } => {
    const pt = new DOMPoint(px, py).matrixTransform(transformMatrix);
    return { x: pt.x, y: pt.y };
  };
  commands.forEach((cmd) => {
    const type = cmd[0].toUpperCase();
    const isRelative = cmd[0] === cmd[0].toLowerCase();
    const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number).filter((n) => !isNaN(n));
    switch (type) {
      case 'M':
        if (currentPath.length > 0) subPaths.push(currentPath);
        currentPath = [];
        currentX = isRelative ? currentX + coords[0] : coords[0];
        currentY = isRelative ? currentY + coords[1] : coords[1];
        currentPath.push(transformPoint(currentX, currentY));
        startX = currentX;
        startY = currentY;
        break;
      case 'L':
        for (let i = 0; i < coords.length; i += 2) {
          currentX = isRelative ? currentX + coords[i] : coords[i];
          currentY = isRelative ? currentY + coords[i + 1] : coords[i + 1];
          currentPath.push(transformPoint(currentX, currentY));
        }
        break;
      case 'H':
        coords.forEach((h) => {
          currentX = isRelative ? currentX + h : h;
          currentPath.push(transformPoint(currentX, currentY));
        });
        break;
      case 'V':
        coords.forEach((v) => {
          currentY = isRelative ? currentY + v : v;
          currentPath.push(transformPoint(currentX, currentY));
        });
        break;
      case 'A':
        for (let i = 0; i < coords.length; i += 7) {
          currentX = isRelative ? currentX + coords[i + 5] : coords[i + 5];
          currentY = isRelative ? currentY + coords[i + 6] : coords[i + 6];
          currentPath.push(transformPoint(currentX, currentY));
        }
        break;
      case 'Q':
        for (let i = 0; i < coords.length; i += 4) {
          currentX = isRelative ? currentX + coords[i + 2] : coords[i + 2];
          currentY = isRelative ? currentY + coords[i + 3] : coords[i + 3];
          currentPath.push(transformPoint(currentX, currentY));
        }
        break;
      case 'C':
        for (let i = 0; i < coords.length; i += 6) {
          currentX = isRelative ? currentX + coords[i + 4] : coords[i + 4];
          currentY = isRelative ? currentY + coords[i + 5] : coords[i + 5];
          currentPath.push(transformPoint(currentX, currentY));
        }
        break;
      case 'Z':
        currentX = startX;
        currentY = startY;
        currentPath.push(transformPoint(currentX, currentY));
        break;
    }
  });
  if (currentPath.length > 0) subPaths.push(currentPath);
  return subPaths;
}

export function exportToPNG(canvas: HTMLCanvasElement): void {
  const link = document.createElement('a');
  link.download = '蜡染纹样.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}
