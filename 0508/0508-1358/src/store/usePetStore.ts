import { create } from 'zustand';
import { PetState, PetType, ActionType, ACTION_BOOST } from '@/types/pet';
import {
  getInitialState,
  loadFromStorage,
  saveToStorage,
  applyDecayToState,
  performAction,
  createLogEntry,
  addLogEntry,
  determineMood,
  getActionStat,
} from '@/utils/petUtils';

interface PetStore {
  pet: PetState;
  isLoaded: boolean;
  isActionLocked: boolean;
  floatingText: { text: string; id: number } | null;
  initializePet: () => void;
  performPetAction: (action: ActionType) => Promise<void>;
  switchPetType: () => Promise<void>;
  updateWithDecay: () => void;
  resetPet: () => Promise<void>;
  setFloatingText: (text: string | null) => void;
}

let floatingTextIdCounter = 0;
let actionLockPromise: Promise<void> | null = null;

const acquireLock = async (): Promise<() => void> => {
  while (actionLockPromise !== null) {
    await actionLockPromise;
  }
  
  let releaseLock: () => void;
  actionLockPromise = new Promise<void>((resolve) => {
    releaseLock = () => {
      actionLockPromise = null;
      resolve();
    };
  });
  
  return releaseLock!;
};

const LOCK_DURATION = 150;

export const usePetStore = create<PetStore>((set, get) => ({
  pet: getInitialState(),
  isLoaded: false,
  isActionLocked: false,
  floatingText: null,

  initializePet: () => {
    const stored = loadFromStorage();
    if (stored) {
      const migratedPet = {
        ...stored,
        logs: stored.logs || [],
      };
      const updatedPet = applyDecayToState(migratedPet);
      set({ pet: updatedPet, isLoaded: true });
      saveToStorage(updatedPet);
    } else {
      const initialState = getInitialState();
      set({ pet: initialState, isLoaded: true });
      saveToStorage(initialState);
    }
  },

  performPetAction: async (action: ActionType) => {
    const releaseLock = await acquireLock();
    set({ isActionLocked: true });
    
    try {
      const { pet } = get();
      const updatedPet = performAction(pet, action);
      
      const stat = getActionStat(action);
      const newValue = updatedPet[stat];
      const newMood = determineMood(updatedPet);
      const logEntry = createLogEntry(action, ACTION_BOOST, newMood, newValue);
      const petWithLog = addLogEntry(updatedPet, logEntry);
      
      set({ pet: petWithLog });
      saveToStorage(petWithLog);
      
      const texts: Record<ActionType, string> = {
        feed: '+10 🍖',
        clean: '+10 🛁',
        play: '+10 🎾',
      };
      get().setFloatingText(texts[action]);
      
      await new Promise(resolve => setTimeout(resolve, LOCK_DURATION));
    } finally {
      set({ isActionLocked: false });
      releaseLock();
    }
  },

  switchPetType: async () => {
    const releaseLock = await acquireLock();
    set({ isActionLocked: true });
    
    try {
      const { pet } = get();
      const newType: PetType = pet.type === 'cat' ? 'dog' : 'cat';
      const updatedPet = { ...pet, type: newType };
      set({ pet: updatedPet });
      saveToStorage(updatedPet);
      
      await new Promise(resolve => setTimeout(resolve, LOCK_DURATION));
    } finally {
      set({ isActionLocked: false });
      releaseLock();
    }
  },

  updateWithDecay: () => {
    const { pet, isLoaded } = get();
    if (!isLoaded) return;
    const updatedPet = applyDecayToState(pet);
    if (updatedPet !== pet) {
      set({ pet: updatedPet });
      saveToStorage(updatedPet);
    }
  },

  resetPet: async () => {
    const releaseLock = await acquireLock();
    set({ isActionLocked: true });
    
    try {
      const initialState = getInitialState();
      set({ pet: initialState });
      saveToStorage(initialState);
      
      await new Promise(resolve => setTimeout(resolve, LOCK_DURATION));
    } finally {
      set({ isActionLocked: false });
      releaseLock();
    }
  },

  setFloatingText: (text: string | null) => {
    if (text === null) {
      set({ floatingText: null });
      return;
    }
    const id = ++floatingTextIdCounter;
    set({ floatingText: { text, id } });
    setTimeout(() => {
      const current = get().floatingText;
      if (current?.id === id) {
        set({ floatingText: null });
      }
    }, 1500);
  },
}));
