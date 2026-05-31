export interface FeatureWord {
  word: string;
  spamProb: number;
  hamProb: number;
}

export interface WordCount {
  [word: string]: number;
}

export interface TrainingData {
  featureWords: FeatureWord[];
  spamWordCounts: WordCount;
  hamWordCounts: WordCount;
  spamWordCount: number;
  hamWordCount: number;
  spamDocCount: number;
  hamDocCount: number;
}

export interface WordContribution {
  word: string;
  spamLogProb: number;
  hamLogProb: number;
  contribution: number;
  isInVocabulary: boolean;
}

export interface ClassificationResult {
  spamProbability: number;
  hamProbability: number;
  isSpam: boolean;
  wordContributions: WordContribution[];
  confidence: number;
}

export interface TrainingSample {
  id: string;
  text: string;
  label: 'spam' | 'ham';
  createdAt: number;
}

export interface TestEmail {
  text: string;
  label: 'spam' | 'ham';
}
