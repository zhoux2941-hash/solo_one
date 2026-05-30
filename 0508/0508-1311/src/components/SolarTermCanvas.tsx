import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { SolarTerm, Theme, LayoutType, ExportSizeType } from '../types';
import { SEASON_COLORS, SEASON_NAMES, getTermsBySeason } from '../utils/solarTerm';
import { EXPORT_SIZES } from '../utils/themes';
import { calculateLayout, CanvasLayout, PORTRAIT_LAYOUT, LANDSCAPE_LAYOUT } from '../utils/canvasLayout';
import { getYearGanZhi } from '../utils/lunar';

interface SolarTermCanvasProps {
  year: number;
  terms: SolarTerm[];
  theme: Theme;
  fontFamily: string;
  layout: LayoutType;
  backgroundColor: string;
  exportSize: ExportSizeType;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

const SolarTermCanvas: React.FC<SolarTermCanvasProps> = ({
  year,
  terms,
  theme,
  fontFamily,
  layout,
  backgroundColor,
  exportSize,
  onCanvasReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const baseWidth = useMemo(() => {
    const size = EXPORT_SIZES[exportSize];
    return layout === 'portrait' ? size.width : size.height;
  }, [exportSize, layout]);

  const canvasLayout = useMemo(() => {
    return calculateLayout(baseWidth, layout, terms);
  }, [baseWidth, layout, terms]);

  const renderCanvas = useCallback((
    ctx: CanvasRenderingContext2D,
    L: CanvasLayout
  ) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = backgroundColor || theme.backgroundColor;
    ctx.fillRect(0, 0, L.width, L.height);

    drawDecorativeBorder(ctx, L, theme);
    drawCornerPatterns(ctx, L, theme);
    drawTitle(ctx, L, year, theme, fontFamily);

    const termsBySeason = getTermsBySeason(terms);
    SEASON_NAMES.forEach((season, si) => {
      const sl = L.seasons[si];
      const seasonTerms = termsBySeason[season] || [];

      if (layout === 'portrait') {
        drawSeasonHeader(ctx, sl, season, theme, fontFamily);
        seasonTerms.forEach((term, ti) => {
          drawTermCard(ctx, sl.termCards[ti], term, theme, fontFamily);
        });
      } else {
        drawSeasonHeaderHorizontal(ctx, sl, season, theme, fontFamily);
        seasonTerms.forEach((term, ti) => {
          drawTermCardHorizontal(ctx, sl.termCards[ti], term, theme, fontFamily);
        });
      }
    });

    drawSeal(ctx, L, theme);
    drawFooter(ctx, L, theme, fontFamily);
  }, [year, terms, theme, fontFamily, layout, backgroundColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasLayout.width;
    canvas.height = canvasLayout.height;

    renderCanvas(ctx, canvasLayout);

    if (onCanvasReady) onCanvasReady(canvas);
  }, [canvasLayout, renderCanvas, onCanvasReady]);

  useEffect(() => {
    const updateSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const scale = Math.min(cw / canvasLayout.width, ch / canvasLayout.height) * 0.92;
      canvas.style.width = `${canvasLayout.width * scale}px`;
      canvas.style.height = `${canvasLayout.height * scale}px`;
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [canvasLayout]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden p-4">
      <canvas
        ref={canvasRef}
        className="shadow-2xl rounded"
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
      />
    </div>
  );
};

function drawDecorativeBorder(ctx: CanvasRenderingContext2D, L: CanvasLayout, theme: Theme) {
  const bp = L.padding * 0.6;
  ctx.strokeStyle = theme.borderColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(bp, bp, L.width - bp * 2, L.height - bp * 2);
  ctx.lineWidth = 1;
  ctx.strokeRect(bp + 12, bp + 12, L.width - bp * 2 - 24, L.height - bp * 2 - 24);
  ctx.strokeStyle = theme.accentColor;
  ctx.setLineDash([20, 10]);
  ctx.lineWidth = 2;
  ctx.strokeRect(bp + 6, bp + 6, L.width - bp * 2 - 12, L.height - bp * 2 - 12);
  ctx.setLineDash([]);
}

function drawCornerPatterns(ctx: CanvasRenderingContext2D, L: CanvasLayout, theme: Theme) {
  const cs = L.padding * 0.8;
  const corners = [
    { x: L.padding, y: L.padding, r: 0 },
    { x: L.width - L.padding, y: L.padding, r: Math.PI / 2 },
    { x: L.width - L.padding, y: L.height - L.padding, r: Math.PI },
    { x: L.padding, y: L.height - L.padding, r: -Math.PI / 2 },
  ];
  corners.forEach(c => {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.r);
    ctx.strokeStyle = theme.primaryColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, cs * 0.3);
    ctx.lineTo(0, 0);
    ctx.lineTo(cs * 0.3, 0);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, cs * 0.6);
    ctx.lineTo(0, cs * 0.35);
    ctx.lineTo(cs * 0.35, cs * 0.35);
    ctx.lineTo(cs * 0.35, 0);
    ctx.stroke();
    ctx.restore();
  });
}

function drawTitle(ctx: CanvasRenderingContext2D, L: CanvasLayout, year: number, theme: Theme, fontFamily: string) {
  ctx.fillStyle = theme.primaryColor;
  ctx.font = `bold 72px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('二十四节气', L.titleCenterX, L.titleY);

  ctx.font = `36px ${fontFamily}`;
  ctx.fillStyle = theme.secondaryColor;
  ctx.fillText(`${year}年 · 农历${getYearGanZhi(year)}年`, L.titleCenterX, L.subtitleY);

  ctx.beginPath();
  ctx.moveTo(L.padding + L.contentWidth * 0.1, L.separatorY);
  ctx.lineTo(L.padding + L.contentWidth * 0.9, L.separatorY);
  ctx.strokeStyle = theme.accentColor;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawSeasonHeader(ctx: CanvasRenderingContext2D, sl: CanvasLayout['seasons'][0], season: string, theme: Theme, fontFamily: string) {
  const P = PORTRAIT_LAYOUT;
  const color = SEASON_COLORS[season];

  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.15;
  ctx.fillRect(sl.headerX, sl.headerY, sl.headerWidth, sl.headerHeight);
  ctx.restore();

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(sl.headerX, sl.headerY, sl.headerWidth, sl.headerHeight);

  ctx.fillStyle = color;
  ctx.font = `bold ${P.seasonHeaderFont}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(season, sl.headerX + sl.headerWidth / 2, sl.headerY + sl.headerHeight / 2 - 10);

  const en: Record<string, string> = { '春': 'Spring', '夏': 'Summer', '秋': 'Autumn', '冬': 'Winter' };
  ctx.font = `${P.seasonHeaderENFont}px ${fontFamily}`;
  ctx.fillStyle = theme.textColor;
  ctx.globalAlpha = 0.7;
  ctx.fillText(en[season] || '', sl.headerX + sl.headerWidth / 2, sl.headerY + sl.headerHeight / 2 + 25);
  ctx.globalAlpha = 1;
}

function drawSeasonHeaderHorizontal(ctx: CanvasRenderingContext2D, sl: CanvasLayout['seasons'][0], season: string, theme: Theme, fontFamily: string) {
  const LS = LANDSCAPE_LAYOUT;
  const color = SEASON_COLORS[season];

  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.15;
  ctx.fillRect(sl.headerX, sl.headerY, sl.headerWidth, sl.headerHeight);
  ctx.restore();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(sl.headerX, sl.headerY, sl.headerWidth, sl.headerHeight);

  ctx.fillStyle = color;
  ctx.font = `bold ${LS.seasonHeaderFont}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(season, sl.headerX + sl.headerWidth / 2, sl.headerY + sl.headerHeight / 2);
}

function drawTermCard(ctx: CanvasRenderingContext2D, card: { x: number; y: number; width: number; height: number }, term: SolarTerm, theme: Theme, fontFamily: string) {
  const P = PORTRAIT_LAYOUT;
  const color = SEASON_COLORS[term.season];

  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1;
  ctx.strokeRect(card.x, card.y, card.width, card.height);
  ctx.globalAlpha = 1;

  ctx.fillStyle = theme.primaryColor;
  ctx.font = `bold ${P.termNameFont}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(term.name, card.x + card.width / 2, card.y + P.termNameTop);

  ctx.fillStyle = theme.secondaryColor;
  ctx.font = `${P.termDateFont}px ${fontFamily}`;
  ctx.fillText(term.date, card.x + card.width / 2, card.y + P.termDateTop);

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.8;
  ctx.font = `${P.termLunarFont}px ${fontFamily}`;
  ctx.fillText(`农历 ${term.lunarDate}`, card.x + card.width / 2, card.y + P.termLunarTop);
  ctx.globalAlpha = 1;

  ctx.fillStyle = theme.textColor;
  ctx.globalAlpha = 0.7;
  ctx.font = `${P.termPhenologyFont}px ${fontFamily}`;
  term.phenology.split('，').forEach((line, i) => {
    ctx.fillText(line, card.x + card.width / 2, card.y + P.termPhenologyStart + i * P.termPhenologyLineHeight);
  });
  ctx.globalAlpha = 1;
}

function drawTermCardHorizontal(ctx: CanvasRenderingContext2D, card: { x: number; y: number; width: number; height: number }, term: SolarTerm, theme: Theme, fontFamily: string) {
  const LS = LANDSCAPE_LAYOUT;
  const color = SEASON_COLORS[term.season];

  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  ctx.strokeRect(card.x, card.y, card.width, card.height);
  ctx.globalAlpha = 1;

  ctx.fillStyle = theme.primaryColor;
  ctx.font = `bold ${LS.termNameFont}px ${fontFamily}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(term.name, card.x + LS.termNameLeft, card.y + LS.termNameTop);

  ctx.fillStyle = theme.secondaryColor;
  ctx.font = `${LS.termDateFont}px ${fontFamily}`;
  ctx.fillText(term.date, card.x + LS.termDateLeft, card.y + LS.termDateTop);

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.8;
  ctx.font = `${LS.termLunarFont}px ${fontFamily}`;
  ctx.fillText(term.lunarDate, card.x + LS.termLunarLeft, card.y + LS.termLunarTop);
  ctx.globalAlpha = 1;

  ctx.fillStyle = theme.textColor;
  ctx.globalAlpha = 0.7;
  ctx.font = `${LS.termPhenologyFont}px ${fontFamily}`;
  ctx.textAlign = 'right';
  ctx.fillText(term.phenology, card.x + card.width - LS.termPhenologyRight, card.y + card.height / 2 + 5);
  ctx.globalAlpha = 1;
}

function drawSeal(ctx: CanvasRenderingContext2D, L: CanvasLayout, theme: Theme) {
  const sealSize = 80;
  ctx.save();
  ctx.translate(L.sealX, L.sealY);
  ctx.rotate(-0.1);
  ctx.fillStyle = theme.primaryColor;
  ctx.globalAlpha = 0.85;
  ctx.fillRect(0, 0, sealSize, sealSize);
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(Math.random() * sealSize, Math.random() * sealSize, Math.random() * 8 + 2, Math.random() * 8 + 2);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('节气', sealSize / 2, sealSize / 2 - 10);
  ctx.font = '16px serif';
  ctx.fillText('之印', sealSize / 2, sealSize / 2 + 18);
  ctx.restore();
}

function drawFooter(ctx: CanvasRenderingContext2D, L: CanvasLayout, theme: Theme, fontFamily: string) {
  ctx.fillStyle = theme.textColor;
  ctx.globalAlpha = 0.6;
  ctx.font = `18px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('二十四节气 · 中华传统文化', L.width / 2, L.footerY);
  ctx.globalAlpha = 1;
}

export default SolarTermCanvas;
