export interface Role {
  id: string;
  name: string;
  gender: 'male' | 'female';
  pronoun: string;
  honorific: string;
  description: string;
  skill: string;
  avatar: string;
  color: string;
}

export interface Temple {
  id: string;
  name: string;
  location: string;
  ritualType: string;
  description: string;
  culturalIntro: string;
  offerings: string[];
  taboos: string[];
  order: number;
  position: {
    x: number;
    y: number;
  };
}

export type InteractionType = 'click' | 'hold' | 'sequence' | 'rhythm';

export interface Task {
  id: string;
  roleId: string;
  templeId: string;
  title: string;
  description: string;
  dialogue: string;
  interactionType: '祭祀' | '对歌' | '打跳' | '讲述' | '祈福';
  meritReward: number;
  difficulty: '简单' | '中等' | '困难';
}

export interface TaskInteractionConfig {
  type: InteractionType;
  targetCount: number;
  timeLimit: number;
  sequence?: string[];
  rhythmPattern?: number[];
  holdDuration?: number;
}

export interface TaskInteractionResult {
  success: boolean;
  score: number;
  meritEarned: number;
  timeTaken: number;
  combo: number;
  accuracy: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredMerit: number;
  unlocked: boolean;
}

export interface Ending {
  id: string;
  type: 'perfect' | 'regret' | 'accident';
  title: string;
  description: string;
  poem: string;
  minMerit: number;
  maxMerit: number;
  requireAllTasksCompleted?: boolean;
}

export interface GameState {
  currentRole: Role | null;
  currentTempleId: string;
  completedTasks: string[];
  merit: number;
  unlockedBadges: string[];
  gamePhase: 'selection' | 'playing' | 'ended';
  currentEnding: Ending | null;
}
