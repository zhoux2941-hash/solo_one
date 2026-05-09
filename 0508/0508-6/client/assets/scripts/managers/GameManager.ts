import { _decorator, Component, director, Node } from 'cc';
import {
  GameState,
  GameScene,
  MatchStatus,
  Player,
  DefenseLayout,
  TowerData,
  BattleResult,
  LeaderboardEntry,
  TOWER_CONFIGS,
  TowerType,
  INITIAL_GOLD,
  MAX_BASE_HP,
  MAX_TOWER_COUNT,
  WAVE_REWARD,
} from '../types/GameTypes';
import { NetworkManager } from '../network/NetworkManager';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
  private static _instance: GameManager | null = null;

  private gameState: GameState;

  public static get instance(): GameManager {
    if (!this._instance) {
      console.error('GameManager 尚未初始化');
    }
    return this._instance!;
  }

  onLoad() {
    if (GameManager._instance) {
      this.destroy();
      return;
    }
    GameManager._instance = this;

    this.gameState = this.createInitialState();
    this.setupNetworkListeners();
  }

  private createInitialState(): GameState {
    return {
      currentScene: 'main_menu',
      matchStatus: 'idle',
      player: null,
      opponent: null,
      roomId: null,
      myLayout: null,
      opponentLayout: null,
      gold: INITIAL_GOLD,
      baseHp: MAX_BASE_HP,
      maxBaseHp: MAX_BASE_HP,
      wave: 0,
      maxWaves: 5,
      enemyKills: 0,
    };
  }

  private setupNetworkListeners(): void {
    const nm = NetworkManager.instance;

    nm.onJoinSuccess = (playerId: string, playerName: string, leaderboard: LeaderboardEntry[]) => {
      this.gameState.player = { id: playerId, name: playerName };
      this.leaderboardCache = leaderboard;
      console.log(`玩家 ${playerName} 加入成功`);
    };

    nm.onMatchmakingStarted = (message: string) => {
      this.gameState.matchStatus = 'searching';
      console.log(message);
    };

    nm.onMatchmakingCancelled = (message: string) => {
      this.gameState.matchStatus = 'idle';
      console.log(message);
    };

    nm.onMatchFound = (roomId: string, opponent: Player, message: string) => {
      this.gameState.roomId = roomId;
      this.gameState.opponent = opponent;
      this.gameState.matchStatus = 'matched';
      this.gameState.gold = INITIAL_GOLD;
      this.gameState.baseHp = MAX_BASE_HP;
      this.gameState.wave = 0;
      this.gameState.enemyKills = 0;
      this.gameState.myLayout = { towers: [] };
      console.log(`${message}，对手: ${opponent.name}`);
    };

    nm.onBattleStart = (myLayout: DefenseLayout, opponentLayout: DefenseLayout) => {
      this.gameState.myLayout = myLayout;
      this.gameState.opponentLayout = opponentLayout;
      this.gameState.matchStatus = 'battle';
      console.log('战斗开始！');
    };

    nm.onBattleFinished = (result: BattleResult, leaderboard: LeaderboardEntry[]) => {
      this.gameState.matchStatus = 'finished';
      this.battleResultCache = result;
      this.leaderboardCache = leaderboard;
      console.log('战斗结束');
    };

    nm.onOpponentDisconnected = (message: string) => {
      console.log(message);
    };
  }

  private leaderboardCache: LeaderboardEntry[] = [];
  private battleResultCache: BattleResult | null = null;

  public getState(): GameState {
    return { ...this.gameState };
  }

  public getPlayer(): Player | null {
    return this.gameState.player;
  }

  public getOpponent(): Player | null {
    return this.gameState.opponent;
  }

  public getGold(): number {
    return this.gameState.gold;
  }

  public addGold(amount: number): void {
    this.gameState.gold += amount;
  }

  public spendGold(amount: number): boolean {
    if (this.gameState.gold >= amount) {
      this.gameState.gold -= amount;
      return true;
    }
    return false;
  }

  public getBaseHp(): number {
    return this.gameState.baseHp;
  }

  public damageBase(damage: number): void {
    this.gameState.baseHp = Math.max(0, this.gameState.baseHp - damage);
  }

  public getWave(): number {
    return this.gameState.wave;
  }

  public nextWave(): void {
    this.gameState.wave++;
    this.addGold(WAVE_REWARD);
  }

  public getEnemyKills(): number {
    return this.gameState.enemyKills;
  }

  public addKill(): void {
    this.gameState.enemyKills++;
  }

  public getMyLayout(): DefenseLayout | null {
    return this.gameState.myLayout;
  }

  public getOpponentLayout(): DefenseLayout | null {
    return this.gameState.opponentLayout;
  }

  public addTower(towerData: TowerData): boolean {
    if (!this.gameState.myLayout) {
      this.gameState.myLayout = { towers: [] };
    }

    if (this.gameState.myLayout.towers.length >= MAX_TOWER_COUNT) {
      return false;
    }

    const config = TOWER_CONFIGS[towerData.type];
    const cost = config.baseCost;

    if (!this.spendGold(cost)) {
      return false;
    }

    this.gameState.myLayout.towers.push(towerData);
    return true;
  }

  public removeTower(towerId: string): boolean {
    if (!this.gameState.myLayout) return false;

    const index = this.gameState.myLayout.towers.findIndex((t) => t.id === towerId);
    if (index === -1) return false;

    const tower = this.gameState.myLayout.towers[index];
    const config = TOWER_CONFIGS[tower.type];
    const refund = Math.floor(config.baseCost * 0.7);
    this.addGold(refund);

    this.gameState.myLayout.towers.splice(index, 1);
    return true;
  }

  public upgradeTower(towerId: string): boolean {
    if (!this.gameState.myLayout) return false;

    const tower = this.gameState.myLayout.towers.find((t) => t.id === towerId);
    if (!tower) return false;

    const config = TOWER_CONFIGS[tower.type];
    if (tower.level >= config.maxLevel) return false;

    const upgradeCost = config.upgradeCost[tower.level - 1];
    if (!this.spendGold(upgradeCost)) {
      return false;
    }

    tower.level++;
    return true;
  }

  public getLeaderboardCache(): LeaderboardEntry[] {
    return this.leaderboardCache;
  }

  public getBattleResultCache(): BattleResult | null {
    return this.battleResultCache;
  }

  public getTowerCount(): number {
    return this.gameState.myLayout?.towers.length || 0;
  }

  public canAffordTower(type: TowerType): boolean {
    return this.gameState.gold >= TOWER_CONFIGS[type].baseCost;
  }

  public canAffordUpgrade(towerId: string): boolean {
    if (!this.gameState.myLayout) return false;
    const tower = this.gameState.myLayout.towers.find((t) => t.id === towerId);
    if (!tower) return false;
    const config = TOWER_CONFIGS[tower.type];
    if (tower.level >= config.maxLevel) return false;
    const upgradeCost = config.upgradeCost[tower.level - 1];
    return this.gameState.gold >= upgradeCost;
  }

  public resetMatch(): void {
    this.gameState.matchStatus = 'idle';
    this.gameState.opponent = null;
    this.gameState.roomId = null;
    this.gameState.myLayout = null;
    this.gameState.opponentLayout = null;
    this.gameState.gold = INITIAL_GOLD;
    this.gameState.baseHp = MAX_BASE_HP;
    this.gameState.wave = 0;
    this.gameState.enemyKills = 0;
  }

  public loadScene(sceneName: string): void {
    this.gameState.currentScene = sceneName as GameScene;
    director.loadScene(sceneName);
  }
}
