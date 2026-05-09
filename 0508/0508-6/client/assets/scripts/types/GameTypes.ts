export interface Player {
  id: string;
  name: string;
}

export interface Position {
  x: number;
  y: number;
}

export type TowerType = 'arrow' | 'fire' | 'ice' | 'cannon';

export interface TowerConfig {
  name: string;
  icon: string;
  baseCost: number;
  upgradeCost: number[];
  maxLevel: number;
  damage: number[];
  range: number[];
  attackSpeed: number[];
  special?: 'aoe' | 'slow';
  color: string;
  description: string;
}

export interface TowerData {
  id: string;
  type: TowerType;
  level: number;
  position: Position;
}

export interface DefenseLayout {
  towers: TowerData[];
}

export type EnemyType = 'normal' | 'fast' | 'tank' | 'boss';

export type WeatherType = 'sunny' | 'rainy' | 'cloudy';

export interface WeatherConfig {
  name: string;
  icon: string;
  description: string;
  color: string;
}

export interface EnemyConfig {
  name: string;
  hp: number;
  speed: number;
  reward: number;
  color: string;
  size: number;
}

export interface EnemyData {
  id: string;
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  baseSpeed: number;
  pathIndex: number;
  position: Position;
  slowTimer: number;
  alive: boolean;
}

export type GameScene = 'main_menu' | 'matchmaking' | 'defense_setup' | 'battle' | 'result';

export type MatchStatus = 'idle' | 'searching' | 'matched' | 'battle' | 'finished';

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  wins: number;
  losses: number;
  rating: number;
}

export interface BattleResult {
  winnerId: string;
  player1Hp: number;
  player2Hp: number;
  player1Kills: number;
  player2Kills: number;
}

export interface GameState {
  currentScene: GameScene;
  matchStatus: MatchStatus;
  player: Player | null;
  opponent: Player | null;
  roomId: string | null;
  myLayout: DefenseLayout | null;
  opponentLayout: DefenseLayout | null;
  gold: number;
  baseHp: number;
  maxBaseHp: number;
  wave: number;
  maxWaves: number;
  enemyKills: number;
}

export interface ServerMessage {
  type: string;
  playerId?: string;
  playerName?: string;
  roomId?: string;
  opponent?: Player;
  layout?: DefenseLayout;
  myLayout?: DefenseLayout;
  opponentLayout?: DefenseLayout;
  result?: BattleResult;
  leaderboard?: LeaderboardEntry[];
  message?: string;
}

export const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  arrow: {
    name: '箭塔',
    icon: '🏹',
    baseCost: 15,
    upgradeCost: [20, 35, 50],
    maxLevel: 4,
    damage: [10, 18, 28, 42],
    range: [150, 165, 180, 200],
    attackSpeed: [1.2, 1.4, 1.6, 1.8],
    color: '#4CAF50',
    description: '快速单体攻击',
  },
  fire: {
    name: '火塔',
    icon: '🔥',
    baseCost: 25,
    upgradeCost: [30, 45, 60],
    maxLevel: 4,
    damage: [8, 14, 22, 32],
    range: [120, 135, 150, 170],
    attackSpeed: [0.8, 0.9, 1.0, 1.2],
    special: 'aoe',
    color: '#FF5722',
    description: '范围伤害攻击',
  },
  ice: {
    name: '冰塔',
    icon: '❄️',
    baseCost: 20,
    upgradeCost: [25, 40, 55],
    maxLevel: 4,
    damage: [6, 10, 16, 24],
    range: [130, 145, 160, 180],
    attackSpeed: [1.0, 1.1, 1.2, 1.3],
    special: 'slow',
    color: '#00BCD4',
    description: '减速敌人',
  },
  cannon: {
    name: '炮塔',
    icon: '💣',
    baseCost: 35,
    upgradeCost: [45, 60, 80],
    maxLevel: 4,
    damage: [25, 42, 65, 100],
    range: [140, 155, 170, 190],
    attackSpeed: [0.5, 0.6, 0.7, 0.8],
    color: '#9E9E9E',
    description: '高伤害单体攻击',
  },
};

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  normal: {
    name: '普通小兵',
    hp: 50,
    speed: 60,
    reward: 5,
    color: '#795548',
    size: 20,
  },
  fast: {
    name: '快速兵',
    hp: 30,
    speed: 100,
    reward: 8,
    color: '#FFEB3B',
    size: 16,
  },
  tank: {
    name: '重装兵',
    hp: 150,
    speed: 35,
    reward: 15,
    color: '#607D8B',
    size: 28,
  },
  boss: {
    name: 'BOSS',
    hp: 500,
    speed: 25,
    reward: 50,
    color: '#F44336',
    size: 36,
  },
};

export const WAVE_CONFIG = [
  [{ type: 'normal' as EnemyType, count: 5, interval: 1500 }],
  [
    { type: 'normal' as EnemyType, count: 6, interval: 1200 },
    { type: 'fast' as EnemyType, count: 3, interval: 1000 },
  ],
  [
    { type: 'normal' as EnemyType, count: 8, interval: 1000 },
    { type: 'tank' as EnemyType, count: 2, interval: 2000 },
  ],
  [
    { type: 'fast' as EnemyType, count: 8, interval: 800 },
    { type: 'normal' as EnemyType, count: 5, interval: 1000 },
  ],
  [
    { type: 'normal' as EnemyType, count: 6, interval: 800 },
    { type: 'tank' as EnemyType, count: 3, interval: 1500 },
    { type: 'boss' as EnemyType, count: 1, interval: 3000 },
  ],
];

export const PATH_POINTS: Position[] = [
  { x: -400, y: 50 },
  { x: -200, y: 50 },
  { x: -200, y: -50 },
  { x: 0, y: -50 },
  { x: 0, y: 100 },
  { x: 200, y: 100 },
  { x: 200, y: 0 },
  { x: 400, y: 0 },
];

export const INITIAL_GOLD = 100;
export const MAX_BASE_HP = 100;
export const MAX_TOWER_COUNT = 10;
export const WAVE_REWARD = 20;

export const WEATHER_CONFIGS: Record<WeatherType, WeatherConfig> = {
  sunny: {
    name: '晴天',
    icon: '☀️',
    description: '火塔伤害 +30%',
    color: '#FF9800',
  },
  rainy: {
    name: '雨天',
    icon: '🌧️',
    description: '冰塔范围 +30%',
    color: '#2196F3',
  },
  cloudy: {
    name: '阴天',
    icon: '☁️',
    description: '无特殊效果',
    color: '#9E9E9E',
  },
};

export const WEATHER_EFFECTS: Record<WeatherType, { affectedTower: TowerType; stat: 'damage' | 'range'; multiplier: number } | null> = {
  sunny: { affectedTower: 'fire', stat: 'damage', multiplier: 1.3 },
  rainy: { affectedTower: 'ice', stat: 'range', multiplier: 1.3 },
  cloudy: null,
};

export const WEATHER_TYPES: WeatherType[] = ['sunny', 'rainy', 'cloudy'];

export function getRandomWeather(): WeatherType {
  return WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)];
}
