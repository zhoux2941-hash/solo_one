import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useNavigate } from 'react-router-dom';
import { Role, Temple, Ending, Badge } from '@/types';
import { badges } from '@/data/badges';

interface GameStoreState {
  currentRole: Role | null;
  currentTempleIndex: number;
  completedTemples: string[];
  completedTasks: string[];
  merit: number;
  unlockedBadges: string[];
  currentEnding: Ending | null;
  isRolePlaying: boolean;
  selectedTemple: Temple | null;
  selectRole: (role: Role, navigate?: ReturnType<typeof useNavigate>) => void;
  completeTemple: (templeId: string) => void;
  completeTask: (taskId: string, templeId: string) => void;
  addMerit: (amount: number) => void;
  unlockBadge: (badgeId: string) => void;
  setEnding: (ending: Ending) => void;
  resetGame: () => void;
  selectTemple: (temple: Temple | null) => void;
}

const initialState: Omit<GameStoreState, 'selectRole' | 'completeTemple' | 'completeTask' | 'addMerit' | 'unlockBadge' | 'setEnding' | 'resetGame' | 'selectTemple'> = {
  currentRole: null,
  currentTempleIndex: 0,
  completedTemples: [],
  completedTasks: [],
  merit: 0,
  unlockedBadges: [],
  currentEnding: null,
  isRolePlaying: false,
  selectedTemple: null,
};

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      selectRole: (role: Role, navigate?: ReturnType<typeof useNavigate>) => {
        set({
          currentRole: role,
          isRolePlaying: true,
          currentTempleIndex: 0,
          completedTemples: [],
          completedTasks: [],
          merit: 0,
          unlockedBadges: [],
          currentEnding: null,
        });
        if (navigate) {
          navigate('/parade');
        }
      },

      completeTemple: (templeId: string) => {
        const { completedTemples, currentTempleIndex } = get();
        if (!completedTemples.includes(templeId)) {
          set({
            completedTemples: [...completedTemples, templeId],
            currentTempleIndex: currentTempleIndex + 1,
          });
        }
      },

      completeTask: (taskId: string, templeId: string) => {
        const { completedTasks, completedTemples, currentTempleIndex } = get();
        const updates: Partial<GameStoreState> = {};
        
        if (!completedTasks.includes(taskId)) {
          updates.completedTasks = [...completedTasks, taskId];
        }
        
        if (!completedTemples.includes(templeId)) {
          updates.completedTemples = [...completedTemples, templeId];
          updates.currentTempleIndex = currentTempleIndex + 1;
        }
        
        set(updates);
      },

      addMerit: (amount: number) => {
        const { merit, unlockedBadges } = get();
        const newMerit = merit + amount;
        set({ merit: newMerit });

        const newUnlockedBadges: string[] = [...unlockedBadges];
        badges.forEach((badge: Badge) => {
          if (
            newMerit >= badge.requiredMerit &&
            !newUnlockedBadges.includes(badge.id)
          ) {
            newUnlockedBadges.push(badge.id);
          }
        });

        if (newUnlockedBadges.length !== unlockedBadges.length) {
          set({ unlockedBadges: newUnlockedBadges });
        }
      },

      unlockBadge: (badgeId: string) => {
        const { unlockedBadges } = get();
        if (!unlockedBadges.includes(badgeId)) {
          set({ unlockedBadges: [...unlockedBadges, badgeId] });
        }
      },

      setEnding: (ending: Ending) => {
        set({ currentEnding: ending });
      },

      resetGame: () => {
        set(initialState);
      },

      selectTemple: (temple: Temple | null) => {
        set({ selectedTemple: temple });
      },
    }),
    {
      name: 'game-storage',
    }
  )
);
