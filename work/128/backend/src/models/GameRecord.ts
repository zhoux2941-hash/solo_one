import { MahjongTile } from './MahjongTile';
import { v4 as uuidv4 } from 'uuid';

export enum GameOperationType {
  START = 'start',
  DEAL = 'deal',
  DRAW = 'draw',
  DISCARD = 'discard',
  PENG = 'peng',
  GANG = 'gang',
  AN_GANG = 'an_gang',
  BU_GANG = 'bu_gang',
  HU = 'hu',
  PASS = 'pass',
  END = 'end',
}

export interface GameOperation {
  id: string;
  type: GameOperationType;
  timestamp: number;
  playerIndex: number;
  playerId: string;
  playerName: string;
  tile?: {
    type: string;
    rank: number;
    id?: string;
  };
  tiles?: Array<{
    type: string;
    rank: number;
    id?: string;
  }>;
  targetPlayerIndex?: number;
  fanType?: string;
  fanCount?: number;
  scoreChange?: number;
  metadata?: Record<string, any>;
}

export interface PlayerGameResult {
  playerId: string;
  playerName: string;
  seatIndex: number;
  isBanker: boolean;
  isWinner: boolean;
  finalScore: number;
  scoreChange: number;
  fanType?: string;
  fanCount?: number;
  handTiles?: Array<{
    type: string;
    rank: number;
  }>;
  melds?: Array<{
    type: string;
    tiles: Array<{
      type: string;
      rank: number;
    }>;
  }>;
}

export interface GameRecord {
  id: string;
  roomId: string;
  roomName: string;
  roundNumber: number;
  startTime: number;
  endTime: number;
  duration: number;
  
  players: PlayerGameResult[];
  winnerPlayerId: string | null;
  isDraw: boolean;
  
  operations: GameOperation[];
  
  initialState?: {
    deck: Array<{
      type: string;
      rank: number;
      id: string;
    }>;
    playerHands: Record<number, Array<{
      type: string;
      rank: number;
      id: string;
    }>>;
    bankerIndex: number;
  };
  
  finalState?: {
    playerScores: Record<string, number>;
    remainingTiles: number;
  };
}

export class GameRecordBuilder {
  private record: GameRecord;
  private operationIndex: number;

  constructor(roomId: string, roomName: string, roundNumber: number = 1) {
    this.record = {
      id: uuidv4().replace(/-/g, '').slice(0, 16),
      roomId: roomId,
      roomName: roomName,
      roundNumber: roundNumber,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      players: [],
      winnerPlayerId: null,
      isDraw: false,
      operations: [],
    };
    this.operationIndex = 0;
  }

  getId(): string {
    return this.record.id;
  }

  addPlayer(
    playerId: string,
    playerName: string,
    seatIndex: number,
    isBanker: boolean
  ): void {
    this.record.players.push({
      playerId,
      playerName,
      seatIndex,
      isBanker,
      isWinner: false,
      finalScore: 0,
      scoreChange: 0,
    });
  }

  setInitialState(
    deck: MahjongTile[],
    playerHands: Map<number, MahjongTile[]>,
    bankerIndex: number
  ): void {
    this.record.initialState = {
      deck: deck.map(t => ({ type: t.type, rank: t.rank, id: t.id })),
      playerHands: {},
      bankerIndex,
    };

    for (const [seatIndex, tiles] of playerHands.entries()) {
      this.record.initialState.playerHands[seatIndex] = tiles.map(t => ({
        type: t.type,
        rank: t.rank,
        id: t.id,
      }));
    }
  }

  private addOperation(operation: Omit<GameOperation, 'id' | 'timestamp'>): GameOperation {
    const op: GameOperation = {
      ...operation,
      id: `${this.record.id}_${this.operationIndex++}`,
      timestamp: Date.now(),
    };
    this.record.operations.push(op);
    return op;
  }

  recordStart(bankerIndex: number): void {
    this.addOperation({
      type: GameOperationType.START,
      playerIndex: bankerIndex,
      playerId: '',
      playerName: '',
      metadata: { bankerIndex },
    });
  }

  recordDeal(playerIndex: number, playerId: string, playerName: string, tileCount: number): void {
    this.addOperation({
      type: GameOperationType.DEAL,
      playerIndex,
      playerId,
      playerName,
      metadata: { tileCount },
    });
  }

  recordDraw(
    playerIndex: number,
    playerId: string,
    playerName: string,
    tile: MahjongTile,
    isSupplement: boolean = false
  ): void {
    this.addOperation({
      type: GameOperationType.DRAW,
      playerIndex,
      playerId,
      playerName,
      tile: { type: tile.type, rank: tile.rank, id: tile.id },
      metadata: { isSupplement },
    });
  }

  recordDiscard(
    playerIndex: number,
    playerId: string,
    playerName: string,
    tile: MahjongTile
  ): void {
    this.addOperation({
      type: GameOperationType.DISCARD,
      playerIndex,
      playerId,
      playerName,
      tile: { type: tile.type, rank: tile.rank, id: tile.id },
    });
  }

  recordPeng(
    playerIndex: number,
    playerId: string,
    playerName: string,
    tile: MahjongTile,
    fromPlayerIndex: number,
    tiles: MahjongTile[]
  ): void {
    this.addOperation({
      type: GameOperationType.PENG,
      playerIndex,
      playerId,
      playerName,
      tile: { type: tile.type, rank: tile.rank },
      tiles: tiles.map(t => ({ type: t.type, rank: t.rank })),
      targetPlayerIndex: fromPlayerIndex,
    });
  }

  recordGang(
    playerIndex: number,
    playerId: string,
    playerName: string,
    tile: MahjongTile,
    fromPlayerIndex: number,
    isAnGang: boolean = false,
    isBuGang: boolean = false
  ): void {
    let type: GameOperationType;
    if (isAnGang) {
      type = GameOperationType.AN_GANG;
    } else if (isBuGang) {
      type = GameOperationType.BU_GANG;
    } else {
      type = GameOperationType.GANG;
    }

    this.addOperation({
      type,
      playerIndex,
      playerId,
      playerName,
      tile: { type: tile.type, rank: tile.rank },
      targetPlayerIndex: fromPlayerIndex,
    });
  }

  recordHu(
    playerIndex: number,
    playerId: string,
    playerName: string,
    tile: MahjongTile,
    fromPlayerIndex: number,
    fanType: string,
    fanCount: number,
    scoreChange: number
  ): void {
    this.addOperation({
      type: GameOperationType.HU,
      playerIndex,
      playerId,
      playerName,
      tile: { type: tile.type, rank: tile.rank },
      targetPlayerIndex: fromPlayerIndex,
      fanType,
      fanCount,
      scoreChange,
    });
  }

  recordPass(
    playerIndex: number,
    playerId: string,
    playerName: string
  ): void {
    this.addOperation({
      type: GameOperationType.PASS,
      playerIndex,
      playerId,
      playerName,
    });
  }

  setWinner(
    playerId: string,
    fanType: string,
    fanCount: number,
    totalScoreChange: number
  ): void {
    this.record.winnerPlayerId = playerId;
    
    const playerResult = this.record.players.find(p => p.playerId === playerId);
    if (playerResult) {
      playerResult.isWinner = true;
      playerResult.fanType = fanType;
      playerResult.fanCount = fanCount;
      playerResult.scoreChange = totalScoreChange;
    }
  }

  setDraw(): void {
    this.record.isDraw = true;
  }

  setPlayerScores(scores: Map<string, number>): void {
    for (const [playerId, score] of scores.entries()) {
      const playerResult = this.record.players.find(p => p.playerId === playerId);
      if (playerResult) {
        playerResult.finalScore = score;
      }
    }
  }

  setFinalState(remainingTiles: number): void {
    this.record.finalState = {
      playerScores: {},
      remainingTiles,
    };

    for (const player of this.record.players) {
      this.record.finalState.playerScores[player.playerId] = player.finalScore;
    }
  }

  build(): GameRecord {
    this.record.endTime = Date.now();
    this.record.duration = this.record.endTime - this.record.startTime;
    return { ...this.record };
  }
}
