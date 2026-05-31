import { ClassificationResult, TrainingData, TrainingSample, WordContribution, WordCount } from '../types/classifier';
import { presetFeatureWords, presetHamDocCount, presetSpamDocCount, testEmails } from '../data/trainingData';

const STORAGE_KEY_TRAINING_DATA = 'spam_classifier_training_data';
const STORAGE_KEY_USER_SAMPLES = 'spam_classifier_user_samples';
const STORAGE_KEY_USER_WEIGHT = 'spam_classifier_user_weight';

export class NaiveBayesClassifier {
  private trainingData: TrainingData;
  private userSamples: TrainingSample[];
  private userWeight: number;

  constructor() {
    this.userWeight = this.loadUserWeight();
    this.trainingData = this.loadTrainingData();
    this.userSamples = this.loadUserSamples();
  }

  private loadUserWeight(): number {
    const stored = localStorage.getItem(STORAGE_KEY_USER_WEIGHT);
    if (stored) {
      return JSON.parse(stored);
    }
    return 50;
  }

  private saveUserWeight(): void {
    localStorage.setItem(STORAGE_KEY_USER_WEIGHT, JSON.stringify(this.userWeight));
  }

  getUserWeight(): number {
    return this.userWeight;
  }

  setUserWeight(weight: number): void {
    this.userWeight = Math.max(0, Math.min(100, weight));
    this.saveUserWeight();
    this.retrainModel();
    this.saveTrainingData();
  }

  private loadTrainingData(): TrainingData {
    const stored = localStorage.getItem(STORAGE_KEY_TRAINING_DATA);
    if (stored) {
      return JSON.parse(stored);
    }
    return this.buildPresetTrainingData();
  }

  private loadUserSamples(): TrainingSample[] {
    const stored = localStorage.getItem(STORAGE_KEY_USER_SAMPLES);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  }

  private saveTrainingData(): void {
    localStorage.setItem(STORAGE_KEY_TRAINING_DATA, JSON.stringify(this.trainingData));
  }

  private saveUserSamples(): void {
    localStorage.setItem(STORAGE_KEY_USER_SAMPLES, JSON.stringify(this.userSamples));
  }

  private buildPresetTrainingData(): TrainingData {
    const spamWordCounts: WordCount = {};
    const hamWordCounts: WordCount = {};
    let spamWordCount = 0;
    let hamWordCount = 0;

    presetFeatureWords.forEach(fw => {
      const spamCount = Math.round(fw.spamProb * 10000);
      const hamCount = Math.round(fw.hamProb * 10000);
      spamWordCounts[fw.word] = spamCount;
      hamWordCounts[fw.word] = hamCount;
      spamWordCount += spamCount;
      hamWordCount += hamCount;
    });

    return {
      featureWords: [...presetFeatureWords],
      spamWordCounts,
      hamWordCounts,
      spamWordCount,
      hamWordCount,
      spamDocCount: presetSpamDocCount,
      hamDocCount: presetHamDocCount,
    };
  }

  tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 2);
  }

  getWordProb(word: string, isSpam: boolean): number {
    const wordCounts = isSpam ? this.trainingData.spamWordCounts : this.trainingData.hamWordCounts;
    const totalCount = isSpam ? this.trainingData.spamWordCount : this.trainingData.hamWordCount;
    const vocabSize = this.trainingData.featureWords.length;

    const count = wordCounts[word] || 0;
    return (count + 1) / (totalCount + vocabSize);
  }

  classify(emailText: string): ClassificationResult {
    const tokens = this.tokenize(emailText);
    const uniqueTokens = [...new Set(tokens)];

    const priorSpam = this.trainingData.spamDocCount / (this.trainingData.spamDocCount + this.trainingData.hamDocCount);
    const priorHam = this.trainingData.hamDocCount / (this.trainingData.spamDocCount + this.trainingData.hamDocCount);

    let logSpamProb = Math.log(priorSpam);
    let logHamProb = Math.log(priorHam);

    const wordContributions: WordContribution[] = uniqueTokens.map(word => {
      const spamProb = this.getWordProb(word, true);
      const hamProb = this.getWordProb(word, false);
      
      const wordLogSpam = Math.log(spamProb);
      const wordLogHam = Math.log(hamProb);
      
      logSpamProb += wordLogSpam;
      logHamProb += wordLogHam;

      const contribution = wordLogSpam - wordLogHam;
      const isInVocabulary = this.trainingData.featureWords.some(fw => fw.word === word);

      return {
        word,
        spamLogProb: wordLogSpam,
        hamLogProb: wordLogHam,
        contribution,
        isInVocabulary,
      };
    });

    const maxLog = Math.max(logSpamProb, logHamProb);
    const spamNumerator = Math.exp(logSpamProb - maxLog);
    const hamNumerator = Math.exp(logHamProb - maxLog);
    const denominator = spamNumerator + hamNumerator;

    const spamProbability = spamNumerator / denominator;
    const hamProbability = hamNumerator / denominator;

    const confidence = Math.abs(spamProbability - 0.5) * 2;

    return {
      spamProbability,
      hamProbability,
      isSpam: spamProbability > hamProbability,
      wordContributions: wordContributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)),
      confidence,
    };
  }

  addTrainingSample(text: string, label: 'spam' | 'ham'): void {
    const sample: TrainingSample = {
      id: Date.now().toString(),
      text,
      label,
      createdAt: Date.now(),
    };

    this.userSamples.push(sample);
    this.retrainModel();
    this.saveUserSamples();
    this.saveTrainingData();
  }

  private retrainModel(): void {
    const baseData = this.buildPresetTrainingData();
    const multiplier = this.userWeight / 50;

    this.userSamples.forEach(sample => {
      const tokens = this.tokenize(sample.text);
      const wordCounts = sample.label === 'spam' ? baseData.spamWordCounts : baseData.hamWordCounts;

      tokens.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + multiplier;
        if (sample.label === 'spam') {
          baseData.spamWordCount += multiplier;
        } else {
          baseData.hamWordCount += multiplier;
        }
      });

      if (sample.label === 'spam') {
        baseData.spamDocCount += multiplier;
      } else {
        baseData.hamDocCount += multiplier;
      }
    });

    const allWords = new Set([
      ...Object.keys(baseData.spamWordCounts),
      ...Object.keys(baseData.hamWordCounts),
    ]);

    baseData.featureWords = Array.from(allWords).map(word => ({
      word,
      spamProb: (baseData.spamWordCounts[word] || 0) / baseData.spamWordCount,
      hamProb: (baseData.hamWordCounts[word] || 0) / baseData.hamWordCount,
    }));

    this.trainingData = baseData;
  }

  resetToPreset(): void {
    this.userSamples = [];
    this.userWeight = 50;
    this.trainingData = this.buildPresetTrainingData();
    localStorage.removeItem(STORAGE_KEY_TRAINING_DATA);
    localStorage.removeItem(STORAGE_KEY_USER_SAMPLES);
    localStorage.removeItem(STORAGE_KEY_USER_WEIGHT);
  }

  calculateAccuracy(): number {
    let correct = 0;

    testEmails.forEach(email => {
      const result = this.classify(email.text);
      const predictedLabel = result.isSpam ? 'spam' : 'ham';
      if (predictedLabel === email.label) {
        correct++;
      }
    });

    return correct / testEmails.length;
  }

  getUserSampleCount(): { spam: number; ham: number } {
    return {
      spam: this.userSamples.filter(s => s.label === 'spam').length,
      ham: this.userSamples.filter(s => s.label === 'ham').length,
    };
  }

  getVocabularySize(): number {
    return this.trainingData.featureWords.length;
  }

  getTotalSampleCount(): { spam: number; ham: number; total: number } {
    return {
      spam: Math.round(this.trainingData.spamDocCount),
      ham: Math.round(this.trainingData.hamDocCount),
      total: Math.round(this.trainingData.spamDocCount + this.trainingData.hamDocCount),
    };
  }
}

export const classifier = new NaiveBayesClassifier();
