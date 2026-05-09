import { _decorator, Component, Node, Label, Button, director } from 'cc';
import { NetworkManager } from '../network/NetworkManager';
import { GameManager } from '../managers/GameManager';
import { Player } from '../types/GameTypes';

const { ccclass, property } = _decorator;

@ccclass('MatchmakingScene')
export class MatchmakingScene extends Component {
  @property(Button)
  searchButton: Button | null = null;

  @property(Button)
  cancelButton: Button | null = null;

  @property(Button)
  backButton: Button | null = null;

  @property(Label)
  statusLabel: Label | null = null;

  @property(Label)
  timerLabel: Label | null = null;

  @property(Node)
  searchingAnimation: Node | null = null;

  @property(Node)
  matchFoundPanel: Node | null = null;

  @property(Label)
  opponentNameLabel: Label | null = null;

  @property(Button)
  readyButton: Button | null = null;

  private isSearching: boolean = false;
  private searchTimer: number = 0;
  private opponent: Player | null = null;

  onLoad() {
    this.setupButtons();
    this.setupNetworkListeners();
    this.resetUI();
  }

  private setupButtons(): void {
    if (this.searchButton) {
      this.searchButton.node.on(Button.EventType.CLICK, this.onSearchClick, this);
    }
    if (this.cancelButton) {
      this.cancelButton.node.on(Button.EventType.CLICK, this.onCancelClick, this);
    }
    if (this.backButton) {
      this.backButton.node.on(Button.EventType.CLICK, this.onBackClick, this);
    }
    if (this.readyButton) {
      this.readyButton.node.on(Button.EventType.CLICK, this.onReadyClick, this);
    }
  }

  private setupNetworkListeners(): void {
    const nm = NetworkManager.instance;

    nm.onMatchmakingStarted = (message: string) => {
      this.isSearching = true;
      this.searchTimer = 0;
      this.showSearchingUI();
      this.showStatus(message);
    };

    nm.onMatchmakingCancelled = (message: string) => {
      this.isSearching = false;
      this.resetUI();
      this.showStatus(message);
    };

    nm.onMatchFound = (roomId: string, opponent: Player, message: string) => {
      this.isSearching = false;
      this.opponent = opponent;
      this.showMatchFoundUI(opponent);
      this.showStatus(message);
    };

    nm.onOpponentDisconnected = (message: string) => {
      this.showStatus(message);
      setTimeout(() => {
        GameManager.instance.resetMatch();
        GameManager.instance.loadScene('MainMenuScene');
      }, 2000);
    };
  }

  private resetUI(): void {
    if (this.searchButton) this.searchButton.node.active = true;
    if (this.cancelButton) this.cancelButton.node.active = false;
    if (this.searchingAnimation) this.searchingAnimation.active = false;
    if (this.matchFoundPanel) this.matchFoundPanel.active = false;
    if (this.timerLabel) this.timerLabel.string = '';
    this.showStatus('点击按钮开始匹配');
  }

  private showSearchingUI(): void {
    if (this.searchButton) this.searchButton.node.active = false;
    if (this.cancelButton) this.cancelButton.node.active = true;
    if (this.searchingAnimation) this.searchingAnimation.active = true;
  }

  private showMatchFoundUI(opponent: Player): void {
    if (this.cancelButton) this.cancelButton.node.active = false;
    if (this.searchingAnimation) this.searchingAnimation.active = false;
    if (this.matchFoundPanel) this.matchFoundPanel.active = true;
    if (this.opponentNameLabel) this.opponentNameLabel.string = opponent.name;
  }

  private onSearchClick(): void {
    const gm = GameManager.instance;
    const nm = NetworkManager.instance;
    const player = gm.getPlayer();

    if (player) {
      nm.startMatchmaking(player.id);
    }
  }

  private onCancelClick(): void {
    const gm = GameManager.instance;
    const nm = NetworkManager.instance;
    const player = gm.getPlayer();

    if (player) {
      nm.cancelMatchmaking(player.id);
    }
  }

  private onReadyClick(): void {
    GameManager.instance.loadScene('DefenseSetupScene');
  }

  private onBackClick(): void {
    const gm = GameManager.instance;
    const nm = NetworkManager.instance;
    const player = gm.getPlayer();

    if (this.isSearching && player) {
      nm.cancelMatchmaking(player.id);
    }

    gm.loadScene('MainMenuScene');
  }

  private showStatus(message: string): void {
    if (this.statusLabel) {
      this.statusLabel.string = message;
    }
    console.log(message);
  }

  update(dt: number) {
    if (this.isSearching && this.timerLabel) {
      this.searchTimer += dt;
      const seconds = Math.floor(this.searchTimer);
      this.timerLabel.string = `已搜索: ${seconds} 秒`;
    }
  }

  onDestroy() {
    if (this.searchButton) {
      this.searchButton.node.off(Button.EventType.CLICK, this.onSearchClick, this);
    }
    if (this.cancelButton) {
      this.cancelButton.node.off(Button.EventType.CLICK, this.onCancelClick, this);
    }
    if (this.backButton) {
      this.backButton.node.off(Button.EventType.CLICK, this.onBackClick, this);
    }
    if (this.readyButton) {
      this.readyButton.node.off(Button.EventType.CLICK, this.onReadyClick, this);
    }
  }
}
