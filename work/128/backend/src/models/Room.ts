import { Player, PlayerState } from './Player';
import { MahjongTile } from './MahjongTile';
import { MahjongLogic } from '../core/MahjongLogic';
import { MAHJONG_CONFIG, GAME_STATES, ACTION_TYPES } from '../config';
import { logger } from '../utils';
import { GameRecordBuilder, GameOperationType } from './GameRecord';
import { gameRecordManager } from '../core';

export interface RoomState {
  id: string;
  name: string;
  hostId: string;
  maxPlayers: number;
  players: PlayerState[];
  gameState: string;
  currentPlayerIndex: number;
  deck: MahjongTile[];
  discardPile: MahjongTile[];
  lastDiscardedTile: MahjongTile | null;
  winningPlayer: string | null;
  round: number;
  bankerIndex: number;
}

export class Room {
  id: string;
  name: string;
  hostId: string;
  maxPlayers: number;
  players: Player[];
  gameState: typeof GAME_STATES[keyof typeof GAME_STATES];
  currentPlayerIndex: number;
  deck: MahjongTile[];
  discardPile: MahjongTile[];
  lastDiscardedTile: MahjongTile | null;
  winningPlayer: string | null;
  round: number;
  bankerIndex: number;
  actionTimeoutTimer: NodeJS.Timeout | null;
  waitingActions: Map<string, string>;
  operationLocks: Set<string>;
  gameRecordBuilder: GameRecordBuilder | null;
  lastFanType: string | null;
  lastFanCount: number;
  lastScoreChange: number;

  constructor(id: string, name: string, hostId: string) {
    this.id = id;
    this.name = name;
    this.hostId = hostId;
    this.maxPlayers = MAHJONG_CONFIG.PLAYER_COUNT;
    this.players = [];
    this.gameState = GAME_STATES.WAITING;
    this.currentPlayerIndex = 0;
    this.deck = [];
    this.discardPile = [];
    this.lastDiscardedTile = null;
    this.winningPlayer = null;
    this.round = 1;
    this.bankerIndex = 0;
    this.actionTimeoutTimer = null;
    this.waitingActions = new Map();
    this.operationLocks = new Set();
    this.gameRecordBuilder = null;
    this.lastFanType = null;
    this.lastFanCount = 0;
    this.lastScoreChange = 0;
  }

  static createFromJSON(json: any): Room {
    const room = new Room(json.id, json.name, json.hostId);
    room.maxPlayers = json.maxPlayers;
    room.players = json.players.map((p: any) => Player.createFromJSON(p));
    room.gameState = json.gameState;
    room.currentPlayerIndex = json.currentPlayerIndex;
    room.deck = json.deck.map((t: any) => MahjongTile.createFromJSON(t));
    room.discardPile = json.discardPile.map((t: any) => MahjongTile.createFromJSON(t));
    room.lastDiscardedTile = json.lastDiscardedTile 
      ? MahjongTile.createFromJSON(json.lastDiscardedTile) 
      : null;
    room.winningPlayer = json.winningPlayer;
    room.round = json.round;
    room.bankerIndex = json.bankerIndex;
    return room;
  }

  toJSON(): RoomState {
    return {
      id: this.id,
      name: this.name,
      hostId: this.hostId,
      maxPlayers: this.maxPlayers,
      players: this.players.map(p => p.toJSON()),
      gameState: this.gameState,
      currentPlayerIndex: this.currentPlayerIndex,
      deck: this.deck.map(t => t.toJSON()),
      discardPile: this.discardPile.map(t => t.toJSON()),
      lastDiscardedTile: this.lastDiscardedTile?.toJSON() || null,
      winningPlayer: this.winningPlayer,
      round: this.round,
      bankerIndex: this.bankerIndex,
    };
  }

  addPlayer(playerId: string, playerName: string): boolean {
    if (this.players.length >= this.maxPlayers) {
      return false;
    }
    if (this.players.some(p => p.id === playerId)) {
      return false;
    }
    
    const seatIndex = this.players.length;
    const isHost = playerId === this.hostId;
    const player = new Player(playerId, playerName, seatIndex, isHost);
    this.players.push(player);
    
    logger.logPlayer(this.id, playerId, 'Joined room');
    return true;
  }

  removePlayer(playerId: string): boolean {
    const index = this.players.findIndex(p => p.id === playerId);
    if (index === -1) {
      return false;
    }
    
    const removedSeat = this.players.splice(index, 1)[0];
    
    for (let i = index; i < this.players.length; i++) {
      this.players[i].seatIndex = i;
    }
    
    logger.logPlayer(this.id, playerId, 'Left room');
    
    if (removedSeat.isHost && this.players.length > 0) {
      this.hostId = this.players[0].id;
      this.players[0].isHost = true;
      logger.logGame(this.id, `New host: ${this.players[0].name}`);
    }
    
    return true;
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.find(p => p.id === playerId);
  }

  isFull(): boolean {
    return this.players.length === this.maxPlayers;
  }

  allReady(): boolean {
    return this.players.every(p => p.isReady || p.isAI);
  }

  setPlayerReady(playerId: string, ready: boolean): boolean {
    const player = this.getPlayer(playerId);
    if (!player) {
      return false;
    }
    player.isReady = ready;
    logger.logPlayer(this.id, playerId, `Set ready: ${ready}`);
    return true;
  }

  startGame(): boolean {
    if (!this.isFull() || !this.allReady()) {
      return false;
    }
    
    this.gameState = GAME_STATES.STARTING;
    logger.logGame(this.id, 'Starting new round');
    
    this.deck = MahjongLogic.shuffleDeck(MahjongLogic.createDeck());
    this.discardPile = [];
    this.lastDiscardedTile = null;
    this.winningPlayer = null;
    this.lastFanType = null;
    this.lastFanCount = 0;
    this.lastScoreChange = 0;
    
    for (const player of this.players) {
      player.handTiles = [];
      player.melds = [];
      player.discardedTiles = [];
      player.lastAction = null;
      player.lastActionTile = null;
    }
    
    this.gameRecordBuilder = new GameRecordBuilder(this.id, this.name, this.round);
    
    for (const player of this.players) {
      this.gameRecordBuilder.addPlayer(
        player.id,
        player.name,
        player.seatIndex,
        player.seatIndex === this.bankerIndex
      );
    }
    
    this.dealTiles();
    
    const initialPlayerHands = new Map<number, MahjongTile[]>();
    for (const player of this.players) {
      initialPlayerHands.set(player.seatIndex, [...player.handTiles]);
    }
    this.gameRecordBuilder.setInitialState(this.deck, initialPlayerHands, this.bankerIndex);
    this.gameRecordBuilder.recordStart(this.bankerIndex);
    
    this.currentPlayerIndex = this.bankerIndex;
    this.gameState = GAME_STATES.PLAYING;
    
    this.drawTileForCurrentPlayer();
    logger.logGame(this.id, `Game started. Current player: ${this.players[this.currentPlayerIndex].name}`);
    
    return true;
  }

  private dealTiles(): void {
    for (let i = 0; i < MAHJONG_CONFIG.INITIAL_TILES; i++) {
      for (const player of this.players) {
        const tile = this.deck.shift();
        if (tile) {
          player.addTile(tile);
          if (this.gameRecordBuilder && i === MAHJONG_CONFIG.INITIAL_TILES - 1) {
            this.gameRecordBuilder.recordDeal(
              player.seatIndex,
              player.id,
              player.name,
              MAHJONG_CONFIG.INITIAL_TILES
            );
          }
        }
      }
    }
  }

  private drawTileForCurrentPlayer(): void {
    if (this.deck.length === 0) {
      this.endRound('draw');
      return;
    }
    
    const player = this.players[this.currentPlayerIndex];
    const tile = this.deck.shift()!;
    player.addTile(tile);
    
    if (this.gameRecordBuilder) {
      this.gameRecordBuilder.recordDraw(
        player.seatIndex,
        player.id,
        player.name,
        tile,
        false
      );
    }
    
    logger.logPlayer(this.id, player.id, `Drew tile: ${tile.type}_${tile.rank}`);
    
    const anGangOptions = MahjongLogic.getAnGangOptions(player.handTiles);
    const buGangOptions = MahjongLogic.getBuGangOptions(
      player.handTiles, 
      player.melds.filter(m => m.type === 'peng')
    );
    
    if (MahjongLogic.canHu(player.handTiles.slice(0, -1), player.handTiles[player.handTiles.length - 1])) {
      this.offerActions(player, ['hu', 'discard'], tile);
    } else if (anGangOptions.length > 0 || buGangOptions.length > 0) {
      this.offerActions(player, ['gang', 'discard'], tile);
    } else {
      this.setDiscardTimeout(player);
    }
  }

  private offerActions(player: Player, actions: string[], tile: MahjongTile): void {
    this.gameState = GAME_STATES.WAITING_ACTION;
    this.waitingActions.set(player.id, JSON.stringify(actions));
    
    this.setActionTimeout(player, MAHJONG_CONFIG.ACTION_TIMEOUT, () => {
      this.handleTimeout(player);
    });
  }

  private handleTimeout(player: Player): void {
    if (this.waitingActions.delete(player.id));
    
    if (player.lastAction === 'gang' || player.lastAction === 'hu') {
      this.advanceToNextPlayer();
    } else {
      this.setDiscardTimeout(player);
    }
  }

  private setDiscardTimeout(player: Player): void {
    this.gameState = GAME_STATES.PLAYING;
    this.setActionTimeout(player, MAHJONG_CONFIG.DISCARD_TIMEOUT, () => {
      this.autoDiscard(player);
    });
  }

  private setActionTimeout(player: Player, timeout: number, callback: () => void): void {
    if (this.actionTimeoutTimer) {
      clearTimeout(this.actionTimeoutTimer);
    }
    
    this.actionTimeoutTimer = setTimeout(() => {
      logger.logPlayer(this.id, player.id, 'Action timeout');
      callback();
    }, timeout);
  }

  private autoDiscard(player: Player): void {
    if (player.handTiles.length === 0) {
      return;
    }
    
    const tileToDiscard = player.handTiles[player.handTiles.length - 1];
    this.discardTile(player.id, tileToDiscard.id);
  }

  discardTile(playerId: string, tileId: string): boolean {
    if (this.operationLocks.has(playerId)) {
      logger.logPlayer(this.id, playerId, 'Operation rejected: already processing');
      return false;
    }

    const player = this.getPlayer(playerId);
    if (!player || player.handTiles.length === 0) {
      return false;
    }
    
    this.operationLocks.add(playerId);
    
    try {
      const tile = player.removeTile(tileId);
      if (!tile) {
        return false;
      }
    
      this.lastDiscardedTile = tile;
      this.discardPile.push(tile);
      player.addDiscardedTile(tile);
      player.lastAction = ACTION_TYPES.DISCARD;
      player.lastActionTile = tile;
    
      if (this.gameRecordBuilder) {
        this.gameRecordBuilder.recordDiscard(
          player.seatIndex,
          player.id,
          player.name,
          tile
        );
      }
    
      logger.logPlayer(this.id, playerId, `Discarded: ${tile.type}_${tile.rank}`);
    
      this.waitingActions.clear();
      if (this.actionTimeoutTimer) {
        clearTimeout(this.actionTimeoutTimer);
      }
    
      this.canOthersRespond(tile);
    
      return true;
    } finally {
      this.operationLocks.delete(playerId);
    }
  }

  private canOthersRespond(tile: MahjongTile): void {
    this.waitingActions.clear();
    let hasResponders = false;
    
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      if (player.seatIndex === this.currentPlayerIndex) continue;
      
      const actions = MahjongLogic.getAvailableActions(player.handTiles, tile);
      
      if (actions.length > 0) {
        hasResponders = true;
        this.waitingActions.set(player.id, JSON.stringify(actions));
      }
    }
    
    if (hasResponders) {
      this.gameState = GAME_STATES.WAITING_ACTION;
      
      const firstResponder = this.players.find(p => this.waitingActions.has(p.id));
      if (firstResponder) {
        this.setActionTimeout(firstResponder, MAHJONG_CONFIG.ACTION_TIMEOUT, () => {
          this.handleResponseTimeout();
        });
      }
    } else {
      this.advanceToNextPlayer();
    }
  }

  private handleResponseTimeout(): void {
    for (const [playerId, actionsStr] of this.waitingActions.entries()) {
      const actions = JSON.parse(actionsStr);
      if (actions.includes('hu')) {
        this.respondAction(playerId, 'pass', null);
        return;
      }
    }
    
    this.waitingActions.clear();
    this.advanceToNextPlayer();
  }

  respondAction(playerId: string, action: string, tile: MahjongTile | null): boolean {
    if (this.operationLocks.has(playerId)) {
      logger.logPlayer(this.id, playerId, 'Action rejected: already processing');
      return false;
    }

    const player = this.getPlayer(playerId);
    if (!player) {
      return false;
    }
    
    const actionsStr = this.waitingActions.get(playerId);
    if (!actionsStr) {
      return false;
    }
    
    const availableActions = JSON.parse(actionsStr);
    if (!availableActions.includes(action) && action !== 'pass') {
      return false;
    }
    
    this.operationLocks.add(playerId);

    try {
      if (this.actionTimeoutTimer) {
        clearTimeout(this.actionTimeoutTimer);
      }
    
      logger.logPlayer(this.id, playerId, `Action: ${action}`);
    
      switch (action) {
        case 'pass':
          this.handlePass(playerId);
          break;
        case 'peng':
          this.handlePeng(player, this.lastDiscardedTile!);
          break;
        case 'gang':
          this.handleGang(player, tile || this.lastDiscardedTile!);
          break;
        case 'hu':
          this.handleHu(player, this.lastDiscardedTile!);
          break;
        default:
          return false;
      }
    
      return true;
    } finally {
      this.operationLocks.delete(playerId);
    }
  }

  private handlePass(playerId: string): void {
    const player = this.getPlayer(playerId);
    
    if (this.gameRecordBuilder && player) {
      this.gameRecordBuilder.recordPass(
        player.seatIndex,
        player.id,
        player.name
      );
    }
    
    this.waitingActions.delete(playerId);
    
    const nextResponder = this.players.find(p => this.waitingActions.has(p.id));
    if (nextResponder) {
      this.setActionTimeout(nextResponder, MAHJONG_CONFIG.ACTION_TIMEOUT, () => {
        this.handleResponseTimeout();
      });
    } else {
      this.advanceToNextPlayer();
    }
  }

  private handlePeng(player: Player, discardedTile: MahjongTile): void {
    const tiles = player.getTilesForPeng(discardedTile);
    
    if (this.gameRecordBuilder) {
      this.gameRecordBuilder.recordPeng(
        player.seatIndex,
        player.id,
        player.name,
        discardedTile,
        this.currentPlayerIndex,
        tiles
      );
    }
    
    const meld = {
      type: 'peng' as const,
      tiles: [...tiles, discardedTile],
      fromPlayer: this.currentPlayerIndex,
    };
    
    player.addMeld(meld);
    this.lastDiscardedTile = null;
    
    this.waitingActions.clear();
    this.currentPlayerIndex = player.seatIndex;
    player.lastAction = ACTION_TYPES.PENG;
    player.lastActionTile = discardedTile;
    
    this.setDiscardTimeout(player);
    logger.logGame(this.id, `${player.name} 碰了 ${discardedTile.type}_${discardedTile.rank}`);
  }

  private handleGang(player: Player, tile: MahjongTile): void {
    const isBuGang = player.melds.some(
      m => m.type === 'peng' && m.tiles.length > 0 && m.tiles[0].equals(tile)
    );
    
    const isSelfDraw = player.handTiles.filter(t => t.equals(tile)).length >= 4;
    
    if (isBuGang) {
      this.handleBuGang(player, tile);
    } else if (isSelfDraw) {
      this.handleAnGang(player, tile);
    } else {
      this.handleMingGang(player, tile);
    }
  }

  private handleMingGang(player: Player, discardedTile: MahjongTile): void {
    const tiles = player.getTilesForGang(discardedTile);
    tiles.push(discardedTile);
    
    if (this.gameRecordBuilder) {
      this.gameRecordBuilder.recordGang(
        player.seatIndex,
        player.id,
        player.name,
        discardedTile,
        this.currentPlayerIndex,
        false,
        false
      );
    }
    
    const meld = {
      type: 'gang' as const,
      tiles: tiles,
      fromPlayer: this.currentPlayerIndex,
    };
    
    player.addMeld(meld);
    this.lastDiscardedTile = null;
    this.waitingActions.clear();
    this.currentPlayerIndex = player.seatIndex;
    player.lastAction = ACTION_TYPES.GANG;
    player.lastActionTile = discardedTile;
    
    this.drawGangSupplement(player);
    logger.logGame(this.id, `${player.name} 杠了 ${discardedTile.type}_${discardedTile.rank}`);
  }

  private handleAnGang(player: Player, tile: MahjongTile): void {
    const tiles = player.getTilesForGang(tile);
    
    if (this.gameRecordBuilder) {
      this.gameRecordBuilder.recordGang(
        player.seatIndex,
        player.id,
        player.name,
        tile,
        player.seatIndex,
        true,
        false
      );
    }
    
    const meld = {
      type: 'an_gang' as const,
      tiles: tiles,
      fromPlayer: player.seatIndex,
    };
    
    player.addMeld(meld);
    this.waitingActions.clear();
    this.currentPlayerIndex = player.seatIndex;
    player.lastAction = ACTION_TYPES.AN_GANG;
    player.lastActionTile = tile;
    
    this.drawGangSupplement(player);
    logger.logGame(this.id, `${player.name} 暗杠了 ${tile.type}_${tile.rank}`);
  }

  private handleBuGang(player: Player, tile: MahjongTile): void {
    const tileToAdd = player.getTilesForBuGang(tile);
    if (!tileToAdd) return;
    
    const pengMeld = player.melds.find(
      m => m.type === 'peng' && m.tiles.length > 0 && m.tiles[0].equals(tile)
    );
    
    if (pengMeld) {
      pengMeld.type = 'bu_gang';
      pengMeld.tiles.push(tileToAdd);
    }
    
    if (this.gameRecordBuilder) {
      this.gameRecordBuilder.recordGang(
        player.seatIndex,
        player.id,
        player.name,
        tile,
        player.seatIndex,
        false,
        true
      );
    }
    
    this.waitingActions.clear();
    this.currentPlayerIndex = player.seatIndex;
    player.lastAction = ACTION_TYPES.BU_GANG;
    player.lastActionTile = tile;
    
    this.drawGangSupplement(player);
    logger.logGame(this.id, `${player.name} 补杠了 ${tile.type}_${tile.rank}`);
  }

  private drawGangSupplement(player: Player): void {
    if (this.deck.length > 0) {
      const supplementTile = this.deck.pop()!;
      player.addTile(supplementTile);
      
      if (this.gameRecordBuilder) {
        this.gameRecordBuilder.recordDraw(
          player.seatIndex,
          player.id,
          player.name,
          supplementTile,
          true
        );
      }
      
      logger.logPlayer(this.id, player.id, `Drew gang supplement: ${supplementTile.type}_${supplementTile.rank}`);
      
      if (MahjongLogic.canHu(player.handTiles.slice(0, -1), player.handTiles[player.handTiles.length - 1])) {
        this.offerActions(player, ['hu', 'discard'], player.handTiles[player.handTiles.length - 1]);
      } else {
        this.setDiscardTimeout(player);
      }
    } else {
      this.endRound('draw');
    }
  }

  private handleHu(player: Player, discardedTile: MahjongTile): void {
    player.addTile(discardedTile);
    this.winningPlayer = player.id;
    this.gameState = GAME_STATES.FINISHED;
    
    if (this.actionTimeoutTimer) {
      clearTimeout(this.actionTimeoutTimer);
    }
    this.waitingActions.clear();
    
    const fan = MahjongLogic.calculateFan(player.handTiles, player.melds, discardedTile);
    const score = fan * 10;
    
    this.lastFanType = this.determineFanType(player, fan);
    this.lastFanCount = fan;
    this.lastScoreChange = score;
    
    if (this.gameRecordBuilder) {
      this.gameRecordBuilder.recordHu(
        player.seatIndex,
        player.id,
        player.name,
        discardedTile,
        this.currentPlayerIndex,
        this.lastFanType,
        fan,
        score
      );
    }
    
    for (const other of this.players) {
      if (other.id !== player.id) {
        other.score -= score;
        player.score += score;
      }
    }
    
    if (this.gameRecordBuilder) {
      this.gameRecordBuilder.setWinner(
        player.id,
        this.lastFanType,
        fan,
        score
      );
      
      const scores = new Map<string, number>();
      for (const p of this.players) {
        scores.set(p.id, p.score);
      }
      this.gameRecordBuilder.setPlayerScores(scores);
      this.gameRecordBuilder.setFinalState(this.deck.length);
    }
    
    logger.logGame(this.id, `${player.name} 胡牌了! 番数: ${fan}, 得分: ${score}`);
    
    this.saveGameRecord();
  }

  private determineFanType(player: Player, fanCount: number): string {
    const handTiles = player.handTiles;
    
    const allSameType = handTiles.every(t => t.type === handTiles[0].type);
    if (allSameType && fanCount >= 3) {
      return '清一色';
    }
    
    if (fanCount >= 2) {
      const tileCount: Record<string, number> = {};
      for (const tile of handTiles) {
        const key = `${tile.type}_${tile.rank}`;
        tileCount[key] = (tileCount[key] || 0) + 1;
      }
      
      let pairCount = 0;
      let tripletCount = 0;
      for (const key in tileCount) {
        if (tileCount[key] >= 2) pairCount++;
        if (tileCount[key] >= 3) tripletCount++;
      }
      
      if (pairCount === 7) {
        return '七对';
      }
      if (tripletCount >= 4) {
        return '对对胡';
      }
    }
    
    const gangCount = player.melds.filter(m => 
      m.type === 'gang' || m.type === 'an_gang' || m.type === 'bu_gang'
    ).length;
    
    if (gangCount > 0) {
      return `杠x${gangCount}`;
    }
    
    return '平胡';
  }

  private advanceToNextPlayer(): void {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.gameState = GAME_STATES.PLAYING;
    
    this.drawTileForCurrentPlayer();
  }

  private endRound(result: 'draw' | 'hu'): void {
    this.gameState = GAME_STATES.FINISHED;
    
    if (this.actionTimeoutTimer) {
      clearTimeout(this.actionTimeoutTimer);
    }
    this.waitingActions.clear();
    
    if (result === 'draw' && this.gameRecordBuilder) {
      this.gameRecordBuilder.setDraw();
      
      const scores = new Map<string, number>();
      for (const p of this.players) {
        scores.set(p.id, p.score);
      }
      this.gameRecordBuilder.setPlayerScores(scores);
      this.gameRecordBuilder.setFinalState(this.deck.length);
      
      this.saveGameRecord();
    }
    
    logger.logGame(this.id, `Round ended: ${result}`);
  }

  private async saveGameRecord(): Promise<void> {
    if (!this.gameRecordBuilder) return;
    
    const record = this.gameRecordBuilder.build();
    
    try {
      await gameRecordManager.saveRecord(record);
      logger.logGame(this.id, `Game record saved: ${record.id}`);
    } catch (error) {
      logger.error(`Failed to save game record:`, error);
    }
  }

  nextRound(): boolean {
    if (this.gameState !== GAME_STATES.FINISHED) {
      return false;
    }
    
    this.round++;
    
    if (this.winningPlayer) {
      const winner = this.getPlayer(this.winningPlayer);
      if (winner) {
        this.bankerIndex = winner.seatIndex;
      }
    }
    
    for (const player of this.players) {
      player.isReady = false;
    }
    
    this.gameState = GAME_STATES.WAITING;
    logger.logGame(this.id, `Starting round ${this.round}`);
    
    return true;
  }

  validateDiscard(playerId: string, tileId: string): boolean {
    const player = this.getPlayer(playerId);
    if (!player) {
      return false;
    }
    
    if (player.seatIndex !== this.currentPlayerIndex) {
      return false;
    }
    
    if (this.gameState !== GAME_STATES.PLAYING) {
      return false;
    }
    
    return player.handTiles.some(t => t.id === tileId);
  }

  validateAction(playerId: string, action: string): boolean {
    const actionsStr = this.waitingActions.get(playerId);
    if (!actionsStr) {
      return false;
    }
    
    const availableActions = JSON.parse(actionsStr);
    return availableActions.includes(action) || action === 'pass';
  }

  getPublicState(): any {
    const state = this.toJSON();
    
    return {
      ...state,
      deck: state.deck.length,
      players: state.players.map(p => ({
        ...p,
        handTiles: p.handTiles.length,
      })),
    };
  }

  getPlayerView(playerId: string): any {
    const player = this.getPlayer(playerId);
    if (!player) {
      return null;
    }
    
    return {
      room: this.getPublicState(),
      myHand: player.toJSON().handTiles,
      myMelds: player.toJSON().melds,
      myDiscardedTiles: player.toJSON().discardedTiles,
      availableActions: this.waitingActions.get(playerId) ? JSON.parse(this.waitingActions.get(playerId)!) : [],
      isMyTurn: player.seatIndex === this.currentPlayerIndex && this.gameState === GAME_STATES.PLAYING,
    };
  }
}
