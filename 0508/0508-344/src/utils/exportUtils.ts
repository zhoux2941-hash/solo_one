import type Konva from 'konva';
import jsPDF from 'jspdf';

export interface ExportOptions {
  format: 'png' | 'pdf';
  includeTimestamp: boolean;
  includeOperator: boolean;
  operatorName: string;
}

export async function exportChartAsImage(
  stage: Konva.Stage,
  options: ExportOptions
): Promise<string> {
  const originalScale = stage.scale();
  const originalPosition = stage.position();

  stage.scale({ x: 1, y: 1 });
  stage.position({ x: 0, y: 0 });
  stage.batchDraw();

  await new Promise((resolve) => setTimeout(resolve, 50));

  const dataUrl = stage.toDataURL({
    pixelRatio: 2,
    mimeType: 'image/png',
  });

  stage.scale(originalScale);
  stage.position(originalPosition);
  stage.batchDraw();

  const img = new Image();
  img.src = dataUrl;
  await new Promise((resolve) => {
    img.onload = resolve;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const footerHeight = 60;
  canvas.width = img.width;
  canvas.height = img.height + footerHeight;

  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(img, 0, 0);

  if (options.includeTimestamp || options.includeOperator) {
    const timestamp = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const footerY = img.height + 10;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(0, img.height, canvas.width, footerHeight);

    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, img.height);
    ctx.lineTo(canvas.width, img.height);
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '24px Roboto Mono, monospace';
    ctx.textAlign = 'left';

    let infoText = '';

    if (options.includeTimestamp) {
      infoText += `导出时间: ${timestamp}`;
    }

    if (options.includeOperator && options.operatorName) {
      if (infoText) infoText += '  |  ';
      infoText += `值班员: ${options.operatorName}`;
    }

    ctx.fillText(infoText, 30, footerY + 30);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#60A5FA';
    ctx.font = 'bold 24px Orbitron, Roboto Mono, monospace';
    ctx.fillText('引航站海图工作台 - 值班图', canvas.width - 30, footerY + 30);
  }

  return canvas.toDataURL('image/png');
}

export async function exportChartAsPDF(
  stage: Konva.Stage,
  options: ExportOptions
): Promise<Blob> {
  const imageData = await exportChartAsImage(stage, options);

  const img = new Image();
  img.src = imageData;
  await new Promise((resolve) => {
    img.onload = resolve;
  });

  const imgWidth = img.width;
  const imgHeight = img.height;
  const aspectRatio = imgWidth / imgHeight;

  const pdfWidth = 297;
  const pdfHeight = pdfWidth / aspectRatio;

  const pdf = new jsPDF({
    orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pdfWidth, Math.max(pdfHeight, 210)],
  });

  const x = 0;
  const y = 10;
  const width = pdfWidth;
  const height = pdfHeight - 20;

  pdf.addImage(imageData, 'PNG', x, y, width, height);

  return pdf.output('blob');
}

export function downloadFile(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  downloadFile(url, filename);
  URL.revokeObjectURL(url);
}

export function generateExportFilename(format: 'png' | 'pdf'): string {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
  return `海图值班图_${timestamp}_${time}.${format}`;
}
