import { create } from 'zustand';
import type { Task, WeeklyStats, DailyStat } from '../types';
import { dbService, createEmptyTask, updateTaskContent, toggleTaskCompleted } from '../utils/db';
import { getTodayString, addDays, getWeekRange, generateTaskId } from '../utils/dateUtils';

const STORE_DEBUG = true;
const storeLog = (message: string, data?: unknown) => {
  if (STORE_DEBUG) {
    console.log(`[TasksStore] ${message}`, data ?? '');
  }
};

interface TasksState {
  currentDate: string;
  tasks: Task[];
  weeklyStats: WeeklyStats | null;
  isLoading: boolean;
  isInitialized: boolean;
  direction: 'left' | 'right' | null;
  setDate: (date: string) => void;
  goToPrevDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;
  loadTasksByDate: (date: string) => Promise<void>;
  updateTaskContent: (index: number, content: string) => Promise<void>;
  toggleTaskComplete: (index: number) => Promise<void>;
  copyToToday: () => Promise<void>;
  loadWeeklyStats: () => Promise<void>;
}

const getOrCreateTasksForDate = async (date: string): Promise<Task[]> => {
  storeLog(`getOrCreateTasksForDate: ${date}`);

  let tasks = await dbService.getTasksByDate(date);
  storeLog(`Existing tasks for ${date}: ${tasks.length}`, tasks);

  if (tasks.length === 0) {
    storeLog(`No tasks found for ${date}, creating 3 empty tasks`);
    tasks = [0, 1, 2].map((i) => createEmptyTask(date, i));
    for (const task of tasks) {
      await dbService.saveTask(task);
    }
    storeLog(`Created and saved 3 tasks for ${date}`);
  } else if (tasks.length < 3) {
    storeLog(`Only ${tasks.length} tasks found, filling missing ones`);
    const existingIndices = new Set(tasks.map((t) => t.index));
    for (let i = 0; i < 3; i++) {
      if (!existingIndices.has(i)) {
        const newTask = createEmptyTask(date, i);
        await dbService.saveTask(newTask);
        tasks.push(newTask);
      }
    }
    tasks.sort((a, b) => a.index - b.index);
    storeLog(`Filled tasks for ${date}:`, tasks);
  }
  return tasks;
};

const calculateWeeklyStats = (allTasks: Task[], weekDates: string[]): WeeklyStats => {
  const dailyStats: DailyStat[] = weekDates.map((date) => {
    const dayTasks = allTasks.filter((t) => t.date === date);
    const completed = dayTasks.filter((t) => t.completed && t.content.trim() !== '').length;
    const total = dayTasks.filter((t) => t.content.trim() !== '').length;
    return { date, completed, total };
  });

  const completedCount = dailyStats.reduce((sum, d) => sum + d.completed, 0);
  const totalCount = dailyStats.reduce((sum, d) => sum + d.total, 0);
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    completedCount,
    totalCount,
    percentage,
    dailyStats,
  };
};

export const useTasksStore = create<TasksState>((set, get) => ({
  currentDate: getTodayString(),
  tasks: [],
  weeklyStats: null,
  isLoading: true,
  isInitialized: false,
  direction: null,

  setDate: (date: string) => {
    storeLog(`setDate: ${date}`);
    const currentDate = get().currentDate;
    const direction = date < currentDate ? 'left' : 'right';
    set({ currentDate: date, direction, isLoading: true });
    get().loadTasksByDate(date);
    get().loadWeeklyStats();
  },

  goToPrevDay: () => {
    const { currentDate } = get();
    const prevDate = addDays(currentDate, -1);
    storeLog(`goToPrevDay: ${prevDate}`);
    get().setDate(prevDate);
  },

  goToNextDay: () => {
    const { currentDate } = get();
    const nextDate = addDays(currentDate, 1);
    storeLog(`goToNextDay: ${nextDate}`);
    get().setDate(nextDate);
  },

  goToToday: () => {
    const today = getTodayString();
    storeLog(`goToToday: ${today}`);
    if (get().currentDate !== today) {
      get().setDate(today);
    }
  },

  loadTasksByDate: async (date: string) => {
    storeLog(`loadTasksByDate: ${date}`);
    try {
      const tasks = await getOrCreateTasksForDate(date);
      storeLog(`Tasks loaded for ${date}, setting to store:`, tasks);
      set({ tasks, isLoading: false });
    } catch (error) {
      storeLog('Failed to load tasks:', error);
      console.error('Failed to load tasks:', error);
      set({ isLoading: false });
    }
  },

  updateTaskContent: async (index: number, content: string) => {
    storeLog(`updateTaskContent: index=${index}, content length=${content.length}`);
    const { tasks } = get();
    const task = tasks[index];
    if (!task) {
      storeLog(`Task not found at index ${index}`);
      return;
    }

    const updatedTask = updateTaskContent(task, content);
    storeLog('Saving updated task:', updatedTask);
    await dbService.saveTask(updatedTask);

    const newTasks = [...tasks];
    newTasks[index] = updatedTask;
    set({ tasks: newTasks });
    storeLog('Task content updated in store');

    get().loadWeeklyStats();
  },

  toggleTaskComplete: async (index: number) => {
    storeLog(`toggleTaskComplete: index=${index}`);
    const { tasks } = get();
    const task = tasks[index];
    if (!task) {
      storeLog(`Task not found at index ${index}`);
      return;
    }

    const updatedTask = toggleTaskCompleted(task);
    storeLog('Saving toggled task:', { id: updatedTask.id, completed: updatedTask.completed });
    await dbService.saveTask(updatedTask);

    const newTasks = [...tasks];
    newTasks[index] = updatedTask;
    set({ tasks: newTasks });
    storeLog('Task completion toggled in store');

    get().loadWeeklyStats();
  },

  copyToToday: async () => {
    const { currentDate, tasks } = get();
    const today = getTodayString();

    if (currentDate === today) return;

    storeLog(`copyToToday: copying from ${currentDate} to ${today}`);

    const hasContent = tasks.some((t) => t.content.trim() !== '');
    if (!hasContent) {
      storeLog('No content to copy, skipping');
      return;
    }

    const todayTasks = await dbService.getTasksByDate(today);

    for (let i = 0; i < 3; i++) {
      const sourceTask = tasks[i];
      const content = sourceTask?.content ?? '';
      const now = Date.now();

      let targetTask: Task;
      if (i < todayTasks.length) {
        targetTask = {
          ...todayTasks[i],
          content,
          completed: false,
          updatedAt: now,
        };
      } else {
        targetTask = {
          id: generateTaskId(today, i),
          date: today,
          index: i,
          content,
          completed: false,
          createdAt: now,
          updatedAt: now,
        };
      }

      await dbService.saveTask(targetTask);
      storeLog(`Copied task ${i}: "${content}" to ${today}`);
    }

    get().setDate(today);
    storeLog('copyToToday: completed');
  },

  loadWeeklyStats: async () => {
    storeLog('loadWeeklyStats');
    try {
      const { currentDate } = get();
      const { start, end, dates } = getWeekRange(currentDate);
      storeLog(`Week range: ${start} to ${end}`, dates);
      const allTasks = await dbService.getTasksByDateRange(start, end);
      storeLog(`All tasks for week: ${allTasks.length}`, allTasks);
      const stats = calculateWeeklyStats(allTasks, dates);
      storeLog('Calculated weekly stats:', stats);
      set({ weeklyStats: stats });
    } catch (error) {
      storeLog('Failed to load weekly stats:', error);
      console.error('Failed to load weekly stats:', error);
    }
  },
}));

export const initializeStore = async () => {
  storeLog('initializeStore: starting...');
  try {
    await dbService.init();
    storeLog('Database initialized, now loading data...');

    const store = useTasksStore.getState();
    await store.loadTasksByDate(store.currentDate);
    await store.loadWeeklyStats();

    useTasksStore.setState({ isInitialized: true });
    storeLog('initializeStore: completed successfully');
  } catch (error) {
    storeLog('initializeStore failed:', error);
    console.error('Failed to initialize store:', error);
    throw error;
  }
};
