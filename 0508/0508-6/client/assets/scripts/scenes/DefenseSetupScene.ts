import { _decorator, Component, Node, Label, Button, Vec3, Color, Sprite, EventTouch, UITransform, instantiate, Prefab, Input, input } from 'cc';
import { GameManager } from '../managers/GameManager';
import { NetworkManager } from '../network/NetworkManager';
import {
  TowerType,
  TowerData,
  TOWER_CONFIGS,
  MAX_TOWER_COUNT,
  PATH_POINTS,
} from '../types/GameTypes';
import { v4 as uuidv4 } from 'uuid';

const { ccclass, property } = _decorator;

@ccclass('DefenseSetupScene')
export class DefenseSetupScene extends Component {
  @property(Prefab)
  towerPreviewPrefab: Prefab | null = null;

  @property(Node)
  gameBoard: Node | null = null;

  @property(Node)
  towersContainer: Node | null = null;

  @property(Node)
  pathDisplay: Node | null = null;

  @property(Label)
  goldLabel: Label | null = null;

  @property(Label)
  towerCountLabel: Label | null = null;

  @property(Label)
  statusLabel: Label | null = null;

  @property(Button)
  confirmButton: Button | null = null;

  @property(Button)
  backButton: Button | null = null;

  @property(Node)
  towerSelectPanel: Node | null = null;

  @property(Node)
  towerInfoPanel: Node | null = null;

  @property(Label)
  selectedTowerName: Label | null = null;

  @property(Label)
  selectedTowerCost: Label | null = null;

  @property(Label)
  selectedTowerDesc: Label | null = null;

  @property(Button)
  upgradeButton: Button | null = null;

  @property(Button)
  sellButton: Button | null = null;

  private selectedTowerType: TowerType | null = null;
  private selectedTowerId: string | null = null;
  private towerPreview: Node | null = null;
  private placedTowers: Map<string, Node> = new Map();

  onLoad() {
    this.setupButtons();
    this.setupTowerButtons();
    this.setupInput();
    this.drawPath();
    this.updateUI();

    const nm = NetworkManager.instance;
    nm.onLayoutSubmitted = (message: string) => {
      this.showStatus(message);
    };
  }

  private setupButtons(): void {
    if (this.confirmButton) {
      this.confirmButton.node.on(Button.EventType.CLICK, this.onConfirmClick, this);
    }
    if (this.backButton) {
      this.backButton.node.on(Button.EventType.CLICK, this.onBackClick, this);
    }
    if (this.upgradeButton) {
      this.upgradeButton.node.on(Button.EventType.CLICK, this.onUpgradeClick, this);
    }
    if (this.sellButton) {
      this.sellButton.node.on(Button.EventType.CLICK, this.onSellClick, this);
    }
  }

  private setupTowerButtons(): void {
    if (!this.towerSelectPanel) return;

    const towerTypes: TowerType[] = ['arrow', 'fire', 'ice', 'cannon'];
    const buttons = this.towerSelectPanel.getComponentsInChildren(Button);

    buttons.forEach((btn, index) => {
      if (index < towerTypes.length) {
        const type = towerTypes[index];
        btn.node.on(Button.EventType.CLICK, () => {
          this.selectTowerType(type);
        });

        const label = btn.getComponentInChildren(Label);
        if (label) {
          const config = TOWER_CONFIGS[type];
          label.string = `${config.icon} ${config.name}\n${config.baseCost}金`;
        }
      }
    });
  }

  private setupInput(): void {
    if (this.gameBoard) {
      this.gameBoard.on(Node.EventType.TOUCH_START, this.onBoardTouchStart, this);
      this.gameBoard.on(Node.EventType.TOUCH_MOVE, this.onBoardTouchMove, this);
      this.gameBoard.on(Node.EventType.TOUCH_END, this.onBoardTouchEnd, this);
    }
  }

  private drawPath(): void {
    if (!this.pathDisplay) return;

    const graphics = this.pathDisplay.getComponent('Graphics');
    if (graphics) {
      const g = graphics as any;
      g.clear();
      g.strokeColor = Color.GRAY;
      g.lineWidth = 3;
      g.moveTo(PATH_POINTS[0].x, PATH_POINTS[0].y);

      for (let i = 1; i < PATH_POINTS.length; i++) {
        g.lineTo(PATH_POINTS[i].x, PATH_POINTS[i].y);
      }
      g.stroke();

      g.fillColor = new Color(255, 100, 100, 200);
      for (const point of PATH_POINTS) {
        g.circle(point.x, point.y, 8);
        g.fill();
      }
    }
  }

  private selectTowerType(type: TowerType): void {
    const gm = GameManager.instance;
    const config = TOWER_CONFIGS[type];

    if (!gm.canAffordTower(type)) {
      this.showStatus(`金币不足，需要 ${config.baseCost} 金`);
      return;
    }

    if (gm.getTowerCount() >= MAX_TOWER_COUNT) {
      this.showStatus(`已达到最大防御塔数量 (${MAX_TOWER_COUNT})`);
      return;
    }

    this.selectedTowerType = type;
    this.selectedTowerId = null;
    this.hideTowerInfo();
    this.showStatus(`选择了 ${config.name}，点击地图放置`);

    this.createTowerPreview(type);
  }

  private createTowerPreview(type: TowerType): void {
    if (!this.towerPreviewPrefab || !this.gameBoard) return;

    if (this.towerPreview) {
      this.towerPreview.destroy();
    }

    this.towerPreview = instantiate(this.towerPreviewPrefab);
    this.towerPreview.opacity = 150;
    this.gameBoard.addChild(this.towerPreview);

    const config = TOWER_CONFIGS[type];
    const sprite = this.towerPreview.getComponent(Sprite);
    if (sprite) {
      const color = new Color().fromHEX(config.color);
      sprite.color = color;
    }

    const rangeIndicator = this.towerPreview.getChildByName('RangeIndicator');
    if (rangeIndicator) {
      const range = config.range[0];
      rangeIndicator.setScale(range / 50, range / 50, 1);
      rangeIndicator.active = true;
    }
  }

  private onBoardTouchStart(event: EventTouch): void {
    if (!this.gameBoard || !this.selectedTowerType) return;

    const worldPos = event.getUILocation();
    const localPos = this.convertToLocalPos(worldPos);
    this.updatePreviewPosition(localPos);
  }

  private onBoardTouchMove(event: EventTouch): void {
    if (!this.gameBoard || !this.towerPreview || !this.selectedTowerType) return;

    const worldPos = event.getUILocation();
    const localPos = this.convertToLocalPos(worldPos);
    this.updatePreviewPosition(localPos);
  }

  private onBoardTouchEnd(event: EventTouch): void {
    if (!this.gameBoard) return;

    const worldPos = event.getUILocation();
    const localPos = this.convertToLocalPos(worldPos);

    if (this.selectedTowerType && this.towerPreview) {
      this.tryPlaceTower(localPos);
    } else {
      this.trySelectPlacedTower(localPos);
    }
  }

  private convertToLocalPos(worldPos: { x: number; y: number }): Vec3 {
    if (!this.gameBoard) return new Vec3(0, 0, 0);

    const transform = this.gameBoard.getComponent(UITransform);
    if (!transform) return new Vec3(0, 0, 0);

    const localPos = transform.convertToNodeSpaceAR(new Vec3(worldPos.x, worldPos.y, 0));
    return localPos;
  }

  private updatePreviewPosition(pos: Vec3): void {
    if (!this.towerPreview) return;
    this.towerPreview.setPosition(pos);
  }

  private tryPlaceTower(pos: Vec3): void {
    if (!this.selectedTowerType || !this.towerPreviewPrefab || !this.towersContainer) return;

    const gm = GameManager.instance;
    const config = TOWER_CONFIGS[this.selectedTowerType];

    if (this.isPositionOnPath(pos)) {
      this.showStatus('不能在敌人路径上放置防御塔');
      return;
    }

    if (this.isPositionOverlapping(pos)) {
      this.showStatus('该位置已有防御塔');
      return;
    }

    const towerData: TowerData = {
      id: uuidv4(),
      type: this.selectedTowerType,
      level: 1,
      position: { x: pos.x, y: pos.y },
    };

    if (gm.addTower(towerData)) {
      const towerNode = instantiate(this.towerPreviewPrefab);
      towerNode.setPosition(pos);
      this.towersContainer.addChild(towerNode);

      const sprite = towerNode.getComponent(Sprite);
      if (sprite) {
        const color = new Color().fromHEX(config.color);
        sprite.color = color;
      }

      this.placedTowers.set(towerData.id, towerNode);
      this.updateUI();
      this.showStatus(`放置了 ${config.name}`);

      this.selectedTowerType = null;
      if (this.towerPreview) {
        this.towerPreview.destroy();
        this.towerPreview = null;
      }
    }
  }

  private isPositionOnPath(pos: Vec3): boolean {
    const pathWidth = 40;

    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
      const p1 = PATH_POINTS[i];
      const p2 = PATH_POINTS[i + 1];

      const dist = this.pointToLineDistance(
        pos.x,
        pos.y,
        p1.x,
        p1.y,
        p2.x,
        p2.y
      );

      if (dist < pathWidth) {
        return true;
      }
    }

    return false;
  }

  private pointToLineDistance(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private isPositionOverlapping(pos: Vec3): boolean {
    const towerRadius = 30;
    const gm = GameManager.instance;
    const layout = gm.getMyLayout();

    if (!layout) return false;

    for (const tower of layout.towers) {
      const dx = pos.x - tower.position.x;
      const dy = pos.y - tower.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < towerRadius * 2) {
        return true;
      }
    }

    return false;
  }

  private trySelectPlacedTower(pos: Vec3): void {
    const gm = GameManager.instance;
    const layout = gm.getMyLayout();

    if (!layout) return;

    const clickRadius = 30;

    for (const tower of layout.towers) {
      const dx = pos.x - tower.position.x;
      const dy = pos.y - tower.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < clickRadius) {
        this.selectPlacedTower(tower.id);
        return;
      }
    }

    this.selectedTowerId = null;
    this.hideTowerInfo();
  }

  private selectPlacedTower(towerId: string): void {
    const gm = GameManager.instance;
    const layout = gm.getMyLayout();

    if (!layout) return;

    const towerData = layout.towers.find((t) => t.id === towerId);
    if (!towerData) return;

    this.selectedTowerId = towerId;
    this.selectedTowerType = null;

    if (this.towerPreview) {
      this.towerPreview.destroy();
      this.towerPreview = null;
    }

    this.showTowerInfo(towerData);
  }

  private showTowerInfo(towerData: TowerData): void {
    if (!this.towerInfoPanel) return;

    const config = TOWER_CONFIGS[towerData.type];
    this.towerInfoPanel.active = true;

    if (this.selectedTowerName) {
      this.selectedTowerName.string = `${config.icon} ${config.name} (Lv.${towerData.level}/${config.maxLevel})`;
    }

    if (this.selectedTowerCost) {
      if (towerData.level < config.maxLevel) {
        const upgradeCost = config.upgradeCost[towerData.level - 1];
        this.selectedTowerCost.string = `升级费用: ${upgradeCost} 金`;
      } else {
        this.selectedTowerCost.string = '已满级';
      }
    }

    if (this.selectedTowerDesc) {
      const damage = config.damage[towerData.level - 1];
      const range = config.range[towerData.level - 1];
      const speed = config.attackSpeed[towerData.level - 1];
      this.selectedTowerDesc.string = `伤害: ${damage} | 范围: ${range} | 攻速: ${speed.toFixed(1)}/s\n${config.description}`;
    }

    if (this.upgradeButton) {
      const gm = GameManager.instance;
      this.upgradeButton.interactable = gm.canAffordUpgrade(towerData.id);
    }
  }

  private hideTowerInfo(): void {
    if (this.towerInfoPanel) {
      this.towerInfoPanel.active = false;
    }
  }

  private onUpgradeClick(): void {
    if (!this.selectedTowerId) return;

    const gm = GameManager.instance;
    const layout = gm.getMyLayout();

    if (!layout) return;

    const towerData = layout.towers.find((t) => t.id === this.selectedTowerId);
    if (!towerData) return;

    if (gm.upgradeTower(this.selectedTowerId)) {
      const config = TOWER_CONFIGS[towerData.type];
      const towerNode = this.placedTowers.get(this.selectedTowerId);

      if (towerNode) {
        const scale = 0.8 + (towerData.level - 1) * 0.1;
        towerNode.setScale(scale, scale, 1);
      }

      this.showStatus(`升级成功！${config.name} Lv.${towerData.level}`);
      this.showTowerInfo(towerData);
      this.updateUI();
    } else {
      this.showStatus('升级失败，金币不足或已满级');
    }
  }

  private onSellClick(): void {
    if (!this.selectedTowerId) return;

    const gm = GameManager.instance;
    const layout = gm.getMyLayout();

    if (!layout) return;

    const towerData = layout.towers.find((t) => t.id === this.selectedTowerId);
    if (!towerData) return;

    const config = TOWER_CONFIGS[towerData.type];

    if (gm.removeTower(this.selectedTowerId)) {
      const towerNode = this.placedTowers.get(this.selectedTowerId);
      if (towerNode) {
        towerNode.destroy();
        this.placedTowers.delete(this.selectedTowerId);
      }

      this.showStatus(`卖出 ${config.name}，返还 ${Math.floor(config.baseCost * 0.7)} 金`);
      this.selectedTowerId = null;
      this.hideTowerInfo();
      this.updateUI();
    }
  }

  private onConfirmClick(): void {
    const gm = GameManager.instance;
    const layout = gm.getMyLayout();
    const player = gm.getPlayer();

    if (!layout || layout.towers.length === 0) {
      this.showStatus('请至少放置一座防御塔！');
      return;
    }

    if (!player) {
      this.showStatus('玩家信息错误，请返回重进');
      return;
    }

    const nm = NetworkManager.instance;
    nm.submitLayout(player.id, layout);

    this.showStatus('阵型已提交，等待对手...');

    nm.onBattleStart = (myLayout, opponentLayout) => {
      console.log('战斗开始！');
      gm.loadScene('BattleScene');
    };
  }

  private onBackClick(): void {
    const gm = GameManager.instance;
    const nm = NetworkManager.instance;
    const player = gm.getPlayer();

    if (player) {
      nm.cancelMatchmaking(player.id);
    }

    gm.resetMatch();
    gm.loadScene('MatchmakingScene');
  }

  private updateUI(): void {
    const gm = GameManager.instance;

    if (this.goldLabel) {
      this.goldLabel.string = `金币: ${gm.getGold()}`;
    }

    if (this.towerCountLabel) {
      this.towerCountLabel.string = `防御塔: ${gm.getTowerCount()}/${MAX_TOWER_COUNT}`;
    }
  }

  private showStatus(message: string): void {
    if (this.statusLabel) {
      this.statusLabel.string = message;
    }
    console.log(message);
  }

  update(dt: number) {
    this.updateUI();
  }

  onDestroy() {
    if (this.confirmButton) {
      this.confirmButton.node.off(Button.EventType.CLICK, this.onConfirmClick, this);
    }
    if (this.backButton) {
      this.backButton.node.off(Button.EventType.CLICK, this.onBackClick, this);
    }
    if (this.upgradeButton) {
      this.upgradeButton.node.off(Button.EventType.CLICK, this.onUpgradeClick, this);
    }
    if (this.sellButton) {
      this.sellButton.node.off(Button.EventType.CLICK, this.onSellClick, this);
    }
  }
}
