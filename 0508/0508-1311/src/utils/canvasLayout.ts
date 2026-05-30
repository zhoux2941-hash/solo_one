import { SolarTerm, LayoutType } from '../types';
import { SEASON_NAMES } from './solarTerm';

const TITLE_FONT = 72;
const TITLE_TOP_OFFSET = 80;
const SUBTITLE_FONT = 36;
const SUBTITLE_OFFSET = 70;
const SEPARATOR_GAP = 30;
const FOOTER_FONT = 18;
const FOOTER_BOTTOM_OFFSET = 40;
const SEASON_HEADER_EN_OFFSET = 35;

export const PORTRAIT_LAYOUT = {
  seasonPaddingTop: 25,
  seasonPaddingBottom: 10,
  seasonHeaderWidth: 80,
  seasonHeaderHeight: 120,
  seasonHeaderFont: 42,
  seasonHeaderENFont: 16,
  seasonHeaderGap: 15,
  termsPerRow: 3,
  termCardGapX: 10,
  termCardGapY: 8,
  termCardLeftOffset: 100,
  termNameFont: 32,
  termDateFont: 18,
  termLunarFont: 14,
  termPhenologyFont: 13,
  termNameTop: 8,
  termDateTop: 48,
  termLunarTop: 72,
  termPhenologyStart: 95,
  termPhenologyLineHeight: 18,
  termCardMinHeight: 135,
  seasonGap: 10,
} as const;

export const LANDSCAPE_LAYOUT = {
  seasonPaddingX: 15,
  seasonHeaderHeight: 50,
  seasonHeaderFont: 28,
  seasonHeaderGap: 10,
  termCardGap: 5,
  termNameFont: 22,
  termDateFont: 16,
  termLunarFont: 12,
  termPhenologyFont: 12,
  termNameLeft: 15,
  termNameTop: 5,
  termDateLeft: 85,
  termDateTop: 8,
  termLunarLeft: 85,
  termLunarTop: 28,
  termPhenologyRight: 15,
  termCardMinHeight: 55,
  seasonGap: 10,
} as const;

export interface TermCardLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SeasonLayout {
  headerX: number;
  headerY: number;
  headerWidth: number;
  headerHeight: number;
  termCards: TermCardLayout[];
}

export interface CanvasLayout {
  width: number;
  height: number;
  padding: number;
  contentWidth: number;
  titleCenterX: number;
  titleY: number;
  subtitleY: number;
  separatorY: number;
  footerY: number;
  sealX: number;
  sealY: number;
  seasons: SeasonLayout[];
}

export function calculateLayout(
  baseWidth: number,
  layout: LayoutType,
  terms: SolarTerm[]
): CanvasLayout {
  const padding = baseWidth * 0.05;
  const contentWidth = baseWidth - padding * 2;
  const titleCenterX = padding + contentWidth / 2;
  const titleY = padding + TITLE_TOP_OFFSET;
  const subtitleY = titleY + SUBTITLE_OFFSET;
  const separatorY = subtitleY + SEPARATOR_GAP;

  const termsBySeason: Record<string, SolarTerm[]> = {};
  SEASON_NAMES.forEach(s => {
    termsBySeason[s] = terms.filter(t => t.season === s);
  });

  let seasons: SeasonLayout[];
  let totalContentHeight: number;

  if (layout === 'portrait') {
    const P = PORTRAIT_LAYOUT;
    seasons = [];
    let currentY = separatorY + 20;

    for (const season of SEASON_NAMES) {
      const seasonTerms = termsBySeason[season] || [];
      const rows = Math.ceil(seasonTerms.length / P.termsPerRow);
      const termWidth = (contentWidth - P.termCardLeftOffset - P.termCardGapX * (P.termsPerRow - 1)) / P.termsPerRow;
      const termHeight = P.termCardMinHeight;
      const seasonContentHeight = P.seasonPaddingTop + P.seasonHeaderHeight + P.seasonHeaderGap + rows * termHeight + (rows - 1) * P.termCardGapY + P.seasonPaddingBottom;

      const seasonLayout: SeasonLayout = {
        headerX: padding + 30,
        headerY: currentY + P.seasonPaddingTop,
        headerWidth: P.seasonHeaderWidth,
        headerHeight: P.seasonHeaderHeight,
        termCards: [],
      };

      seasonTerms.forEach((term, i) => {
        const col = i % P.termsPerRow;
        const row = Math.floor(i / P.termsPerRow);
        seasonLayout.termCards.push({
          x: padding + P.termCardLeftOffset + col * (termWidth + P.termCardGapX),
          y: currentY + P.seasonPaddingTop + P.seasonHeaderHeight + P.seasonHeaderGap + row * (termHeight + P.termCardGapY),
          width: termWidth,
          height: termHeight,
        });
      });

      seasons.push(seasonLayout);
      currentY += seasonContentHeight + P.seasonGap;
    }

    totalContentHeight = currentY - (separatorY + 20);
  } else {
    const L = LANDSCAPE_LAYOUT;
    const seasonWidth = contentWidth / 4;
    seasons = [];
    let maxSeasonHeight = 0;

    for (let si = 0; si < SEASON_NAMES.length; si++) {
      const season = SEASON_NAMES[si];
      const seasonTerms = termsBySeason[season] || [];
      const termWidth = seasonWidth - L.seasonPaddingX * 2 - 20;
      const termHeight = L.termCardMinHeight;
      const seasonContentHeight = L.seasonHeaderHeight + L.seasonHeaderGap + seasonTerms.length * termHeight + (seasonTerms.length - 1) * L.termCardGap + 20;

      const seasonX = padding + si * seasonWidth + L.seasonPaddingX;
      const seasonLayout: SeasonLayout = {
        headerX: seasonX,
        headerY: separatorY + 30,
        headerWidth: seasonWidth - L.seasonPaddingX * 2,
        headerHeight: L.seasonHeaderHeight,
        termCards: [],
      };

      seasonTerms.forEach((term, i) => {
        seasonLayout.termCards.push({
          x: seasonX + 10,
          y: separatorY + 30 + L.seasonHeaderHeight + L.seasonHeaderGap + i * (termHeight + L.termCardGap),
          width: termWidth,
          height: termHeight,
        });
      });

      seasons.push(seasonLayout);
      maxSeasonHeight = Math.max(maxSeasonHeight, seasonContentHeight);
    }

    totalContentHeight = maxSeasonHeight;
  }

  const footerY = separatorY + 30 + totalContentHeight + FOOTER_BOTTOM_OFFSET;
  const totalHeight = footerY + FOOTER_FONT + padding * 0.3;

  const sealSize = 80;
  const sealX = baseWidth - padding - 100;
  const sealY = padding + 60;

  return {
    width: baseWidth,
    height: totalHeight,
    padding,
    contentWidth,
    titleCenterX,
    titleY,
    subtitleY,
    separatorY,
    footerY,
    sealX,
    sealY,
    seasons,
  };
}
