import type { FormulaEntry } from '../types';

export const additionFormulas: Record<string, FormulaEntry> = {
  'plus1-direct': { key: 'plus1-direct', formula: '一上一', description: '+1，直接拨下珠1靠梁' },
  'plus2-direct': { key: 'plus2-direct', formula: '二上二', description: '+2，直接拨下珠2靠梁' },
  'plus3-direct': { key: 'plus3-direct', formula: '三上三', description: '+3，直接拨下珠3靠梁' },
  'plus4-direct': { key: 'plus4-direct', formula: '四上四', description: '+4，直接拨下珠4靠梁' },
  'plus5-direct': { key: 'plus5-direct', formula: '五上五', description: '+5，拨上珠1靠梁' },
  'plus6-direct': { key: 'plus6-direct', formula: '六上六', description: '+6，拨上珠1和下珠1靠梁' },
  'plus7-direct': { key: 'plus7-direct', formula: '七上七', description: '+7，拨上珠1和下珠2靠梁' },
  'plus8-direct': { key: 'plus8-direct', formula: '八上八', description: '+8，拨上珠1和下珠3靠梁' },
  'plus9-direct': { key: 'plus9-direct', formula: '九上九', description: '+9，拨上珠1和下珠4靠梁' },

  'plus1-break5': { key: 'plus1-break5', formula: '一下五去四', description: '+1，下珠不够，拨上珠5靠梁，去下珠4' },
  'plus2-break5': { key: 'plus2-break5', formula: '二下五去三', description: '+2，下珠不够，拨上珠5靠梁，去下珠3' },
  'plus3-break5': { key: 'plus3-break5', formula: '三下五去二', description: '+3，下珠不够，拨上珠5靠梁，去下珠2' },
  'plus4-break5': { key: 'plus4-break5', formula: '四下五去一', description: '+4，下珠不够，拨上珠5靠梁，去下珠1' },

  'plus1-carry': { key: 'plus1-carry', formula: '一去九进一', description: '+1，本档满十，去9，向前一位进1' },
  'plus2-carry': { key: 'plus2-carry', formula: '二去八进一', description: '+2，本档满十，去8，向前一位进1' },
  'plus3-carry': { key: 'plus3-carry', formula: '三去七进一', description: '+3，本档满十，去7，向前一位进1' },
  'plus4-carry': { key: 'plus4-carry', formula: '四去六进一', description: '+4，本档满十，去6，向前一位进1' },
  'plus5-carry': { key: 'plus5-carry', formula: '五去五进一', description: '+5，本档满十，去5，向前一位进1' },
  'plus6-carry': { key: 'plus6-carry', formula: '六去四进一', description: '+6，本档满十，去4，向前一位进1' },
  'plus7-carry': { key: 'plus7-carry', formula: '七去三进一', description: '+7，本档满十，去3，向前一位进1' },
  'plus8-carry': { key: 'plus8-carry', formula: '八去二进一', description: '+8，本档满十，去2，向前一位进1' },
  'plus9-carry': { key: 'plus9-carry', formula: '九去一进一', description: '+9，本档满十，去1，向前一位进1' },
};

export const subtractionFormulas: Record<string, FormulaEntry> = {
  'minus1-direct': { key: 'minus1-direct', formula: '一去一', description: '-1，直接拨去下珠1' },
  'minus2-direct': { key: 'minus2-direct', formula: '二去二', description: '-2，直接拨去下珠2' },
  'minus3-direct': { key: 'minus3-direct', formula: '三去三', description: '-3，直接拨去下珠3' },
  'minus4-direct': { key: 'minus4-direct', formula: '四去四', description: '-4，直接拨去下珠4' },
  'minus5-direct': { key: 'minus5-direct', formula: '五去五', description: '-5，拨去上珠5' },
  'minus6-direct': { key: 'minus6-direct', formula: '六去六', description: '-6，拨去上珠5和下珠1' },
  'minus7-direct': { key: 'minus7-direct', formula: '七去七', description: '-7，拨去上珠5和下珠2' },
  'minus8-direct': { key: 'minus8-direct', formula: '八去八', description: '-8，拨去上珠5和下珠3' },
  'minus9-direct': { key: 'minus9-direct', formula: '九去九', description: '-9，拨去上珠5和下珠4' },

  'minus1-break5': { key: 'minus1-break5', formula: '一上四去五', description: '-1，下珠不够，拨上4，去上珠5' },
  'minus2-break5': { key: 'minus2-break5', formula: '二上三去五', description: '-2，下珠不够，拨上3，去上珠5' },
  'minus3-break5': { key: 'minus3-break5', formula: '三上二去五', description: '-3，下珠不够，拨上2，去上珠5' },
  'minus4-break5': { key: 'minus4-break5', formula: '四上一去五', description: '-4，下珠不够，拨上1，去上珠5' },

  'minus1-borrow': { key: 'minus1-borrow', formula: '一退一还九', description: '-1，本档不够，前位退1，本档还9' },
  'minus2-borrow': { key: 'minus2-borrow', formula: '二退一还八', description: '-2，本档不够，前位退1，本档还8' },
  'minus3-borrow': { key: 'minus3-borrow', formula: '三退一还七', description: '-3，本档不够，前位退1，本档还7' },
  'minus4-borrow': { key: 'minus4-borrow', formula: '四退一还六', description: '-4，本档不够，前位退1，本档还6' },
  'minus5-borrow': { key: 'minus5-borrow', formula: '五退一还五', description: '-5，本档不够，前位退1，本档还5' },
  'minus6-borrow': { key: 'minus6-borrow', formula: '六退一还四', description: '-6，本档不够，前位退1，本档还4' },
  'minus7-borrow': { key: 'minus7-borrow', formula: '七退一还三', description: '-7，本档不够，前位退1，本档还3' },
  'minus8-borrow': { key: 'minus8-borrow', formula: '八退一还二', description: '-8，本档不够，前位退1，本档还2' },
  'minus9-borrow': { key: 'minus9-borrow', formula: '九退一还一', description: '-9，本档不够，前位退1，本档还1' },
};

export const multiplicationFormulas: Record<string, string> = {
  '1×1': '一一得一', '1×2': '一二得二', '1×3': '一三得三', '1×4': '一四得四', '1×5': '一五得五',
  '1×6': '一六得六', '1×7': '一七得七', '1×8': '一八得八', '1×9': '一九得九',
  '2×1': '二一得二', '2×2': '二二得四', '2×3': '二三得六', '2×4': '二四得八', '2×5': '二五一十',
  '2×6': '二六十二', '2×7': '二七十四', '2×8': '二八十六', '2×9': '二九十八',
  '3×1': '三一得三', '3×2': '三二得六', '3×3': '三三得九', '3×4': '三四十二', '3×5': '三五十五',
  '3×6': '三六十八', '3×7': '三七二十一', '3×8': '三八二十四', '3×9': '三九二十七',
  '4×1': '四一得四', '4×2': '四二得八', '4×3': '四三十二', '4×4': '四四十六', '4×5': '四五二十',
  '4×6': '四六二十四', '4×7': '四七二十八', '4×8': '四八三十二', '4×9': '四九三十六',
  '5×1': '五一得五', '5×2': '五二一十', '5×3': '五十三', '5×4': '五十四', '5×5': '五五二十五',
  '5×6': '五六三十', '5×7': '五七三十五', '5×8': '五八四十', '5×9': '五九四十五',
  '6×1': '六一得六', '6×2': '六二十二', '6×3': '六三十八', '6×4': '六四二十四', '6×5': '六五三十',
  '6×6': '六六三十六', '6×7': '六七四十二', '6×8': '六八四十八', '6×9': '六九五十四',
  '7×1': '七一得七', '7×2': '七二十四', '7×3': '七三二十一', '7×4': '七四二十八', '7×5': '七五三十五',
  '7×6': '七六四十二', '7×7': '七七四十九', '7×8': '七八五十六', '7×9': '七九六十三',
  '8×1': '八一得八', '8×2': '八二十六', '8×3': '八三二十四', '8×4': '八四三十二', '8×5': '八五四十',
  '8×6': '八六四十八', '8×7': '八七五十六', '8×8': '八八六十四', '8×9': '八九七十二',
  '9×1': '九一得九', '9×2': '九二十八', '9×3': '九三二十七', '9×4': '九四三十六', '9×5': '九五四十五',
  '9×6': '九六五十四', '9×7': '九七六十三', '9×8': '九八七十二', '9×9': '九九八十一',
};

export const getAdditionFormula = (currentValue: number, addValue: number): FormulaEntry => {
  const digit = currentValue % 10;
  const newDigit = digit + addValue;

  if (newDigit < 5 && digit + addValue <= 4) {
    return additionFormulas[`plus${addValue}-direct`];
  } else if (digit < 5 && newDigit >= 5 && newDigit < 10) {
    return additionFormulas[`plus${addValue}-break5`];
  } else if (newDigit >= 10) {
    return additionFormulas[`plus${addValue}-carry`];
  }
  return additionFormulas[`plus${addValue}-direct`];
};

export const getSubtractionFormula = (currentValue: number, minusValue: number): FormulaEntry => {
  const digit = currentValue % 10;

  if (digit >= minusValue) {
    if (digit >= 5 && minusValue <= 4 && digit - minusValue < 5) {
      return subtractionFormulas[`minus${minusValue}-break5`];
    }
    return subtractionFormulas[`minus${minusValue}-direct`];
  } else {
    return subtractionFormulas[`minus${minusValue}-borrow`];
  }
};
