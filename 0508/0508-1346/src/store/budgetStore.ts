import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Budget } from '@/lib/constants';
import { CATEGORIES } from '@/lib/constants';

interface BudgetState {
  budgets: Budget[];
  setBudget: (category: string, amount: number) => void;
  getBudget: (category: string) => number;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      budgets: CATEGORIES.map((c) => ({ category: c.key, amount: 0 })),
      setBudget: (category, amount) =>
        set((state) => {
          const existing = state.budgets.find((b) => b.category === category);
          if (existing) {
            return {
              budgets: state.budgets.map((b) =>
                b.category === category ? { ...b, amount } : b
              ),
            };
          }
          return {
            budgets: [...state.budgets, { category, amount }],
          };
        }),
      getBudget: (category) => {
        return get().budgets.find((b) => b.category === category)?.amount || 0;
      },
    }),
    {
      name: 'budget-storage',
    }
  )
);
