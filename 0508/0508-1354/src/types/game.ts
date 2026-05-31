export interface Resources {
  enemyTroops: number;
  enemyDistance: number;
  ownTroops: number;
  provisions: number;
  wallDurability: number;
  morale: number;
}

export interface General {
  id: string;
  name: string;
  title: string;
  icon: string;
  loyalty: number;
  trait: string;
  traitDescription: string;
  isDefected: boolean;
}

export interface DecisionOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  strategyPower: number;
  effects: {
    success: Partial<Resources>;
    draw: Partial<Resources>;
    failure: Partial<Resources>;
  };
  loyaltyEffects: Record<string, number>;
}

export interface BattleResult {
  decision: DecisionOption;
  outcome: 'victory' | 'defeat' | 'draw';
  message: string;
  resourceChanges: Partial<Resources>;
  loyaltyChanges: Record<string, number>;
  defectedGeneral: General | null;
}

export interface GameLog {
  round: number;
  timestamp: number;
  result: BattleResult;
}

export type FinalOutcome = 'greatVictory' | 'victory' | 'defeat' | null;

export interface GameState {
  currentRound: number;
  maxRounds: number;
  resources: Resources;
  generals: General[];
  currentOptions: DecisionOption[];
  battleLogs: GameLog[];
  gameStatus: 'playing' | 'ended';
  finalOutcome: FinalOutcome;
}
