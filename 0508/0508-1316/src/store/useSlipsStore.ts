import { create } from 'zustand';
import { BambooSlip, BambooSlipData, EdgeTexture, TextCorrection } from '../types';
import { guodianSlips } from '../data/slipsData';

interface SlipsState {
  slips: BambooSlip[];
  selectedSlipId: string | null;
  isStarted: boolean;
  slipCount: number;
  
  setSlipCount: (count: number) => void;
  startSimulation: () => void;
  setSlips: (slips: BambooSlip[]) => void;
  selectSlip: (id: string | null) => void;
  flipSlip: (id: string) => void;
  correctText: (slipId: string, field: 'modernText' | 'annotation', newText: string) => void;
  revertCorrection: (slipId: string, correctionId: string) => void;
  revertAllCorrections: (slipId: string) => void;
  reset: () => void;
}

function generateHoles(): { top: number; middle: number; bottom: number } {
  const baseOffset = Math.random() * 10 - 5;
  return {
    top: 40 + baseOffset + Math.random() * 4 - 2,
    middle: 0 + baseOffset + Math.random() * 4 - 2,
    bottom: -40 + baseOffset + Math.random() * 4 - 2
  };
}

function generateEdgeTexture(): EdgeTexture {
  const patternType = Math.floor(Math.random() * 5);
  const pointCount = 20;
  const leftEdge: number[] = [];
  const rightEdge: number[] = [];
  
  for (let i = 0; i < pointCount; i++) {
    const baseWave = Math.sin((i / pointCount) * Math.PI * 2 + patternType) * 2;
    const noise = Math.random() * 1.5 - 0.75;
    leftEdge.push(baseWave + noise);
    rightEdge.push(baseWave + noise + Math.random() * 0.5 - 0.25);
  }
  
  return {
    leftEdge,
    rightEdge,
    patternHash: `pattern-${patternType}-${Math.floor(Math.random() * 1000)}`
  };
}

function generateCompatibleTexture(sourceTexture: EdgeTexture): EdgeTexture {
  const leftEdge: number[] = [];
  const rightEdge: number[] = [];
  
  for (let i = 0; i < sourceTexture.rightEdge.length; i++) {
    leftEdge.push(sourceTexture.rightEdge[i] + (Math.random() * 0.6 - 0.3));
    rightEdge.push(sourceTexture.rightEdge[i] + Math.random() * 2 - 1);
  }
  
  return {
    leftEdge,
    rightEdge,
    patternHash: sourceTexture.patternHash.replace(/\d+$/, (match) => String(Number(match) + 1))
  };
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const useSlipsStore = create<SlipsState>((set, get) => ({
  slips: [],
  selectedSlipId: null,
  isStarted: false,
  slipCount: 8,

  setSlipCount: (count) => set({ slipCount: count }),

  startSimulation: () => {
    const { slipCount } = get();
    const selectedSlips = guodianSlips.slice(0, slipCount);
    
    let previousTexture: EdgeTexture | null = null;
    
    const bambooSlips: BambooSlip[] = selectedSlips.map((slip: BambooSlipData, index) => {
      let texture: EdgeTexture;
      
      if (previousTexture === null) {
        texture = generateEdgeTexture();
      } else {
        texture = generateCompatibleTexture(previousTexture);
      }
      previousTexture = texture;
      
      return {
        ...slip,
        currentIndex: index,
        holes: generateHoles(),
        texture,
        isFlipped: false,
        correctedModernText: null,
        correctedAnnotation: null,
        corrections: []
      };
    });
    
    const shuffled = shuffleArray(bambooSlips).map((slip, idx) => ({
      ...slip,
      currentIndex: idx
    }));
    
    set({ slips: shuffled, isStarted: true, selectedSlipId: null });
  },

  setSlips: (slips) => set({ slips }),

  selectSlip: (id) => set({ selectedSlipId: id }),

  flipSlip: (id) => set((state) => ({
    slips: state.slips.map((slip) =>
      slip.id === id ? { ...slip, isFlipped: !slip.isFlipped } : slip
    )
  })),

  correctText: (slipId, field, newText) => set((state) => ({
    slips: state.slips.map((slip) => {
      if (slip.id !== slipId) return slip;

      const originalText = field === 'modernText' ? slip.modernText : slip.annotation;
      const currentText = field === 'modernText' 
        ? (slip.correctedModernText ?? slip.modernText)
        : (slip.correctedAnnotation ?? slip.annotation);

      if (newText === currentText) return slip;

      const correction: TextCorrection = {
        id: `corr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        field,
        originalText,
        correctedText: newText,
        timestamp: Date.now()
      };

      return {
        ...slip,
        ...(field === 'modernText' 
          ? { correctedModernText: newText } 
          : { correctedAnnotation: newText }),
        corrections: [...slip.corrections, correction]
      };
    })
  })),

  revertCorrection: (slipId, correctionId) => set((state) => ({
    slips: state.slips.map((slip) => {
      if (slip.id !== slipId) return slip;
      
      const targetCorrection = slip.corrections.find(c => c.id === correctionId);
      if (!targetCorrection) return slip;

      const remainingCorrections = slip.corrections.filter(c => c.id !== correctionId);
      
      const lastModernCorrection = [...remainingCorrections]
        .reverse()
        .find(c => c.field === 'modernText');
      const lastAnnotationCorrection = [...remainingCorrections]
        .reverse()
        .find(c => c.field === 'annotation');

      return {
        ...slip,
        correctedModernText: lastModernCorrection 
          ? lastModernCorrection.correctedText 
          : null,
        correctedAnnotation: lastAnnotationCorrection 
          ? lastAnnotationCorrection.correctedText 
          : null,
        corrections: remainingCorrections
      };
    })
  })),

  revertAllCorrections: (slipId) => set((state) => ({
    slips: state.slips.map((slip) => {
      if (slip.id !== slipId) return slip;
      return {
        ...slip,
        correctedModernText: null,
        correctedAnnotation: null,
        corrections: []
      };
    })
  })),

  reset: () => set({
    slips: [],
    selectedSlipId: null,
    isStarted: false
  })
}));
