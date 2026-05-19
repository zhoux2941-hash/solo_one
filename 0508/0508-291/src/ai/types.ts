export interface PlayerAction {
  id: string;
  type: 'move' | 'pickup' | 'attack' | 'talk' | 'examine' | 'use';
  timestamp: number;
  roomId: string;
  target?: string;
  description: string;
}

export interface StoryContext {
  playerName: string;
  currentRoom: string;
  visitedRooms: string[];
  inventory: string[];
  defeatedMonsters: string[];
  recentActions: PlayerAction[];
  discoveredClues: string[];
  storySeed: number;
  currentPlotPoint: number;
}

export interface GeneratedContent {
  id: string;
  type: 'room_description' | 'clue' | 'event' | 'monster_flavor' | 'item_description';
  content: string;
  roomId?: string;
  targetId?: string;
  timestamp: number;
  isRevealed: boolean;
  relevanceScore: number;
}

export interface PlotBranch {
  id: string;
  trigger: {
    type: 'room_enter' | 'item_pickup' | 'monster_defeat' | 'time_based';
    target?: string;
    condition?: (context: StoryContext) => boolean;
  };
  description: string;
  consequences: {
    roomChanges?: { [roomId: string]: Partial<any> };
    newClues?: string[];
    storyShift?: string;
  };
  isActivated: boolean;
}

export interface AIGenerationOptions {
  maxLength: number;
  temperature: number;
  topP: number;
  seed?: number;
  style: 'dark_fantasy' | 'mysterious' | 'epic' | 'humorous';
}

export interface Clue {
  id: string;
  content: string;
  hint: string;
  roomId: string;
  isDiscovered: boolean;
  discoveredAt?: number;
  leadsTo?: string;
  importance: 'low' | 'medium' | 'high';
}

export interface StoryState {
  context: StoryContext;
  generatedContent: Map<string, GeneratedContent>;
  activeBranches: string[];
  clues: Clue[];
  plotProgression: number;
  uniqueSeed: number;
}
