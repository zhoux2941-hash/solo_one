export type DebuffType = 'poison' | 'injury' | 'hunger';

export interface Debuff {
  id: string;
  type: DebuffType;
  intensity: number;
  turnsActive: number;
  source: string;
}

export interface FoodOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  satiety: { min: number; max: number };
  healthRisk: {
    probability: number;
    damage: { min: number; max: number };
    type: 'poison' | 'injury' | 'none';
  };
  timeCost: number;
}

export interface HistoryRecord {
  round: number;
  foodId: string;
  foodName: string;
  foodIcon: string;
  satietyGain: number;
  healthChange: number;
  satietyChange: number;
  timeCost: number;
  riskEvent: string | null;
  debuffChanges: { type: DebuffType; action: 'add' | 'tick' | 'decay'; detail: string }[];
}

export type EndingType = 'rescued' | 'survived' | 'dead' | 'timeout' | null;

export interface GameState {
  round: number;
  maxRounds: number;
  satiety: number;
  health: number;
  debuffs: Debuff[];
  timeRemaining: number;
  maxTime: number;
  isGameOver: boolean;
  ending: EndingType;
  history: HistoryRecord[];
  selectedFood: string | null;
}

export interface GameAction {
  type: 'SELECT_FOOD' | 'CONFIRM_CHOICE' | 'RESTART_GAME';
  payload?: string;
}
