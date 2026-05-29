import type { WordData, SyllableResult } from '../types';
import dictionaryData from '../data/dictionary.json';

const dictionary = new Map<string, WordData>();
dictionaryData.words.forEach(word => {
  dictionary.set(word.word.toLowerCase(), word);
});

const sonorityValues: Record<string, number> = {
  'a': 5, 'e': 5, 'i': 5, 'o': 5, 'u': 5,
  'y': 4, 'w': 4,
  'l': 3, 'r': 3,
  'm': 2, 'n': 2, 'ng': 2, 'nm': 2,
  'v': 1, 'z': 1, 'ð': 1, 'ʒ': 1, 'f': 1, 's': 1, 'θ': 1, 'ʃ': 1, 'h': 1,
  'p': 0, 't': 0, 'k': 0, 'b': 0, 'd': 0, 'g': 0, 'tʃ': 0, 'dʒ': 0,
};

function getSonority(char: string): number {
  const lower = char.toLowerCase();
  return sonorityValues[lower] || 0;
}

function getSonorityForDigraph(word: string, index: number): { value: number; length: number } {
  const twoChar = word.slice(index, index + 2).toLowerCase();
  
  if (sonorityValues[twoChar]) {
    return { value: sonorityValues[twoChar], length: 2 };
  }
  
  return { value: getSonority(word[index]), length: 1 };
}

function getSonorityProfile(word: string): { value: number; char: string; index: number }[] {
  const profile: { value: number; char: string; index: number }[] = [];
  let i = 0;
  
  while (i < word.length) {
    const result = getSonorityForDigraph(word, i);
    profile.push({
      value: result.value,
      char: word.slice(i, i + result.length),
      index: i
    });
    i += result.length;
  }
  
  return profile;
}

function findNuclei(profile: { value: number; char: string; index: number }[]): number[] {
  const nuclei: number[] = [];
  
  for (let i = 0; i < profile.length; i++) {
    if (profile[i].value >= 4) {
      if (nuclei.length === 0 || i > nuclei[nuclei.length - 1] + 1) {
        nuclei.push(i);
      }
    }
  }
  
  return nuclei;
}

function findSyllableBoundaries(word: string): number[] {
  if (word.length <= 1) return [];
  
  const profile = getSonorityProfile(word);
  const nuclei = findNuclei(profile);
  
  if (nuclei.length <= 1) return [];
  
  const boundaries: number[] = [];
  
  for (let i = 0; i < nuclei.length - 1; i++) {
    const currentNucleus = nuclei[i];
    const nextNucleus = nuclei[i + 1];
    
    let minSonority = Infinity;
    let minIndex = -1;
    
    for (let j = currentNucleus + 1; j < nextNucleus; j++) {
      if (profile[j].value < minSonority) {
        minSonority = profile[j].value;
        minIndex = j;
      } else if (profile[j].value === minSonority && minIndex !== -1) {
        minIndex = j;
      }
    }
    
    if (minIndex !== -1) {
      const boundaryPosition = profile[minIndex].index;
      if (boundaryPosition > 0 && boundaryPosition < word.length - 1) {
        boundaries.push(boundaryPosition);
      }
    }
  }
  
  return boundaries.sort((a, b) => a - b);
}

export function syllabifyBySonority(word: string): string[] {
  const lowerWord = word.toLowerCase();
  
  if (lowerWord.length === 0) return [];
  if (lowerWord.length <= 2) return [lowerWord];
  
  const boundaries = findSyllableBoundaries(lowerWord);
  
  if (boundaries.length === 0) return [lowerWord];
  
  const syllables: string[] = [];
  let start = 0;
  
  for (const boundary of boundaries) {
    syllables.push(lowerWord.slice(start, boundary));
    start = boundary;
  }
  
  syllables.push(lowerWord.slice(start));
  
  return syllables.filter(s => s.length > 0);
}

export function estimateStressIndex(syllables: string[]): number {
  if (syllables.length === 1) return 0;
  
  const suffixRules: Record<string, number> = {
    'tion': -1,  
    'sion': -1,  
    'ic': -1,    
    'ical': -2,  
    'ity': -2,   
    'ive': -1,   
    'ment': -1,  
    'ness': -1,  
    'able': -1,  
    'ible': -1,  
    'ous': -1,   
    'ful': -1,   
    'less': -1,  
    'er': -1,    
    'or': -1,    
    'ist': -1,   
    'ize': -2,   
    'ify': -2,   
    'ate': -2,   
    'al': -1,    
    'ant': -1,   
    'ent': -1,   
    'graphy': -2,
    'logy': -2,  
    'ology': -2, 
    'scopy': -2, 
    'graph': -2, 
    'metry': -2, 
    'phony': -2, 
    'gamy': -2,  
    'nomy': -2,  
    'pathy': -2, 
    'thy': -2,   
    'my': -1,    
    'ry': -1,    
    'ure': -1,   
    'age': -1,   
    'ance': -2,  
    'ence': -2,  
    'dom': -1,   
    'hood': -1,  
    'ship': -1,  
    'ward': -1,  
    'wise': -1,  
  };
  
  const wordStr = syllables.join('');
  
  for (const [suffix, offset] of Object.entries(suffixRules)) {
    if (wordStr.endsWith(suffix)) {
      const targetIndex = syllables.length + offset;
      if (targetIndex >= 0 && targetIndex < syllables.length) {
        return targetIndex;
      }
      break;
    }
  }
  
  let bestIndex = syllables.length - 2 >= 0 ? syllables.length - 2 : 0;
  let bestScore = -1;
  
  syllables.forEach((syllable, index) => {
    let score = 0;
    
    if (index === syllables.length - 2) {
      score += 5;
    } else if (index === syllables.length - 1) {
      score -= 10;
    } else if (index === 0) {
      score += 2;
    }
    
    const vowelCount = syllable.split('').filter(c => 'aeiouy'.includes(c.toLowerCase())).length;
    score += vowelCount * 3;
    
    const hasLongVowel = /[aeiouy][aeiouy]/.test(syllable) || 
                         /[aeiouy]e$/.test(syllable);
    if (hasLongVowel) score += 2;
    
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  
  return bestIndex;
}

export function lookupWord(word: string): WordData | null {
  return dictionary.get(word.toLowerCase()) || null;
}

export function analyzeWord(word: string): SyllableResult {
  const trimmedWord = word.trim().toLowerCase();
  
  if (!trimmedWord) {
    return {
      word: '',
      ipa: '',
      syllables: [],
      stressIndex: 0,
      syllableDisplay: '',
      stressedDisplay: ''
    };
  }
  
  const dictEntry = lookupWord(trimmedWord);
  
  let syllables: string[];
  let stressIndex: number;
  let ipa: string;
  
  if (dictEntry) {
    syllables = dictEntry.syllables;
    stressIndex = dictEntry.stressIndex;
    ipa = dictEntry.ipa;
  } else {
    syllables = syllabifyBySonority(trimmedWord);
    stressIndex = estimateStressIndex(syllables);
    ipa = '';
  }
  
  const syllableDisplay = syllables.join('·');
  const stressedDisplay = syllables.map((s, i) => 
    i === stressIndex ? `ˈ${s}` : s
  ).join('·');
  
  return {
    word: trimmedWord,
    ipa,
    syllables,
    stressIndex,
    syllableDisplay,
    stressedDisplay
  };
}

export function analyzeWords(words: string): SyllableResult[] {
  const wordList = words
    .split(/[\s,，.。!！?？;；:：]+/)
    .filter(w => w.trim())
    .map(w => w.trim());
  
  return wordList.map(analyzeWord);
}
