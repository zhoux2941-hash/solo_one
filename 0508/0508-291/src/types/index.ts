export interface Player {
  id: string;
  name: string;
  roomId: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  inventory: Item[];
  isOnline: boolean;
  lastSeen: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'potion' | 'misc';
  effect?: {
    stat?: 'hp' | 'attack' | 'defense';
    value: number;
  };
}

export interface Room {
  id: string;
  name: string;
  description: string;
  exits: { [direction: string]: string };
  items: string[];
  monsters: string[];
  maxPlayers: number;
  currentPlayers: string[];
}

export interface Monster {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  roomId: string;
}

export interface CombatState {
  playerId: string;
  monsterId: string;
  turn: 'player' | 'monster';
  log: string[];
  isActive: boolean;
}

export interface Message {
  type: 'chat' | 'system' | 'combat' | 'state';
  sender: string;
  content: string;
  timestamp: number;
}

export interface PeerNode {
  id: string;
  connection?: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
  isConnected: boolean;
  isRelay: boolean;
  lastPing: number;
}

export interface CRDTOperation {
  type: 'set' | 'delete' | 'add' | 'remove';
  key: string;
  value?: any;
  vectorClock: { [nodeId: string]: number };
  nodeId: string;
  timestamp: number;
}

export interface DHTEntry {
  key: string;
  value: any;
  replicas: string[];
  timestamp: number;
}

export interface GameState {
  players: { [id: string]: Player };
  rooms: { [id: string]: Room };
  monsters: { [id: string]: Monster };
  combats: { [id: string]: CombatState };
  messages: Message[];
  currentPlayerId: string;
}
