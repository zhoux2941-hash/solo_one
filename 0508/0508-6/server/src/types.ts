export interface Player {
  id: string;
  socketId: string;
  name: string;
  ready: boolean;
  layout?: DefenseLayout;
}

export interface DefenseLayout {
  towers: TowerData[];
}

export interface TowerData {
  id: string;
  type: TowerType;
  level: number;
  position: { x: number; y: number };
}

export type TowerType = 'arrow' | 'fire' | 'ice' | 'cannon';

export interface TowerConfig {
  name: string;
  baseCost: number;
  upgradeCost: number[];
  maxLevel: number;
  damage: number[];
  range: number[];
  attackSpeed: number[];
  special?: 'aoe' | 'slow';
}

export interface EnemyData {
  id: string;
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  pathIndex: number;
  position: { x: number; y: number };
  slowTimer: number;
}

export type EnemyType = 'normal' | 'fast' | 'tank' | 'boss';

export interface GameRoom {
  id: string;
  players: Map<string, Player>;
  status: RoomStatus;
  createdAt: number;
}

export type RoomStatus = 'waiting' | 'ready' | 'playing' | 'finished';

export interface BattleResult {
  winnerId: string;
  player1Hp: number;
  player2Hp: number;
  player1Kills: number;
  player2Kills: number;
}

export interface GameState {
  players: Map<string, Player>;
  rooms: Map<string, GameRoom>;
  matchingQueue: Player[];
  leaderboard: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  wins: number;
  losses: number;
  rating: number;
}

export interface MatchMessage {
  type: string;
  playerId?: string;
  playerName?: string;
  roomId?: string;
  layout?: DefenseLayout;
  opponentLayout?: DefenseLayout;
  result?: BattleResult;
  leaderboard?: LeaderboardEntry[];
  message?: string;
}
