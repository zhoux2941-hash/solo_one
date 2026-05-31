import Papa from 'papaparse';
import { GarbageRecord, GarbageType, CsvRow, GARBAGE_TYPE_CONFIG } from '../types';

const GARBAGE_TYPE_MAP: Record<string, GarbageType> = {
  '可回收物': 'recyclable',
  '可回收': 'recyclable',
  '厨余垃圾': 'kitchen',
  '厨余': 'kitchen',
  '有害垃圾': 'harmful',
  '有害': 'harmful',
  '其他垃圾': 'other',
  '其他': 'other',
};

const TYPO_CORRECTIONS: Record<string, string> = {
  '厨佘': '厨余',
  '厨佘垃圾': '厨余垃圾',
  '橱余': '厨余',
  '橱余垃圾': '厨余垃圾',
  '处余': '厨余',
  '处余垃圾': '厨余垃圾',
  '可回収': '可回收',
  '可回収物': '可回收物',
  '可回手': '可回收',
  '可回手物': '可回收物',
  '有诲': '有害',
  '有诲垃圾': '有害垃圾',
  '有还': '有害',
  '有还垃圾': '有害垃圾',
  '有害拉圾': '有害垃圾',
  '其它': '其他',
  '其它垃圾': '其他垃圾',
  '其牠': '其他',
  '其牠垃圾': '其他垃圾',
  '拉圾': '垃圾',
  '会回收': '可回收',
  '会回收物': '可回收物',
  '害有垃圾': '有害垃圾',
  '余厨': '厨余',
  '余厨垃圾': '厨余垃圾',
  '收可回': '可回收',
  '收可回物': '可回收物',
};

const IS_CORRECT_TYPOS: Record<string, boolean> = {
  'shi': true,
  'si': true,
  'shi是': true,
  '对': true,
  '对的': true,
  '正确': true,
  '没问题': true,
  'ok': true,
  'okay': true,
  'ye': true,
  'yeah': true,
  'y': true,
  't': true,
  'fou': false,
  'fu': false,
  'fou否': false,
  '错': false,
  '错的': false,
  '错误': false,
  '不对': false,
  'no': false,
  'n': false,
  'f': false,
  '不是': false,
  '非': false,
};

export interface CorrectionRecord {
  row: number;
  field: string;
  original: string;
  corrected: string;
}

export interface ParseResult {
  records: GarbageRecord[];
  errorCount: number;
  errors: string[];
  corrections: CorrectionRecord[];
}

function correctTypo(value: string): { corrected: string; wasCorrected: boolean } {
  const trimmed = value.trim();
  if (TYPO_CORRECTIONS[trimmed]) {
    return { corrected: TYPO_CORRECTIONS[trimmed], wasCorrected: true };
  }
  return { corrected: trimmed, wasCorrected: false };
}

function mapGarbageType(typeStr: string): { type: GarbageType | null; wasCorrected: boolean; original: string; corrected: string } {
  const trimmed = typeStr.trim();
  const { corrected, wasCorrected } = correctTypo(trimmed);
  const type = GARBAGE_TYPE_MAP[corrected] || null;
  return { type, wasCorrected, original: trimmed, corrected };
}

function parseIsCorrect(value: string): { value: boolean | null; wasCorrected: boolean; original: string; corrected: string } {
  const trimmed = value.trim();
  const lowerTrimmed = trimmed.toLowerCase();
  
  const standardTrue = ['是', 'true', '1', 'yes'];
  const standardFalse = ['否', 'false', '0', 'no'];
  
  if (standardTrue.includes(lowerTrimmed)) {
    return { value: true, wasCorrected: false, original: trimmed, corrected: trimmed };
  }
  if (standardFalse.includes(lowerTrimmed)) {
    return { value: false, wasCorrected: false, original: trimmed, corrected: trimmed };
  }
  
  if (IS_CORRECT_TYPOS[lowerTrimmed] !== undefined) {
    const correctedValue = IS_CORRECT_TYPOS[lowerTrimmed];
    return { 
      value: correctedValue, 
      wasCorrected: true, 
      original: trimmed, 
      corrected: correctedValue ? '是' : '否' 
    };
  }
  
  const { corrected, wasCorrected } = correctTypo(trimmed);
  if (wasCorrected) {
    const lowerCorrected = corrected.toLowerCase();
    if (standardTrue.includes(lowerCorrected)) {
      return { value: true, wasCorrected: true, original: trimmed, corrected };
    }
    if (standardFalse.includes(lowerCorrected)) {
      return { value: false, wasCorrected: true, original: trimmed, corrected };
    }
  }
  
  return { value: null, wasCorrected: false, original: trimmed, corrected: trimmed };
}

function validateRow(row: CsvRow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!row['垃圾袋ID']?.trim()) {
    errors.push('垃圾袋ID不能为空');
  }
  if (!row['投放时间']?.trim()) {
    errors.push('投放时间不能为空');
  }
  if (!row['居民楼号']?.trim()) {
    errors.push('居民楼号不能为空');
  }
  if (!row['垃圾类型']?.trim()) {
    errors.push('垃圾类型不能为空');
  } else if (mapGarbageType(row['垃圾类型']).type === null) {
    errors.push(`无效的垃圾类型: ${row['垃圾类型']}`);
  }
  if (!row['是否正确投放']?.trim()) {
    errors.push('是否正确投放不能为空');
  } else if (parseIsCorrect(row['是否正确投放']).value === null) {
    errors.push(`无效的是否正确投放值: ${row['是否正确投放']}`);
  }

  return { valid: errors.length === 0, errors };
}

interface TransformResult {
  record: GarbageRecord | null;
  corrections: CorrectionRecord[];
}

function transformRow(row: CsvRow, rowIndex: number): TransformResult {
  const corrections: CorrectionRecord[] = [];
  
  const garbageTypeResult = mapGarbageType(row['垃圾类型']);
  const isCorrectResult = parseIsCorrect(row['是否正确投放']);
  const 投放时间 = new Date(row['投放时间']);

  if (garbageTypeResult.wasCorrected) {
    corrections.push({
      row: rowIndex,
      field: '垃圾类型',
      original: garbageTypeResult.original,
      corrected: garbageTypeResult.corrected,
    });
  }

  if (isCorrectResult.wasCorrected) {
    corrections.push({
      row: rowIndex,
      field: '是否正确投放',
      original: isCorrectResult.original,
      corrected: isCorrectResult.corrected,
    });
  }

  if (garbageTypeResult.type === null || isCorrectResult.value === null || isNaN(投放时间.getTime())) {
    return { record: null, corrections };
  }

  return {
    record: {
      bagId: row['垃圾袋ID'].trim(),
      投放时间,
      buildingNumber: row['居民楼号'].trim(),
      garbageType: garbageTypeResult.type,
      isCorrect: isCorrectResult.value,
    },
    corrections,
  };
}

export function parseCsvFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const errors: string[] = [];
    const records: GarbageRecord[] = [];
    const corrections: CorrectionRecord[] = [];
    let rowIndex = 0;

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      step: (result) => {
        rowIndex++;
        const row = result.data;
        const validation = validateRow(row);
        
        if (validation.valid) {
          const transformResult = transformRow(row, rowIndex);
          corrections.push(...transformResult.corrections);
          if (transformResult.record) {
            records.push(transformResult.record);
          } else {
            errors.push(`第${rowIndex}行: 数据转换失败`);
          }
        } else {
          errors.push(`第${rowIndex}行: ${validation.errors.join(', ')}`);
        }
      },
      complete: () => {
        resolve({
          records,
          errorCount: errors.length,
          errors: errors.slice(0, 50),
          corrections,
        });
      },
      error: (error) => {
        reject(new Error(`CSV解析失败: ${error.message}`));
      },
    });
  });
}

export function generateSampleData(): GarbageRecord[] {
  const buildings = ['1号楼', '2号楼', '3号楼', '4号楼', '5号楼', '6号楼', '7号楼', '8号楼'];
  const garbageTypes: GarbageType[] = ['recyclable', 'kitchen', 'harmful', 'other'];
  const records: GarbageRecord[] = [];

  const baseDate = new Date('2024-01-01');
  
  for (let i = 0; i < 500; i++) {
    const daysOffset = Math.floor(Math.random() * 90);
    const hoursOffset = Math.floor(Math.random() * 24);
    const 投放时间 = new Date(baseDate);
    投放时间.setDate(投放时间.getDate() + daysOffset);
    投放时间.setHours(hoursOffset, Math.floor(Math.random() * 60), 0);

    const buildingAccuracy: Record<string, number> = {
      '1号楼': 0.95,
      '2号楼': 0.88,
      '3号楼': 0.72,
      '4号楼': 0.65,
      '5号楼': 0.58,
      '6号楼': 0.82,
      '7号楼': 0.45,
      '8号楼': 0.78,
    };

    const buildingNumber = buildings[Math.floor(Math.random() * buildings.length)];
    const garbageType = garbageTypes[Math.floor(Math.random() * garbageTypes.length)];
    const accuracy = buildingAccuracy[buildingNumber];
    const isCorrect = Math.random() < accuracy;

    records.push({
      bagId: `BAG${String(i + 1).padStart(4, '0')}`,
      投放时间,
      buildingNumber,
      garbageType,
      isCorrect,
    });
  }

  return records;
}
