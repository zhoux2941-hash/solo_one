const ABBREVIATIONS = [
  "Mr", "Mrs", "Ms", "Miss", "Dr", "Prof", "Sr", "Jr",
  "Capt", "Col", "Gen", "Gov", "Lt", "Sgt", "Rev", "Hon",
  "Jan", "Feb", "Mar", "Apr", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun",
  "etc", "e.g", "i.e", "vs", "viz", "p.m", "a.m", "P.M", "A.M",
  "St", "Ave", "Rd", "Blvd", "Ln", "Ct", "Dr",
  "U.S", "U.K", "U.S.A", "U.N", "E.U",
  "B.C", "A.D",
  "Vol", "Chap", "Fig", "pp", "No",
  "Inc", "Ltd", "Co", "Corp",
];

const PERIOD_PLACEHOLDER = "\u00B7";

const HONORIFICS = new Set([
  "mr", "mrs", "ms", "miss", "dr", "prof", "sr", "jr",
  "capt", "col", "gen", "gov", "lt", "sgt", "rev", "hon",
  "st",
]);

export function preprocessAbbreviations(text: string): string {
  let processed = text;

  for (const abbr of ABBREVIATIONS) {
    const abbrWithDots = abbr.replace(/\./g, "\\.");
    const regex = new RegExp(`\\b${abbrWithDots}\\.`, "gi");
    processed = processed.replace(regex, (match, offset) => {
      const afterMatch = processed.slice(offset + match.length);
      const nextIsCapital = /^\s+[A-Z]/.test(afterMatch);
      const isHonorific = HONORIFICS.has(abbr.toLowerCase());
      const isAtSentenceEnd = nextIsCapital && !isHonorific;
      const innerDotsReplaced = abbr.replace(/\./g, PERIOD_PLACEHOLDER);
      if (isAtSentenceEnd) {
        return innerDotsReplaced + ".";
      }
      return innerDotsReplaced + PERIOD_PLACEHOLDER;
    });
  }

  const multiLetterRegex = /\b([A-Z](?:\.[A-Z])+)\./g;
  processed = processed.replace(multiLetterRegex, (match, p1, offset) => {
    const afterMatch = processed.slice(offset + match.length);
    const isAtSentenceEnd = /^\s+[A-Z]/.test(afterMatch);
    const innerDotsReplaced = p1.replace(/\./g, PERIOD_PLACEHOLDER);
    if (isAtSentenceEnd) {
      return innerDotsReplaced + ".";
    }
    return innerDotsReplaced + PERIOD_PLACEHOLDER;
  });

  return processed;
}

export function restorePeriods(text: string): string {
  return text.replace(new RegExp(PERIOD_PLACEHOLDER, "g"), ".");
}

const SYLLABLE_EXCEPTIONS: Record<string, number> = {
  "people": 2, "pulse": 1, "else": 1, "purple": 2, "example": 3,
  "nation": 2, "special": 2, "create": 2, "true": 1, "blue": 1,
  "since": 1, "guide": 1, "guilty": 2, "guest": 1, "queue": 1,
  "coyote": 3, "zion": 2, "alien": 3, "okay": 2, "enemy": 3,
  "beautiful": 3, "syllable": 3, "apple": 2, "table": 2,
  "bottle": 2, "little": 2, "education": 4, "international": 5,
  "appreciate": 4, "associate": 4, "precious": 2, "conscience": 2,
  "anxious": 2, "ocean": 2, "action": 2, "separate": 3,
  "programming": 3, "readability": 5, "university": 5,
  "understand": 3, "government": 3, "computer": 3, "banana": 3,
  "family": 3, "welcome": 2, "water": 2, "hello": 2,
};

export function countSyllables(word: string): number {
  word = word.toLowerCase().trim();
  if (word.length === 0) return 0;
  if (word.length <= 2) return 1;

  word = word.replace(/[^a-z]/g, "");

  if (SYLLABLE_EXCEPTIONS[word]) {
    return SYLLABLE_EXCEPTIONS[word];
  }

  const vowelGroups = word.match(/[aeiouy]+/g);
  let count = vowelGroups ? vowelGroups.length : 0;

  if (word.endsWith("e") && count > 1) {
    if (!word.endsWith("le") && !word.endsWith("ee") && !word.endsWith("ue")) {
      count--;
    }
  }

  if (word.endsWith("le") && word.length > 3) {
    const prevChar = word[word.length - 3];
    if (!/[aeiouy]/.test(prevChar)) {
      count++;
    }
  }

  if (word.endsWith("ed") && count > 1) {
    const prevChar = word[word.length - 3];
    if (!/[aeiouy]/.test(prevChar) && prevChar !== 'l') {
      count--;
    }
  }

  if (/[aeiou]tion|[aeiou]sion/.test(word)) {
    count++;
  }

  if (/cial|tial/.test(word)) {
    count++;
  }

  if (/^re[aeiouy]/.test(word)) {
    count++;
  }

  if (/^pre[aeiouy]/.test(word)) {
    count++;
  }

  return Math.max(1, count);
}

export function getWordSyllables(word: string): number {
  return countSyllables(word);
}

export interface TextAnalysis {
  words: string[];
  sentenceCount: number;
  wordCount: number;
  syllableCount: number;
  avgWordLength: number;
  polysyllableCount: number;
  polysyllableRatio: number;
  complexWordCount: number;
  wordSyllableMap: Map<string, number>;
}

export function analyzeText(text: string): TextAnalysis {
  const processedText = preprocessAbbreviations(text);
  const sentences = processedText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(sentences.length, 1);

  const restoredText = restorePeriods(processedText);
  const rawWords = restoredText
    .replace(/[^a-zA-Z\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const words = rawWords;
  const wordCount = Math.max(words.length, 1);

  const wordSyllableMap = new Map<string, number>();
  let syllableCount = 0;
  let polysyllableCount = 0;
  let complexWordCount = 0;
  let totalWordLength = 0;

  for (const word of words) {
    const cleanWord = word.replace(/[^a-zA-Z'-]/g, "");
    if (cleanWord.length === 0) continue;
    totalWordLength += cleanWord.length;

    const syllables = countSyllables(cleanWord);
    wordSyllableMap.set(cleanWord.toLowerCase(), syllables);
    syllableCount += syllables;

    if (syllables >= 3) {
      polysyllableCount++;
      complexWordCount++;
    }
  }

  return {
    words,
    sentenceCount,
    wordCount,
    syllableCount,
    avgWordLength: wordCount > 0 ? totalWordLength / wordCount : 0,
    polysyllableCount,
    polysyllableRatio: wordCount > 0 ? polysyllableCount / wordCount : 0,
    complexWordCount,
    wordSyllableMap,
  };
}

export interface ReadabilityResult {
  fleschReadingEase: number;
  fleschReadingEaseLabel: string;
  fleschReadingEaseDesc: string;
  fleschKincaidGrade: number;
  fleschKincaidGradeLabel: string;
  fleschKincaidGradeDesc: string;
  gunningFogIndex: number;
  gunningFogLabel: string;
  gunningFogDesc: string;
  smogIndex: number;
  smogLabel: string;
  smogDesc: string;
}

function getFleschReadingEaseInterpretation(score: number): {
  label: string;
  desc: string;
} {
  if (score >= 90) return { label: "Very Easy", desc: "非常容易阅读，适合5年级学生（约10-11岁）" };
  if (score >= 80) return { label: "Easy", desc: "较易阅读，适合6年级学生（约11-12岁）" };
  if (score >= 70) return { label: "Fairly Easy", desc: "较易阅读，适合7年级学生（约12-13岁）" };
  if (score >= 60) return { label: "Standard", desc: "标准难度，适合8-9年级学生（约13-15岁）" };
  if (score >= 50) return { label: "Fairly Difficult", desc: "较难阅读，适合高中生（约15-18岁）" };
  if (score >= 30) return { label: "Difficult", desc: "困难，适合大学生及成年人" };
  return { label: "Very Difficult", desc: "非常困难，适合研究生及专业人士" };
}

function getFleschKincaidGradeInterpretation(grade: number): {
  label: string;
  desc: string;
} {
  if (grade <= 5) return { label: "Elementary", desc: "小学水平，非常易懂" };
  if (grade <= 8) return { label: "Middle School", desc: "中学水平，较易理解" };
  if (grade <= 10) return { label: "High School", desc: "高中水平，标准难度" };
  if (grade <= 12) return { label: "High School+", desc: "高中高级水平，有一定难度" };
  if (grade <= 16) return { label: "College", desc: "大学水平，需要较高阅读能力" };
  return { label: "Graduate", desc: "研究生水平，专业学术文本" };
}

function getGunningFogInterpretation(index: number): {
  label: string;
  desc: string;
} {
  if (index <= 6) return { label: "Very Easy", desc: "大众读物，几乎所有人都能理解" };
  if (index <= 8) return { label: "Easy", desc: "较易阅读，适合一般读者" };
  if (index <= 10) return { label: "Standard", desc: "标准难度，适合高中及以上读者" };
  if (index <= 12) return { label: "Ideal", desc: "理想难度，适合高中毕业生" };
  if (index <= 14) return { label: "Difficult", desc: "较难，适合大学生" };
  if (index <= 16) return { label: "Very Difficult", desc: "困难，适合大学毕业生" };
  return { label: "Extremely Difficult", desc: "极其困难，适合学术专家" };
}

function getSMOGInterpretation(index: number): {
  label: string;
  desc: string;
} {
  if (index <= 5) return { label: "Elementary", desc: "小学水平" };
  if (index <= 8) return { label: "Middle School", desc: "中学水平" };
  if (index <= 10) return { label: "High School", desc: "高中水平" };
  if (index <= 12) return { label: "High School+", desc: "高中高级水平" };
  if (index <= 14) return { label: "College", desc: "大学水平" };
  return { label: "Graduate", desc: "研究生及以上水平" };
}

export function calculateReadability(analysis: TextAnalysis): ReadabilityResult {
  const { sentenceCount, wordCount, syllableCount, complexWordCount, polysyllableCount } = analysis;

  const fleschReadingEase =
    206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);

  const fleschKincaidGrade =
    0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59;

  const gunningFogIndex =
    0.4 * (wordCount / sentenceCount + 100 * (complexWordCount / wordCount));

  const polysyllableCountForSmog = Math.max(polysyllableCount, 1);
  const smogIndex =
    1.043 * Math.sqrt(polysyllableCountForSmog * (30 / sentenceCount)) + 3.1291;

  const fleschInterp = getFleschReadingEaseInterpretation(fleschReadingEase);
  const kincaidInterp = getFleschKincaidGradeInterpretation(fleschKincaidGrade);
  const fogInterp = getGunningFogInterpretation(gunningFogIndex);
  const smogInterp = getSMOGInterpretation(smogIndex);

  return {
    fleschReadingEase: Math.round(fleschReadingEase * 10) / 10,
    fleschReadingEaseLabel: fleschInterp.label,
    fleschReadingEaseDesc: fleschInterp.desc,
    fleschKincaidGrade: Math.round(fleschKincaidGrade * 10) / 10,
    fleschKincaidGradeLabel: kincaidInterp.label,
    fleschKincaidGradeDesc: kincaidInterp.desc,
    gunningFogIndex: Math.round(gunningFogIndex * 10) / 10,
    gunningFogLabel: fogInterp.label,
    gunningFogDesc: fogInterp.desc,
    smogIndex: Math.round(smogIndex * 10) / 10,
    smogLabel: smogInterp.label,
    smogDesc: smogInterp.desc,
  };
}
