import { create } from 'zustand';
import type { GameState, Note, JudgeResult, Particle } from '@/types/game';
import { BEAT_INTERVAL, NOTE_FALL_DURATION, JUDGE_OFFSET_DEFAULT, NOTE_SPEED_DEFAULT } from '@/constants/game';

interface GameActions {
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  resetGame: () => void;
  update: (currentTime: number, judgeLineY: number, noteSpeed: number) => void;
  hit: (currentTime: number, judgeLineY: number, centerX: number) => void;
  addParticles: (x: number, y: number, color: string) => void;
  setJudgeOffset: (offset: number) => void;
  setNoteSpeed: (speed: number) => void;
}

const generateNoteId = () => Math.random().toString(36).substring(2, 9);

const generateParticleId = () => Math.random().toString(36).substring(2, 9);

const initialState: GameState = {
  isPlaying: false,
  isPaused: false,
  score: 0,
  combo: 0,
  maxCombo: 0,
  notes: [],
  particles: [],
  lastJudge: null,
  judgeTime: 0,
  startTime: 0,
  lastNoteTime: 0,
  judgeOffset: JUDGE_OFFSET_DEFAULT,
  noteSpeed: NOTE_SPEED_DEFAULT,
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  startGame: () => {
    const now = performance.now();
    set({
      ...initialState,
      isPlaying: true,
      startTime: now,
      lastNoteTime: now,
      judgeOffset: get().judgeOffset,
      noteSpeed: get().noteSpeed,
    });
  },

  pauseGame: () => {
    set({ isPaused: true });
  },

  resumeGame: () => {
    set({ isPaused: false });
  },

  resetGame: () => {
    set(initialState);
  },

  update: (currentTime: number, judgeLineY: number, noteSpeed: number) => {
    const state = get();
    if (!state.isPlaying || state.isPaused) return;

    const elapsedTime = currentTime - state.startTime;
    const notesToGenerate = Math.floor(elapsedTime / BEAT_INTERVAL);
    const currentNoteCount = Math.floor((state.lastNoteTime - state.startTime) / BEAT_INTERVAL);

    let newNotes = [...state.notes];
    let newLastNoteTime = state.lastNoteTime;

    for (let i = currentNoteCount; i < notesToGenerate; i++) {
      const targetTime = state.startTime + (i + 1) * BEAT_INTERVAL + NOTE_FALL_DURATION;
      newNotes.push({
        id: generateNoteId(),
        targetTime,
        y: -50,
        hit: false,
        missed: false,
      });
      newLastNoteTime = state.startTime + i * BEAT_INTERVAL;
    }

    newNotes = newNotes.map((note) => {
      if (note.hit || note.missed) return note;

      const timeUntilTarget = note.targetTime - currentTime;
      const y = judgeLineY - (timeUntilTarget / 1000) * noteSpeed;

      if (timeUntilTarget < -120 && !note.hit) {
        return { ...note, y, missed: true };
      }

      return { ...note, y };
    });

    const missedNotes = newNotes.filter((note) => note.missed && !note.hit);
    let newCombo = state.combo;
    let newMaxCombo = state.maxCombo;
    let newScore = state.score;
    let newLastJudge = state.lastJudge;
    let newJudgeTime = state.judgeTime;

    if (missedNotes.length > 0) {
      newCombo = 0;
      newLastJudge = 'miss';
      newJudgeTime = currentTime;
    }

    newNotes = newNotes.filter((note) => {
      if (note.hit && currentTime - note.targetTime > 500) return false;
      if (note.missed && currentTime - note.targetTime > 500) return false;
      return true;
    });

    const newParticles = state.particles
      .map((p) => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.2,
        life: p.life - 1,
      }))
      .filter((p) => p.life > 0);

    set({
      notes: newNotes,
      particles: newParticles,
      combo: newCombo,
      maxCombo: newMaxCombo,
      score: newScore,
      lastNoteTime: newLastNoteTime,
      lastJudge: newLastJudge,
      judgeTime: newJudgeTime,
    });
  },

  hit: (currentTime: number, judgeLineY: number, centerX: number) => {
    const state = get();
    if (!state.isPlaying || state.isPaused) return;

    const { perfectWindow, goodWindow } = { perfectWindow: 30, goodWindow: 80 };
    const { perfectScore, goodScore, comboMultiplierThreshold, comboMultiplier } = {
      perfectScore: 100,
      goodScore: 50,
      comboMultiplierThreshold: 10,
      comboMultiplier: 2,
    };

    const effectiveTime = currentTime - state.judgeOffset;

    const activeNotes = state.notes.filter(
      (note) => !note.hit && !note.missed && Math.abs(note.y - judgeLineY) < 100
    );

    if (activeNotes.length === 0) return;

    let closestNote: Note | null = null;
    let minDiff = Infinity;

    for (const note of activeNotes) {
      const diff = Math.abs(effectiveTime - note.targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestNote = note;
      }
    }

    if (!closestNote) return;

    let result: JudgeResult = null;
    let points = 0;
    let particleColor = '';

    if (minDiff <= perfectWindow) {
      result = 'perfect';
      points = perfectScore;
      particleColor = '#06b6d4';
    } else if (minDiff <= goodWindow) {
      result = 'good';
      points = goodScore;
      particleColor = '#8b5cf6';
    } else {
      result = 'miss';
      particleColor = '#ec4899';
    }

    const newCombo = result === 'miss' ? 0 : state.combo + 1;
    const newMaxCombo = Math.max(state.maxCombo, newCombo);
    const multiplier = newCombo >= comboMultiplierThreshold ? comboMultiplier : 1;
    const finalPoints = points * multiplier;

    const newNotes = state.notes.map((note) =>
      note.id === closestNote!.id ? { ...note, hit: true } : note
    );

    get().addParticles(centerX, judgeLineY, particleColor);

    set({
      notes: newNotes,
      score: state.score + finalPoints,
      combo: newCombo,
      maxCombo: newMaxCombo,
      lastJudge: result,
      judgeTime: currentTime,
    });
  },

  addParticles: (x: number, y: number, color: string) => {
    const particles: Particle[] = [];
    const particleCount = 12;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      particles.push({
        id: generateParticleId(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color,
        life: 30,
        maxLife: 30,
        size: 3 + Math.random() * 4,
      });
    }

    set((state) => ({
      particles: [...state.particles, ...particles],
    }));
  },

  setJudgeOffset: (offset: number) => {
    set({ judgeOffset: offset });
  },

  setNoteSpeed: (speed: number) => {
    set({ noteSpeed: speed });
  },
}));
