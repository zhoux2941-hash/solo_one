export type VoicePart = 'high' | 'low';

export type Dialect = 'sanjiang' | 'congjiang' | 'liping';

export type TrainingMode = 'entry' | 'melody';

export interface Song {
  id: string;
  title: string;
  dialect: Dialect;
  duration: number;
  lyrics: {
    dong: string;
    chinese: string;
  };
  audioConfig: {
    highVoice: {
      baseFrequency: number;
      entryTime: number;
      pattern: number[];
    };
    lowVoice: {
      baseFrequency: number;
      entryTime: number;
      pattern: number[];
    };
  };
  questions: {
    entry: {
      correctAnswer: VoicePart;
      highEntryTime: number;
      lowEntryTime: number;
    };
    melody: {
      correctAnswer: VoicePart;
      description: string;
    };
  };
}

export interface UserProgress {
  score: number;
  totalAnswered: number;
  correctStreak: number;
  unlockedHeritageIds: string[];
  currentDialect: Dialect;
}

export interface HeritageContent {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  unlockRequirement: number;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  highVolume: number;
  lowVolume: number;
}

export interface AnswerFeedback {
  isCorrect: boolean;
  correctAnswer: VoicePart;
  userAnswer: VoicePart;
  songTitle: string;
  lyrics: {
    dong: string;
    chinese: string;
  };
  explanation: string;
}
