import { _decorator, Component, Node, instantiate, Prefab, Vec3 } from 'cc';
import {
  DefenseLayout,
  TowerData,
  EnemyData,
  EnemyType,
  WeatherType,
  WAVE_CONFIG,
  PATH_POINTS,
  ENEMY_CONFIGS,
  WEATHER_EFFECTS,
  getRandomWeather,
  BattleResult,
} from '../types/GameTypes';
import { Tower } from './Tower';
import { Enemy } from './Enemy';
import { GameManager } from '../managers/GameManager';
import { v4 as uuidv4 } from 'uuid';

const { ccclass, property } = _decorator;

@ccclass('BattleEngine')
export class BattleEngine extends Component {
  @property(Prefab)
  towerPrefab: Prefab | null = null;

  @property(Prefab)
  enemyPrefab: Prefab | null = null;

  @property(Node)
  towersContainer: Node | null = null;

  @property(Node)
  enemiesContainer: Node | null = null;

  @property(Node)
  effectsContainer: Node | null = null;

  private towers: Tower[] = [];
  private enemies: Enemy[] = [];
  private enemyDataMap: Map<string, EnemyData> = new Map();
  private isRunning: boolean = false;
  private currentWave: number = 0;
  private waveEnemiesRemaining: number = 0;
  private waveComplete: boolean = true;
  private spawnTimer: number = 0;
  private spawnQueue: { type: EnemyType; delay: number }[] = [];
  private totalSpawned: number = 0;
  private totalToSpawn: number = 0;
  private currentWeather: WeatherType = 'cloudy';

  public onWaveComplete: ((wave: number) => void) | null = null;
  public onEnemyReachBase: (() => void) | null = null;
  public onEnemyDeath: ((reward: number) => void) | null = null;
  public onAllWavesComplete: (() => void) | null = null;

  public init(myLayout: DefenseLayout): void {
    this.towers = [];
    this.enemies = [];
    this.enemyDataMap.clear();
    this.currentWave = 0;
    this.isRunning = false;
    this.totalSpawned = 0;
    this.totalToSpawn = 0;
    this.currentWeather = getRandomWeather();

    if (this.towersContainer) {
      this.towersContainer.removeAllChildren();
    }
    if (this.enemiesContainer) {
      this.enemiesContainer.removeAllChildren();
    }

    this.createTowers(myLayout.towers);
    console.log(`本场战斗天气: ${this.currentWeather}`);
  }

  private createTowers(towerDataList: TowerData[]): void {
    if (!this.towerPrefab || !this.towersContainer) return;

    for (const data of towerDataList) {
      const node = instantiate(this.towerPrefab);
      node.setPosition(new Vec3(data.position.x, data.position.y, 0));
      this.towersContainer.addChild(node);

      const tower = node.getComponent(Tower);
      if (tower) {
        tower.init(
          data,
          this.currentWeather,
          this.handleTowerAttack.bind(this),
          this.getEnemiesInRange.bind(this)
        );
        this.towers.push(tower);
      }
    }
  }

  public getWeather(): WeatherType {
    return this.currentWeather;
  }

  private handleTowerAttack(
    targetId: string,
    damage: number,
    position: any,
    isAoe: boolean,
    isSlow: boolean
  ): void {
    if (isAoe) {
      for (const enemy of this.enemies) {
        const data = enemy.getData();
        if (!data || !data.alive) continue;

        const dx = data.position.x - position.x;
        const dy = data.position.y - position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 100) {
          enemy.takeDamage(damage, false);
        }
      }
    } else {
      const enemy = this.enemies.find((e) => e.getData()?.id === targetId);
      if (enemy) {
        enemy.takeDamage(damage, isSlow);
      }
    }
  }

  private getEnemiesInRange(position: any, range: number): EnemyData[] {
    const result: EnemyData[] = [];

    for (const [, data] of this.enemyDataMap) {
      if (!data.alive) continue;

      const dx = data.position.x - position.x;
      const dy = data.position.y - position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= range) {
        result.push(data);
      }
    }

    return result;
  }

  public startBattle(): void {
    this.isRunning = true;
    this.startNextWave();
  }

  public stopBattle(): void {
    this.isRunning = false;
  }

  private startNextWave(): void {
    if (this.currentWave >= WAVE_CONFIG.length) {
      this.isRunning = false;
      if (this.onAllWavesComplete) {
        this.onAllWavesComplete();
      }
      return;
    }

    this.waveComplete = false;
    const waveConfig = WAVE_CONFIG[this.currentWave];
    this.spawnQueue = [];

    let totalEnemies = 0;
    for (const group of waveConfig) {
      for (let i = 0; i < group.count; i++) {
        const delay = i * group.interval;
        this.spawnQueue.push({ type: group.type, delay });
      }
      totalEnemies += group.count;
    }

    this.waveEnemiesRemaining = totalEnemies;
    this.totalSpawned = 0;
    this.totalToSpawn = totalEnemies;
    this.spawnTimer = 0;

    this.currentWave++;
    console.log(`开始第 ${this.currentWave} 波，共 ${totalEnemies} 个敌人`);
  }

  public update(dt: number): void {
    if (!this.isRunning) return;

    this.spawnTimer += dt * 1000;

    while (
      this.spawnQueue.length > 0 &&
      this.spawnTimer >= this.spawnQueue[0].delay
    ) {
      const spawn = this.spawnQueue.shift()!;
      this.spawnEnemy(spawn.type);
    }

    for (const tower of this.towers) {
      tower.update(dt);
    }

    for (const enemy of this.enemies) {
      enemy.update(dt);
    }

    if (!this.waveComplete && this.allEnemiesDefeated()) {
      this.waveComplete = true;
      if (this.onWaveComplete) {
        this.onWaveComplete(this.currentWave);
      }
      setTimeout(() => {
        this.startNextWave();
      }, 2000);
    }
  }

  private spawnEnemy(type: EnemyType): void {
    if (!this.enemyPrefab || !this.enemiesContainer) return;

    const config = ENEMY_CONFIGS[type];
    const hpMultiplier = 1 + (this.currentWave - 1) * 0.1;
    const startPos = { ...PATH_POINTS[0] };

    const enemyData: EnemyData = {
      id: uuidv4(),
      type: type,
      hp: Math.floor(config.hp * hpMultiplier),
      maxHp: Math.floor(config.hp * hpMultiplier),
      speed: config.speed,
      baseSpeed: config.speed,
      pathIndex: 0,
      position: startPos,
      slowTimer: 0,
      alive: true,
    };

    this.enemyDataMap.set(enemyData.id, enemyData);
    this.totalSpawned++;

    const node = instantiate(this.enemyPrefab);
    node.setPosition(new Vec3(startPos.x, startPos.y, 0));
    this.enemiesContainer.addChild(node);

    const enemy = node.getComponent(Enemy);
    if (enemy) {
      enemy.init(
        enemyData,
        () => this.handleEnemyReachBase(enemyData.id),
        () => this.handleEnemyDeath(enemyData.id, config.reward)
      );
      this.enemies.push(enemy);
    }
  }

  private handleEnemyReachBase(enemyId: string): void {
    const enemyData = this.enemyDataMap.get(enemyId);
    if (!enemyData || !enemyData.alive) return;

    enemyData.alive = false;
    this.waveEnemiesRemaining--;

    if (this.onEnemyReachBase) {
      this.onEnemyReachBase();
    }
  }

  private handleEnemyDeath(enemyId: string, reward: number): void {
    const enemyData = this.enemyDataMap.get(enemyId);
    if (!enemyData || !enemyData.alive) return;

    enemyData.alive = false;
    this.waveEnemiesRemaining--;

    if (this.onEnemyDeath) {
      this.onEnemyDeath(reward);
    }
  }

  private allEnemiesDefeated(): boolean {
    if (this.totalSpawned < this.totalToSpawn) {
      return false;
    }

    for (const [, data] of this.enemyDataMap) {
      if (data.alive) {
        return false;
      }
    }

    return true;
  }

  public getCurrentWave(): number {
    return this.currentWave;
  }

  public getAliveEnemies(): EnemyData[] {
    const result: EnemyData[] = [];
    for (const [, data] of this.enemyDataMap) {
      if (data.alive) {
        result.push(data);
      }
    }
    return result;
  }

  public clear(): void {
    this.isRunning = false;
    this.towers = [];
    this.enemies = [];
    this.enemyDataMap.clear();
  }
}
