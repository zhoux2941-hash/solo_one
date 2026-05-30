import { create } from 'zustand';
import type { ColorConversionResult, PantoneColor, InputMode, RGB, CMYK, Lab } from '@shared/types';
import { colorAlgorithms } from '@shared/color-algorithms';

interface ColorState {
  inputMode: InputMode;
  currentRgb: RGB;
  currentCmyk: CMYK;
  currentPantoneCode: string;
  currentHex: string;
  conversionResult: ColorConversionResult | null;
  presetColors: PantoneColor[];
  searchResults: PantoneColor[];
  selectedColors: PantoneColor[];
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  setInputMode: (mode: InputMode) => void;
  setRgb: (rgb: RGB) => void;
  setCmyk: (cmyk: CMYK) => void;
  setPantoneCode: (code: string) => void;
  setHex: (hex: string) => void;
  setConversionResult: (result: ColorConversionResult | null) => void;
  setPresetColors: (colors: PantoneColor[]) => void;
  setSearchResults: (results: PantoneColor[]) => void;
  toggleSelectedColor: (color: PantoneColor) => void;
  removeSelectedColor: (colorId: number) => void;
  clearSelectedColors: () => void;
  setSearchQuery: (query: string) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialRgb: RGB = { r: 230, g: 25, b: 45 };
const initialCmyk: CMYK = { c: 0, m: 90, y: 80, k: 10 };

export const useColorStore = create<ColorState>((set, get) => ({
  inputMode: 'rgb',
  currentRgb: initialRgb,
  currentCmyk: initialCmyk,
  currentPantoneCode: 'PANTONE 185 C',
  currentHex: '#E6192D',
  conversionResult: null,
  presetColors: [],
  searchResults: [],
  selectedColors: [],
  searchQuery: '',
  isLoading: false,
  error: null,

  setInputMode: (mode) => set({ inputMode: mode }),

  setRgb: (rgb) => {
    const hex = colorAlgorithms.rgbToHex(rgb);
    const cmyk = colorAlgorithms.rgbToCmyk(rgb);
    set({ currentRgb: rgb, currentHex: hex, currentCmyk: cmyk });
  },

  setCmyk: (cmyk) => {
    const rgb = colorAlgorithms.cmykToRgb(cmyk);
    const hex = colorAlgorithms.rgbToHex(rgb);
    set({ currentCmyk: cmyk, currentRgb: rgb, currentHex: hex });
  },

  setPantoneCode: (code) => set({ currentPantoneCode: code }),

  setHex: (hex) => {
    const rgb = colorAlgorithms.hexToRgb(hex);
    const cmyk = colorAlgorithms.rgbToCmyk(rgb);
    set({ currentHex: hex, currentRgb: rgb, currentCmyk: cmyk });
  },

  setConversionResult: (result) => set({ conversionResult: result }),

  setPresetColors: (colors) => set({ presetColors: colors }),

  setSearchResults: (results) => set({ searchResults: results }),

  toggleSelectedColor: (color) => {
    const selected = get().selectedColors;
    const exists = selected.find(c => c.id === color.id);
    if (exists) {
      set({ selectedColors: selected.filter(c => c.id !== color.id) });
    } else {
      set({ selectedColors: [...selected, color] });
    }
  },

  removeSelectedColor: (colorId) => {
    set({ selectedColors: get().selectedColors.filter(c => c.id !== colorId) });
  },

  clearSelectedColors: () => set({ selectedColors: [] }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () => set({
    inputMode: 'rgb',
    currentRgb: initialRgb,
    currentCmyk: initialCmyk,
    conversionResult: null,
    searchResults: [],
    searchQuery: '',
    error: null
  })
}));
