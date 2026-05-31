import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Expense } from '@/lib/constants';
import { generateId } from '@/lib/constants';

interface CategoryStats {
  [monthKey: string]: {
    [category: string]: number;
  };
}

interface ExpenseState {
  expenses: Expense[];
  categoryStats: CategoryStats;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  removeExpense: (id: string) => void;
  getCategoryStats: (monthKey: string) => Record<string, number>;
  getMonthTotal: (monthKey: string) => number;
  recalculateStats: () => void;
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],
      categoryStats: {},

      addExpense: (expense) =>
        set((state) => {
          const newExpense = { ...expense, id: generateId() };
          const monthKey = expense.date.substring(0, 7);
          const { categoryStats } = state;
          const monthStats = categoryStats[monthKey] || {};
          const currentTotal = monthStats[expense.category] || 0;
          const newTotal = currentTotal + expense.amount;

          return {
            expenses: [newExpense, ...state.expenses],
            categoryStats: {
              ...categoryStats,
              [monthKey]: {
                ...monthStats,
                [expense.category]: Math.round(newTotal * 100) / 100,
              },
            },
          };
        }),

      removeExpense: (id) =>
        set((state) => {
          const expense = state.expenses.find((e) => e.id === id);
          if (!expense) return state;

          const monthKey = expense.date.substring(0, 7);
          const { categoryStats } = state;
          const monthStats = categoryStats[monthKey];
          if (!monthStats) return { expenses: state.expenses.filter((e) => e.id !== id) };

          const currentTotal = monthStats[expense.category] || 0;
          const newTotal = Math.max(0, currentTotal - expense.amount);

          const newMonthStats = { ...monthStats };
          if (newTotal <= 0) {
            delete newMonthStats[expense.category];
          } else {
            newMonthStats[expense.category] = Math.round(newTotal * 100) / 100;
          }

          return {
            expenses: state.expenses.filter((e) => e.id !== id),
            categoryStats: {
              ...categoryStats,
              [monthKey]: newMonthStats,
            },
          };
        }),

      getCategoryStats: (monthKey) => {
        return get().categoryStats[monthKey] || {};
      },

      getMonthTotal: (monthKey) => {
        const monthStats = get().categoryStats[monthKey] || {};
        return Object.values(monthStats).reduce((sum, v) => sum + v, 0);
      },

      recalculateStats: () => {
        const { expenses } = get();
        const newStats: CategoryStats = {};
        for (const expense of expenses) {
          const monthKey = expense.date.substring(0, 7);
          if (!newStats[monthKey]) newStats[monthKey] = {};
          const current = newStats[monthKey][expense.category] || 0;
          newStats[monthKey][expense.category] = Math.round((current + expense.amount) * 100) / 100;
        }
        set({ categoryStats: newStats });
      },
    }),
    {
      name: 'expense-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.recalculateStats();
        }
      },
    }
  )
);
