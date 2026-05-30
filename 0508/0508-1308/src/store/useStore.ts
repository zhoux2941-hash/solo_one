import { create } from 'zustand';
import type { Role, Character, FacePattern, ColorSymbolism } from '../../shared/types';

interface AppState {
  roles: Role[];
  characters: Character[];
  selectedRoleId: number | null;
  selectedCharacterId: number | null;
  facePattern: FacePattern | null;
  colorSymbolism: ColorSymbolism[];
  customColors: {
    main: string;
    secondary: string;
    outline: string;
    accent1: string;
    accent2: string;
  };
  loading: boolean;
  error: string | null;
  activeTab: 'info' | 'operas' | 'color-symbolism';

  setRoles: (roles: Role[]) => void;
  setCharacters: (characters: Character[]) => void;
  setSelectedRoleId: (id: number | null) => void;
  setSelectedCharacterId: (id: number | null) => void;
  setFacePattern: (pattern: FacePattern | null) => void;
  setColorSymbolism: (colors: ColorSymbolism[]) => void;
  setCustomColor: (key: keyof AppState['customColors'], value: string) => void;
  resetCustomColors: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveTab: (tab: 'info' | 'operas' | 'color-symbolism') => void;
}

const initialCustomColors = {
  main: '#C41E3A',
  secondary: '#000000',
  outline: '#1A1A1A',
  accent1: '#FFD700',
  accent2: '#8B4513',
};

export const useStore = create<AppState>((set) => ({
  roles: [],
  characters: [],
  selectedRoleId: null,
  selectedCharacterId: null,
  facePattern: null,
  colorSymbolism: [],
  customColors: initialCustomColors,
  loading: false,
  error: null,
  activeTab: 'info',

  setRoles: (roles) => set({ roles }),
  setCharacters: (characters) => set({ characters }),
  setSelectedRoleId: (id) => set({ selectedRoleId: id, selectedCharacterId: null, facePattern: null }),
  setSelectedCharacterId: (id) => set({ selectedCharacterId: id }),
  setFacePattern: (pattern) => {
    if (pattern) {
      set({
        facePattern: pattern,
        customColors: {
          main: pattern.mainColor,
          secondary: pattern.secondaryColor,
          outline: pattern.outlineColor,
          accent1: pattern.accentColor1,
          accent2: pattern.accentColor2,
        },
      });
    } else {
      set({ facePattern: null, customColors: initialCustomColors });
    }
  },
  setColorSymbolism: (colors) => set({ colorSymbolism: colors }),
  setCustomColor: (key, value) =>
    set((state) => ({
      customColors: { ...state.customColors, [key]: value },
    })),
  resetCustomColors: () =>
    set((state) => {
      if (!state.facePattern) return { customColors: initialCustomColors };
      return {
        customColors: {
          main: state.facePattern.mainColor,
          secondary: state.facePattern.secondaryColor,
          outline: state.facePattern.outlineColor,
          accent1: state.facePattern.accentColor1,
          accent2: state.facePattern.accentColor2,
        },
      };
    }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
