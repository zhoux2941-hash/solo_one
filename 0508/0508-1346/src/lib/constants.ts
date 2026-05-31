export interface CategoryConfig {
  key: string;
  label: string;
  color: string;
  icon: string;
}

export const CATEGORIES: CategoryConfig[] = [
  { key: 'dining', label: '餐饮', color: '#F97316', icon: 'UtensilsCrossed' },
  { key: 'transport', label: '交通', color: '#3B82F6', icon: 'Car' },
  { key: 'shopping', label: '购物', color: '#EC4899', icon: 'ShoppingBag' },
  { key: 'entertainment', label: '娱乐', color: '#8B5CF6', icon: 'Gamepad2' },
  { key: 'medical', label: '医疗', color: '#10B981', icon: 'HeartPulse' },
  { key: 'education', label: '教育', color: '#06B6D4', icon: 'GraduationCap' },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c])
) as Record<string, CategoryConfig>;

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  note: string;
}

export interface Budget {
  category: string;
  amount: number;
}

export function formatMoney(n: number): string {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function getMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-');
  return `${y}年${parseInt(m)}月`;
}

export function getPrevMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const prevMonth = m === 1 ? 12 : m - 1;
  const prevYear = m === 1 ? y - 1 : y;
  return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export function getExpensesForMonth(expenses: Expense[], monthKey: string): Expense[] {
  return expenses.filter((e) => e.date.startsWith(monthKey));
}

export function getCategoryTotals(expenses: Expense[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const e of expenses) {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  }
  return totals;
}
