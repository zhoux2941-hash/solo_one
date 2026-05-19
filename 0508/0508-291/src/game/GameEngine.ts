import { v4 as uuidv4 } from 'uuid';
import { Player, Room, Monster, Item, CombatState, Message, GameState } from '../types';
import { CRDTDocument } from '../crdt/CRDTDocument';
import { PeerNetwork } from '../network/PeerNetwork';
import { DistributedHashTable } from '../dht/DistributedHashTable';
import { StoryManager } from '../ai/StoryManager';
import { StoryState } from '../ai/types';

const MAX_PLAYERS_PER_ROOM = 8;

export class GameEngine {
  private crdt: CRDTDocument<GameState>;
  private peerNetwork: PeerNetwork;
  private dht: DistributedHashTable;
  private currentPlayerId: string;
  private onMessageCallback?: (message: Message) => void;
  private onStateChange?: (state: GameState) => void;
  private storyManager: StoryManager;
  private onStoryUpdate?: (state: StoryState) => void;
  private aiEnabled: boolean = true;

  constructor(peerNetwork: PeerNetwork, storySeed?: number) {
    this.peerNetwork = peerNetwork;
    this.currentPlayerId = peerNetwork.nodeId;
    this.dht = new DistributedHashTable(peerNetwork.nodeId, peerNetwork);
    this.storyManager = new StoryManager(storySeed);

    const initialState: GameState = {
      players: {},
      rooms: this.createInitialRooms(),
      monsters: {},
      combats: {},
      messages: [],
      currentPlayerId: this.currentPlayerId,
    };

    this.crdt = new CRDTDocument(peerNetwork.nodeId, initialState);
    this.crdt.setOnStateChange((state) => this.onStateChange?.(state));

    this.setupNetworkHandlers();
    this.setupStoryIntegration();
  }

  private setupStoryIntegration(): void {
    this.storyManager.setOnStoryUpdate((state) => {
      this.onStoryUpdate?.(state);
    });
  }

  private createInitialRooms(): { [id: string]: Room } {
    const rooms: { [id: string]: Room } = {};

    rooms['entrance'] = {
      id: 'entrance',
      name: '洞穴入口',
      description: '你站在一个昏暗的洞穴入口前。空气中弥漫着潮湿和神秘的气息。',
      exits: { north: 'hallway', east: 'treasure' },
      items: ['torch'],
      monsters: [],
      maxPlayers: MAX_PLAYERS_PER_ROOM,
      currentPlayers: [],
    };

    rooms['hallway'] = {
      id: 'hallway',
      name: '幽暗走廊',
      description: '一条狭长的走廊延伸向前，两侧的墙壁上刻满了古老的符文。',
      exits: { south: 'entrance', north: 'chamber', west: 'armory' },
      items: [],
      monsters: ['goblin1'],
      maxPlayers: MAX_PLAYERS_PER_ROOM,
      currentPlayers: [],
    };

    rooms['treasure'] = {
      id: 'treasure',
      name: '宝藏室',
      description: '金光闪闪的宝藏室！金币和宝石堆积如山。',
      exits: { west: 'entrance' },
      items: ['gold_sword', 'health_potion'],
      monsters: ['dragon1'],
      maxPlayers: MAX_PLAYERS_PER_ROOM,
      currentPlayers: [],
    };

    rooms['armory'] = {
      id: 'armory',
      name: '军械库',
      description: '这里曾是战士们存放武器的地方。架子上还有一些遗留的装备。',
      exits: { east: 'hallway' },
      items: ['iron_shield', 'steel_armor'],
      monsters: ['skeleton1'],
      maxPlayers: MAX_PLAYERS_PER_ROOM,
      currentPlayers: [],
    };

    rooms['chamber'] = {
      id: 'chamber',
      name: '祭坛密室',
      description: '一个神秘的祭坛矗立在房间中央。空气中充满了魔力的波动。',
      exits: { south: 'hallway' },
      items: ['magic_ring'],
      monsters: ['wraith1'],
      maxPlayers: MAX_PLAYERS_PER_ROOM,
      currentPlayers: [],
    };

    return rooms;
  }

  private createInitialMonsters(): { [id: string]: Monster } {
    const monsters: { [id: string]: Monster } = {};

    monsters['goblin1'] = {
      id: 'goblin1',
      name: '哥布林',
      hp: 30,
      maxHp: 30,
      attack: 8,
      defense: 3,
      roomId: 'hallway',
    };

    monsters['dragon1'] = {
      id: 'dragon1',
      name: '幼龙',
      hp: 100,
      maxHp: 100,
      attack: 20,
      defense: 10,
      roomId: 'treasure',
    };

    monsters['skeleton1'] = {
      id: 'skeleton1',
      name: '骷髅战士',
      hp: 40,
      maxHp: 40,
      attack: 12,
      defense: 5,
      roomId: 'armory',
    };

    monsters['wraith1'] = {
      id: 'wraith1',
      name: '幽灵',
      hp: 60,
      maxHp: 60,
      attack: 15,
      defense: 2,
      roomId: 'chamber',
    };

    return monsters;
  }

  private createItems(): { [id: string]: Item } {
    const items: { [id: string]: Item } = {};

    items['torch'] = {
      id: 'torch',
      name: '火把',
      description: '一支普通的火把，可以照亮黑暗的区域。',
      type: 'misc',
    };

    items['gold_sword'] = {
      id: 'gold_sword',
      name: '黄金之剑',
      description: '一把闪耀着金光的利剑，攻击力极强。',
      type: 'weapon',
      effect: { stat: 'attack', value: 15 },
    };

    items['health_potion'] = {
      id: 'health_potion',
      name: '生命药水',
      description: '恢复50点生命值的神奇药水。',
      type: 'potion',
      effect: { stat: 'hp', value: 50 },
    };

    items['iron_shield'] = {
      id: 'iron_shield',
      name: '铁盾',
      description: '坚固的铁制盾牌，可以有效抵御敌人的攻击。',
      type: 'armor',
      effect: { stat: 'defense', value: 8 },
    };

    items['steel_armor'] = {
      id: 'steel_armor',
      name: '钢甲',
      description: '厚重的钢制盔甲，提供强大的防护。',
      type: 'armor',
      effect: { stat: 'defense', value: 12 },
    };

    items['magic_ring'] = {
      id: 'magic_ring',
      name: '魔力戒指',
      description: '一枚蕴含神秘力量的戒指，提升各项属性。',
      type: 'misc',
      effect: { stat: 'hp', value: 20 },
    };

    return items;
  }

  private pendingSyncRequests: Map<string, NodeJS.Timeout> = new Map();
  private syncRetryDelay: number = 2000;
  private maxSyncRetries: number = 3;
  private syncAttempts: Map<string, number> = new Map();

  private setupNetworkHandlers() {
    this.peerNetwork.setOnMessage((from, data) => {
      this.dht.handleMessage(from, data);

      if (data.type === 'crdt-operation') {
        this.crdt.applyOperation(data.operation);
      } else if (data.type === 'crdt-full-sync-request') {
        this.handleFullSyncRequest(from);
      } else if (data.type === 'crdt-full-sync-response') {
        this.handleFullSyncResponse(from, data.snapshot, data.operations);
      } else if (data.type === 'crdt-sync-request') {
        const ops = this.crdt.getOperationsSince(data.vectorClock);
        this.peerNetwork.send(from, {
          type: 'crdt-sync-response',
          operations: ops,
        });
      } else if (data.type === 'crdt-sync-response') {
        this.handleIncrementalSyncResponse(from, data.operations);
      } else if (data.type === 'chat') {
        this.addMessage({
          type: 'chat',
          sender: data.sender,
          content: data.content,
          timestamp: data.timestamp,
        });
      }
    });

    this.peerNetwork.setOnPeerConnected((peerId) => {
      const state = this.crdt.getState();
      const isReconnect = !!state.players[peerId];
      
      if (isReconnect) {
        this.addSystemMessage(`玩家 ${state.players[peerId]?.name || peerId.slice(0, 8)} 重新连接了`);
      } else {
        this.addSystemMessage(`玩家 ${peerId.slice(0, 8)} 加入了游戏`);
      }
      
      this.initiateFullSync(peerId);
    });

    this.peerNetwork.setOnPeerDisconnected((peerId) => {
      this.cleanupSync(peerId);
      const state = this.crdt.getState();
      if (state.players[peerId]) {
        const player = state.players[peerId];
        this.addSystemMessage(`玩家 ${player.name || peerId.slice(0, 8)} 断开连接`);
        this.crdt.set(`players.${peerId}.isOnline`, false);
        this.crdt.set(`players.${peerId}.lastSeen`, Date.now());
        this.removePlayerFromRoom(peerId, player.roomId);
      } else {
        this.addSystemMessage(`玩家 ${peerId.slice(0, 8)} 离开了游戏`);
      }
    });
  }

  private initiateFullSync(peerId: string) {
    this.cleanupSync(peerId);
    this.syncAttempts.set(peerId, 0);
    this.sendFullSyncRequest(peerId);
  }

  private sendFullSyncRequest(peerId: string) {
    const attempts = this.syncAttempts.get(peerId) || 0;
    if (attempts >= this.maxSyncRetries) {
      this.addSystemMessage(`与 ${peerId.slice(0, 8)} 的同步失败，已达最大重试次数`);
      this.cleanupSync(peerId);
      return;
    }

    this.syncAttempts.set(peerId, attempts + 1);
    this.peerNetwork.send(peerId, {
      type: 'crdt-full-sync-request',
      vectorClock: this.crdt.getVectorClock(),
      playerId: this.currentPlayerId,
    });

    const timeout = setTimeout(() => {
      this.addSystemMessage(`同步超时，正在重试... (${attempts + 1}/${this.maxSyncRetries})`);
      this.sendFullSyncRequest(peerId);
    }, this.syncRetryDelay);

    this.pendingSyncRequests.set(peerId, timeout);
  }

  private handleFullSyncRequest(peerId: string) {
    const snapshot = this.crdt.createSnapshot();
    const allOperations = this.crdt.getOperations();

    this.peerNetwork.send(peerId, {
      type: 'crdt-full-sync-response',
      snapshot: {
        state: snapshot.state,
        vectorClock: snapshot.vectorClock,
      },
      operations: allOperations,
    });
  }

  private handleFullSyncResponse(peerId: string, snapshot: any, operations: any[]) {
    this.cleanupSync(peerId);
    
    const localClock = this.crdt.getVectorClock();
    const remoteClock = snapshot.vectorClock;
    
    const shouldMergeSnapshot = this.isClockGreater(remoteClock, localClock);
    
    if (shouldMergeSnapshot) {
      this.crdt.applySnapshot(snapshot);
      this.addSystemMessage(`已从 ${peerId.slice(0, 8)} 同步完整游戏状态`);
    }
    
    if (operations.length > 0) {
      const applied = this.crdt.applyOperations(operations);
      if (applied > 0 && !shouldMergeSnapshot) {
        this.addSystemMessage(`已应用 ${applied} 个状态更新`);
      }
    }

    this.verifyPlayerState();
    this.syncWithAllPeers();
  }

  private handleIncrementalSyncResponse(peerId: string, operations: any[]) {
    if (operations.length > 0) {
      const applied = this.crdt.applyOperations(operations);
      if (applied > 0) {
        console.log(`Applied ${applied} incremental operations from ${peerId}`);
      }
    }
  }

  private isClockGreater(a: { [nodeId: string]: number }, b: { [nodeId: string]: number }): boolean {
    const allNodes = new Set([...Object.keys(a), ...Object.keys(b)]);
    let hasGreater = false;
    for (const nodeId of allNodes) {
      const aVal = a[nodeId] || 0;
      const bVal = b[nodeId] || 0;
      if (aVal > bVal) {
        hasGreater = true;
      } else if (aVal < bVal) {
        return false;
      }
    }
    return hasGreater;
  }

  private syncWithPeer(peerId: string) {
    this.peerNetwork.send(peerId, {
      type: 'crdt-sync-request',
      vectorClock: this.crdt.getVectorClock(),
    });
  }

  private syncWithAllPeers() {
    const connectedPeers = this.peerNetwork.getConnectedPeers();
    connectedPeers.forEach(peerId => {
      if (!this.pendingSyncRequests.has(peerId)) {
        this.syncWithPeer(peerId);
      }
    });
  }

  private cleanupSync(peerId: string) {
    const timeout = this.pendingSyncRequests.get(peerId);
    if (timeout) {
      clearTimeout(timeout);
      this.pendingSyncRequests.delete(peerId);
    }
    this.syncAttempts.delete(peerId);
  }

  private verifyPlayerState() {
    const state = this.crdt.getState();
    const player = state.players[this.currentPlayerId];
    
    if (player) {
      if (player.isOnline === false) {
        this.crdt.set(`players.${this.currentPlayerId}.isOnline`, true);
      }
      
      if (!state.rooms[player.roomId]?.currentPlayers.includes(this.currentPlayerId)) {
        this.addPlayerToRoom(this.currentPlayerId, player.roomId);
      }
    }
    
    this.verifyRoomState();
    this.verifyMonsterState();
  }

  private verifyRoomState() {
    const state = this.crdt.getState();
    
    Object.values(state.rooms).forEach(room => {
      room.currentPlayers = room.currentPlayers.filter(playerId => {
        const player = state.players[playerId];
        return player && player.isOnline;
      });
    });
  }

  private verifyMonsterState() {
    const state = this.crdt.getState();
    const monsters = this.createInitialMonsters();
    
    Object.values(monsters).forEach(monster => {
      if (!state.monsters[monster.id] && monster.hp > 0) {
        this.crdt.set(`monsters.${monster.id}`, monster);
      }
    });
  }

  destroy() {
    this.pendingSyncRequests.forEach(timeout => clearTimeout(timeout));
    this.pendingSyncRequests.clear();
    this.syncAttempts.clear();
    this.peerNetwork.disconnectAll();
  }

  setOnMessage(callback: (message: Message) => void) {
    this.onMessageCallback = callback;
  }

  setOnStateChange(callback: (state: GameState) => void) {
    this.onStateChange = callback;
  }

  getState(): GameState {
    return this.crdt.getState();
  }

  async initializeAI(): Promise<void> {
    await this.storyManager.initialize();
  }

  joinGame(playerName: string) {
    const state = this.crdt.getState();
    const existingPlayer = state.players[this.currentPlayerId];

    if (existingPlayer) {
      this.addSystemMessage(`欢迎回来，${existingPlayer.name}！`);
      
      this.crdt.set(`players.${this.currentPlayerId}.isOnline`, true);
      this.crdt.set(`players.${this.currentPlayerId}.lastSeen`, Date.now());
      this.crdt.set(`players.${this.currentPlayerId}.name`, playerName);
      
      if (existingPlayer.hp <= 0) {
        this.crdt.set(`players.${this.currentPlayerId}.hp`, 100);
        this.crdt.set(`players.${this.currentPlayerId}.roomId`, 'entrance');
        this.addSystemMessage('你已在洞穴入口复活。');
      }
      
      this.addPlayerToRoom(this.currentPlayerId, state.players[this.currentPlayerId].roomId);
      this.addSystemMessage(`当前位置: ${state.rooms[state.players[this.currentPlayerId].roomId]?.name || '未知'}`);
      
      this.synchronizePlayerState();
    } else {
      const items = this.createItems();
      const newPlayer: Player = {
        id: this.currentPlayerId,
        name: playerName,
        roomId: 'entrance',
        hp: 100,
        maxHp: 100,
        attack: 10,
        defense: 5,
        inventory: [items['torch']],
        isOnline: true,
        lastSeen: Date.now(),
      };

      this.crdt.set(`players.${this.currentPlayerId}`, newPlayer);
      this.addPlayerToRoom(this.currentPlayerId, 'entrance');

      if (Object.keys(state.monsters).length === 0) {
        const monsters = this.createInitialMonsters();
        Object.values(monsters).forEach((monster) => {
          this.crdt.set(`monsters.${monster.id}`, monster);
        });
      }

      this.addSystemMessage(`${playerName} 加入了游戏！`);
      this.look();
    }

    this.storyManager.updateFromGameState(this.crdt.getState());
    this.triggerFullSync();
    this.broadcastPlayerJoin();
  }

  private synchronizePlayerState() {
    const connectedPeers = this.peerNetwork.getConnectedPeers();
    if (connectedPeers.length > 0) {
      this.addSystemMessage(`正在与 ${connectedPeers.length} 个节点同步游戏状态...`);
    }
  }

  private triggerFullSync() {
    const connectedPeers = this.peerNetwork.getConnectedPeers();
    connectedPeers.forEach(peerId => {
      this.initiateFullSync(peerId);
    });
  }

  private broadcastPlayerJoin() {
    const state = this.crdt.getState();
    const player = state.players[this.currentPlayerId];
    if (player) {
      this.peerNetwork.broadcast({
        type: 'player-join',
        playerId: this.currentPlayerId,
        playerName: player.name,
        timestamp: Date.now(),
      });
    }
  }

  async move(direction: string): Promise<boolean> {
    const state = this.crdt.getState();
    const player = state.players[this.currentPlayerId];

    if (!player) {
      this.addSystemMessage('请先加入游戏！');
      return false;
    }

    const currentRoom = state.rooms[player.roomId];
    if (!currentRoom.exits[direction]) {
      this.addSystemMessage(`无法向 ${direction} 移动，那里没有出口。`);
      return false;
    }

    const newRoomId = currentRoom.exits[direction];
    const newRoom = state.rooms[newRoomId];

    if (newRoom.currentPlayers.length >= newRoom.maxPlayers) {
      this.addSystemMessage(`${newRoom.name} 已满员，请稍后再试。`);
      return false;
    }

    this.removePlayerFromRoom(this.currentPlayerId, player.roomId);
    this.crdt.set(`players.${this.currentPlayerId}.roomId`, newRoomId);
    this.addPlayerToRoom(this.currentPlayerId, newRoomId);

    this.storyManager.recordAction('move', newRoomId, `移动到 ${newRoomId}`, direction);
    this.storyManager.updateFromGameState(this.crdt.getState());

    this.addSystemMessage(`你向 ${direction} 移动，来到了 ${newRoom.name}。`);
    
    if (this.aiEnabled) {
      const aiDescription = await this.storyManager.generateRoomDescription(newRoomId);
      this.addSystemMessage('\n' + aiDescription);
      
      if (Math.random() < 0.3) {
        const event = await this.storyManager.triggerRandomEvent();
        this.addSystemMessage('\n' + event);
      }
    } else {
      this.look();
    }

    this.broadcastState();
    return true;
  }

  look() {
    const state = this.crdt.getState();
    const player = state.players[this.currentPlayerId];
    if (!player) return;

    const room = state.rooms[player.roomId];
    this.addSystemMessage(`\n=== ${room.name} ===`);
    this.addSystemMessage(room.description);

    if (room.items.length > 0) {
      const items = this.createItems();
      const itemNames = room.items.map((id) => items[id]?.name || id).join(', ');
      this.addSystemMessage(`你看到了: ${itemNames}`);
    }

    if (room.monsters.length > 0) {
      const monsterNames = room.monsters
        .map((id) => state.monsters[id]?.name || id)
        .join(', ');
      this.addSystemMessage(`危险！这里有: ${monsterNames}`);
    }

    const otherPlayers = room.currentPlayers.filter((pid) => pid !== this.currentPlayerId);
    if (otherPlayers.length > 0) {
      const playerNames = otherPlayers
        .map((pid) => state.players[pid]?.name || pid.slice(0, 8))
        .join(', ');
      this.addSystemMessage(`其他玩家: ${playerNames}`);
    }

    const exits = Object.keys(room.exits).join(', ');
    this.addSystemMessage(`出口方向: ${exits}`);
  }

  async pickUp(itemId: string): Promise<boolean> {
    const state = this.crdt.getState();
    const player = state.players[this.currentPlayerId];
    if (!player) {
      this.addSystemMessage('请先加入游戏！');
      return false;
    }

    const room = state.rooms[player.roomId];
    if (!room.items.includes(itemId)) {
      this.addSystemMessage(`这里没有 ${itemId}。`);
      return false;
    }

    const items = this.createItems();
    const item = items[itemId];

    this.crdt.remove(`rooms.${player.roomId}.items`, itemId);
    this.crdt.add(`players.${this.currentPlayerId}.inventory`, item);

    this.storyManager.recordAction('pickup', player.roomId, `拾取 ${item.name}`, itemId);
    this.storyManager.updateFromGameState(this.crdt.getState());

    this.addSystemMessage(`你拾取了 ${item.name}！`);
    
    if (this.aiEnabled) {
      const itemDescription = await this.storyManager.generateItemDescription(itemId);
      this.addSystemMessage(itemDescription);
    }

    this.applyItemEffect(item);
    this.broadcastState();
    return true;
  }

  private applyItemEffect(item: Item) {
    if (item.effect) {
      if (item.effect.stat === 'hp') {
        const state = this.crdt.getState();
        const player = state.players[this.currentPlayerId];
        const newHp = Math.min(player.maxHp, player.hp + item.effect.value);
        this.crdt.set(`players.${this.currentPlayerId}.hp`, newHp);
        this.addSystemMessage(`生命值恢复了 ${item.effect.value} 点！`);
      } else if (item.effect.stat === 'attack') {
        const state = this.crdt.getState();
        const player = state.players[this.currentPlayerId];
        this.crdt.set(
          `players.${this.currentPlayerId}.attack`,
          player.attack + item.effect.value
        );
        this.addSystemMessage(`攻击力提升了 ${item.effect.value} 点！`);
      } else if (item.effect.stat === 'defense') {
        const state = this.crdt.getState();
        const player = state.players[this.currentPlayerId];
        this.crdt.set(
          `players.${this.currentPlayerId}.defense`,
          player.defense + item.effect.value
        );
        this.addSystemMessage(`防御力提升了 ${item.effect.value} 点！`);
      }
    }
  }

  async attack(monsterId: string): Promise<boolean> {
    const state = this.crdt.getState();
    const player = state.players[this.currentPlayerId];
    if (!player) {
      this.addSystemMessage('请先加入游戏！');
      return false;
    }

    const monster = state.monsters[monsterId];
    if (!monster || monster.roomId !== player.roomId) {
      this.addSystemMessage(`没有找到 ${monsterId}。`);
      return false;
    }

    const combatId = `${this.currentPlayerId}-${monsterId}`;
    const existingCombat = state.combats[combatId];

    if (!existingCombat || !existingCombat.isActive) {
      const combat: CombatState = {
        playerId: this.currentPlayerId,
        monsterId,
        turn: 'player',
        log: [`战斗开始！你对 ${monster.name} 发起了攻击。`],
        isActive: true,
      };
      this.crdt.set(`combats.${combatId}`, combat);
      
      if (this.aiEnabled) {
        const monsterFlavor = await this.storyManager.generateMonsterFlavor(monsterId);
        this.addSystemMessage(monsterFlavor);
      } else {
        this.addSystemMessage(`战斗开始！你对 ${monster.name} 发起了攻击。`);
      }
    }

    this.storyManager.recordAction('attack', player.roomId, `攻击 ${monster.name}`, monsterId);

    const damage = Math.max(1, player.attack - monster.defense + Math.floor(Math.random() * 5));
    const newMonsterHp = monster.hp - damage;

    this.addSystemMessage(`你对 ${monster.name} 造成了 ${damage} 点伤害！`);

    if (newMonsterHp <= 0) {
      this.crdt.set(`monsters.${monsterId}.hp`, 0);
      this.crdt.set(`combats.${combatId}.isActive`, false);
      this.crdt.remove(`rooms.${player.roomId}.monsters`, monsterId);
      this.addSystemMessage(`你击败了 ${monster.name}！`);
      
      this.storyManager.recordAction('attack', player.roomId, `击败 ${monster.name}`, monsterId);
      this.storyManager.updateFromGameState(this.crdt.getState());
    } else {
      this.crdt.set(`monsters.${monsterId}.hp`, newMonsterHp);
      this.crdt.set(`combats.${combatId}.turn`, 'monster');

      setTimeout(() => {
        this.monsterAttack(combatId, monsterId, this.currentPlayerId);
      }, 1000);
    }

    this.broadcastState();
    return true;
  }

  private monsterAttack(combatId: string, monsterId: string, playerId: string) {
    const state = this.crdt.getState();
    const monster = state.monsters[monsterId];
    const player = state.players[playerId];

    if (!monster || !player || monster.hp <= 0) {
      return;
    }

    const damage = Math.max(1, monster.attack - player.defense + Math.floor(Math.random() * 3));
    const newPlayerHp = player.hp - damage;

    this.addSystemMessage(`${monster.name} 对你造成了 ${damage} 点伤害！`);

    if (newPlayerHp <= 0) {
      this.crdt.set(`players.${playerId}.hp`, 0);
      this.crdt.set(`combats.${combatId}.isActive`, false);
      this.addSystemMessage('你被击败了...');
      setTimeout(() => this.respawn(), 3000);
    } else {
      this.crdt.set(`players.${playerId}.hp`, newPlayerHp);
      this.crdt.set(`combats.${combatId}.turn`, 'player');
    }

    this.broadcastState();
  }

  private respawn() {
    this.crdt.set(`players.${this.currentPlayerId}.hp`, 100);
    this.crdt.set(`players.${this.currentPlayerId}.roomId`, 'entrance');
    this.addSystemMessage('你在洞穴入口复活了...');
    this.broadcastState();
  }

  checkInventory() {
    const state = this.crdt.getState();
    const player = state.players[this.currentPlayerId];
    if (!player) {
      this.addSystemMessage('请先加入游戏！');
      return;
    }

    this.addSystemMessage('\n=== 背包 ===');
    if (player.inventory.length === 0) {
      this.addSystemMessage('你的背包是空的。');
    } else {
      player.inventory.forEach((item) => {
        this.addSystemMessage(`- ${item.name}: ${item.description}`);
      });
    }
    this.addSystemMessage(`\nHP: ${player.hp}/${player.maxHp}`);
    this.addSystemMessage(`攻击力: ${player.attack}`);
    this.addSystemMessage(`防御力: ${player.defense}`);
  }

  checkPlayers() {
    const state = this.crdt.getState();
    const onlinePlayers = Object.values(state.players).filter((p) => p.isOnline);

    this.addSystemMessage('\n=== 在线玩家 ===');
    onlinePlayers.forEach((p) => {
      const room = state.rooms[p.roomId];
      this.addSystemMessage(`- ${p.name} (HP: ${p.hp}/${p.maxHp}) @ ${room?.name || '未知'}`);
    });
    this.addSystemMessage(`总计: ${onlinePlayers.length} 名玩家在线`);
  }

  sendChatMessage(content: string) {
    const state = this.crdt.getState();
    const player = state.players[this.currentPlayerId];
    const message: Message = {
      type: 'chat',
      sender: player?.name || this.currentPlayerId.slice(0, 8),
      content,
      timestamp: Date.now(),
    };

    this.addMessage(message);
    this.peerNetwork.broadcast({
      type: 'chat',
      ...message,
    });
  }

  private addMessage(message: Message) {
    this.crdt.add('messages', message);
    this.onMessageCallback?.(message);
  }

  private addSystemMessage(content: string) {
    this.addMessage({
      type: 'system',
      sender: '系统',
      content,
      timestamp: Date.now(),
    });
  }

  private addPlayerToRoom(playerId: string, roomId: string) {
    this.crdt.add(`rooms.${roomId}.currentPlayers`, playerId);
    this.dht.addRoomNode(roomId, playerId);
  }

  private removePlayerFromRoom(playerId: string, roomId: string) {
    this.crdt.remove(`rooms.${roomId}.currentPlayers`, playerId);
    this.dht.removeRoomNode(roomId, playerId);
  }

  private broadcastState() {
    const operations = this.crdt.getOperations();
    if (operations.length > 0) {
      const latestOp = operations[operations.length - 1];
      this.peerNetwork.broadcast({
        type: 'crdt-operation',
        operation: latestOp,
      });
    }
  }

  async processCommand(command: string): Promise<void> {
    const parts = command.trim().toLowerCase().split(' ');
    const cmd = parts[0];
    const args = parts.slice(1).join(' ');

    switch (cmd) {
      case 'north':
      case 'n':
        await this.move('north');
        break;
      case 'south':
      case 's':
        await this.move('south');
        break;
      case 'east':
      case 'e':
        await this.move('east');
        break;
      case 'west':
      case 'w':
        await this.move('west');
        break;
      case 'look':
      case 'l':
        this.look();
        break;
      case 'inventory':
      case 'i':
        this.checkInventory();
        break;
      case 'players':
      case 'who':
        this.checkPlayers();
        break;
      case 'pickup':
      case 'get':
      case 'take':
        if (args) {
          await this.pickUp(args);
        } else {
          this.addSystemMessage('请指定要拾取的物品: pickup <物品ID>');
        }
        break;
      case 'attack':
      case 'kill':
      case 'fight':
        if (args) {
          await this.attack(args);
        } else {
          this.addSystemMessage('请指定要攻击的怪物: attack <怪物ID>');
        }
        break;
      case 'say':
      case 'chat':
        if (args) {
          this.sendChatMessage(args);
        } else {
          this.addSystemMessage('请输入要说的内容');
        }
        break;
      case 'story':
      case 'progress':
        this.showStoryProgress();
        break;
      case 'clues':
        this.showClues();
        break;
      case 'ai':
      case 'toggle-ai':
        this.toggleAI();
        break;
      case 'help':
      case '?':
        this.showHelp();
        break;
      default:
        this.addSystemMessage(`未知命令: ${cmd}。输入 help 查看可用命令。`);
    }
  }

  private showStoryProgress(): void {
    const summary = this.storyManager.getStorySummary();
    this.addSystemMessage('\n' + summary);
  }

  private showClues(): void {
    const clues = this.storyManager.getDiscoveredClues();
    if (clues.length === 0) {
      this.addSystemMessage('你还没有发现任何线索。');
      return;
    }
    
    this.addSystemMessage('\n=== 已发现的线索 ===');
    clues.forEach((clue, index) => {
      const importance = clue.importance === 'high' ? '⭐' : clue.importance === 'medium' ? '📌' : '📎';
      this.addSystemMessage(`${importance} [${clue.roomId}]: ${clue.content}`);
    });
  }

  toggleAI(): void {
    this.aiEnabled = !this.aiEnabled;
    this.addSystemMessage(`AI剧情生成已 ${this.aiEnabled ? '启用' : '禁用'}。`);
  }

  getStoryState(): StoryState | null {
    return this.storyManager.getState();
  }

  setOnStoryUpdate(callback: (state: StoryState) => void): void {
    this.onStoryUpdate = callback;
  }

  regenerateStory(newSeed?: number): void {
    this.storyManager.regenerateStory(newSeed);
    this.addSystemMessage('剧情已重新生成！每次冒险都是独特的体验。');
  }

  isAIReady(): boolean {
    return this.storyManager.isReady();
  }

  private showHelp() {
    this.addSystemMessage('\n=== 可用命令 ===');
    this.addSystemMessage('移动: north(n), south(s), east(e), west(w)');
    this.addSystemMessage('观察: look(l) - 查看当前房间');
    this.addSystemMessage('背包: inventory(i) - 查看背包和属性');
    this.addSystemMessage('拾取: pickup <物品ID> - 拾取物品');
    this.addSystemMessage('攻击: attack <怪物ID> - 攻击怪物');
    this.addSystemMessage('聊天: say <内容> - 发送聊天消息');
    this.addSystemMessage('玩家: players/who - 查看在线玩家');
    this.addSystemMessage('剧情: story/progress - 查看剧情进度');
    this.addSystemMessage('线索: clues - 查看已发现的线索');
    this.addSystemMessage('AI: ai/toggle-ai - 开关AI剧情生成');
    this.addSystemMessage('帮助: help/? - 显示此帮助');
  }
}
