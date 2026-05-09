import { _decorator, Component, Node, Label, Button, Color, Graphics, UITransform, ProgressBar, Vec3, Prefab, instantiate } from 'cc';
import { GameManager } from '../managers/GameManager';
import { NetworkManager } from '../network/NetworkManager';
import { BattleEngine } from '../game/BattleEngine';
import {
  BattleResult,
  WeatherType,
  WEATHER_CONFIGS,
  MAX_BASE_HP,
  WAVE_CONFIG,
  PATH_POINTS,
  ENEMY_CONFIGS,
  DefenseLayout,
} from '../types/GameTypes';

const { ccclass, property } = _decorator;

@ccclass('BattleScene')
export class BattleScene extends Component {
  @property(Prefab)
  towerPrefab: Prefab | null = null;

  @property(Prefab)
  enemyPrefab: Prefab | null = null;

  @property(Node)
  gameBoard: Node | null = null;

  @property(Node)
  towersContainer: Node | null = null;

  @property(Node)
  enemiesContainer: Node | null = null;

  @property(Node)
  effectsContainer: Node | null = null;

  @property(Node)
  pathDisplay: Node | null = null;

  @property(Label)
  goldLabel: Label | null = null;

  @property(Label)
  waveLabel: Label | null = null;

  @property(Label)
  killsLabel: Label | null = null;

  @property(ProgressBar)
  hpBar: ProgressBar | null = null;

  @property(Label)
  hpLabel: Label | null = null;

  @property(Label)
  statusLabel: Label | null = null;

  @property(Label)
  opponentNameLabel: Label | null = null;

  @property(Label)
  weatherLabel: Label | null = null;

  @property(Node)
  battleCompletePanel: Node | null = null;

  @property(Label)
  resultLabel: Label | null = null;

  private battleEngine: BattleEngine | null = null;
  private isBattling: boolean = false;
  private simulatedBaseHp: number = MAX_BASE_HP;

  onLoad() {
    const gm = GameManager.instance;
    const myLayout = gm.getMyLayout();

    if (!myLayout) {
      console.error('防御阵型数据丢失！');
      this.showStatus('游戏数据错误，返回主菜单');
      setTimeout(() => {
        gm.loadScene('MainMenuScene');
      }, 2000);
      return;
    }

    this.updateOpponentInfo();
    this.drawPath();
    this.initBattleEngine(myLayout);
  }

  private updateOpponentInfo(): void {
    const gm = GameManager.instance;
    const opponent = gm.getOpponent();

    if (this.opponentNameLabel && opponent) {
      this.opponentNameLabel.string = `对手: ${opponent.name}`;
    }

    this.updateUI();
  }

  private drawPath(): void {
    if (!this.pathDisplay) return;

    const graphics = this.pathDisplay.getComponent(Graphics);
    if (graphics) {
      graphics.clear();
      graphics.strokeColor = new Color(100, 100, 100, 255);
      graphics.lineWidth = 4;
      graphics.moveTo(PATH_POINTS[0].x, PATH_POINTS[0].y);

      for (let i = 1; i < PATH_POINTS.length; i++) {
        graphics.lineTo(PATH_POINTS[i].x, PATH_POINTS[i].y);
      }
      graphics.stroke();

      graphics.fillColor = new Color(255, 50, 50, 200);
      for (const point of PATH_POINTS) {
        graphics.circle(point.x, point.y, 6);
        graphics.fill();
      }

      graphics.fillColor = new Color(50, 255, 50, 200);
      const lastPoint = PATH_POINTS[PATH_POINTS.length - 1];
      graphics.circle(lastPoint.x, lastPoint.y, 20);
      graphics.fill();
    }
  }

  private initBattleEngine(myLayout: DefenseLayout): void {
    if (!this.towerPrefab || !this.enemyPrefab) return;

    const engineNode = new Node('BattleEngine');
    this.node.addChild(engineNode);

    this.battleEngine = engineNode.addComponent(BattleEngine);

    if (this.towersContainer) {
      this.battleEngine.towersContainer = this.towersContainer;
    }
    if (this.enemiesContainer) {
      this.battleEngine.enemiesContainer = this.enemiesContainer;
    }
    if (this.effectsContainer) {
      this.battleEngine.effectsContainer = this.effectsContainer;
    }

    this.battleEngine.towerPrefab = this.towerPrefab;
    this.battleEngine.enemyPrefab = this.enemyPrefab;

    this.battleEngine.onWaveComplete = this.handleWaveComplete.bind(this);
    this.battleEngine.onEnemyReachBase = this.handleEnemyReachBase.bind(this);
    this.battleEngine.onEnemyDeath = this.handleEnemyDeath.bind(this);
    this.battleEngine.onAllWavesComplete = this.handleAllWavesComplete.bind(this);

    this.battleEngine.init(myLayout);

    this.updateWeatherDisplay();

    setTimeout(() => {
      this.startBattle();
    }, 1500);
  }

  private updateWeatherDisplay(): void {
    if (!this.battleEngine || !this.weatherLabel) return;

    const weather = this.battleEngine.getWeather();
    const config = WEATHER_CONFIGS[weather];

    this.weatherLabel.string = `${config.icon} ${config.name} - ${config.description}`;

    const color = new Color().fromHEX(config.color);
    this.weatherLabel.color = color;

    console.log(`天气: ${config.name}, 效果: ${config.description}`);
  }

  private startBattle(): void {
    if (!this.battleEngine) return;

    this.isBattling = true;
    this.simulatedBaseHp = MAX_BASE_HP;
    this.showStatus('战斗开始！');
    this.battleEngine.startBattle();
  }

  private handleWaveComplete(wave: number): void {
    const gm = GameManager.instance;
    gm.nextWave();
    this.showStatus(`第 ${wave} 波防守成功！获得 20 金币`);
    this.updateUI();
  }

  private handleEnemyReachBase(): void {
    const gm = GameManager.instance;
    gm.damageBase(10);
    this.simulatedBaseHp = gm.getBaseHp();

    this.showStatus('基地受到攻击！-10 HP');
    this.updateUI();

    if (gm.getBaseHp() <= 0) {
      this.endBattle(false);
    }
  }

  private handleEnemyDeath(reward: number): void {
    const gm = GameManager.instance;
    gm.addGold(reward);
    gm.addKill();
    this.updateUI();
  }

  private handleAllWavesComplete(): void {
    this.endBattle(true);
  }

  private endBattle(allWavesCleared: boolean): void {
    if (!this.isBattling) return;

    this.isBattling = false;

    const gm = GameManager.instance;
    const myHp = gm.getBaseHp();
    const myKills = gm.getEnemyKills();

    const simulatedOpponentHp = this.simulateOpponentBattle();
    const simulatedOpponentKills = Math.floor(myKills * 0.8);

    let winnerId: string;
    const player = gm.getPlayer();
    const opponent = gm.getOpponent();

    if (myHp > simulatedOpponentHp) {
      winnerId = player?.id || '';
    } else if (myHp < simulatedOpponentHp) {
      winnerId = opponent?.id || '';
    } else {
      winnerId = myKills >= simulatedOpponentKills ? (player?.id || '') : (opponent?.id || '');
    }

    const result: BattleResult = {
      winnerId: winnerId,
      player1Hp: myHp,
      player2Hp: simulatedOpponentHp,
      player1Kills: myKills,
      player2Kills: simulatedOpponentKills,
    };

    this.showBattleResult(result);

    const nm = NetworkManager.instance;
    if (player) {
      nm.submitBattleResult(player.id, result);
    }
  }

  private simulateOpponentBattle(): number {
    const gm = GameManager.instance;
    const opponentLayout = gm.getOpponentLayout();

    if (!opponentLayout) {
      return 50;
    }

    const towerStrength = opponentLayout.towers.reduce((sum, tower) => {
      return sum + tower.level * 10;
    }, 0);

    const baseStrength = 50 + towerStrength;
    const randomFactor = Math.random() * 40 - 20;

    return Math.max(0, Math.min(MAX_BASE_HP, Math.floor(baseStrength + randomFactor)));
  }

  private showBattleResult(result: BattleResult): void {
    if (this.battleCompletePanel) {
      this.battleCompletePanel.active = true;
    }

    const gm = GameManager.instance;
    const player = gm.getPlayer();
    const isWinner = result.winnerId === player?.id;

    if (this.resultLabel) {
      if (isWinner) {
        this.resultLabel.string = '🎉 胜利！';
        this.resultLabel.color = new Color(255, 215, 0, 255);
      } else {
        this.resultLabel.string = '💔 失败...';
        this.resultLabel.color = new Color(255, 100, 100, 255);
      }
    }

    if (this.statusLabel) {
      this.statusLabel.string = `你的HP: ${result.player1Hp} | 对手HP: ${result.player2Hp}\n击杀数: ${result.player1Kills} | 对手击杀: ${result.player2Kills}`;
    }

    const returnButton = this.battleCompletePanel?.getChildByName('ReturnButton');
    if (returnButton) {
      const btn = returnButton.getComponent(Button);
      if (btn) {
        btn.node.on(Button.EventType.CLICK, () => {
          gm.resetMatch();
          gm.loadScene('MainMenuScene');
        });
      }
    }
  }

  private updateUI(): void {
    const gm = GameManager.instance;

    if (this.goldLabel) {
      this.goldLabel.string = `金币: ${gm.getGold()}`;
    }

    if (this.waveLabel) {
      this.waveLabel.string = `波次: ${gm.getWave()}/${WAVE_CONFIG.length}`;
    }

    if (this.killsLabel) {
      this.killsLabel.string = `击杀: ${gm.getEnemyKills()}`;
    }

    if (this.hpBar) {
      this.hpBar.progress = gm.getBaseHp() / MAX_BASE_HP;
    }

    if (this.hpLabel) {
      this.hpLabel.string = `基地HP: ${gm.getBaseHp()}/${MAX_BASE_HP}`;
    }
  }

  private showStatus(message: string): void {
    if (this.statusLabel) {
      this.statusLabel.string = message;
    }
    console.log(message);
  }

  update(dt: number) {
    if (this.battleEngine && this.isBattling) {
      this.battleEngine.update(dt);
    }
    this.updateUI();
  }

  onDestroy() {
    if (this.battleEngine) {
      this.battleEngine.clear();
    }
  }
}
