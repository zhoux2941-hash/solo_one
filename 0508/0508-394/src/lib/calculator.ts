import type { ComponentResult, Dynasty, ModuleData } from './types';

const SONG_TIAO = 30;
const QING_DK = 1;

function angLengthSong(jumps: number, angIndex: number): number {
  return (jumps - angIndex) * SONG_TIAO + 15;
}

function qingAngLength(jumps: number, angIndex: number): number {
  return 14 + angIndex * 7;
}

export function calculateComponents(
  dynasty: Dynasty,
  jumps: number,
  mod: ModuleData
): ComponentResult[] {
  const f = mod.fenMm;
  const components: ComponentResult[] = [];

  if (dynasty === '宋') {
    calculateSongComponents(jumps, mod, f, components);
  } else {
    calculateQingComponents(jumps, mod, f, components);
  }

  return components;
}

function addComp(
  components: ComponentResult[],
  name: string,
  type: '斗' | '拱' | '昂' | '枋',
  wFen: number,
  hFen: number,
  dFen: number,
  count: number,
  f: number
) {
  const wMm = wFen * f;
  const hMm = hFen * f;
  const dMm = dFen * f;
  components.push({
    name,
    type,
    widthFen: wFen,
    heightFen: hFen,
    depthFen: dFen,
    widthMm: wMm,
    heightMm: hMm,
    depthMm: dMm,
    count,
    volumeMm3: wMm * hMm * dMm * count,
  });
}

function calculateSongComponents(
  jumps: number,
  mod: ModuleData,
  f: number,
  components: ComponentResult[]
) {
  const dcH = mod.dancaiHeight;
  const dcW = mod.dancaiWidth;
  const zcH = mod.zucaiHeight;

  addComp(components, '栌斗', '斗', 32, 20, 32, 1, f);

  const huaCount = jumps >= 2 ? jumps - Math.floor(jumps / 2) : jumps;
  if (huaCount > 0) {
    addComp(components, '华拱', '拱', SONG_TIAO, dcH, dcW, huaCount, f);
  }

  addComp(components, '泥道拱', '拱', 62, dcH, dcW, 1, f);

  const manGongCount = Math.floor(jumps / 2);
  const guaZiGongCount = jumps - 1 - manGongCount;
  if (guaZiGongCount > 0) {
    addComp(components, '瓜子拱', '拱', 62, dcH, dcW, guaZiGongCount, f);
  }
  if (manGongCount > 0) {
    addComp(components, '慢拱', '拱', 92, dcH, dcW, manGongCount, f);
  }

  addComp(components, '令拱', '拱', 72, dcH, dcW, 1, f);

  const angCount = Math.floor(jumps / 2);
  for (let i = 0; i < angCount; i++) {
    const aLen = angLengthSong(jumps, i);
    addComp(components, `下昂${i + 1}`, '昂', aLen, zcH, dcW, 1, f);
  }

  if (jumps >= 4) {
    addComp(components, '上昂', '昂', 30, zcH, dcW, Math.max(0, Math.floor((jumps - 3) / 2)), f);
  }

  const sanDouPerLayer = jumps + 1;
  const sanDouLayers = jumps;
  addComp(components, '散斗', '斗', 14, 10, 16, sanDouPerLayer * sanDouLayers, f);

  addComp(components, '齐心斗', '斗', 14, 10, 16, jumps, f);

  addComp(components, '交互斗', '斗', 18, 10, 16, jumps, f);

  const fangLayers = Math.max(1, Math.min(jumps, 3));
  addComp(components, '柱头枋', '枋', 60, dcH, dcW, fangLayers, f);

  if (jumps >= 2) {
    addComp(components, '罗汉枋', '枋', 60, dcH, dcW, fangLayers - 1, f);
  }

  addComp(components, '撩檐枋', '枋', 60, dcH, dcW, 1, f);

  if (jumps >= 4) {
    addComp(components, '平棊枋', '枋', 60, dcH, dcW, 1, f);
  }
}

function calculateQingComponents(
  jumps: number,
  mod: ModuleData,
  f: number,
  components: ComponentResult[]
) {
  const dcH = mod.dancaiHeight;
  const dcW = mod.dancaiWidth;
  const zcH = mod.zucaiHeight;

  addComp(components, '大斗', '斗', 3 * QING_DK, 2 * QING_DK, 3 * QING_DK, 1, f);

  const qiaoCount = jumps >= 2 ? Math.ceil(jumps / 2) : jumps;
  if (qiaoCount > 0) {
    addComp(components, '翘', '拱', 3 * QING_DK, dcH, dcW, qiaoCount, f);
  }

  const angCount = Math.floor(jumps / 2);
  for (let i = 0; i < angCount; i++) {
    const aLen = qingAngLength(jumps, i);
    addComp(components, `昂${i + 1}`, '昂', aLen, zcH, dcW, 1, f);
  }

  addComp(components, '正心瓜拱', '拱', 6.2 * QING_DK, dcH, dcW, 1, f);
  addComp(components, '正心万拱', '拱', 9.2 * QING_DK, dcH, dcW, Math.max(0, jumps - 1), f);

  const guaGongCount = jumps;
  if (guaGongCount > 0) {
    addComp(components, '瓜拱', '拱', 6.2 * QING_DK, dcH, dcW, guaGongCount, f);
  }

  const wanGongCount = jumps - 1;
  if (wanGongCount > 0) {
    addComp(components, '万拱', '拱', 9.2 * QING_DK, dcH, dcW, wanGongCount, f);
  }

  addComp(components, '厢拱', '拱', 6.2 * QING_DK, dcH, dcW, 1, f);

  const shibaDouPerLayer = jumps + 1;
  const douLayers = jumps;
  addComp(components, '十八斗', '斗', 1.8 * QING_DK, 1.4 * QING_DK, 1.8 * QING_DK, shibaDouPerLayer * douLayers, f);

  addComp(components, '槽升子', '斗', 1.3 * QING_DK, 1.4 * QING_DK, 1.3 * QING_DK, jumps * 2, f);

  addComp(components, '三才升', '斗', 1.3 * QING_DK, 1.4 * QING_DK, 1.3 * QING_DK, jumps * 2, f);

  const zhengXinFangLayers = Math.max(1, jumps);
  addComp(components, '正心枋', '枋', 1.2 * QING_DK, dcH, dcW, zhengXinFangLayers, f);

  const yeFangLayers = Math.max(0, jumps - 1);
  if (yeFangLayers > 0) {
    addComp(components, '拽枋', '枋', 1.2 * QING_DK, dcH, dcW, yeFangLayers, f);
  }

  addComp(components, '挑檐枋', '枋', 1.2 * QING_DK, dcH, dcW, 1, f);
  addComp(components, '井口枋', '枋', 1.2 * QING_DK, dcH, dcW, 1, f);

  if (jumps >= 4) {
    addComp(components, '花台枋', '枋', 1.2 * QING_DK, dcH, dcW, Math.max(0, jumps - 3), f);
  }
}

export type LodLevel = 'low' | 'medium' | 'high';

export interface MortiseTenon {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  type: 'mortise' | 'tenon';
  parentType: '斗' | '拱' | '昂' | '枋';
}

export interface SectionElement {
  x: number;
  y: number;
  w: number;
  h: number;
  depth: number;
  label: string;
  type: '斗' | '拱' | '昂' | '枋';
  color: string;
  isAng?: boolean;
  angEnd?: { x: number; y: number };
  lod?: {
    low: { visible: boolean; simplify: number };
    medium: { visible: boolean; simplify: number };
    high: { visible: boolean; simplify: number };
  };
  mortises?: MortiseTenon[];
  tenons?: MortiseTenon[];
  layerIndex?: number;
  connectionPoints?: { x: number; y: number; z: number }[];
}

export const LOD_DISTANCES = {
  low: 120,
  medium: 70,
  high: 0,
};

export function getLodLevel(distance: number): LodLevel {
  if (distance >= LOD_DISTANCES.low) return 'low';
  if (distance >= LOD_DISTANCES.medium) return 'medium';
  return 'high';
}

function createLodConfig(type: SectionElement['type'], size: number): SectionElement['lod'] {
  const isSmall = size < 15;
  const isMedium = size >= 15 && size < 30;
  
  return {
    low: { visible: !isSmall, simplify: isSmall ? 0 : (isMedium ? 0.6 : 0.4) },
    medium: { visible: true, simplify: isSmall ? 0.8 : 0.6 },
    high: { visible: true, simplify: 1 },
  };
}

function calculateMortiseTenon(
  el: SectionElement,
  upperElements: SectionElement[],
  lowerElements: SectionElement[],
  dcW: number
): { mortises: MortiseTenon[]; tenons: MortiseTenon[] } {
  const mortises: MortiseTenon[] = [];
  const tenons: MortiseTenon[] = [];

  const elCenterX = el.x + el.w / 2;
  const elCenterY = el.y + el.h / 2;
  const tenonSize = dcW * 0.4;
  const mortiseSize = dcW * 0.45;

  for (const upper of upperElements) {
    const upperCenterX = upper.x + upper.w / 2;
    const overlapX = Math.min(el.x + el.w, upper.x + upper.w) - Math.max(el.x, upper.x);
    const verticalDist = upper.y - (el.y + el.h);
    
    if (overlapX > 0 && verticalDist < 5 && verticalDist > -2) {
      const mortise: MortiseTenon = {
        x: upperCenterX - el.x - mortiseSize / 2,
        y: el.h - mortiseSize * 0.6,
        z: 0,
        w: mortiseSize,
        h: mortiseSize * 0.6,
        d: Math.min(el.depth, upper.depth) * 0.9,
        type: 'mortise',
        parentType: el.type,
      };
      mortises.push(mortise);

      const tenon: MortiseTenon = {
        x: upperCenterX - upper.x - tenonSize / 2,
        y: -tenonSize * 0.6,
        z: 0,
        w: tenonSize,
        h: tenonSize * 0.6,
        d: Math.min(el.depth, upper.depth) * 0.85,
        type: 'tenon',
        parentType: upper.type,
      };
      tenons.push(tenon);
    }
  }

  for (const lower of lowerElements) {
    const lowerCenterX = lower.x + lower.w / 2;
    const overlapX = Math.min(el.x + el.w, lower.x + lower.w) - Math.max(el.x, lower.x);
    const verticalDist = el.y - (lower.y + lower.h);
    
    if (overlapX > 0 && verticalDist < 5 && verticalDist > -2) {
      const tenon: MortiseTenon = {
        x: lowerCenterX - el.x - tenonSize / 2,
        y: -tenonSize * 0.6,
        z: 0,
        w: tenonSize,
        h: tenonSize * 0.6,
        d: Math.min(el.depth, lower.depth) * 0.85,
        type: 'tenon',
        parentType: el.type,
      };
      tenons.push(tenon);
    }
  }

  if (el.type === '斗') {
    const earSize = el.w * 0.15;
    mortises.push({
      x: el.w * 0.1,
      y: el.h * 0.4,
      z: -el.depth * 0.4,
      w: el.w * 0.8,
      h: el.h * 0.15,
      d: earSize,
      type: 'mortise',
      parentType: '斗',
    });
    mortises.push({
      x: el.w * 0.1,
      y: el.h * 0.4,
      z: el.depth * 0.4 - earSize,
      w: el.w * 0.8,
      h: el.h * 0.15,
      d: earSize,
      type: 'mortise',
      parentType: '斗',
    });
  }

  if (el.type === '拱' || el.type === '昂') {
    const tenonW = el.w * 0.08;
    tenons.push({
      x: -tenonW * 0.5,
      y: el.h * 0.3,
      z: 0,
      w: tenonW,
      h: el.h * 0.4,
      d: el.depth * 0.9,
      type: 'tenon',
      parentType: el.type,
    });
    tenons.push({
      x: el.w - tenonW * 0.5,
      y: el.h * 0.3,
      z: 0,
      w: tenonW,
      h: el.h * 0.4,
      d: el.depth * 0.9,
      type: 'tenon',
      parentType: el.type,
    });
  }

  return { mortises, tenons };
}

function calculateConnectionPoints(el: SectionElement): { x: number; y: number; z: number }[] {
  const points: { x: number; y: number; z: number }[] = [];
  const cx = el.x + el.w / 2;
  const cy = el.y + el.h / 2;

  points.push({ x: cx, y: cy, z: 0 });
  points.push({ x: el.x + el.w * 0.25, y: cy, z: 0 });
  points.push({ x: el.x + el.w * 0.75, y: cy, z: 0 });
  
  if (el.type === '斗') {
    points.push({ x: cx, y: el.y + el.h * 0.3, z: -el.depth * 0.4 });
    points.push({ x: cx, y: el.y + el.h * 0.3, z: el.depth * 0.4 });
  }

  return points;
}

export function recalculateMortisesOnZoom(
  elements: SectionElement[],
  zoomScale: number,
  dcW: number
): SectionElement[] {
  const adjustedDcW = dcW * Math.max(0.5, Math.min(2, zoomScale));
  
  return elements.map((el, idx) => {
    const upperElements = elements.filter((e, i) => 
      i !== idx && e.y > el.y && Math.abs(e.y - el.y) < 30
    );
    const lowerElements = elements.filter((e, i) => 
      i !== idx && e.y < el.y && Math.abs(el.y - e.y) < 30
    );
    
    const { mortises, tenons } = calculateMortiseTenon(el, upperElements, lowerElements, adjustedDcW);
    
    return {
      ...el,
      mortises,
      tenons,
    };
  });
}

export function calculateSectionElements(
  dynasty: Dynasty,
  jumps: number,
  mod: ModuleData
): SectionElement[] {
  const elements: SectionElement[] = [];
  const dcH = mod.dancaiHeight;
  const dcW = mod.dancaiWidth;
  const zcH = mod.zucaiHeight;
  const qiH = mod.qiHeight;

  if (dynasty === '宋') {
    const luW = 32;
    const luH = 20;
    elements.push({
      x: -luW / 2, y: 0, w: luW, h: luH,
      depth: luW, label: '栌斗', type: '斗', color: '#8D6E63'
    });

    let currentY = luH;
    let angIndex = 0;

    for (let j = 0; j < jumps; j++) {
      const isAngLayer = j % 2 === 1 && j > 0;
      const jumpLen = SONG_TIAO;
      const jumpX = j * SONG_TIAO;

      if (isAngLayer) {
        const aLen = angLengthSong(jumps, angIndex);
        const startX = -16;
        const endX = startX + aLen;
        const startY = currentY;
        const endY = currentY + zcH;

        elements.push({
          x: startX, y: startY, w: aLen, h: zcH,
          depth: dcW, label: `下昂${angIndex + 1}`, type: '昂', color: '#5D4037',
          isAng: true, angEnd: { x: endX, y: endY }
        });

        const angDouY = currentY + zcH - 10;
        elements.push({
          x: jumpX + jumpLen / 2 - 7, y: angDouY, w: 14, h: 10,
          depth: 16, label: '交互斗', type: '斗', color: '#6D4C41'
        });

        const lingY = angDouY + 10 + qiH;
        elements.push({
          x: jumpX - 21, y: lingY, w: 72, h: dcH,
          depth: dcW, label: '令拱', type: '拱', color: '#D7CCC8'
        });

        angIndex++;
      } else {
        elements.push({
          x: jumpX, y: currentY, w: jumpLen, h: dcH,
          depth: dcW, label: `华拱${j + 1}`, type: '拱', color: '#A1887F'
        });

        elements.push({
          x: jumpX + jumpLen / 2 - 7, y: currentY + dcH, w: 14, h: 10,
          depth: 16, label: '散斗', type: '斗', color: '#6D4C41'
        });

        const upperGongY = currentY + dcH + qiH;
        if (j === 0) {
          elements.push({
            x: -31, y: upperGongY, w: 62, h: dcH,
            depth: dcW, label: '泥道拱', type: '拱', color: '#BCAAA4'
          });
        } else {
          const isMan = j % 2 === 0;
          elements.push({
            x: isMan ? jumpX - 46 : jumpX - 31,
            y: upperGongY,
            w: isMan ? 92 : 62, h: dcH,
            depth: dcW,
            label: isMan ? `慢拱${j}` : `瓜子拱${j}`,
            type: '拱',
            color: isMan ? '#BCAAA4' : '#D7CCC8'
          });
        }

        elements.push({
          x: jumpX - 30, y: currentY - dcH, w: 60, h: dcH,
          depth: dcW, label: j === 0 ? '柱头枋' : '罗汉枋', type: '枋', color: '#5D4037'
        });
      }

      currentY += zcH;
    }

    elements.push({
      x: (jumps - 1) * SONG_TIAO - 36, y: currentY + qiH, w: 72, h: dcH,
      depth: dcW, label: '令拱', type: '拱', color: '#D7CCC8'
    });

    elements.push({
      x: (jumps - 1) * SONG_TIAO - 30, y: currentY + qiH + dcH + qiH, w: 60, h: dcH,
      depth: dcW, label: '撩檐枋', type: '枋', color: '#5D4037'
    });

  } else {
    const daDouW = 3 * QING_DK;
    const daDouH = 2 * QING_DK;
    elements.push({
      x: -daDouW / 2, y: 0, w: daDouW, h: daDouH,
      depth: daDouW, label: '大斗', type: '斗', color: '#8D6E63'
    });

    let currentY = daDouH;
    let angIndex = 0;

    for (let j = 0; j < jumps; j++) {
      const isAngLayer = j % 2 === 1 && j > 0;
      const qiaoLen = 3 * QING_DK;
      const qiaoX = j * qiaoLen;

      if (isAngLayer) {
        const aLen = qingAngLength(jumps, angIndex);
        const startX = -1.5;
        const endX = startX + aLen;

        elements.push({
          x: startX, y: currentY, w: aLen, h: zcH,
          depth: dcW, label: `昂${angIndex + 1}`, type: '昂', color: '#5D4037',
          isAng: true, angEnd: { x: endX, y: currentY + zcH }
        });

        elements.push({
          x: qiaoX + qiaoLen / 2 - 0.9, y: currentY + zcH - 1.4,
          w: 1.8 * QING_DK, h: 1.4 * QING_DK,
          depth: 1.8 * QING_DK, label: '十八斗', type: '斗', color: '#6D4C41'
        });

        angIndex++;
      } else {
        elements.push({
          x: qiaoX, y: currentY, w: qiaoLen, h: dcH,
          depth: dcW, label: `翘${j + 1}`, type: '拱', color: '#A1887F'
        });

        elements.push({
          x: qiaoX + qiaoLen / 2 - 0.9, y: currentY + dcH,
          w: 1.8 * QING_DK, h: 1.4 * QING_DK,
          depth: 1.8 * QING_DK, label: '十八斗', type: '斗', color: '#6D4C41'
        });

        const upperGongY = currentY + dcH + qiH;
        if (j === 0) {
          elements.push({
            x: -3.1, y: upperGongY, w: 6.2 * QING_DK, h: dcH,
            depth: dcW, label: '正心瓜拱', type: '拱', color: '#BCAAA4'
          });
        } else {
          const isMan = j % 2 === 0;
          elements.push({
            x: qiaoX - (isMan ? 4.6 : 3.1),
            y: upperGongY,
            w: (isMan ? 9.2 : 6.2) * QING_DK, h: dcH,
            depth: dcW,
            label: isMan ? `万拱${j}` : `瓜拱${j}`,
            type: '拱',
            color: isMan ? '#BCAAA4' : '#D7CCC8'
          });
        }

        elements.push({
          x: qiaoX - 6, y: currentY - dcH, w: 12 * QING_DK, h: dcH,
          depth: dcW, label: j === 0 ? '正心枋' : '拽枋', type: '枋', color: '#5D4037'
        });
      }

      currentY += zcH;
    }

    const xiangX = (jumps - 1) * 3 * QING_DK;
    elements.push({
      x: xiangX - 3.1, y: currentY + qiH, w: 6.2 * QING_DK, h: dcH,
      depth: dcW, label: '厢拱', type: '拱', color: '#D7CCC8'
    });

    elements.push({
      x: xiangX - 6, y: currentY + qiH + dcH + qiH, w: 12 * QING_DK, h: dcH,
      depth: dcW, label: '挑檐枋', type: '枋', color: '#5D4037'
    });
  }

  const sortedByY = [...elements].sort((a, b) => a.y - b.y);
  
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const maxDim = Math.max(el.w, el.h, el.depth);
    
    el.lod = createLodConfig(el.type, maxDim);
    el.layerIndex = sortedByY.findIndex(e => e === el);
    el.connectionPoints = calculateConnectionPoints(el);
    
    const upperElements = elements.filter((e, idx) => 
      idx !== i && e.y > el.y && Math.abs(e.y - (el.y + el.h)) < 8
    );
    const lowerElements = elements.filter((e, idx) => 
      idx !== i && e.y < el.y && Math.abs(el.y - (e.y + e.h)) < 8
    );
    
    const { mortises, tenons } = calculateMortiseTenon(el, upperElements, lowerElements, dcW);
    el.mortises = mortises;
    el.tenons = tenons;
  }

  return elements;
}
