import React, { useRef, useEffect, useCallback } from 'react';
import { useDougongStore } from '@/store/useDougongStore';
import { calculateSectionElements } from '@/lib/calculator';

function lightenColor(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.min(255, r + amount)},${Math.min(255, g + amount)},${Math.min(255, b + amount)})`;
}

function darkenColor(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.max(0, r - amount)},${Math.max(0, g - amount)},${Math.max(0, b - amount)})`;
}

export default function SectionView2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dynasty = useDougongStore((s) => s.dynasty);
  const jumps = useDougongStore((s) => s.jumps);
  const moduleData = useDougongStore((s) => s.moduleData);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !moduleData) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#2B1E17');
    bgGrad.addColorStop(0.4, '#1E1510');
    bgGrad.addColorStop(1, '#0F0C08');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const sunRayGrad = ctx.createRadialGradient(w * 0.8, h * 0.15, 0, w * 0.8, h * 0.15, Math.max(w, h) * 0.8);
    sunRayGrad.addColorStop(0, 'rgba(255, 220, 150, 0.06)');
    sunRayGrad.addColorStop(0.3, 'rgba(255, 200, 120, 0.03)');
    sunRayGrad.addColorStop(1, 'rgba(255, 180, 90, 0)');
    ctx.fillStyle = sunRayGrad;
    ctx.fillRect(0, 0, w, h);

    const elements = calculateSectionElements(dynasty, jumps, moduleData);
    if (elements.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of elements) {
      if (el.x < minX) minX = el.x;
      if (el.y < minY) minY = el.y;
      if (el.x + el.w > maxX) maxX = el.x + el.w;
      if (el.y + el.h > maxY) maxY = el.y + el.h;
    }

    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const padX = contentW * 0.15;
    const padY = contentH * 0.15;

    const dimSpace = 50;
    const titleSpace = 36;
    const drawW = w - dimSpace;
    const drawH = h - titleSpace;
    const scale = Math.min(drawW / (contentW + padX * 2), drawH / (contentH + padY * 2));
    const offsetX = (drawW - contentW * scale) / 2 - minX * scale;
    const offsetY = (drawH - contentH * scale) / 2 - minY * scale + titleSpace;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const sunAngle = Math.PI / 5;
    const shadowLength = 6;
    const shadowDx = Math.cos(sunAngle) * shadowLength;
    const shadowDy = Math.sin(sunAngle) * shadowLength;

    const gridStep = 10;
    const gMinX = Math.floor(minX / gridStep) * gridStep;
    const gMinY = Math.floor(minY / gridStep) * gridStep;
    const gMaxX = Math.ceil(maxX / gridStep) * gridStep;
    const gMaxY = Math.ceil(maxY / gridStep) * gridStep;

    ctx.strokeStyle = 'rgba(212,168,67,0.04)';
    ctx.lineWidth = 0.5 / scale;
    for (let gx = gMinX; gx <= gMaxX; gx += gridStep) {
      ctx.beginPath();
      ctx.moveTo(gx, gMinY);
      ctx.lineTo(gx, gMaxY);
      ctx.stroke();
    }
    for (let gy = gMinY; gy <= gMaxY; gy += gridStep) {
      ctx.beginPath();
      ctx.moveTo(gMinX, gy);
      ctx.lineTo(gMaxX, gy);
      ctx.stroke();
    }

    const sortedElements = [...elements].sort((a, b) => a.y - b.y || a.x - b.x);

    for (const el of sortedElements) {
      if (el.isAng && el.angEnd) {
        ctx.save();

        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.moveTo(el.x + shadowDx, el.y + shadowDy);
        ctx.lineTo(el.x + el.w + shadowDx, el.y + shadowDy);
        ctx.lineTo(el.angEnd.x + shadowDx, el.angEnd.y + shadowDy);
        ctx.lineTo(el.angEnd.x - el.h + shadowDx, el.angEnd.y + shadowDy);
        ctx.closePath();
        ctx.fill();

        const grad = ctx.createLinearGradient(el.x, el.y, el.angEnd.x, el.angEnd.y + el.h);
        grad.addColorStop(0, lightenColor(el.color, 35));
        grad.addColorStop(0.4, lightenColor(el.color, 12));
        grad.addColorStop(1, darkenColor(el.color, 25));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.x + el.w, el.y);
        ctx.lineTo(el.angEnd.x, el.angEnd.y);
        ctx.lineTo(el.angEnd.x - el.h, el.angEnd.y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 240, 200, 0.12)';
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.x + el.w, el.y);
        ctx.lineTo(el.x + el.w, el.y + el.h * 0.25);
        ctx.lineTo(el.x, el.y + el.h * 0.25);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.moveTo(el.angEnd.x - el.h * 0.3, el.angEnd.y);
        ctx.lineTo(el.angEnd.x, el.angEnd.y);
        ctx.lineTo(el.angEnd.x, el.angEnd.y - el.h * 0.6);
        ctx.lineTo(el.angEnd.x - el.h * 0.3, el.angEnd.y - el.h * 0.6);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = lightenColor(el.color, 60);
        ctx.lineWidth = 0.5 / scale;
        ctx.stroke();

        const angMidX = (el.x + el.angEnd.x) / 2;
        const angMidY = (el.y + el.angEnd.y) / 2;
        const fontSize = Math.min(el.w * 0.2, el.h * 0.55, 6);
        if (fontSize > 1.5) {
          ctx.fillStyle = 'rgba(255,255,255,0.92)';
          ctx.font = `500 ${fontSize}px "Noto Sans SC", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const angAngle = Math.atan2(el.angEnd.y - el.y, el.angEnd.x - el.x);
          ctx.save();
          ctx.translate(angMidX, angMidY);
          ctx.rotate(angAngle);
          ctx.shadowColor = 'rgba(0,0,0,0.6)';
          ctx.shadowBlur = 1;
          ctx.fillText(el.label, 0, 0);
          ctx.shadowBlur = 0;
          ctx.restore();
        }

        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.moveTo(el.x, el.y + el.h);
        ctx.lineTo(el.x + shadowDx, el.y + el.h + shadowDy);
        ctx.lineTo(el.x + el.w + shadowDx, el.y + el.h + shadowDy);
        ctx.lineTo(el.x + el.w + shadowDx, el.y + shadowDy);
        ctx.lineTo(el.x + el.w, el.y);
        ctx.lineTo(el.x, el.y);
        ctx.closePath();
        ctx.fill();

        const grad = ctx.createLinearGradient(el.x, el.y, el.x, el.y + el.h);
        grad.addColorStop(0, lightenColor(el.color, 35));
        grad.addColorStop(0.35, lightenColor(el.color, 10));
        grad.addColorStop(1, darkenColor(el.color, 25));
        ctx.fillStyle = grad;
        ctx.fillRect(el.x, el.y, el.w, el.h);

        ctx.fillStyle = 'rgba(255, 240, 200, 0.15)';
        ctx.fillRect(el.x, el.y, el.w, el.h * 0.28);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.fillRect(el.x, el.y + el.h * 0.72, el.w, el.h * 0.28);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(el.x + el.w * 0.75, el.y, el.w * 0.25, el.h);

        ctx.strokeStyle = lightenColor(el.color, 60);
        ctx.lineWidth = 0.5 / scale;
        ctx.strokeRect(el.x, el.y, el.w, el.h);

        ctx.strokeStyle = darkenColor(el.color, 35);
        ctx.lineWidth = 0.3 / scale;
        ctx.beginPath();
        ctx.moveTo(el.x + el.w * 0.02, el.y + el.h * 0.02);
        ctx.lineTo(el.x + el.w * 0.02, el.y + el.h * 0.98);
        ctx.stroke();

        const fontSize = Math.min(el.w * 0.45, el.h * 0.55, 7);
        if (fontSize > 1.5) {
          ctx.fillStyle = 'rgba(255,255,255,0.92)';
          ctx.font = `500 ${fontSize}px "Noto Sans SC", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0,0,0,0.6)';
          ctx.shadowBlur = 1;
          ctx.fillText(el.label, el.x + el.w / 2, el.y + el.h / 2);
          ctx.shadowBlur = 0;
        }
      }
    }

    ctx.restore();

    const dustParticles = 40;
    for (let i = 0; i < dustParticles; i++) {
      const px = (Math.sin(i * 137.5) * 0.5 + 0.5) * w;
      const py = (Math.cos(i * 97.3) * 0.5 + 0.5) * h;
      const size = 0.5 + (i % 3) * 0.5;
      const alpha = 0.03 + (i % 5) * 0.01;
      ctx.fillStyle = `rgba(255, 230, 180, ${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const rightX = w - dimSpace + 12;
    const topPx = offsetY;
    const botPx = offsetY + contentH * scale;

    ctx.strokeStyle = 'rgba(212,168,67,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightX, topPx);
    ctx.lineTo(rightX, botPx);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rightX - 4, topPx);
    ctx.lineTo(rightX + 4, topPx);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rightX - 4, botPx);
    ctx.lineTo(rightX + 4, botPx);
    ctx.stroke();

    ctx.fillStyle = '#D4A843';
    ctx.font = '11px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(rightX + 14, (topPx + botPx) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${(contentH * moduleData.fenMm).toFixed(0)}mm`, 0, 0);
    ctx.restore();

    const leftPx = offsetX + minX * scale;
    const rightContentPx = offsetX + maxX * scale;
    const bottomY = botPx + 16;

    ctx.beginPath();
    ctx.moveTo(leftPx, bottomY);
    ctx.lineTo(rightContentPx, bottomY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(leftPx, bottomY - 4);
    ctx.lineTo(leftPx, bottomY + 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rightContentPx, bottomY - 4);
    ctx.lineTo(rightContentPx, bottomY + 4);
    ctx.stroke();
    ctx.fillText(`${(contentW * moduleData.fenMm).toFixed(0)}mm`, (leftPx + rightContentPx) / 2, bottomY + 14);

    ctx.fillStyle = '#D4A843';
    ctx.font = 'bold 15px "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText('横剖面图', w / 2, 22);
    ctx.shadowBlur = 0;

    const vignette = ctx.createRadialGradient(
      w / 2, h / 2, Math.min(w, h) * 0.25,
      w / 2, h / 2, Math.max(w, h) * 0.85
    );
    vignette.addColorStop(0, 'rgba(26,18,16,0)');
    vignette.addColorStop(0.7, 'rgba(26,18,16,0.25)');
    vignette.addColorStop(1, 'rgba(26,18,16,0.65)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }, [dynasty, jumps, moduleData]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  return (
    <div className="relative rounded-lg overflow-hidden shadow-lg h-full border border-[#5D4037]/30">
      <div ref={containerRef} className="w-full h-full">
        <canvas ref={canvasRef} className="block w-full h-full" />
      </div>
    </div>
  );
}
