export interface Task {
  id: string;
  date: string;
  index: number;
  content: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DailyTasks {
  date: string;
  tasks: Task[];
}

export interface DailyStat {
  date: string;
  completed: number;
  total: number;
}

export interface WeeklyStats {
  completedCount: number;
  totalCount: number;
  percentage: number;
  dailyStats: DailyStat[];
}

export type DateRange = {
  start: string;
  end: string;
};
