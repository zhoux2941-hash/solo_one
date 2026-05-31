import { create } from 'zustand';
import { rgbToHex, rgbToString, clamp } from '@/utils/colorUtils';

interface ColorState {
  red: number;
  green: number;
  blue: number;
  setRed: (value: number) => void;
  setGreen: (value: number) => void;
  setBlue: (value: number) => void;
  randomize: () => void;
  getHex: () => string;
  getRgbString: () => string;
}

let rafId: number | null = null;
let pendingUpdate: Partial<Pick<ColorState, 'red' | 'green' | 'blue'>> | null = null;

function scheduleUpdate(
  set: (partial: Partial<ColorState>) => void,
  update: Partial<Pick<ColorState, 'red' | 'green' | 'blue'>>
) {
  if (!pendingUpdate) {
    pendingUpdate = { ...update };
  } else {
    Object.assign(pendingUpdate, update);
  }

  if (rafId === null) {
    rafId = requestAnimationFrame(() => {
      if (pendingUpdate) {
        set(pendingUpdate);
        pendingUpdate = null;
      }
      rafId = null;
    });
  }
}

export const useColorStore = create<ColorState>((set, get) => ({
  red: 128,
  green: 128,
  blue: 128,

  setRed: (value: number) => scheduleUpdate(set, { red: clamp(value) }),
  setGreen: (value: number) => scheduleUpdate(set, { green: clamp(value) }),
  setBlue: (value: number) => scheduleUpdate(set, { blue: clamp(value) }),

  randomize: () => {
    scheduleUpdate(set, {
      red: Math.floor(Math.random() * 256),
      green: Math.floor(Math.random() * 256),
      blue: Math.floor(Math.random() * 256),
    });
  },

  getHex: () => {
    const { red, green, blue } = get();
    return rgbToHex(red, green, blue);
  },

  getRgbString: () => {
    const { red, green, blue } = get();
    return rgbToString(red, green, blue);
  },
}));
