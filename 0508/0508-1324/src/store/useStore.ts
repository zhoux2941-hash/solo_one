import { create } from 'zustand';
import type { UserProgress, VoicePart, TrainingMode, Dialect, AnswerFeedback, Song } from '@/types';
import { songs } from '@/data/songs';
import { heritageContents } from '@/data/heritage';

interface StoreState {
  userProgress: UserProgress;
  currentSongIndex: number;
  currentMode: TrainingMode | null;
  selectedAnswer: VoicePart | null;
  isAnswered: boolean;
  showFeedback: boolean;
  feedbackData: AnswerFeedback | null;
  highVolume: number;
  lowVolume: number;
  setDialect: (dialect: Dialect) => void;
  setMode: (mode: TrainingMode) => void;
  setSelectedAnswer: (answer: VoicePart | null) => void;
  submitAnswer: (song: Song, mode: TrainingMode) => void;
  nextSong: () => void;
  resetForNewSong: () => void;
  setHighVolume: (volume: number) => void;
  setLowVolume: (volume: number) => void;
  getAvailableSongs: () => Song[];
  getCurrentSong: () => Song | null;
  resetProgress: () => void;
}

const STORAGE_KEY = 'dongzu-singer-progress';

const loadProgress = (): UserProgress => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load progress:', e);
  }
  return {
    score: 0,
    totalAnswered: 0,
    correctStreak: 0,
    unlockedHeritageIds: [],
    currentDialect: 'sanjiang',
  };
};

const saveProgress = (progress: UserProgress) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
};

export const useStore = create<StoreState>((set, get) => ({
  userProgress: loadProgress(),
  currentSongIndex: 0,
  currentMode: null,
  selectedAnswer: null,
  isAnswered: false,
  showFeedback: false,
  feedbackData: null,
  highVolume: 1,
  lowVolume: 1,

  setDialect: (dialect: Dialect) => {
    const newProgress = { ...get().userProgress, currentDialect: dialect };
    set({ userProgress: newProgress, currentSongIndex: 0 });
    saveProgress(newProgress);
  },

  setMode: (mode: TrainingMode) => {
    set({ currentMode: mode, currentSongIndex: 0 });
    get().resetForNewSong();
  },

  setSelectedAnswer: (answer: VoicePart | null) => {
    set({ selectedAnswer: answer });
  },

  submitAnswer: (song: Song, mode: TrainingMode) => {
    const { selectedAnswer, userProgress } = get();
    if (!selectedAnswer) return;

    const questionData = mode === 'entry' ? song.questions.entry : song.questions.melody;
    const isCorrect = selectedAnswer === questionData.correctAnswer;

    let newScore = userProgress.score;
    let newCorrectStreak = userProgress.correctStreak;
    let newUnlockedIds = [...userProgress.unlockedHeritageIds];

    if (isCorrect) {
      newScore += 1;
      newCorrectStreak += 1;

      heritageContents.forEach(h => {
        if (
          h.unlockRequirement <= newScore &&
          !newUnlockedIds.includes(h.id)
        ) {
          newUnlockedIds.push(h.id);
        }
      });
    } else {
      newCorrectStreak = 0;
    }

    const newProgress: UserProgress = {
      ...userProgress,
      score: newScore,
      totalAnswered: userProgress.totalAnswered + 1,
      correctStreak: newCorrectStreak,
      unlockedHeritageIds: newUnlockedIds,
    };

    const feedback: AnswerFeedback = {
      isCorrect,
      correctAnswer: questionData.correctAnswer,
      userAnswer: selectedAnswer,
      songTitle: song.title,
      lyrics: song.lyrics,
      explanation: mode === 'entry'
        ? `高音部在第${song.questions.entry.highEntryTime}秒进入，低音部在第${song.questions.entry.lowEntryTime}秒进入`
        : song.questions.melody.description,
    };

    set({
      userProgress: newProgress,
      isAnswered: true,
      showFeedback: true,
      feedbackData: feedback,
    });

    saveProgress(newProgress);
  },

  nextSong: () => {
    const { currentSongIndex, getAvailableSongs } = get();
    const available = getAvailableSongs();
    const nextIndex = (currentSongIndex + 1) % available.length;
    set({ currentSongIndex: nextIndex });
    get().resetForNewSong();
  },

  resetForNewSong: () => {
    set({
      selectedAnswer: null,
      isAnswered: false,
      showFeedback: false,
      feedbackData: null,
      highVolume: 1,
      lowVolume: 1,
    });
  },

  setHighVolume: (volume: number) => set({ highVolume: volume }),
  setLowVolume: (volume: number) => set({ lowVolume: volume }),

  getAvailableSongs: () => {
    const { userProgress } = get();
    return songs.filter(s => s.dialect === userProgress.currentDialect);
  },

  getCurrentSong: () => {
    const { currentSongIndex, getAvailableSongs } = get();
    const available = getAvailableSongs();
    return available[currentSongIndex % available.length] || null;
  },

  resetProgress: () => {
    const defaultProgress: UserProgress = {
      score: 0,
      totalAnswered: 0,
      correctStreak: 0,
      unlockedHeritageIds: [],
      currentDialect: 'sanjiang',
    };
    set({ userProgress: defaultProgress, currentSongIndex: 0 });
    saveProgress(defaultProgress);
  },
}));
