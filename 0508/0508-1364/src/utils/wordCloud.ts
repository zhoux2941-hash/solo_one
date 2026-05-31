import type { GitCommit } from '../types';

export interface WordData {
  name: string;
  value: number;
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
  'need', 'dare', 'ought', 'used', 'it', 'its', 'this', 'that', 'these',
  'those', 'i', 'you', 'he', 'she', 'we', 'they', 'what', 'which', 'who',
  'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
  'also', 'now', 'here', 'there', 'then', 'once', 'if', 'because', 'while',
  'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further',
  '的', '了', '和', '是', '在', '我', '有', '他', '她', '它',
  '们', '这个', '那个', '这些', '那些', '一个', '一些', '什么',
  '怎么', '为什么', '因为', '所以', '但是', '而且', '或者', '与',
  '及', '并', '等', '啊', '呀', '吧', '呢', '吗', '哦',
  '嗯', '哈', '啦', '哦', '啊', '嘿', '哎', '喔',
  'update', 'updates', 'fix', 'fixes', 'fixed', 'fixing',
  'add', 'added', 'adding', 'remove', 'removed', 'removing',
  'change', 'changed', 'changes', 'changing', 'modify', 'modified',
  'refactor', 'refactored', 'refactoring', 'improve', 'improved',
  'bug', 'bugs', 'feature', 'features', 'test', 'tests', 'testing',
  'doc', 'docs', 'document', 'documentation', 'style', 'styles',
  'format', 'formats', 'formatted', 'clean', 'cleaned', 'cleanup',
  'build', 'builds', 'building', 'ci', 'cd', 'deploy', 'deployment',
  'for', 'to', 'from', 'use', 'using', 'used', 'new', 'old',
]);

function isChinese(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x4e00 && code <= 0x9fa5;
}

function isEnglishWord(word: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(word);
}

function tokenizeChinese(text: string): string[] {
  const words: string[] = [];
  let i = 0;
  
  while (i < text.length) {
    const char = text[i];
    
    if (isChinese(char)) {
      for (let len = 4; len >= 2; len--) {
        if (i + len <= text.length) {
          const word = text.slice(i, i + len);
          if (isChinese(word[0]) && isChinese(word[word.length - 1])) {
            words.push(word);
            i += len;
            break;
          }
        }
      }
      i++;
    } else {
      i++;
    }
  }
  
  return words;
}

function tokenizeEnglish(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9_-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 2 && isEnglishWord(word));
  
  return words;
}

export function extractWords(text: string): string[] {
  if (!text || text.trim() === '') return [];
  
  const normalizedText = text.toLowerCase().trim();
  
  const englishWords = tokenizeEnglish(normalizedText);
  const chineseWords = tokenizeChinese(normalizedText);
  
  return [...englishWords, ...chineseWords];
}

export function filterStopWords(words: string[]): string[] {
  return words.filter(word => {
    if (word.length < 2) return false;
    return !STOP_WORDS.has(word.toLowerCase());
  });
}

export function calculateWordFrequency(commits: GitCommit[]): Map<string, number> {
  const wordCount = new Map<string, number>();
  
  for (const commit of commits) {
    const words = extractWords(commit.message);
    const filteredWords = filterStopWords(words);
    
    for (const word of filteredWords) {
      const lowerWord = word.toLowerCase();
      wordCount.set(lowerWord, (wordCount.get(lowerWord) || 0) + 1);
    }
  }
  
  return wordCount;
}

export function generateWordCloudData(
  commits: GitCommit[],
  maxWords: number = 100
): WordData[] {
  if (commits.length === 0) return [];
  
  const wordCount = calculateWordFrequency(commits);
  
  const wordList: WordData[] = Array.from(wordCount.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, maxWords);
  
  if (wordList.length === 0) return [];
  
  const maxValue = wordList[0].value;
  const minValue = wordList[wordList.length - 1].value;
  
  const normalizedWords = wordList.map(word => ({
    ...word,
    value: minValue === maxValue 
      ? 50 
      : Math.round(12 + ((word.value - minValue) / (maxValue - minValue)) * 50),
  }));
  
  return normalizedWords;
}

export const WORD_CLOUD_COLORS = [
  '#0c8ae6',
  '#ff6b35',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#84cc16',
  '#6366f1',
  '#3b82f6',
  '#ef4444',
  '#14b8a6',
  '#eab308',
  '#a855f7',
  '#22c55e',
];

export function getRandomColor(): string {
  return WORD_CLOUD_COLORS[Math.floor(Math.random() * WORD_CLOUD_COLORS.length)];
}
