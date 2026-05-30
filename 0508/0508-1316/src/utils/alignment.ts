import { BambooSlip } from '../types';
import { bigramModel, trigramModel } from '../data/laoziCorpus';

export const HOLE_ALIGNMENT_THRESHOLD = 8;
export const TEXTURE_SIMILARITY_THRESHOLD = 0.7;
export const GLYPH_SIMILARITY_THRESHOLD = 0.5;
export const SEMANTIC_PROBABILITY_THRESHOLD = 0.05;
export const OVERALL_ALIGNMENT_THRESHOLD = 0.65;

const charStrokeCount: Record<string, number> = {
  '道': 12, '可': 5, '非': 8, '恒': 9, '名': 6, '也': 3,
  '无': 4, '万': 3, '物': 8, '之': 3, '始': 8, '有': 6,
  '母': 5, '故': 9, '欲': 11, '以': 4, '观': 6, '其': 8,
  '妙': 7, '所': 8, '天': 4, '下': 3, '皆': 9, '知': 8,
  '美': 9, '为': 4, '斯': 12, '恶': 10, '已': 3, '善': 12,
  '不': 4, '相': 9, '生': 5, '难': 10, '易': 8, '成': 6,
  '长': 4, '短': 12, '形': 7, '高': 10, '卑': 8, '倾': 10,
  '音': 9, '声': 7, '和': 8, '前': 9, '后': 6, '随': 11,
  '是': 9, '圣': 5, '人': 2, '处': 5, '行': 6, '教': 11,
  '作': 7, '焉': 11, '而': 6, '辞': 13, '弗': 5, '居': 8,
  '夫': 4, '唯': 11, '去': 5, '尚': 8, '贤': 8, '使': 8,
  '民': 5, '争': 6, '贵': 9, '得': 11, '货': 8, '盗': 11,
  '见': 4, '心': 4, '乱': 7, '治': 8, '虚': 11, '实': 8,
  '腹': 13, '弱': 10, '强': 12, '骨': 9, '常': 11, '敢': 11,
  '则': 6, '冲': 6, '用': 5, '或': 8, '渊': 11, '兮': 4,
  '似': 6, '宗': 8, '挫': 10, '锐': 12, '解': 13, '纷': 7,
  '光': 6, '尘': 6, '湛': 12, '存': 6, '吾': 7, '谁': 10,
  '子': 3, '象': 11, '帝': 9, '先': 6, '地': 6, '仁': 4,
  '刍': 5, '狗': 8, '百': 6, '姓': 8, '犹': 7, '谷': 7,
  '神': 9, '死': 6, '牝': 6, '根': 10, '绵': 11, '若': 8,
  '勤': 13, '久': 3, '能': 10, '且': 5, '自': 6, '外': 5,
  '私': 7, '邪': 6, '上': 3, '水': 4, '利': 7, '几': 2,
  '言': 7, '信': 9, '政': 9, '事': 8, '时': 7, '尤': 4,
  '持': 9, '盈': 9, '如': 6, '揣': 12, '保': 9, '金': 8,
  '玉': 5, '满': 13, '莫': 10, '富': 12, '骄': 9, '遗': 12,
  '咎': 8, '遂': 12, '功': 5, '退': 9, '载': 10, '营': 11,
  '魄': 14, '抱': 8, '一': 1, '离': 10, '乎': 5, '专': 4,
  '气': 4, '致': 10, '柔': 9, '婴': 11, '儿': 2, '涤': 10,
  '除': 9, '览': 9, '疵': 11, '爱': 10, '国': 8, '门': 3,
  '开': 4, '阖': 13, '雌': 14, '明': 8, '白': 5, '四': 5,
  '达': 6, '畜': 10, '宰': 10, '德': 15, '三': 3, '十': 2,
  '辐': 13, '共': 6, '毂': 13, '当': 6, '车': 4, '埏': 9,
  '埴': 11, '器': 16, '室': 9, '五': 4, '色': 6, '令': 5,
  '盲': 8, '聋': 11, '味': 8, '爽': 11, '驰': 6, '骋': 10,
  '畋': 9, '猎': 11, '狂': 7, '妨': 7, '彼': 8, '取': 8,
  '宠': 8, '辱': 10, '惊': 11, '大': 3, '患': 11, '身': 7,
  '何': 7, '谓': 11, '失': 5, '及': 3, '托': 6, '寄': 11,
  '视': 8, '夷': 6, '听': 7, '希': 7, '搏': 13, '微': 13,
  '诘': 8, '混': 11, '皦': 18, '昧': 9, '绳': 14, '归': 5,
  '状': 7, '惚': 11, '恍': 9, '迎': 7, '首': 9, '执': 6,
  '古': 5, '御': 12, '今': 4, '纪': 6, '士': 3, '通': 10,
  '深': 11, '识': 7, '容': 10, '豫': 15, '冬': 5,
  '涉': 10, '川': 3, '畏': 9, '邻': 7, '俨': 9, '客': 9,
  '涣': 10, '冰': 6, '释': 12, '敦': 12, '朴': 6, '旷': 7,
  '浊': 9, '孰': 11, '静': 14, '徐': 10, '清': 11, '安': 6,
  '蔽': 14, '新': 13, '极': 7, '笃': 9, '并': 6,
  '芸': 7, '各': 6, '曰': 4, '命': 8, '妄': 6,
  '凶': 2, '乃': 2, '公': 4, '王': 4, '没': 7, '殆': 9,
  '太': 4, '亲': 9, '誉': 13, '侮': 9, '足': 7, '悠': 11,
  '我': 7, '然': 12, '废': 8, '义': 3,
  '智': 12, '慧': 15, '伪': 6, '六': 4, '孝': 7, '慈': 13,
  '家': 10, '昏': 8, '忠': 8, '臣': 6, '绝': 9, '弃': 7,
  '倍': 10, '复': 9, '巧': 5, '贼': 10, '文': 4,
  '属': 12, '素': 10, '少': 4, '寡': 14, '学': 8, '忧': 7,
  '阿': 7, '荒': 9, '央': 5, '哉': 9, '熙': 14, '享': 8,
  '牢': 7, '春': 9, '登': 12, '台': 5, '独': 9, '泊': 9,
  '未': 5, '兆': 6, '孩': 6, '儽': 18, '余': 7,
  '愚': 13, '沌': 7, '俗': 9, '昭': 9,
  '闷': 7, '澹': 16, '海': 10, '飂': 14, '止': 4, '顽': 13,
  '鄙': 13, '异': 6, '食': 9, '孔': 4, '惟': 11, '从': 4,
  '窈': 9, '冥': 10, '精': 14, '真': 10,
  '阅': 10, '甫': 7, '此': 6, '曲': 6, '全': 6, '枉': 8,
  '直': 8, '洼': 9, '敝': 11, '多': 6, '惑': 9,
  '式': 6, '彰': 14, '伐': 6, '矜': 9, '岂': 6,
  '诚': 8, '飘': 20, '风': 4, '终': 8,
  '朝': 12, '骤': 17, '雨': 8, '况': 7, '于': 3,
  '者': 8, '同': 6, '乐': 5, '企': 6, '立': 5, '跨': 13,
  '赘': 17, '寂': 11, '寥': 14, '改': 7, '周': 8,
  '逝': 10, '远': 7, '反': 4, '域': 11,
  '法': 8, '重': 9, '轻': 9, '躁': 17, '君': 7,
  '辎': 12, '虽': 9, '荣': 9,
  '燕': 16, '超': 12, '奈': 8, '乘': 10, '主': 5,
  '辙': 16, '迹': 9, '瑕': 13, '谪': 13, '数': 13,
  '筹': 13, '策': 12, '闭': 6, '关': 6, '楗': 12, '结': 9,
  '约': 6, '救': 11, '袭': 11, '资': 13,
  '迷': 9, '要': 9, '雄': 12,
  '守': 6, '溪': 13, '散': 12, '官': 8, '制': 8, '割': 12,
  '将': 9, '败': 8, '歔': 15, '吹': 7, '羸': 19,
  '隳': 17, '甚': 9, '奢': 11, '泰': 10, '佐': 7,
  '还': 7, '师': 6, '荆': 9, '棘': 12, '军': 6, '年': 6,
  '果': 8, '壮': 6, '老': 6,
  '早': 6, '佳': 8, '祥': 10,
  '恬': 10, '淡': 11, '胜': 9, '杀': 6, '众': 6, '哀': 9,
  '悲': 12, '泣': 8, '丧': 8, '礼': 5, '小': 3,
  '侯': 9, '宾': 10, '合': 6, '甘': 5, '露': 21,
  '均': 7, '譬': 20,
  '江': 6, '力': 2,
  '志': 7, '寿': 7, '泛': 5, '左': 5, '右': 5, '恃': 9,
  '衣': 6, '养': 9, '平': 5, '饵': 10,
  '过': 6, '出': 5, '既': 9, '翕': 12, '固': 8, '张': 7,
  '兴': 6, '夺': 6, '与': 3, '鱼': 8,
  '脱': 11, '示': 5, '化': 4,
  '镇': 15, '下': 3,
  '攘': 20, '臂': 17, '扔': 6, '薄': 16,
  '华': 6, '丈': 3, '厚': 9,
  '昔': 8, '宁': 5, '灵': 7,
  '贞': 6, '裂': 12, '发': 5, '歇': 13, '竭': 14,
  '灭': 5, '蹶': 19, '贱': 9, '本': 5, '孤': 8,
  '舆': 13, '琭': 12, '珞': 11, '动': 6,
  '亡': 3, '笑': 10,
  '建': 8, '进': 7,
  '纇': 18, '广': 3, '偷': 11, '渝': 12, '隅': 12,
  '晚': 11, '隐': 11, '贷': 9, '二': 2, '负': 6,
  '阳': 6, '损': 10, '益': 10, '梁': 11, '父': 4,
  '至': 6, '坚': 7, '间': 7,
  '病': 10, '费': 9, '藏': 17,
  '缺': 10, '弊': 11, '穷': 7, '屈': 8, '拙': 8, '讷': 6,
  '寒': 12, '热': 10, '却': 9, '粪': 12, '戎': 6, '郊': 8,
  '祸': 11, '户': 4, '牖': 15, '弥': 8,
  '注': 8, '耳': 6, '目': 5, '徒': 10, '摄': 13,
  '陆': 7, '兕': 8, '虎': 8, '被': 5, '甲': 5, '兵': 7,
  '投': 7, '角': 7, '爪': 4, '刃': 3, '势': 8,
  '尊': 12, '育': 8, '亭': 9, '毒': 9, '覆': 18,
  '塞': 13, '兑': 7, '殃': 9, '习': 11,
  '介': 4, '施': 9, '径': 8, '芜': 7, '服': 8,
  '采': 8, '带': 9, '剑': 9, '厌': 6, '饮': 7, '财': 7,
  '夸': 6, '拔': 8, '祭': 11, '祀': 7,
  '辍': 12, '修': 9, '普': 12, '乡': 3, '邦': 6,
  '含': 7, '赤': 7,
  '虫': 6, '螫': 16, '猛': 11, '据': 11, '攫': 20,
  '筋': 12, '握': 12, '牡': 7,
  '朘': 11, '号': 5, '嗄': 13, '疏': 12,
  '害': 10, '奇': 8, '忌': 7, '讳': 10, '贫': 8, '滋': 12,
  '伎': 6, '云': 4,
  '淳': 11, '察': 14, '福': 13, '倚': 10, '伏': 6, '妖': 7,
  '方': 4, '廉': 13, '刿': 10, '肆': 13, '耀': 20,
  '啬': 11, '积': 10, '克': 7, '柢': 9, '烹': 11,
  '鲜': 14, '莅': 10, '鬼': 9, '交': 6, '流': 10,
  '兼': 10, '奥': 12, '宝': 8, '市': 5, '加': 5,
  '立': 5, '置': 13, '拱': 9, '璧': 18, '驷': 8,
  '马': 3, '坐': 7, '求': 7, '免': 7,
  '报': 7, '怨': 9, '图': 8, '细': 8, '诺': 10,
  '脆': 10, '泮': 8, '毫': 11, '末': 5,
  '层': 7, '累': 11, '千': 3, '里': 7, '慎': 13,
  '辅': 11, '稽': 15, '顺': 9, '推': 11, '肖': 7,
  '俭': 9, '勇': 9, '舍': 8, '战': 9,
  '卫': 3, '武': 8, '怒': 9, '配': 10, '寸': 3, '尺': 4,
  '抗': 7,
  '褐': 13, '怀': 7, '狎': 9, '司': 5, '代': 5, '斫': 9,
  '饥': 6, '税': 10, '刚': 6, '草': 9, '枯': 9, '槁': 14,
  '弓': 3, '抑': 7, '举': 9, '奉': 8, '垢': 9, '社': 7,
  '稷': 15, '契': 9, '责': 8, '彻': 7, '什': 4, '伯': 5,
  '徙': 10, '舟': 6, '陈': 7, '闻': 9, '辩': 16,
  '博': 12, '愈': 13, '往': 8, '来': 7
};

function getStrokeCount(char: string): number {
  return charStrokeCount[char] || (char.length * 5);
}

const strokeBasedSimilarity = (c1: string, c2: string): number => {
  const s1 = getStrokeCount(c1);
  const s2 = getStrokeCount(c2);
  const maxStroke = Math.max(s1, s2);
  if (maxStroke === 0) return 0;
  return 1 - Math.abs(s1 - s2) / maxStroke;
};

export function calculateGlyphSimilarity(
  slip1: BambooSlip,
  slip2: BambooSlip
): { similarity: number; strokeMatch: number; structureMatch: number } {
  const text1 = slip1.ancientText;
  const text2 = slip2.ancientText;
  
  let strokeSimilarity = 0;
  let structureSimilarity = 0;
  const maxLen = Math.max(text1.length, text2.length);
  
  for (let i = 0; i < maxLen; i++) {
    const c1 = text1[i] || '';
    const c2 = text2[i] || '';
    
    if (c1 && c2) {
      strokeSimilarity += strokeBasedSimilarity(c1, c2);
      
      if (c1 === c2) {
        structureSimilarity += 1;
      } else if (Math.abs(c1.length - c2.length) <= 0) {
        structureSimilarity += 0.3;
      }
    }
  }
  
  const avgStrokeSimilarity = strokeSimilarity / maxLen;
  const avgStructureSimilarity = structureSimilarity / maxLen;
  const overallGlyphSimilarity = (avgStrokeSimilarity * 0.6 + avgStructureSimilarity * 0.4);
  
  return {
    similarity: overallGlyphSimilarity,
    strokeMatch: avgStrokeSimilarity,
    structureMatch: avgStructureSimilarity
  };
}

export function calculateSemanticProbability(
  slip1: BambooSlip,
  slip2: BambooSlip
): { probability: number; bigramScore: number; trigramScore: number; matchedPairs: number } {
  const text1 = slip1.modernText;
  const text2 = slip2.modernText;
  
  let bigramHits = 0;
  let bigramTotal = 0;
  let trigramHits = 0;
  let trigramTotal = 0;
  let matchedPairs = 0;
  
  const lastChars = text1.slice(-2);
  
  for (let i = 0; i <= text2.length - 1; i++) {
    const prevChar = text1[text1.length - 1] || '';
    const currChar = text2[i];
    
    const bigramKey = prevChar + currChar;
    if (bigramModel.has(bigramKey)) {
      const nextChars = bigramModel.get(bigramKey)!;
      if (nextChars.has(text2[i + 1] || '')) {
        bigramHits++;
      }
      bigramTotal++;
    }
    
    if (lastChars.length >= 2) {
      const trigramKey = lastChars.slice(-2);
      if (trigramModel.has(trigramKey)) {
        const nextChars = trigramModel.get(trigramKey)!;
        if (nextChars.has(currChar)) {
          trigramHits++;
          matchedPairs++;
        }
        trigramTotal++;
      }
    }
  }
  
  const bigramScore = bigramTotal > 0 ? bigramHits / bigramTotal : 0;
  const trigramScore = trigramTotal > 0 ? trigramHits / trigramTotal : 0;
  
  const contextBonus = matchedPairs > 0 ? Math.min(matchedPairs * 0.1, 0.3) : 0;
  const probability = Math.min(1, (bigramScore * 0.35 + trigramScore * 0.65) + contextBonus);
  
  return {
    probability,
    bigramScore,
    trigramScore,
    matchedPairs
  };
}

function calculateCosineSimilarity(arr1: number[], arr2: number[]): number {
  if (arr1.length !== arr2.length) return 0;
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < arr1.length; i++) {
    dotProduct += arr1[i] * arr2[i];
    norm1 += arr1[i] * arr1[i];
    norm2 += arr2[i] * arr2[i];
  }
  
  const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

function calculatePatternMatch(hash1: string, hash2: string): boolean {
  const base1 = hash1.split('-').slice(0, 2).join('-');
  const base2 = hash2.split('-').slice(0, 2).join('-');
  return base1 === base2;
}

export function matchTextures(
  slip1: BambooSlip,
  slip2: BambooSlip
): { similarity: number; matchedPoints: number; totalPoints: number; isPatternMatch: boolean } {
  const similarity = calculateCosineSimilarity(
    slip1.texture.rightEdge,
    slip2.texture.leftEdge
  );
  
  const isPatternMatch = calculatePatternMatch(
    slip1.texture.patternHash,
    slip2.texture.patternHash
  );
  
  let matchedPoints = 0;
  const tolerance = 0.8;
  for (let i = 0; i < slip1.texture.rightEdge.length; i++) {
    if (Math.abs(slip1.texture.rightEdge[i] - slip2.texture.leftEdge[i]) < tolerance) {
      matchedPoints++;
    }
  }
  
  return {
    similarity: Math.max(0, Math.min(1, similarity)),
    matchedPoints,
    totalPoints: slip1.texture.rightEdge.length,
    isPatternMatch
  };
}

export function checkHoleAlignment(
  slip1: BambooSlip,
  slip2: BambooSlip
): { isAligned: boolean; deviation: number } {
  const topDeviation = Math.abs(slip1.holes.top - slip2.holes.top);
  const middleDeviation = Math.abs(slip1.holes.middle - slip2.holes.middle);
  const bottomDeviation = Math.abs(slip1.holes.bottom - slip2.holes.bottom);
  
  const maxDeviation = Math.max(topDeviation, middleDeviation, bottomDeviation);
  
  return {
    isAligned: maxDeviation <= HOLE_ALIGNMENT_THRESHOLD,
    deviation: maxDeviation
  };
}

export interface AlignmentResult {
  isAligned: boolean;
  holesScore: number;
  textureScore: number;
  glyphScore: number;
  semanticScore: number;
  overallScore: number;
  details: {
    holesAligned: boolean;
    holeDeviation: number;
    textureSimilarity: number;
    glyphSimilarity: number;
    semanticProbability: number;
    strokeMatch: number;
    structureMatch: number;
    bigramScore: number;
    trigramScore: number;
    matchedPairs: number;
  };
}

export function checkAlignment(
  slip1: BambooSlip,
  slip2: BambooSlip
): AlignmentResult {
  const holeCheck = checkHoleAlignment(slip1, slip2);
  const textureMatch = matchTextures(slip1, slip2);
  const glyphMatch = calculateGlyphSimilarity(slip1, slip2);
  const semanticMatch = calculateSemanticProbability(slip1, slip2);
  
  const holeScore = holeCheck.isAligned 
    ? 1 - (holeCheck.deviation / HOLE_ALIGNMENT_THRESHOLD) * 0.5
    : Math.max(0, 1 - (holeCheck.deviation / HOLE_ALIGNMENT_THRESHOLD));
  
  const patternBonus = textureMatch.isPatternMatch ? 0.15 : 0;
  const textureScore = Math.min(1, textureMatch.similarity + patternBonus);
  
  const glyphScore = glyphMatch.similarity;
  
  const semanticBonus = semanticMatch.matchedPairs > 0 ? 0.2 : 0;
  const semanticScore = Math.min(1, semanticMatch.probability + semanticBonus);
  
  const holeWeight = 0.20;
  const textureWeight = 0.25;
  const glyphWeight = 0.20;
  const semanticWeight = 0.35;
  
  const overallScore = (
    holeScore * holeWeight +
    textureScore * textureWeight +
    glyphScore * glyphWeight +
    semanticScore * semanticWeight
  );
  
  const isAligned = overallScore >= OVERALL_ALIGNMENT_THRESHOLD;
  
  return {
    isAligned,
    holesScore: holeScore,
    textureScore,
    glyphScore,
    semanticScore,
    overallScore,
    details: {
      holesAligned: holeCheck.isAligned,
      holeDeviation: holeCheck.deviation,
      textureSimilarity: textureMatch.similarity,
      glyphSimilarity: glyphScore,
      semanticProbability: semanticMatch.probability,
      strokeMatch: glyphMatch.strokeMatch,
      structureMatch: glyphMatch.structureMatch,
      bigramScore: semanticMatch.bigramScore,
      trigramScore: semanticMatch.trigramScore,
      matchedPairs: semanticMatch.matchedPairs
    }
  };
}

export function checkAllAlignments(slips: BambooSlip[]): AlignmentResult[] {
  const results: AlignmentResult[] = [];
  for (let i = 0; i < slips.length - 1; i++) {
    results.push(checkAlignment(slips[i], slips[i + 1]));
  }
  return results;
}

export function getAlignmentQuality(score: number): {
  label: string;
  color: string;
  level: number;
} {
  if (score >= 0.85) return { label: '极佳', color: '#22c55e', level: 4 };
  if (score >= 0.70) return { label: '良好', color: '#84cc16', level: 3 };
  if (score >= 0.55) return { label: '一般', color: '#eab308', level: 2 };
  if (score >= 0.40) return { label: '较差', color: '#f97316', level: 1 };
  return { label: '不匹配', color: '#ef4444', level: 0 };
}
