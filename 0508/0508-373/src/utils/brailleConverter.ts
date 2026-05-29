import { glyphToBraille } from '../data/glyphMap';
import { polyphoneDict } from '../data/polyphoneDict';
import type { BrailleType } from '../data/brailleTypes';
import type { BrailleStrategy } from '../strategies/BrailleStrategy';
import { BrailleStrategyFactory } from '../strategies/BrailleStrategyFactory';

export type ConversionMode = 'pinyin' | 'glyph';

export interface BrailleResult {
  brailleText: string;
  dotMatrixData: number[][][];
  charCount: number;
  convertedCount: number;
  unconvertedChars: string[];
}

const toneMap: Record<string, string> = {
  'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
  'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e',
  'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
  'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
  'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u',
  'ǖ': 'v', 'ǘ': 'v', 'ǚ': 'v', 'ǜ': 'v',
};

function removeTone(pinyin: string): string {
  let result = '';
  for (const char of pinyin) {
    result += toneMap[char] || char;
  }
  return result;
}

const basicPinyinDict: Record<string, string> = {
  '一': 'yi', '二': 'er', '三': 'san', '四': 'si', '五': 'wu',
  '六': 'liu', '七': 'qi', '八': 'ba', '九': 'jiu', '十': 'shi',
  '人': 'ren', '大': 'da', '天': 'tian', '中': 'zhong', '国': 'guo',
  '日': 'ri', '月': 'yue', '水': 'shui', '火': 'huo', '山': 'shan',
  '石': 'shi', '田': 'tian', '土': 'tu', '金': 'jin', '木': 'mu',
  '口': 'kou', '手': 'shou', '心': 'xin', '目': 'mu', '耳': 'er',
  '鼻': 'bi', '舌': 'she', '牙': 'ya', '足': 'zu', '头': 'tou',
  '身': 'shen', '发': 'fa', '眉': 'mei', '眼': 'yan', '脸': 'lian',
  '脚': 'jiao', '骨': 'gu', '皮': 'pi', '血': 'xue', '肉': 'rou',
  '脑': 'nao', '肝': 'gan', '肺': 'fei', '胃': 'wei', '肠': 'chang',
  '胆': 'dan', '肾': 'shen', '脾': 'pi', '男': 'nan', '女': 'nv',
  '父': 'fu', '母': 'mu', '子': 'zi', '儿': 'er', '孙': 'sun',
  '祖': 'zu', '兄': 'xiong', '弟': 'di', '姐': 'jie', '妹': 'mei',
  '夫': 'fu', '妻': 'qi', '童': 'tong', '老': 'lao', '少': 'shao',
  '师': 'shi', '生': 'sheng', '学': 'xue', '校': 'xiao', '书': 'shu',
  '本': 'ben', '课': 'ke', '文': 'wen', '章': 'zhang', '字': 'zi',
  '词': 'ci', '句': 'ju', '读': 'du', '写': 'xie', '算': 'suan',
  '数': 'shu', '小': 'xiao', '高': 'gao', '初': 'chu', '教': 'jiao',
  '同': 'tong', '朋': 'peng', '友': 'you', '工': 'gong', '作': 'zuo',
  '职': 'zhi', '业': 'ye', '公': 'gong', '司': 'si', '板': 'ban',
  '员': 'yuan', '经': 'jing', '理': 'li', '主': 'zhu', '任': 'ren',
  '济': 'ji', '财': 'cai', '务': 'wu', '商': 'shang', '店': 'dian',
  '买': 'mai', '卖': 'mai', '钱': 'qian', '价': 'jia', '贵': 'gui',
  '贱': 'jian', '货': 'huo', '物': 'wu', '品': 'pin', '食': 'shi',
  '米': 'mi', '面': 'mian', '饭': 'fan', '菜': 'cai', '鱼': 'yu',
  '蛋': 'dan', '奶': 'nai', '茶': 'cha', '酒': 'jiu', '烟': 'yan',
  '糖': 'tang', '苹': 'ping', '桃': 'tao', '梨': 'li', '香': 'xiang',
  '蕉': 'jiao', '橙': 'cheng', '柠': 'ning', '檬': 'meng', '葡': 'pu',
  '萄': 'tao', '西': 'xi', '瓜': 'gua', '南': 'nan', '甜': 'tian',
  '苦': 'ku', '酸': 'suan', '辣': 'la', '咸': 'xian', '淡': 'dan',
  '鲜': 'xian', '美': 'mei', '衣': 'yi', '服': 'fu', '帽': 'mao',
  '鞋': 'xie', '袜': 'wa', '裤': 'ku', '裙': 'qun', '衫': 'shan',
  '衬': 'chen', '外': 'wai', '套': 'tao', '内': 'nei', '毛': 'mao',
  '棉': 'mian', '丝': 'si', '绸': 'chou', '布': 'bu', '麻': 'ma',
  '房': 'fang', '屋': 'wu', '楼': 'lou', '家': 'jia', '门': 'men',
  '窗': 'chuang', '墙': 'qiang', '地': 'di', '梯': 'ti', '卫': 'wei',
  '间': 'jian', '厨': 'chu', '客': 'ke', '厅': 'ting', '卧': 'wo',
  '室': 'shi', '阳': 'yang', '台': 'tai', '浴': 'yu', '汽': 'qi',
  '飞': 'fei', '机': 'ji', '船': 'chuan', '轮': 'lun', '交': 'jiao',
  '铁': 'tie', '列': 'lie', '站': 'zhan', '码': 'ma', '港': 'gang',
  '路': 'lu', '街': 'jie', '道': 'dao', '桥': 'qiao', '灯': 'deng',
  '号': 'hao', '邮': 'you', '局': 'ju', '话': 'hua',
  '互': 'hu', '联': 'lian', '络': 'luo', '视': 'shi', '影': 'ying',
  '广': 'guang', '播': 'bo', '新': 'xin', '报': 'bao', '纸': 'zhi',
  '杂': 'za', '志': 'zhi', '籍': 'ji', '音': 'yin', '曲': 'qu',
  '舞': 'wu', '蹈': 'dao', '剧': 'ju', '艺': 'yi', '画': 'hua',
  '法': 'fa', '雕': 'diao', '塑': 'su', '体': 'ti', '运': 'yun',
  '跑': 'pao', '跳': 'tiao', '远': 'yuan', '泳': 'yong', '羽': 'yu',
  '乒': 'ping', '乓': 'pang', '径': 'jing', '赛': 'sai', '软': 'ruan',
  '硬': 'ying', '程': 'cheng', '序': 'xu', '编': 'bian', '开': 'kai',
  '设': 'she', '计': 'ji', '产': 'chan', '测': 'ce', '据': 'ju',
  '库': 'ku', '器': 'qi', '安': 'an', '全': 'quan', '加': 'jia',
  '密': 'mi', '解': 'jie', '译': 'yi', '英': 'ying', '德': 'de',
  '俄': 'e', '阿': 'a', '护': 'hu', '药': 'yao',
  '院': 'yuan', '诊': 'zhen', '所': 'suo', '病': 'bing', '术': 'shu',
  '治': 'zhi', '疗': 'liao', '检': 'jian', '化': 'hua', '验': 'yan',
  '结': 'jie', '健': 'jian', '康': 'kang', '营': 'ying', '维': 'wei',
  '素': 'su', '睡': 'shui', '锻': 'duan', '炼': 'lian', '饮': 'yin',
  '惯': 'guan', '旅': 'lv', '馆': 'guan', '宾': 'bin', '景': 'jing',
  '票': 'piao', '导': 'dao', '团': 'tuan', '自': 'zi', '购': 'gou',
  '超': 'chao', '专': 'zhuan', '快': 'kuai', '递': 'di', '配': 'pei',
  '送': 'song', '时': 'shi', '期': 'qi', '星': 'xing', '今': 'jin',
  '明': 'ming', '昨': 'zuo', '春': 'chun', '夏': 'xia', '秋': 'qiu',
  '冬': 'dong', '份': 'fen', '周': 'zhou', '末': 'mo', '假': 'jia',
  '劳': 'lao', '庆': 'qing', '元': 'yuan', '旦': 'dan', '端': 'duan',
  '午': 'wu', '重': 'chong', '圣': 'sheng', '跨': 'kua', '会': 'hui',
  '宴': 'yan', '聚': 'ju', '派': 'pai', '婚': 'hun', '葬': 'zang',
  '寿': 'shou', '祝': 'zhu', '贺': 'he', '红': 'hong', '奖': 'jiang',
  '名': 'ming', '誉': 'yu', '荣': 'rong', '勋': 'xun', '杯': 'bei',
  '冠': 'guan', '亚': 'ya', '第': 'di', '优': 'you', '良': 'liang',
  '合': 'he', '及': 'ji', '失': 'shi', '败': 'bai', '成': 'cheng',
  '功': 'gong', '胜': 'sheng', '负': 'fu', '赢': 'ying', '输': 'shu',
  '得': 'de', '收': 'shou', '获': 'huo', '损': 'sun', '盈': 'ying',
  '亏': 'kui', '赚': 'zhuan', '赔': 'pei', '约': 'yue', '浪': 'lang',
  '勤': 'qin', '俭': 'jian', '懒': 'lan', '惰': 'duo', '认': 'ren',
  '真': 'zhen', '粗': 'cu', '谨': 'jin', '慎': 'shen', '仔': 'zi',
  '努': 'nu', '坚': 'jian', '持': 'chi', '韧': 'ren', '勇': 'yong',
  '敢': 'gan', '智': 'zhi', '慧': 'hui', '聪': 'cong', '灵': 'ling',
  '敏': 'min', '捷': 'jie', '反': 'fan', '思': 'si', '锐': 'rui',
  '创': 'chuang', '拓': 'tuo', '进': 'jin', '刻': 'ke', '钻': 'zuan',
  '研': 'yan', '长': 'zhang', '展': 'zhan', '改': 'gai', '提': 'ti',
  '升': 'sheng', '级': 'ji', '简': 'jian', '杰': 'jie', '卓': 'zhuo',
  '伟': 'wei', '尚': 'shang', '正': 'zheng', '义': 'yi', '平': 'ping',
  '诚': 'cheng', '忠': 'zhong', '善': 'shan', '和': 'he', '蔼': 'ai',
  '可': 'ke', '亲': 'qin', '热': 're', '朗': 'lang', '观': 'guan',
  '幽': 'you', '默': 'mo', '稳': 'wen', '沉': 'chen', '着': 'zhuo',
  '冷': 'leng', '镇': 'zhen', '定': 'ding', '从': 'cong', '断': 'duan',
  '刚': 'gang', '顽': 'wan', '谦': 'qian', '严': 'yan', '耐': 'nai',
  '谅': 'liang', '宽': 'kuan', '敬': 'jing',
  '谊': 'yi', '协': 'xie', '沟': 'gou', '社': 'she', '貌': 'mao',
  '举': 'ju', '止': 'zhi', '适': 'shi', '规': 'gui', '符': 'fu',
  '称': 'cheng', '如': 'ru', '达': 'da',
};

function getPinyinWithContext(char: string, text: string, index: number): string {
  const polyphoneEntry = polyphoneDict.find(entry => entry.char === char);
  if (!polyphoneEntry) {
    return basicPinyinDict[char] || '';
  }

  const contextWindow = 3;
  const startIdx = Math.max(0, index - contextWindow);
  const endIdx = Math.min(text.length, index + contextWindow + 1);
  const contextText = text.substring(startIdx, endIdx);
  const relativeIndex = index - startIdx;

  for (const contextEntry of polyphoneEntry.contexts) {
    for (const contextStr of contextEntry.context) {
      if (contextStr.length === 1) {
        const contextChar = contextStr;
        if (relativeIndex > 0 && contextText[relativeIndex - 1] === contextChar) {
          return contextEntry.pinyin;
        }
        if (relativeIndex < contextText.length - 1 && contextText[relativeIndex + 1] === contextChar) {
          return contextEntry.pinyin;
        }
      } else {
        if (contextText.includes(contextStr)) {
          return contextEntry.pinyin;
        }
      }
    }
  }

  return polyphoneEntry.default;
}

function brailleCharToDotMatrix(brailleChar: string): number[][] {
  const code = brailleChar.charCodeAt(0);
  const dotMatrix: number[][] = [[0, 0], [0, 0], [0, 0]];
  
  if (code >= 0x2800 && code <= 0x28FF) {
    const offset = code - 0x2800;
    dotMatrix[0][0] = (offset & 0x01) ? 1 : 0;
    dotMatrix[1][0] = (offset & 0x02) ? 1 : 0;
    dotMatrix[2][0] = (offset & 0x04) ? 1 : 0;
    dotMatrix[0][1] = (offset & 0x08) ? 1 : 0;
    dotMatrix[1][1] = (offset & 0x10) ? 1 : 0;
    dotMatrix[2][1] = (offset & 0x20) ? 1 : 0;
  }
  
  return dotMatrix;
}

export function convertToBraille(text: string, mode: ConversionMode, brailleType: BrailleType = 'current'): BrailleResult {
  const strategy: BrailleStrategy = BrailleStrategyFactory.getStrategy(brailleType);
  const brailleText: string[] = [];
  const dotMatrixData: number[][][] = [];
  const unconvertedChars: string[] = [];
  let convertedCount = 0;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    let brailleChar = '';
    
    if (mode === 'glyph') {
      brailleChar = glyphToBraille[char] || '';
    }
    
    if (!brailleChar && mode === 'pinyin') {
      const pinyin = getPinyinWithContext(char, text, i);
      if (pinyin) {
        brailleChar = strategy.convertChar(char, pinyin) || strategy.convertChar(char, removeTone(pinyin)) || '';
      }
    }
    
    if (!brailleChar) {
      brailleChar = strategy.convertChar(char, '') || '\u2800';
      if (!strategy.convertChar(char, '') && !/[\s\n\t]/.test(char)) {
        unconvertedChars.push(char);
      }
    } else {
      convertedCount++;
    }
    
    brailleText.push(brailleChar);
    dotMatrixData.push(brailleCharToDotMatrix(brailleChar));
  }
  
  return {
    brailleText: brailleText.join(''),
    dotMatrixData,
    charCount: text.length,
    convertedCount,
    unconvertedChars,
  };
}

export function speakText(text: string): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    utterance.pitch = 1;
    
    window.speechSynthesis.speak(utterance);
  }
}

export function exportAsText(brailleText: string, originalText: string): void {
  const content = `中文原文：\n${originalText}\n\n盲文结果：\n${brailleText}`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `braille_${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportForPrint(brailleText: string, originalText: string): void {
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>盲文打印</title>
      <style>
        body { font-family: 'Noto Sans Braille', sans-serif; font-size: 24px; padding: 20px; }
        .original { font-family: 'SimSun', serif; font-size: 16px; margin-bottom: 20px; }
        .braille { letter-spacing: 0.5em; line-height: 2; }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="original">${originalText}</div>
      <div class="braille">${brailleText}</div>
    </body>
    </html>
  `;
  
  const blob = new Blob([printContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
        URL.revokeObjectURL(url);
      }, 1000);
    };
  }
}

export { BrailleStrategyFactory };