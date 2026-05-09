import { _decorator, Component, Node } from 'cc';
import {
  ServerMessage,
  DefenseLayout,
  BattleResult,
  LeaderboardEntry,
  Player,
} from '../types/GameTypes';

const { ccclass, property } = _decorator;

@ccclass('NetworkManager')
export class NetworkManager extends Component {
  private static _instance: NetworkManager | null = null;

  private socket: any = null;
  private isConnected: boolean = false;

  public static get instance(): NetworkManager {
    if (!this._instance) {
      console.error('NetworkManager 尚未初始化');
    }
    return this._instance!;
  }

  public onConnect: (() => void) | null = null;
  public onDisconnect: (() => void) | null = null;
  public onJoinSuccess: ((playerId: string, playerName: string, leaderboard: LeaderboardEntry[]) => void) | null = null;
  public onMatchmakingStarted: ((message: string) => void) | null = null;
  public onMatchmakingCancelled: ((message: string) => void) | null = null;
  public onMatchFound: ((roomId: string, opponent: Player, message: string) => void) | null = null;
  public onLayoutSubmitted: ((message: string) => void) | null = null;
  public onBattleStart: ((myLayout: DefenseLayout, opponentLayout: DefenseLayout) => void) | null = null;
  public onBattleFinished: ((result: BattleResult, leaderboard: LeaderboardEntry[]) => void) | null = null;
  public onLeaderboardUpdate: ((leaderboard: LeaderboardEntry[]) => void) | null = null;
  public onOpponentDisconnected: ((message: string) => void) | null = null;

  onLoad() {
    if (NetworkManager._instance) {
      this.destroy();
      return;
    }
    NetworkManager._instance = this;
  }

  public connect(serverUrl: string = 'http://localhost:3000'): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const ioModule = require('socket.io-client');
        this.socket = ioModule.io(serverUrl, {
          transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
          console.log('已连接到服务器');
          this.isConnected = true;
          if (this.onConnect) this.onConnect();
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('与服务器断开连接');
          this.isConnected = false;
          if (this.onDisconnect) this.onDisconnect();
        });

        this.socket.on('connect_error', (error: any) => {
          console.error('连接错误:', error);
          reject(error);
        });

        this.setupEventListeners();
      } catch (error) {
        console.error('初始化 Socket.IO 失败:', error);
        reject(error);
      }
    });
  }

  private setupEventListeners(): void {
    this.socket.on('join_success', (data: ServerMessage) => {
      console.log('加入成功:', data);
      if (this.onJoinSuccess && data.playerId) {
        this.onJoinSuccess(
          data.playerId,
          data.playerName || '',
          data.leaderboard || []
        );
      }
    });

    this.socket.on('matchmaking_started', (data: ServerMessage) => {
      console.log('匹配开始:', data.message);
      if (this.onMatchmakingStarted) {
        this.onMatchmakingStarted(data.message || '');
      }
    });

    this.socket.on('matchmaking_cancelled', (data: ServerMessage) => {
      console.log('匹配取消:', data.message);
      if (this.onMatchmakingCancelled) {
        this.onMatchmakingCancelled(data.message || '');
      }
    });

    this.socket.on('match_found', (data: ServerMessage) => {
      console.log('找到对手:', data);
      if (this.onMatchFound && data.roomId && data.opponent) {
        this.onMatchFound(
          data.roomId,
          data.opponent,
          data.message || ''
        );
      }
    });

    this.socket.on('layout_submitted', (data: ServerMessage) => {
      console.log('阵型提交:', data.message);
      if (this.onLayoutSubmitted) {
        this.onLayoutSubmitted(data.message || '');
      }
    });

    this.socket.on('battle_start', (data: ServerMessage) => {
      console.log('战斗开始');
      if (this.onBattleStart && data.myLayout && data.opponentLayout) {
        this.onBattleStart(data.myLayout, data.opponentLayout);
      }
    });

    this.socket.on('battle_finished', (data: ServerMessage) => {
      console.log('战斗结束');
      if (this.onBattleFinished && data.result && data.leaderboard) {
        this.onBattleFinished(data.result, data.leaderboard);
      }
    });

    this.socket.on('leaderboard_update', (data: ServerMessage) => {
      console.log('排行榜更新');
      if (this.onLeaderboardUpdate && data.leaderboard) {
        this.onLeaderboardUpdate(data.leaderboard);
      }
    });

    this.socket.on('opponent_disconnected', (data: ServerMessage) => {
      console.log('对手断开:', data.message);
      if (this.onOpponentDisconnected) {
        this.onOpponentDisconnected(data.message || '');
      }
    });
  }

  public join(playerName: string): void {
    if (!this.socket || !this.isConnected) {
      console.error('Socket 未连接');
      return;
    }
    this.socket.emit('join', { playerName });
  }

  public startMatchmaking(playerId: string): void {
    if (!this.socket || !this.isConnected) {
      console.error('Socket 未连接');
      return;
    }
    this.socket.emit('start_matchmaking', { playerId });
  }

  public cancelMatchmaking(playerId: string): void {
    if (!this.socket || !this.isConnected) {
      console.error('Socket 未连接');
      return;
    }
    this.socket.emit('cancel_matchmaking', { playerId });
  }

  public submitLayout(playerId: string, layout: DefenseLayout): void {
    if (!this.socket || !this.isConnected) {
      console.error('Socket 未连接');
      return;
    }
    this.socket.emit('submit_layout', { playerId, layout });
  }

  public submitBattleResult(playerId: string, result: BattleResult): void {
    if (!this.socket || !this.isConnected) {
      console.error('Socket 未连接');
      return;
    }
    this.socket.emit('submit_battle_result', { playerId, result });
  }

  public getLeaderboard(): void {
    if (!this.socket || !this.isConnected) {
      console.error('Socket 未连接');
      return;
    }
    this.socket.emit('get_leaderboard');
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}
