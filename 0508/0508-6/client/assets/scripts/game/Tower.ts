import { _decorator, Component, Node, Vec3, tween, Color, Sprite } from 'cc';
import {
  TowerType,
  TowerData,
  WeatherType,
  TOWER_CONFIGS,
  WEATHER_EFFECTS,
  EnemyData,
  Position,
} from '../types/GameTypes';

const { ccclass, property } = _decorator;

@ccclass('Tower')
export class Tower extends Component {
  @property(Sprite)
  towerSprite: Sprite | null = null;

  @property(Node)
  rangeIndicator: Node | null = null;

  private towerData: TowerData | null = null;
  private attackTimer: number = 0;
  private weather: WeatherType = 'cloudy';
  private onAttack: ((targetId: string, damage: number, position: Position, isAoe: boolean, isSlow: boolean) => void) | null = null;
  private getEnemiesInRange: ((position: Position, range: number) => EnemyData[]) | null = null;

  public init(
    data: TowerData,
    weather: WeatherType,
    onAttackCallback: (targetId: string, damage: number, position: Position, isAoe: boolean, isSlow: boolean) => void,
    getEnemiesCallback: (position: Position, range: number) => EnemyData[]
  ): void {
    this.towerData = data;
    this.weather = weather;
    this.onAttack = onAttackCallback;
    this.getEnemiesInRange = getEnemiesCallback;

    this.updateVisuals();
    this.updateRangeIndicator();
  }

  private getActualDamage(baseDamage: number): number {
    const effect = WEATHER_EFFECTS[this.weather];
    if (!effect) return baseDamage;
    if (effect.affectedTower === this.towerData?.type && effect.stat === 'damage') {
      return Math.floor(baseDamage * effect.multiplier);
    }
    return baseDamage;
  }

  private getActualRange(baseRange: number): number {
    const effect = WEATHER_EFFECTS[this.weather];
    if (!effect) return baseRange;
    if (effect.affectedTower === this.towerData?.type && effect.stat === 'range') {
      return Math.floor(baseRange * effect.multiplier);
    }
    return baseRange;
  }

  private updateVisuals(): void {
    if (!this.towerData || !this.towerSprite) return;

    const config = TOWER_CONFIGS[this.towerData.type];
    const color = new Color().fromHEX(config.color);
    this.towerSprite.color = color;

    const scale = 0.8 + (this.towerData.level - 1) * 0.1;
    this.node.setScale(scale, scale, 1);
  }

  private updateRangeIndicator(): void {
    if (!this.towerData || !this.rangeIndicator) return;

    const config = TOWER_CONFIGS[this.towerData.type];
    const baseRange = config.range[this.towerData.level - 1];
    const actualRange = this.getActualRange(baseRange);
    this.rangeIndicator.setScale(actualRange / 50, actualRange / 50, 1);
  }

  public update(dt: number): void {
    if (!this.towerData || !this.onAttack || !this.getEnemiesInRange) return;

    const config = TOWER_CONFIGS[this.towerData.type];
    const attackSpeed = config.attackSpeed[this.towerData.level - 1];
    const attackInterval = 1 / attackSpeed;

    this.attackTimer += dt;

    if (this.attackTimer >= attackInterval) {
      this.attackTimer = 0;
      this.tryAttack();
    }
  }

  private tryAttack(): void {
    if (!this.towerData || !this.onAttack || !this.getEnemiesInRange) return;

    const config = TOWER_CONFIGS[this.towerData.type];
    const baseRange = config.range[this.towerData.level - 1];
    const baseDamage = config.damage[this.towerData.level - 1];
    const range = this.getActualRange(baseRange);
    const damage = this.getActualDamage(baseDamage);
    const isAoe = config.special === 'aoe';
    const isSlow = config.special === 'slow';

    const position = {
      x: this.node.position.x,
      y: this.node.position.y,
    };

    const enemiesInRange = this.getEnemiesInRange(position, range).filter((e) => e.alive);

    if (enemiesInRange.length === 0) return;

    if (isAoe) {
      for (const enemy of enemiesInRange) {
        this.onAttack(enemy.id, damage, position, true, false);
      }
    } else {
      let target = enemiesInRange[0];
      for (let i = 1; i < enemiesInRange.length; i++) {
        if (enemiesInRange[i].pathIndex > target.pathIndex) {
          target = enemiesInRange[i];
        }
      }
      this.onAttack(target.id, damage, position, false, isSlow);
    }

    this.playAttackAnimation();
  }

  private playAttackAnimation(): void {
    if (!this.towerSprite) return;

    tween(this.node)
      .to(0.1, { scale: new Vec3(1.2, 1.2, 1) })
      .to(0.1, { scale: new Vec3(1, 1, 1) })
      .start();
  }

  public getData(): TowerData | null {
    return this.towerData;
  }

  public setRangeVisible(visible: boolean): void {
    if (this.rangeIndicator) {
      this.rangeIndicator.active = visible;
    }
  }
}
