import { _decorator, Component, Node, Vec3, Sprite, Color, UITransform } from 'cc';
import {
  EnemyType,
  EnemyData,
  ENEMY_CONFIGS,
  PATH_POINTS,
  Position,
} from '../types/GameTypes';

const { ccclass, property } = _decorator;

@ccclass('Enemy')
export class Enemy extends Component {
  @property(Sprite)
  enemySprite: Sprite | null = null;

  @property(Node)
  hpBar: Node | null = null;

  private enemyData: EnemyData | null = null;
  private onReachBase: (() => void) | null = null;
  private onDeath: (() => void) | null = null;
  private slowEffectTimer: number = 0;

  public init(
    data: EnemyData,
    onReachBaseCallback: () => void,
    onDeathCallback: () => void
  ): void {
    this.enemyData = data;
    this.onReachBase = onReachBaseCallback;
    this.onDeath = onDeathCallback;
    this.slowEffectTimer = 0;

    this.updateVisuals();
    this.updatePosition();
  }

  private updateVisuals(): void {
    if (!this.enemyData || !this.enemySprite) return;

    const config = ENEMY_CONFIGS[this.enemyData.type];
    const color = new Color().fromHEX(config.color);
    this.enemySprite.color = color;

    const scale = config.size / 20;
    this.node.setScale(scale, scale, 1);

    this.updateHpBar();
  }

  private updateHpBar(): void {
    if (!this.enemyData || !this.hpBar) return;

    const hpPercent = this.enemyData.hp / this.enemyData.maxHp;
    const transform = this.hpBar.getComponent(UITransform);
    if (transform) {
      transform.setContentSize(hpPercent * 30, 4);
    }
  }

  private updatePosition(): void {
    if (!this.enemyData) return;

    this.node.setPosition(
      new Vec3(
        this.enemyData.position.x,
        this.enemyData.position.y,
        0
      )
    );
  }

  public update(dt: number): void {
    if (!this.enemyData || !this.enemyData.alive) return;

    if (this.slowEffectTimer > 0) {
      this.slowEffectTimer -= dt;
      if (this.slowEffectTimer <= 0) {
        this.enemyData.speed = this.enemyData.baseSpeed;
      }
    }

    this.move(dt);
    this.updatePosition();
  }

  private move(dt: number): void {
    if (!this.enemyData) return;

    const pathIndex = this.enemyData.pathIndex;
    if (pathIndex >= PATH_POINTS.length - 1) {
      if (this.onReachBase) {
        this.onReachBase();
      }
      return;
    }

    const currentPos = this.enemyData.position;
    const targetPoint = PATH_POINTS[pathIndex + 1];

    const dx = targetPoint.x - currentPos.x;
    const dy = targetPoint.y - currentPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const moveDistance = this.enemyData.speed * dt;

    if (moveDistance >= distance) {
      this.enemyData.position = { ...targetPoint };
      this.enemyData.pathIndex++;

      if (this.enemyData.pathIndex >= PATH_POINTS.length - 1) {
        if (this.onReachBase) {
          this.onReachBase();
        }
      }
    } else {
      const ratio = moveDistance / distance;
      this.enemyData.position = {
        x: currentPos.x + dx * ratio,
        y: currentPos.y + dy * ratio,
      };
    }
  }

  public takeDamage(damage: number, isSlow: boolean): void {
    if (!this.enemyData || !this.enemyData.alive) return;

    this.enemyData.hp -= damage;

    if (isSlow) {
      this.enemyData.speed = this.enemyData.baseSpeed * 0.5;
      this.slowEffectTimer = 2;
    }

    this.updateHpBar();

    if (this.enemyData.hp <= 0) {
      this.die();
    }
  }

  private die(): void {
    if (!this.enemyData) return;

    this.enemyData.alive = false;
    this.node.active = false;

    if (this.onDeath) {
      this.onDeath();
    }
  }

  public getData(): EnemyData | null {
    return this.enemyData;
  }

  public getPosition(): Position {
    if (!this.enemyData) {
      return { x: 0, y: 0 };
    }
    return this.enemyData.position;
  }
}
