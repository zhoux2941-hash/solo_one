import { Segment, useDefault } from 'segmentit';
import type { Danmaku, WordCount } from '../types';

let segmentit: Segment | null = null;

async function initSegment() {
  if (!segmentit) {
    segmentit = useDefault(new Segment());
  }
  return segmentit;
}

const STOP_WORDS = new Set([
  '的', '了', '和', '是', '在', '我', '有', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '那', '这个', '那个', '他', '她', '它', '们', '而', '与', '或',
  '啊', '哦', '嗯', '哈', '哈哈', '哈哈哈', '哎', '哎呀', '哇', '呀', '吧', '呢',
  '吗', '啦', '哦', '嗯', '什么', '怎么', '为什么', '可以', '能', '应该',
  'video', 'player', 'bilibili', 'B站', '哔哩哔哩',
]);

const EMOJI_RANGES = [
  [0x1f300, 0x1f5ff],
  [0x1f600, 0x1f64f],
  [0x1f680, 0x1f6ff],
  [0x1f900, 0x1f9ff],
  [0x1fa70, 0x1faff],
  [0x2600, 0x26ff],
  [0x2700, 0x27bf],
  [0x1f1e6, 0x1f1ff],
  [0x1f200, 0x1f2ff],
  [0x1f004, 0x1f004],
  [0x1f0cf, 0x1f0cf],
  [0x1f170, 0x1f171],
  [0x1f17e, 0x1f17f],
  [0x1f18e, 0x1f18e],
  [0x1f191, 0x1f19a],
  [0x1f3f0, 0x1f3f0],
  [0x1f000, 0x1f02f],
  [0x1f0a0, 0x1f0af],
  [0x2b00, 0x2bff],
  [0x2300, 0x23ff],
];

function isEmoji(char: string): boolean {
  const code = char.codePointAt(0);
  if (code === undefined) return false;
  return EMOJI_RANGES.some(([start, end]) => code >= start && code <= end);
}

function extractEmojis(text: string): string[] {
  const emojis: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    const code = text.codePointAt(i);
    
    if (code && code > 0xffff) {
      i++;
    }
    
    if (isEmoji(char)) {
      emojis.push(code && code > 0xffff ? String.fromCodePoint(code) : char);
    }
  }
  return emojis;
}

function isValidWord(word: string): boolean {
  if (word.length < 2 && !isEmoji(word)) return false;
  if (STOP_WORDS.has(word.toLowerCase())) return false;
  if (/^\d+$/.test(word) && !isEmoji(word)) return false;
  if (/^[a-zA-Z]$/.test(word)) return false;
  return true;
}

export async function segmentText(text: string): Promise<string[]> {
  const emojis = extractEmojis(text);
  
  const segment = await initSegment();
  const result = segment.doSegment(text, {
    simple: true,
    stripPunctuation: true,
    stripStopword: true,
  });
  
  const words = result.filter(isValidWord);
  
  return [...words, ...emojis];
}

export async function calculateWordFrequency(
  danmakuList: Danmaku[],
  topN: number = 100
): Promise<WordCount[]> {
  const allText = danmakuList.map((d) => d.text).join(' ');
  const words = await segmentText(allText);

  const frequency: Map<string, number> = new Map();

  words.forEach((word) => {
    const lowerWord = word.toLowerCase();
    frequency.set(lowerWord, (frequency.get(lowerWord) || 0) + 1);
  });

  const result: WordCount[] = Array.from(frequency.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);

  return result;
}

export function getTopWords(wordFrequency: WordCount[], topN: number = 20): WordCount[] {
  return wordFrequency.slice(0, topN);
}
