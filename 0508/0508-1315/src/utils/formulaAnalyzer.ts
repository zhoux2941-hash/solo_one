import { SelectedSpice, FormulaAnalysis, AromaCategory, AromaType } from '../types';

const AROMA_TYPE_NAMES: Record<AromaType, string> = {
  woody: '木质',
  spicy: '辛香',
  fresh: '清凉',
  sweet: '甘甜',
  musk: '麝香',
};

const SUGGESTIONS = [
  '此香方配伍均衡，香气层次丰富，适合日常品香使用。',
  '建议在书房或茶室使用，可助于凝神静气。',
  '香气温润，适合秋冬季节熏燃，暖身养心。',
  '香气清冽，适合夏季使用，可提神醒脑。',
  '此香方偏于浓郁，建议少量熏燃，以免过腻。',
  '此香方清雅宜人，适合晨起使用，开启美好一天。',
];

export function analyzeFormula(selected: SelectedSpice[]): FormulaAnalysis | null {
  if (selected.length === 0) return null;

  const totalWeight = selected.reduce((sum, s) => sum + s.grams, 0);

  const attributes = {
    woody: 0,
    spicy: 0,
    fresh: 0,
    sweet: 0,
    musk: 0,
  };

  let totalIntensity = 0;
  let warmCount = 0;
  let coolCount = 0;

  const sortedByDuration = [...selected].sort((a, b) => a.spice.duration - b.spice.duration);

  selected.forEach((item) => {
    const weight = item.grams / totalWeight;
    attributes[item.spice.aromaType] += weight * item.spice.intensity;
    totalIntensity += weight * item.spice.intensity;

    if (item.spice.temperature === 'warm') warmCount += item.grams;
    if (item.spice.temperature === 'cool') coolCount += item.grams;
  });

  const dominantAroma = Object.entries(attributes)
    .sort(([, a], [, b]) => b - a)[0][0] as AromaType;

  let aromaType: AromaCategory;
  if (totalIntensity < 4) {
    aromaType = coolCount > warmCount ? '清雅' : '淡雅';
  } else if (totalIntensity > 6.5) {
    aromaType = '浓郁';
  } else {
    if (warmCount > coolCount * 1.5) {
      aromaType = '温润';
    } else if (coolCount > warmCount * 1.5) {
      aromaType = '清冽';
    } else {
      aromaType = dominantAroma === 'woody' || dominantAroma === 'musk' ? '醇厚' : '清雅';
    }
  }

  const getNote = (spices: SelectedSpice[]): string => {
    if (spices.length === 0) return '无';
    return spices
      .slice(0, 2)
      .map((s) => s.spice.name)
      .join('、');
  };

  const topNote = getNote(sortedByDuration.filter((s) => s.spice.duration <= 4));
  const middleNote = getNote(sortedByDuration.filter((s) => s.spice.duration > 4 && s.spice.duration <= 7));
  const baseNote = getNote(sortedByDuration.filter((s) => s.spice.duration > 7));

  const maxAttr = Math.max(...Object.values(attributes));
  Object.keys(attributes).forEach((key) => {
    attributes[key as AromaType] = Math.round((attributes[key as AromaType] / maxAttr) * 100);
  });

  const balanceScore = 100 - Math.abs(attributes.woody - attributes.sweet) * 0.3
    - Math.abs(attributes.fresh - attributes.spicy) * 0.2;
  const overallScore = Math.min(100, Math.round(balanceScore));

  const suggestion = SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)];

  return {
    totalWeight: Math.round(totalWeight * 100) / 100,
    aromaType,
    topNote: topNote || getNote(sortedByDuration.slice(0, 1)),
    middleNote: middleNote || getNote(sortedByDuration.slice(1, 3)),
    baseNote: baseNote || getNote(sortedByDuration.slice(-1)),
    overallScore,
    suggestion,
    attributes,
  };
}

export function getAromaTypeName(type: AromaType): string {
  return AROMA_TYPE_NAMES[type];
}
