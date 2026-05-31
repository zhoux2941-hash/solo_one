import type { Task } from '../types';
import { generateTaskId } from './dateUtils';

const DB_NAME = 'DailyThreeThingsDB';
const DB_VERSION = 1;
const STORE_NAME = 'tasks';
const DEBUG = true;

const log = (message: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[IndexedDB] ${message}`, data ?? '');
  }
};

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) {
      log('Database already initialized');
      return;
    }
    if (this.initPromise) {
      log('Database initialization in progress, waiting...');
      return this.initPromise;
    }

    log('Initializing database...');
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        log('Database open error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        log('Database initialized successfully');

        this.db.onerror = (event) => {
          log('Database error:', event);
        };

        this.db.onversionchange = () => {
          log('Database version changed, closing connection');
          this.close();
        };

        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        log('Upgrading database...');
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          log('Creating object store:', STORE_NAME);
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
          log('Object store created with date index');
        }
      };

      request.onblocked = () => {
        log('Database open blocked, please close other tabs');
        reject(new Error('Database open blocked'));
      };
    });

    return this.initPromise;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      log('Database not initialized, calling init...');
      await this.init();
    }
  }

  async saveTask(task: Task): Promise<void> {
    await this.ensureInitialized();
    log('Saving task:', { id: task.id, content: task.content, completed: task.completed });

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => {
        log('Task saved successfully (transaction complete):', task.id);
        resolve();
      };

      transaction.onerror = () => {
        log('Transaction error:', transaction.error);
        reject(transaction.error);
      };

      transaction.onabort = () => {
        log('Transaction aborted:', transaction.error);
        reject(transaction.error ?? new Error('Transaction aborted'));
      };

      const request = store.put(task);

      request.onsuccess = () => {
        log('Put request successful:', request.result);
      };

      request.onerror = () => {
        log('Put request error:', request.error);
      };
    });
  }

  async getTask(id: string): Promise<Task | undefined> {
    await this.ensureInitialized();
    log('Getting task by id:', id);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => {
        log('Get task transaction complete');
      };

      const request = store.get(id);

      request.onsuccess = () => {
        log('Get task result:', request.result);
        resolve(request.result);
      };

      request.onerror = () => {
        log('Get task error:', request.error);
        reject(request.error);
      };
    });
  }

  async getTasksByDate(date: string): Promise<Task[]> {
    await this.ensureInitialized();
    log('Getting tasks by date:', date);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('date');

      transaction.oncomplete = () => {
        log('Get tasks by date transaction complete');
      };

      const request = index.getAll(date);

      request.onsuccess = () => {
        const tasks = request.result.sort((a, b) => a.index - b.index);
        log(`Got ${tasks.length} tasks for date ${date}:`, tasks);
        resolve(tasks);
      };

      request.onerror = () => {
        log('Get tasks by date error:', request.error);
        reject(request.error);
      };
    });
  }

  async getTasksByDateRange(startDate: string, endDate: string): Promise<Task[]> {
    await this.ensureInitialized();
    log('Getting tasks by date range:', { startDate, endDate });

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('date');

      const range = IDBKeyRange.bound(startDate, endDate, false, false);
      log('Using IDBKeyRange with bounds (inclusive):', { startDate, endDate });

      transaction.oncomplete = () => {
        log('Get tasks by date range transaction complete');
      };

      const request = index.getAll(range);

      request.onsuccess = () => {
        const tasks = request.result;
        log(`Got ${tasks.length} tasks for range ${startDate} to ${endDate}:`, tasks);
        resolve(tasks);
      };

      request.onerror = () => {
        log('Get tasks by date range error:', request.error);
        reject(request.error);
      };
    });
  }

  async deleteTask(id: string): Promise<void> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const dbService = new IndexedDBService();

export const createEmptyTask = (date: string, index: number): Task => {
  const now = Date.now();
  return {
    id: generateTaskId(date, index),
    date,
    index,
    content: '',
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
};

export const updateTaskContent = (task: Task, content: string): Task => ({
  ...task,
  content,
  updatedAt: Date.now(),
});

export const toggleTaskCompleted = (task: Task): Task => ({
  ...task,
  completed: !task.completed,
  updatedAt: Date.now(),
});
