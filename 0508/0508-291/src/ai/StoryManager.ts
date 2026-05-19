import { v4 as uuidv4 } from 'uuid';
import {
  StoryContext,
  PlayerAction,
  GeneratedContent,
  StoryState,
  PlotBranch,
  Clue,
} from './types';
import { GPT2Generator } from './GPT2Generator';
import { GameState } from '../types';

export class StoryManager {
  private state: StoryState;
  private generator: GPT2Generator;
  private onStoryUpdate?: (state: StoryState) => void;
  private actionHistory: PlayerAction[] = [];
  private maxHistorySize: number = 50;

  constructor(seed?: number) {
    const storySeed = seed || Math.floor(Math.random() * 1000000);
    this.generator = new GPT2Generator(storySeed);
    
    this.state = {
      context: {
        playerName: '',
        currentRoom: 'entrance',
        visitedRooms: [],
        inventory: [],
        defeatedMonsters: [],
        recentActions: [],
        discoveredClues: [],
        storySeed,
        currentPlotPoint: 0,
      },
      generatedContent: new Map(),
      activeBranches: [],
      clues: this.initializeClues(storySeed),
      plotProgression: 0,
      uniqueSeed: storySeed,
    };
  }

  private initializeClues(seed: number): Clue[] {
    const roomClueMapping = {
      entrance: 0,
      hallway: 1,
      treasure: 2,
      armory: 3,
      chamber: 4,
    };

    const clueHints = [
      'Examine the dusty corners carefully.',
      'Listen closely to the echoes.',
      'Not all that glitters is gold.',
      'Look for what the warriors left behind.',
      'The altar holds more than meets the eye.',
    ];

    const leadsTo = ['hallway', 'chamber', 'treasure', 'chamber', 'FINAL'];
    const importance: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high', 'medium', 'high'];

    return Object.entries(roomClueMapping).map(([roomId, index]) => ({
      id: `clue-${roomId}-${seed}`,
      content: '',
      hint: clueHints[index],
      roomId,
      isDiscovered: false,
      leadsTo: leadsTo[index],
      importance: importance[index],
    }));
  }

  async initialize(): Promise<void> {
    await this.generator.loadModel();
    this.setupPlotBranches();
  }

  private setupPlotBranches(): void {
    const branches: PlotBranch[] = [
      {
        id: 'branch-first-room',
        trigger: { type: 'room_enter', target: 'entrance' },
        description: 'Your journey begins. The dungeon holds many secrets...',
        consequences: {
          storyShift: 'The adventure commences',
        },
        isActivated: false,
      },
      {
        id: 'branch-first-monster',
        trigger: { type: 'monster_defeat', target: 'goblin1' },
        description: 'Your first victory echoes through the halls. Something awakens...',
        consequences: {
          storyShift: 'The dungeon takes notice of you',
        },
        isActivated: false,
      },
      {
        id: 'branch-treasure-found',
        trigger: { type: 'room_enter', target: 'treasure' },
        description: 'Gold glimmers in the darkness, but so does danger.',
        consequences: {
          storyShift: 'You have entered the dragon domain',
        },
        isActivated: false,
      },
      {
        id: 'branch-three-clues',
        trigger: {
          type: 'time_based',
          condition: (ctx) => ctx.discoveredClues.length >= 3,
        },
        description: 'The pieces of the puzzle begin to fit together. A pattern emerges.',
        consequences: {
          storyShift: 'The true purpose of the dungeon reveals itself',
        },
        isActivated: false,
      },
    ];

    branches.forEach((branch) => {
      this.state.generatedContent.set(branch.id, {
        id: branch.id,
        type: 'event',
        content: branch.description,
        timestamp: Date.now(),
        isRevealed: false,
        relevanceScore: 0.8,
      });
    });
  }

  updateFromGameState(gameState: GameState): void {
    const player = gameState.players[gameState.currentPlayerId];
    if (!player) return;

    this.state.context.playerName = player.name;
    this.state.context.currentRoom = player.roomId;
    this.state.context.inventory = player.inventory.map((i) => i.name);
    
    this.checkPlotTriggers();
    this.notifyUpdate();
  }

  recordAction(
    type: PlayerAction['type'],
    roomId: string,
    description: string,
    target?: string
  ): void {
    const action: PlayerAction = {
      id: uuidv4(),
      type,
      timestamp: Date.now(),
      roomId,
      target,
      description,
    };

    this.actionHistory.push(action);
    this.state.context.recentActions.push(action);

    if (this.actionHistory.length > this.maxHistorySize) {
      this.actionHistory.shift();
    }
    if (this.state.context.recentActions.length > 10) {
      this.state.context.recentActions.shift();
    }

    this.updateContextForAction(action);
    this.checkPlotTriggers();
    this.advancePlot();
    this.notifyUpdate();
  }

  private updateContextForAction(action: PlayerAction): void {
    switch (action.type) {
      case 'move':
        if (!this.state.context.visitedRooms.includes(action.roomId)) {
          this.state.context.visitedRooms.push(action.roomId);
        }
        break;
      case 'pickup':
        if (action.target && !this.state.context.inventory.includes(action.target)) {
          this.state.context.inventory.push(action.target);
        }
        break;
      case 'attack':
        if (action.target && !this.state.context.defeatedMonsters.includes(action.target)) {
          this.state.context.defeatedMonsters.push(action.target);
        }
        break;
    }
  }

  private checkPlotTriggers(): void {
    const ctx = this.state.context;

    this.state.clues.forEach((clue) => {
      if (
        !clue.isDiscovered &&
        clue.roomId === ctx.currentRoom &&
        this.shouldDiscoverClue(clue)
      ) {
        this.discoverClue(clue.id);
      }
    });

    this.state.generatedContent.forEach((content, id) => {
      if (content.type === 'event' && !content.isRevealed) {
        const branchId = id;
        const branch = this.getPlotBranch(branchId);
        if (branch && this.shouldTriggerBranch(branch)) {
          content.isRevealed = true;
          branch.isActivated = true;
          this.state.activeBranches.push(branchId);
        }
      }
    });
  }

  private shouldDiscoverClue(clue: Clue): boolean {
    const ctx = this.state.context;
    const roomVisits = ctx.visitedRooms.filter((r) => r === clue.roomId).length;
    const clueCount = ctx.discoveredClues.length;
    
    const discoveryChance = Math.min(0.3 + roomVisits * 0.2 + clueCount * 0.1, 0.9);
    return Math.random() < discoveryChance;
  }

  private shouldTriggerBranch(branch: PlotBranch): boolean {
    const ctx = this.state.context;
    const trigger = branch.trigger;

    switch (trigger.type) {
      case 'room_enter':
        return ctx.currentRoom === trigger.target;
      case 'monster_defeat':
        return trigger.target ? ctx.defeatedMonsters.includes(trigger.target) : ctx.defeatedMonsters.length > 0;
      case 'item_pickup':
        return trigger.target ? ctx.inventory.includes(trigger.target) : ctx.inventory.length > 0;
      case 'time_based':
        return trigger.condition ? trigger.condition(ctx) : false;
      default:
        return false;
    }
  }

  private getPlotBranch(id: string): PlotBranch | undefined {
    return undefined;
  }

  private advancePlot(): void {
    const progression = 
      this.state.context.visitedRooms.length * 10 +
      this.state.context.defeatedMonsters.length * 15 +
      this.state.context.discoveredClues.length * 20 +
      this.state.context.inventory.length * 5;
    
    this.state.plotProgression = progression;
    this.state.context.currentPlotPoint = Math.floor(progression / 50);
  }

  async generateRoomDescription(roomId: string): Promise<string> {
    const existing = this.state.generatedContent.get(`room-${roomId}`);
    if (existing && existing.isRevealed) {
      return existing.content;
    }

    const description = await this.generator.generateRoomDescription(
      roomId,
      this.state.context
    );

    this.state.generatedContent.set(`room-${roomId}`, {
      id: `room-${roomId}`,
      type: 'room_description',
      content: description,
      roomId,
      timestamp: Date.now(),
      isRevealed: true,
      relevanceScore: 1.0,
    });

    this.notifyUpdate();
    return description;
  }

  async generateMonsterFlavor(monsterId: string): Promise<string> {
    const existing = this.state.generatedContent.get(`monster-${monsterId}`);
    if (existing && existing.isRevealed) {
      return existing.content;
    }

    const flair = await this.generator.generateMonsterFlavor(
      monsterId,
      this.state.context
    );

    this.state.generatedContent.set(`monster-${monsterId}`, {
      id: `monster-${monsterId}`,
      type: 'monster_flavor',
      content: flair,
      targetId: monsterId,
      timestamp: Date.now(),
      isRevealed: true,
      relevanceScore: 0.9,
    });

    this.notifyUpdate();
    return flair;
  }

  async generateItemDescription(itemId: string): Promise<string> {
    const existing = this.state.generatedContent.get(`item-${itemId}`);
    if (existing && existing.isRevealed) {
      return existing.content;
    }

    const description = await this.generator.generateItemDescription(
      itemId,
      this.state.context
    );

    this.state.generatedContent.set(`item-${itemId}`, {
      id: `item-${itemId}`,
      type: 'item_description',
      content: description,
      targetId: itemId,
      timestamp: Date.now(),
      isRevealed: true,
      relevanceScore: 0.85,
    });

    this.notifyUpdate();
    return description;
  }

  private async discoverClue(clueId: string): Promise<void> {
    const clue = this.state.clues.find((c) => c.id === clueId);
    if (!clue || clue.isDiscovered) return;

    clue.isDiscovered = true;
    clue.discoveredAt = Date.now();

    const content = await this.generator.generateClue(clue.roomId, this.state.context);
    clue.content = content;

    this.state.context.discoveredClues.push(clueId);

    this.state.generatedContent.set(clueId, {
      id: clueId,
      type: 'clue',
      content: `\n🔍 **线索发现!**\n${clue.hint}\n\n${content}`,
      roomId: clue.roomId,
      timestamp: Date.now(),
      isRevealed: true,
      relevanceScore: clue.importance === 'high' ? 1.0 : 0.7,
    });

    this.notifyUpdate();
  }

  async triggerRandomEvent(): Promise<string> {
    const event = await this.generator.generateEvent('random', this.state.context);
    
    const eventId = `event-${uuidv4()}`;
    this.state.generatedContent.set(eventId, {
      id: eventId,
      type: 'event',
      content: `\n✨ **事件!**\n${event}`,
      timestamp: Date.now(),
      isRevealed: true,
      relevanceScore: 0.8,
    });

    this.notifyUpdate();
    return event;
  }

  getClueForRoom(roomId: string): Clue | undefined {
    return this.state.clues.find((c) => c.roomId === roomId && !c.isDiscovered);
  }

  getDiscoveredClues(): Clue[] {
    return this.state.clues.filter((c) => c.isDiscovered);
  }

  getRevealedContent(): GeneratedContent[] {
    return Array.from(this.state.generatedContent.values()).filter((c) => c.isRevealed);
  }

  getStorySummary(): string {
    const ctx = this.state.context;
    return `
📖 **冒险总结**

**玩家:** ${ctx.playerName || '未知'}
**当前位置:** ${ctx.currentRoom}
**已探索房间:** ${ctx.visitedRooms.length}/5
**击败怪物:** ${ctx.defeatedMonsters.length}/4
**发现线索:** ${ctx.discoveredClues.length}/5
**背包物品:** ${ctx.inventory.length}
**剧情进度:** ${this.state.plotProgression}%

**种子:** ${this.state.uniqueSeed}
每次游戏都是独特的体验!
    `.trim();
  }

  getState(): StoryState {
    return { ...this.state };
  }

  getContext(): StoryContext {
    return { ...this.state.context };
  }

  getSeed(): number {
    return this.state.uniqueSeed;
  }

  regenerateStory(newSeed?: number): void {
    const seed = newSeed || Math.floor(Math.random() * 1000000);
    this.generator.setSeed(seed);
    
    this.state = {
      context: {
        ...this.state.context,
        storySeed: seed,
        currentPlotPoint: 0,
        recentActions: [],
      },
      generatedContent: new Map(),
      activeBranches: [],
      clues: this.initializeClues(seed),
      plotProgression: 0,
      uniqueSeed: seed,
    };

    this.setupPlotBranches();
    this.notifyUpdate();
  }

  setOnStoryUpdate(callback: (state: StoryState) => void): void {
    this.onStoryUpdate = callback;
  }

  private notifyUpdate(): void {
    if (this.onStoryUpdate) {
      this.onStoryUpdate(this.state);
    }
  }

  isReady(): boolean {
    return this.generator.isReady();
  }
}
