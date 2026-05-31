import { PetState, PetMood, LogEntry, ActionType, DECAY_RATE, DECAY_INTERVAL_HOURS, MAX_VALUE, MIN_VALUE, SAD_THRESHOLD, HAPPY_THRESHOLD, ACTION_BOOST, STORAGE_KEY, MAX_LOG_ENTRIES } from '@/types/pet';

export const clampValue = (value: number): number => {
  return Math.max(MIN_VALUE, Math.min(MAX_VALUE, value));
};

export const getInitialState = (): PetState => {
  const now = new Date().toISOString();
  return {
    type: 'cat',
    hunger: 80,
    cleanliness: 80,
    happiness: 80,
    lastFed: now,
    lastCleaned: now,
    lastPlayed: now,
    lastUpdated: now,
    createdAt: now,
    logs: [],
  };
};

export const calculateDecay = (lastUpdated: string): Partial<PetState> => {
  const now = new Date();
  const lastUpdateTime = new Date(lastUpdated);
  const hoursPassed = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60));
  
  if (hoursPassed <= 0) {
    return {};
  }
  
  const decayAmount = hoursPassed * DECAY_RATE;
  
  return {
    hunger: decayAmount,
    cleanliness: decayAmount,
    happiness: decayAmount,
  };
};

export const applyDecayToState = (state: PetState): PetState => {
  const decay = calculateDecay(state.lastUpdated);
  
  if (Object.keys(decay).length === 0) {
    return state;
  }
  
  return {
    ...state,
    hunger: clampValue(state.hunger - (decay.hunger || 0)),
    cleanliness: clampValue(state.cleanliness - (decay.cleanliness || 0)),
    happiness: clampValue(state.happiness - (decay.happiness || 0)),
    lastUpdated: new Date().toISOString(),
  };
};

export const determineMood = (state: PetState): PetMood => {
  const { hunger, cleanliness, happiness } = state;
  
  if (hunger < SAD_THRESHOLD || cleanliness < SAD_THRESHOLD || happiness < SAD_THRESHOLD) {
    return 'sad';
  }
  
  if (hunger > HAPPY_THRESHOLD && cleanliness > HAPPY_THRESHOLD && happiness > HAPPY_THRESHOLD) {
    return 'happy';
  }
  
  return 'normal';
};

export const performAction = (state: PetState, action: ActionType): PetState => {
  const now = new Date().toISOString();
  const newState = { ...state, lastUpdated: now };
  
  switch (action) {
    case 'feed':
      newState.hunger = clampValue(state.hunger + ACTION_BOOST);
      newState.lastFed = now;
      break;
    case 'clean':
      newState.cleanliness = clampValue(state.cleanliness + ACTION_BOOST);
      newState.lastCleaned = now;
      break;
    case 'play':
      newState.happiness = clampValue(state.happiness + ACTION_BOOST);
      newState.lastPlayed = now;
      break;
  }
  
  return newState;
};

export const saveToStorage = (state: PetState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save pet state to localStorage:', e);
  }
};

export const loadFromStorage = (): PetState | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as PetState;
    }
  } catch (e) {
    console.error('Failed to load pet state from localStorage:', e);
  }
  return null;
};

export const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getActionLabel = (action: ActionType): string => {
  const labels: Record<ActionType, string> = {
    feed: '喂食',
    clean: '洗澡',
    play: '玩耍',
  };
  return labels[action];
};

export const getStatLabel = (stat: 'hunger' | 'cleanliness' | 'happiness'): string => {
  const labels: Record<string, string> = {
    hunger: '饥饿值',
    cleanliness: '清洁值',
    happiness: '快乐值',
  };
  return labels[stat];
};

export const getActionIcon = (action: ActionType): string => {
  const icons: Record<ActionType, string> = {
    feed: '🍖',
    clean: '🛁',
    play: '🎾',
  };
  return icons[action];
};

export const getMoodEmoji = (mood: PetMood): string => {
  const emojis: Record<PetMood, string> = {
    happy: '😊',
    normal: '😐',
    sad: '😢',
  };
  return emojis[mood];
};

export const getMoodText = (mood: PetMood): string => {
  const texts: Record<PetMood, string> = {
    happy: '开心',
    normal: '一般',
    sad: '难过',
  };
  return texts[mood];
};

export const getActionStat = (action: ActionType): 'hunger' | 'cleanliness' | 'happiness' => {
  const stats: Record<ActionType, 'hunger' | 'cleanliness' | 'happiness'> = {
    feed: 'hunger',
    clean: 'cleanliness',
    play: 'happiness',
  };
  return stats[action];
};

export const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const createLogEntry = (
  action: ActionType,
  valueChange: number,
  mood: PetMood,
  newValue: number
): LogEntry => {
  const now = new Date().toISOString();
  const actionLabel = getActionLabel(action);
  const statLabel = getStatLabel(getActionStat(action));
  const icon = getActionIcon(action);
  
  const messages: Record<ActionType, string[]> = {
    feed: [
      `吃饱饱啦~`,
      `美味的食物！`,
      `肚子圆滚滚~`,
      `好满足呀！`,
    ],
    clean: [
      `香喷喷~`,
      `洗得干干净净！`,
      `毛发顺滑啦~`,
      `好舒服呀！`,
    ],
    play: [
      `玩得好开心！`,
      `最喜欢玩耍啦~`,
      `再来一次！`,
      `太棒啦！`,
    ],
  };
  
  const randomMessage = messages[action][Math.floor(Math.random() * messages[action].length)];
  const moodEmoji = getMoodEmoji(mood);
  const message = `${icon} ${actionLabel}，${statLabel}+${valueChange}，现在${newValue} ${moodEmoji} ${randomMessage}`;
  
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    action,
    message,
    timestamp: now,
    valueChange,
    stat: getActionStat(action),
    mood,
  };
};

export const addLogEntry = (state: PetState, log: LogEntry): PetState => {
  const newLogs = [log, ...state.logs].slice(0, MAX_LOG_ENTRIES);
  return { ...state, logs: newLogs };
};
