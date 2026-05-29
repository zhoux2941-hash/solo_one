import { poemLibrary } from '../data/poems';
import { templates, fillers } from '../data/templates';
import { getRhymingWords, findRhymeGroupByWord, recommendRhymeGroup, getAllRhymeGroups } from '../data/rhyme';
import type { RhymeGroup } from '../data/rhyme';
import { pingzeDict } from '../data/pingze';

export interface PoemLine {
  text: string;
  source: 'library' | 'template';
}

export interface GeneratedPoem {
  lines: string[];
  sources: ('library' | 'template')[];
}

const randomPick = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

const generateLineFromLibrary = (char: string): string | null => {
  const lines = poemLibrary[char];
  if (!lines || lines.length === 0) return null;
  
  const sevenCharLines = lines.filter(line => line.length === 7);
  if (sevenCharLines.length > 0) {
    return randomPick(sevenCharLines);
  }
  
  const fiveCharLines = lines.filter(line => line.length === 5);
  if (fiveCharLines.length > 0) {
    return randomPick(fiveCharLines);
  }
  
  return randomPick(lines);
};

const generateLineFromTemplate = (char: string): string => {
  const template = randomPick(templates);
  const placeholderCount = (template.match(/\{X\}/g) || []).length;
  
  let result = template;
  for (let i = 0; i < placeholderCount; i++) {
    const availableFillers = fillers[char] || fillers['天'];
    const filler = randomPick(availableFillers);
    result = result.replace(/\{X\}/, filler);
  }
  
  if (result.length > 7) {
    result = result.substring(0, 7);
  } else if (result.length < 7) {
    const availableFillers = fillers['天'];
    while (result.length < 7) {
      const filler = randomPick(availableFillers);
      result += filler;
    }
  }
  
  return char + result.substring(1);
};

export const generatePoem = (chars: string[]): GeneratedPoem => {
  const lines: string[] = [];
  const sources: ('library' | 'template')[] = [];
  
  chars.forEach(char => {
    const libraryLine = generateLineFromLibrary(char);
    if (libraryLine) {
      lines.push(libraryLine);
      sources.push('library');
    } else {
      const templateLine = generateLineFromTemplate(char);
      lines.push(templateLine);
      sources.push('template');
    }
  });
  
  return { lines, sources };
};

export const analyzePingze = (poem: string[]): string[] => {
  return poem.map(line => {
    return line.split('').map(char => {
      return pingzeDict[char] || '?';
    }).join('');
  });
};

export const getRhymeSuggestions = (char: string): string[] => {
  return getRhymingWords(char).slice(0, 8);
};

export const getRhymeGroupByWord = (word: string): RhymeGroup | null => {
  return findRhymeGroupByWord(word);
};

export const getRecommendedRhymeGroup = (chars: string[]): RhymeGroup | null => {
  return recommendRhymeGroup(chars);
};

export const getAllRhymeCategories = (): RhymeGroup[] => {
  return getAllRhymeGroups();
};

export const validatePoem = (poem: string[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  poem.forEach((line, index) => {
    if (line.length !== 7) {
      errors.push(`第${index + 1}句长度应为7字，实际${line.length}字`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
