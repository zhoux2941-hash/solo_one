import { _decorator, Component, Node, Label, Button, EditBox, director, game } from 'cc';
import { NetworkManager } from '../network/NetworkManager';
import { GameManager } from '../managers/GameManager';
import { LeaderboardEntry } from '../types/GameTypes';

const { ccclass, property } = _decorator;

@ccclass('MainMenuScene')
export class MainMenuScene extends Component {
  @property(EditBox)
  nameInput: EditBox | null = null;

  @property(Button)
  battleButton: Button | null = null;

  @property(Button)
  leaderboardButton: Button | null = null;

  @property(Button)
  settingsButton: Button | null = null;

  @property(Label)
  statusLabel: Label | null = null;

  @property(Node)
  leaderboardPanel: Node | null = null;

  @property(Node)
  settingsPanel: Node | null = null;

  @property(Node)
  leaderboardContent: Node | null = null;

  @property(Label)
  rankItemTemplate: Label | null = null;

  private isConnecting: boolean = false;

  onLoad() {
    this.setupButtons();
    this.generateRandomName();
  }

  private setupButtons(): void {
    if (this.battleButton) {
      this.battleButton.node.on(Button.EventType.CLICK, this.onBattleClick, this);
    }
    if (this.leaderboardButton) {
      this.leaderboardButton.node.on(Button.EventType.CLICK, this.onLeaderboardClick, this);
    }
    if (this.settingsButton) {
      this.settingsButton.node.on(Button.EventType.CLICK, this.onSettingsClick, this);
    }

    if (this.leaderboardPanel) {
      const closeBtn = this.leaderboardPanel.getChildByName('CloseButton');
      if (closeBtn) {
        closeBtn.on(Button.EventType.CLICK, () => {
          this.leaderboardPanel!.active = false;
        });
      }
    }

    if (this.settingsPanel) {
      const closeBtn = this.settingsPanel.getChildByName('CloseButton');
      if (closeBtn) {
        closeBtn.on(Button.EventType.CLICK, () => {
          this.settingsPanel!.active = false;
        });
      }
    }
  }

  private generateRandomName(): void {
    if (this.nameInput) {
      const names = ['勇者', '战士', '塔防大师', '守护者', '防御专家', '战神', '勇士'];
      const randomName = names[Math.floor(Math.random() * names.length)];
      const number = Math.floor(Math.random() * 1000);
      this.nameInput.string = `${randomName}${number}`;
    }
  }

  private async onBattleClick(): Promise<void> {
    if (this.isConnecting) return;

    const playerName = this.nameInput?.string || '玩家';
    if (!playerName.trim()) {
      this.showStatus('请输入玩家名称！');
      return;
    }

    this.isConnecting = true;
    this.showStatus('正在连接服务器...');

    try {
      const nm = NetworkManager.instance;

      if (!nm.getIsConnected()) {
        await nm.connect('http://localhost:3000');
      }

      nm.join(playerName.trim());

      setTimeout(() => {
        GameManager.instance.loadScene('MatchmakingScene');
      }, 500);
    } catch (error) {
      console.error('连接失败:', error);
      this.showStatus('连接服务器失败，请检查网络');
      this.isConnecting = false;
    }
  }

  private onLeaderboardClick(): void {
    if (this.leaderboardPanel) {
      this.leaderboardPanel.active = true;
      this.loadLeaderboard();
    }
  }

  private loadLeaderboard(): void {
    const gm = GameManager.instance;
    const entries = gm.getLeaderboardCache();

    this.refreshLeaderboardUI(entries);

    const nm = NetworkManager.instance;
    if (nm.getIsConnected()) {
      nm.onLeaderboardUpdate = (leaderboard: LeaderboardEntry[]) => {
        this.refreshLeaderboardUI(leaderboard);
      };
      nm.getLeaderboard();
    }
  }

  private refreshLeaderboardUI(entries: LeaderboardEntry[]): void {
    if (!this.leaderboardContent || !this.rankItemTemplate) return;

    this.leaderboardContent.removeAllChildren();

    entries.forEach((entry, index) => {
      const item = this.rankItemTemplate.node.parent?.clone();
      if (!item) return;

      const labels = item.getComponentsInChildren(Label);
      if (labels.length >= 4) {
        labels[0].string = `${index + 1}`;
        labels[1].string = entry.playerName;
        labels[2].string = `${entry.wins}胜/${entry.losses}负`;
        labels[3].string = `${entry.rating}`;
      }

      item.active = true;
      this.leaderboardContent.addChild(item);
    });
  }

  private onSettingsClick(): void {
    if (this.settingsPanel) {
      this.settingsPanel.active = true;
    }
  }

  private showStatus(message: string): void {
    if (this.statusLabel) {
      this.statusLabel.string = message;
    }
    console.log(message);
  }

  onDestroy() {
    if (this.battleButton) {
      this.battleButton.node.off(Button.EventType.CLICK, this.onBattleClick, this);
    }
  }
}
