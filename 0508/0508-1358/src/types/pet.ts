export type PetType = 'cat' | 'dog';

export type PetMood = 'happy' | 'normal' | 'sad';

export interface LogEntry {
  id: string;
  action: ActionType;
  message: string;
  timestamp: string;
  valueChange: number;
  stat: 'hunger' | 'cleanliness' | 'happiness';
  mood: PetMood;
}

export interface PetState {
  type: PetType;
  hunger: number;
  cleanliness: number;
  happiness: number;
  lastFed: string;
  lastCleaned: string;
  lastPlayed: string;
  lastUpdated: string;
  createdAt: string;
  logs: LogEntry[];
}

export type ActionType = 'feed' | 'clean' | 'play';

export const STORAGE_KEY = 'pixel-pet-state';

export const DECAY_RATE = 5;
export const DECAY_INTERVAL_HOURS = 1;
export const ACTION_BOOST = 10;
export const MAX_VALUE = 100;
export const MIN_VALUE = 0;
export const MAX_LOG_ENTRIES = 50;
export const SAD_THRESHOLD = 30;
export const HAPPY_THRESHOLD = 80;
