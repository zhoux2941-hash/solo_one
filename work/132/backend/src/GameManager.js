const BSPMapGenerator = require('./generators/BSPMapGenerator');
const RandomWalkMapGenerator = require('./generators/RandomWalkMapGenerator');
const FOVCalculator = require('./utils/FOVCalculator');
const MonsterAI = require('./ai/MonsterAI');
const { v4: uuidv4 } = require('uuid');

const MAP_WIDTH = 80;
const MAP_HEIGHT = 40;
const TILE_SIZE = 16;
const VIEW_RADIUS = 8;
const INVENTORY_SIZE = 20;

const TILES = {
  WALL: 0,
  FLOOR: 1,
  DOOR: 2,
  STAIRS_DOWN: 3,
  STAIRS_UP: 4
};

const EQUIPMENT_SLOTS = {
  WEAPON: 'weapon',
  HELMET: 'helmet',
  ARMOR: 'armor',
  SHIELD: 'shield',
  GLOVES: 'gloves',
  BOOTS: 'boots',
  RING_1: 'ring1',
  RING_2: 'ring2',
  AMULET: 'amulet'
};

const SLOT_NAMES = {
  weapon: '武器',
  helmet: '头盔',
  armor: '护甲',
  shield: '盾牌',
  gloves: '手套',
  boots: '靴子',
  ring1: '戒指',
  ring2: '戒指',
  amulet: '护符'
};

const ITEM_TYPES = {
  CONSUMABLE: 'consumable',
  EQUIPMENT: 'equipment',
  GOLD: 'gold'
};

const ITEM_DEFINITIONS = [
  {
    name: '小治疗药水',
    type: ITEM_TYPES.CONSUMABLE,
    subtype: 'potion',
    effect: { hp: 20 },
    symbol: '!',
    color: '#ff4444',
    description: '恢复20点生命值',
    stackable: true,
    maxStack: 10,
    rarity: 'common'
  },
  {
    name: '大治疗药水',
    type: ITEM_TYPES.CONSUMABLE,
    subtype: 'potion',
    effect: { hp: 50 },
    symbol: '!',
    color: '#ff0000',
    description: '恢复50点生命值',
    stackable: true,
    maxStack: 5,
    rarity: 'uncommon'
  },
  {
    name: '力量药水',
    type: ITEM_TYPES.CONSUMABLE,
    subtype: 'potion',
    effect: { tempAttack: 5, duration: 20 },
    symbol: '!',
    color: '#ff8800',
    description: '临时增加5点攻击力，持续20回合',
    stackable: true,
    maxStack: 5,
    rarity: 'uncommon'
  },
  {
    name: '短剑',
    type: ITEM_TYPES.EQUIPMENT,
    slot: EQUIPMENT_SLOTS.WEAPON,
    baseAttack: 3,
    symbol: '/',
    color: '#a0a0a0',
    description: '一把普通的短剑，+3攻击力',
    rarity: 'common'
  },
  {
    name: '长剑',
    type: ITEM_TYPES.EQUIPMENT,
    slot: EQUIPMENT_SLOTS.WEAPON,
    baseAttack: 6,
    symbol: '|',
    color: '#c0c0c0',
    description: '一把锋利的长剑，+6攻击力',
    rarity: 'uncommon'
  },
  {
    name: '魔法剑',
    type: ITEM_TYPES.EQUIPMENT,
    slot: EQUIPMENT_SLOTS.WEAPON,
    baseAttack: 10,
    baseDefense: 2,
    symbol: '|',
    color: '#44aaff',
    description: '一把附魔的魔法剑，+10攻击力 +2防御力',
    rarity: 'rare'
  },
  {
    name: '皮甲',
    type: ITEM_TYPES.EQUIPMENT,
    slot: EQUIPMENT_SLOTS.ARMOR,
    baseDefense: 2,
    symbol: '[',
    color: '#8b4513',
    description: '简单的皮甲，+2防御力',
    rarity: 'common'
  },
  {
    name: '锁子甲',
    type: ITEM_TYPES.EQUIPMENT,
    slot: EQUIPMENT_SLOTS.ARMOR,
    baseDefense: 5,
    symbol: '[',
    color: '#708090',
    description: '坚固的锁子甲，+5防御力',
    rarity: 'uncommon'
  },
  {
    name: '板甲',
    type: ITEM_TYPES.EQUIPMENT,
    slot: EQUIPMENT_SLOTS.ARMOR,
    baseDefense: 10,
    symbol: '[',
    color: '#4a4a4a',
    description: '厚重的板甲，+10防御力',
    rarity: 'rare'
  },
  {
    name: '小盾牌',
    type: ITEM_TYPES.EQUIPMENT,
    slot: EQUIPMENT_SLOTS.SHIELD,
    baseDefense: 2,
    symbol: ')',
    color: '#8b4513',
    description: '一个小盾牌，+2防御力',
    rarity: 'common'
  },
  {
    name: '铁盾',
    type: ITEM_TYPES.EQUIPMENT,
    slot: EQUIPMENT_SLOTS.SHIELD,
    baseDefense: 4,
    symbol: ')',
    color: '#708090',
    description: '坚固的铁盾，+4防御力',
    rarity: 'uncommon'
  },
  {
    name: '布帽',
    type: ITEM_TYPES.EQUIPMENT,
    slot: EQUIPMENT_SLOTS.HELMET,
    baseDefense: 1,
    symbol: '^',
    color: '#8b4513',
    description: '简单的布帽，+1防御力',
    rarity: 'common'
  },
  {
    name: '铁盔',
    type: ITEM_TYPES.EQUIPMENT,
    slot: EQUIPMENT_SLOTS.HELMET,
    baseDefense: 3,
    symbol: '^',
    color: '#708090',
    description: '坚固的铁盔，+3防御力',
    rarity: 'uncommon'
  },
  {
    name: '皮手套',
    type: ITEM_TYPES.EQUIPMENT,
    slot: EQUIPMENT_SLOTS.GLOVES,
    baseDefense: 1,
    symbol: '{',
    color: '#8b4513',
    description: '简单的皮手套，+1防御力',
    rarity: 'common'
  },
  {
    name: '铁手套',
    type: ITEM_TYPES.EQUIPMENT,
    slot: EQUIPMENT_SLOTS.GLOVES,
    baseDefense: 3,
    baseAttack: 1,
    symbol: '{',
    color: '#708090',
    description: '坚固的铁手套，+3防御力 +1攻击力',
    rarity: 'uncommon'
  },
  {
    name: '皮靴',
    type: ITEM_TYPES.EQUIPMENT,
    slot: EQUIPMENT_SLOTS.BOOTS,
    baseDefense: 1,
    symbol: '~',
    color: '#8b4513',
    description: '简单的皮靴，+1防御力',
    rarity: 'common'
  },
  {
    name: '铁靴',
    type: ITEM_TYPES.EQUIPMENT,
    slot: EQUIPMENT_SLOTS.BOOTS,
    baseDefense: 3,
    symbol: '~',
    color: '#708090',
    description: '坚固的铁靴，+3防御力',
    rarity: 'uncommon'
  },
  {
    name: '力量戒指',
    type: ITEM_TYPES.EQUIPMENT,
    slot: EQUIPMENT_SLOTS.RING_1,
    alternateSlots: [EQUIPMENT_SLOTS.RING_2],
    baseAttack: 3,
    symbol: '=',
    color: '#ffd700',
    description: '附魔的戒指，+3攻击力',
    rarity: 'uncommon'
  },
  {
    name: '守护戒指',
    type: ITEM_TYPES.EQUIPMENT,
    slot: EQUIPMENT_SLOTS.RING_1,
    alternateSlots: [EQUIPMENT_SLOTS.RING_2],
    baseDefense: 3,
    symbol: '=',
    color: '#44aaff',
    description: '附魔的戒指，+3防御力',
    rarity: 'uncommon'
  },
  {
    name: '生命护符',
    type: ITEM_TYPES.EQUIPMENT,
    slot: EQUIPMENT_SLOTS.AMULET,
    baseMaxHp: 20,
    symbol: '"',
    color: '#ff44ff',
    description: '神奇的护符，+20最大生命值',
    rarity: 'rare'
  },
  {
    name: '金币',
    type: ITEM_TYPES.GOLD,
    value: 10,
    symbol: '*',
    color: '#ffd700',
    description: '闪闪发光的金币',
    stackable: true,
    maxStack: 999,
    rarity: 'common'
  }
];

const RARITY_WEIGHTS = {
  common: 60,
  uncommon: 30,
  rare: 10
};

class GameManager {
  constructor(redisClient) {
    this.redis = redisClient;
    this.bspGenerator = new BSPMapGenerator(MAP_WIDTH, MAP_HEIGHT);
    this.randomWalkGenerator = new RandomWalkMapGenerator(MAP_WIDTH, MAP_HEIGHT);
    this.fovCalculator = new FOVCalculator();
    this.monsterAI = new MonsterAI();
  }

  async createGame(gameId, playerId, playerName) {
    const map = this.generateMap('bsp');
    const startPos = this.findStartPosition(map);

    const player = {
      id: playerId,
      name: playerName,
      x: startPos.x,
      y: startPos.y,
      hp: 100,
      maxHp: 100,
      baseAttack: 10,
      baseDefense: 5,
      level: 1,
      xp: 0,
      visibleTiles: [],
      equipment: this.createEmptyEquipment(),
      inventory: this.createEmptyInventory(),
      tempEffects: []
    };

    const startingWeapon = this.createItem(this.getItemDefinitionByName('短剑'));
    startingWeapon.x = startPos.x;
    startingWeapon.y = startPos.y;
    player.inventory[0] = startingWeapon;
    this.equipItem(player, 0, EQUIPMENT_SLOTS.WEAPON);

    const monsters = this.spawnMonsters(map, player);
    const items = this.spawnItems(map, player);

    const exploredTiles = this.initializeExploredTiles();
    player.visibleTiles = this.fovCalculator.calculateFOV(
      map, player.x, player.y, VIEW_RADIUS
    );
    this.updateExploredTiles(exploredTiles, player.visibleTiles);

    this.recalculatePlayerStats(player);

    const gameState = {
      gameId,
      map,
      player,
      monsters,
      items,
      exploredTiles,
      turn: 0,
      level: 1,
      gameOver: false,
      messages: ['Welcome to the dungeon! Pick up items and equip them!']
    };

    await this.saveGameState(gameId, gameState);
    return gameState;
  }

  createEmptyEquipment() {
    return {
      weapon: null,
      helmet: null,
      armor: null,
      shield: null,
      gloves: null,
      boots: null,
      ring1: null,
      ring2: null,
      amulet: null
    };
  }

  createEmptyInventory() {
    const inventory = [];
    for (let i = 0; i < INVENTORY_SIZE; i++) {
      inventory.push(null);
    }
    return inventory;
  }

  getItemDefinitionByName(name) {
    return ITEM_DEFINITIONS.find(item => item.name === name);
  }

  getRandomItemDefinition() {
    const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let selectedRarity = 'common';

    for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
      random -= weight;
      if (random <= 0) {
        selectedRarity = rarity;
        break;
      }
    }

    const itemsOfRarity = ITEM_DEFINITIONS.filter(item => item.rarity === selectedRarity);
    return itemsOfRarity[Math.floor(Math.random() * itemsOfRarity.length)];
  }

  createItem(definition) {
    return {
      id: uuidv4(),
      ...definition,
      quantity: 1
    };
  }

  generateMap(algorithm = 'bsp') {
    if (algorithm === 'bsp') {
      return this.bspGenerator.generate();
    } else {
      return this.randomWalkGenerator.generate();
    }
  }

  findStartPosition(map) {
    const floors = [];
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[0].length; x++) {
        if (map[y][x] === TILES.FLOOR) {
          floors.push({ x, y });
        }
      }
    }
    return floors[Math.floor(Math.random() * floors.length)];
  }

  spawnMonsters(map, player) {
    const monsters = [];
    const monsterTypes = [
      { name: 'Goblin', hp: 20, attack: 5, defense: 2, xp: 10, symbol: 'g', color: '#00ff00' },
      { name: 'Orc', hp: 40, attack: 8, defense: 4, xp: 20, symbol: 'o', color: '#ff9900' },
      { name: 'Troll', hp: 80, attack: 12, defense: 6, xp: 50, symbol: 'T', color: '#993300' },
      { name: 'Skeleton', hp: 30, attack: 6, defense: 3, xp: 15, symbol: 's', color: '#cccccc' }
    ];

    const floors = [];
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[0].length; x++) {
        if (map[y][x] === TILES.FLOOR) {
          const dist = Math.abs(x - player.x) + Math.abs(y - player.y);
          if (dist > 10) {
            floors.push({ x, y });
          }
        }
      }
    }

    const monsterCount = Math.min(15, Math.floor(floors.length * 0.05));
    
    for (let i = 0; i < monsterCount; i++) {
      const index = Math.floor(Math.random() * floors.length);
      const pos = floors[index];
      floors.splice(index, 1);

      const type = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
      
      monsters.push({
        id: uuidv4(),
        ...type,
        maxHp: type.hp,
        x: pos.x,
        y: pos.y,
        alive: true
      });
    }

    return monsters;
  }

  spawnItems(map, player) {
    const items = [];
    const floors = [];
    
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[0].length; x++) {
        if (map[y][x] === TILES.FLOOR) {
          const dist = Math.abs(x - player.x) + Math.abs(y - player.y);
          if (dist > 3) {
            floors.push({ x, y });
          }
        }
      }
    }

    const itemCount = Math.min(20, Math.floor(floors.length * 0.04));
    
    for (let i = 0; i < itemCount; i++) {
      const index = Math.floor(Math.random() * floors.length);
      const pos = floors[index];
      floors.splice(index, 1);

      const definition = this.getRandomItemDefinition();
      const item = this.createItem(definition);
      item.x = pos.x;
      item.y = pos.y;
      item.collected = false;
      
      items.push(item);
    }

    return items;
  }

  initializeExploredTiles() {
    const explored = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      explored[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        explored[y][x] = false;
      }
    }
    return explored;
  }

  updateExploredTiles(explored, visible) {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (visible[y] && visible[y][x]) {
          explored[y][x] = true;
        }
      }
    }
  }

  recalculatePlayerStats(player) {
    let attackBonus = 0;
    let defenseBonus = 0;
    let maxHpBonus = 0;

    for (const [slot, item] of Object.entries(player.equipment)) {
      if (item) {
        if (item.baseAttack) attackBonus += item.baseAttack;
        if (item.baseDefense) defenseBonus += item.baseDefense;
        if (item.baseMaxHp) maxHpBonus += item.baseMaxHp;
      }
    }

    let tempAttackBonus = 0;
    let tempDefenseBonus = 0;
    player.tempEffects = player.tempEffects.filter(effect => {
      if (effect.duration > 0) {
        if (effect.tempAttack) tempAttackBonus += effect.tempAttack;
        if (effect.tempDefense) tempDefenseBonus += effect.tempDefense;
        effect.duration--;
        return effect.duration > 0;
      }
      return false;
    });

    player.attack = player.baseAttack + attackBonus + tempAttackBonus;
    player.defense = player.baseDefense + defenseBonus + tempDefenseBonus;
    player.maxHp = 100 + (player.level - 1) * 10 + maxHpBonus;
  }

  findEmptyInventorySlot(player) {
    for (let i = 0; i < player.inventory.length; i++) {
      if (player.inventory[i] === null) {
        return i;
      }
    }
    return -1;
  }

  addItemToInventory(player, item) {
    if (item.stackable) {
      for (let i = 0; i < player.inventory.length; i++) {
        const existing = player.inventory[i];
        if (existing && existing.name === item.name && existing.quantity < existing.maxStack) {
          const space = existing.maxStack - existing.quantity;
          const toAdd = Math.min(space, item.quantity);
          existing.quantity += toAdd;
          item.quantity -= toAdd;
          
          if (item.quantity <= 0) {
            return { success: true, merged: true };
          }
        }
      }
    }

    const emptySlot = this.findEmptyInventorySlot(player);
    if (emptySlot >= 0) {
      player.inventory[emptySlot] = item;
      return { success: true, slot: emptySlot };
    }

    return { success: false, message: '背包已满' };
  }

  removeItemFromInventory(player, slotIndex, quantity = 1) {
    if (slotIndex < 0 || slotIndex >= player.inventory.length) {
      return { success: false, message: '无效的格子' };
    }

    const item = player.inventory[slotIndex];
    if (!item) {
      return { success: false, message: '该格子没有物品' };
    }

    if (quantity >= item.quantity) {
      player.inventory[slotIndex] = null;
      return { success: true, item };
    } else {
      item.quantity -= quantity;
      const removedItem = { ...item, quantity };
      return { success: true, item: removedItem };
    }
  }

  equipItem(player, inventorySlot, targetSlot) {
    const item = player.inventory[inventorySlot];
    if (!item) {
      return { success: false, message: '该格子没有物品' };
    }

    if (item.type !== ITEM_TYPES.EQUIPMENT) {
      return { success: false, message: '该物品不能装备' };
    }

    const validSlots = [item.slot, ...(item.alternateSlots || [])];
    if (!validSlots.includes(targetSlot)) {
      return { success: false, message: '该物品不能装备到该槽位' };
    }

    const oldItem = player.equipment[targetSlot];
    if (oldItem) {
      const result = this.addItemToInventory(player, oldItem);
      if (!result.success) {
        return { success: false, message: '背包已满，无法卸下原有装备' };
      }
    }

    player.equipment[targetSlot] = item;
    player.inventory[inventorySlot] = null;
    
    this.recalculatePlayerStats(player);
    
    return { 
      success: true, 
      message: `装备了 ${item.name}`,
      item,
      targetSlot
    };
  }

  unequipItem(player, slot) {
    const item = player.equipment[slot];
    if (!item) {
      return { success: false, message: '该槽位没有装备' };
    }

    const result = this.addItemToInventory(player, item);
    if (!result.success) {
      return { success: false, message: '背包已满，无法卸下装备' };
    }

    player.equipment[slot] = null;
    this.recalculatePlayerStats(player);
    
    return {
      success: true,
      message: `卸下了 ${item.name}`,
      item
    };
  }

  swapInventoryItems(player, slot1, slot2) {
    if (slot1 < 0 || slot1 >= player.inventory.length ||
        slot2 < 0 || slot2 >= player.inventory.length) {
      return { success: false, message: '无效的格子' };
    }

    if (slot1 === slot2) {
      return { success: true };
    }

    const temp = player.inventory[slot1];
    player.inventory[slot1] = player.inventory[slot2];
    player.inventory[slot2] = temp;

    return { success: true };
  }

  useConsumable(player, inventorySlot) {
    const item = player.inventory[inventorySlot];
    if (!item) {
      return { success: false, message: '该格子没有物品' };
    }

    if (item.type !== ITEM_TYPES.CONSUMABLE) {
      return { success: false, message: '该物品不能使用' };
    }

    let message = '';

    if (item.effect.hp) {
      const oldHp = player.hp;
      player.hp = Math.min(player.maxHp, player.hp + item.effect.hp);
      const healed = player.hp - oldHp;
      message = `使用了 ${item.name}，恢复了 ${healed} 点生命值`;
    }

    if (item.effect.tempAttack) {
      player.tempEffects.push({
        tempAttack: item.effect.tempAttack,
        duration: item.effect.duration || 10
      });
      message = `使用了 ${item.name}，攻击力临时增加 ${item.effect.tempAttack} 点`;
      this.recalculatePlayerStats(player);
    }

    if (item.quantity > 1) {
      item.quantity--;
    } else {
      player.inventory[inventorySlot] = null;
    }

    return { success: true, message };
  }

  dropItem(gameState, player, inventorySlot) {
    const item = player.inventory[inventorySlot];
    if (!item) {
      return { success: false, message: '该格子没有物品' };
    }

    const floors = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const checkX = player.x + dx;
        const checkY = player.y + dy;
        if (checkX >= 0 && checkX < MAP_WIDTH && checkY >= 0 && checkY < MAP_HEIGHT) {
          if (gameState.map[checkY][checkX] === TILES.FLOOR) {
            const hasItem = gameState.items.some(i => 
              i.x === checkX && i.y === checkY && !i.collected
            );
            if (!hasItem) {
              floors.push({ x: checkX, y: checkY });
            }
          }
        }
      }
    }

    if (floors.length === 0) {
      return { success: false, message: '附近没有地方丢弃物品' };
    }

    const dropPos = floors[Math.floor(Math.random() * floors.length)];
    
    player.inventory[inventorySlot] = null;
    item.x = dropPos.x;
    item.y = dropPos.y;
    item.collected = false;
    gameState.items.push(item);

    return { success: true, message: `丢弃了 ${item.name}` };
  }

  async processPlayerMove(gameId, playerId, direction) {
    const gameState = await this.getGameState(gameId);
    if (!gameState || gameState.gameOver) {
      return { success: false, message: 'Game not available' };
    }

    const player = gameState.player;
    if (player.id !== playerId) {
      return { success: false, message: 'Not your turn' };
    }

    const directions = {
      'up': { dx: 0, dy: -1 },
      'down': { dx: 0, dy: 1 },
      'left': { dx: -1, dy: 0 },
      'right': { dx: 1, dy: 0 },
      'up-left': { dx: -1, dy: -1 },
      'up-right': { dx: 1, dy: -1 },
      'down-left': { dx: -1, dy: 1 },
      'down-right': { dx: 1, dy: 1 }
    };
    const dir = directions[direction] || { dx: 0, dy: 0 };
    const dx = dir.dx;
    const dy = dir.dy;

    const newX = player.x + dx;
    const newY = player.y + dy;

    if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) {
      return { success: false, message: 'Cannot move outside map' };
    }

    if (gameState.map[newY][newX] === TILES.WALL) {
      return { success: false, message: 'Cannot walk into walls' };
    }

    const targetMonster = gameState.monsters.find(m => m.x === newX && m.y === newY && m.alive);
    if (targetMonster) {
      const damage = Math.max(1, player.attack - targetMonster.defense);
      targetMonster.hp -= damage;
      gameState.messages.push(`You attack ${targetMonster.name} for ${damage} damage!`);

      if (targetMonster.hp <= 0) {
        targetMonster.alive = false;
        player.xp += targetMonster.xp;
        gameState.messages.push(`${targetMonster.name} dies! You gain ${targetMonster.xp} XP.`);
        
        if (player.xp >= player.level * 100) {
          player.level++;
          player.baseAttack += 2;
          player.baseDefense += 1;
          this.recalculatePlayerStats(player);
          player.hp = player.maxHp;
          gameState.messages.push(`Level up! You are now level ${player.level}.`);
        }
      }
    } else {
      player.x = newX;
      player.y = newY;

      const groundItem = gameState.items.find(i => i.x === newX && i.y === newY && !i.collected);
      if (groundItem) {
        const result = this.addItemToInventory(player, groundItem);
        if (result.success) {
          groundItem.collected = true;
          if (groundItem.type === ITEM_TYPES.GOLD) {
            player.xp += groundItem.value;
            gameState.messages.push(`You picked up ${groundItem.value} gold!`);
          } else {
            gameState.messages.push(`You picked up ${groundItem.name}!`);
          }
        } else {
          gameState.messages.push(`Your inventory is full!`);
        }
      }
    }

    this.recalculatePlayerStats(player);

    player.visibleTiles = this.fovCalculator.calculateFOV(
      gameState.map, player.x, player.y, VIEW_RADIUS
    );
    this.updateExploredTiles(gameState.exploredTiles, player.visibleTiles);

    this.processMonsterTurn(gameState);

    gameState.turn++;

    await this.saveGameState(gameId, gameState);

    return { success: true, gameState: this.getClientGameState(gameState) };
  }

  processMonsterTurn(gameState) {
    const aliveMonsters = gameState.monsters.filter(m => m.alive);
    
    for (const monster of aliveMonsters) {
      const action = this.monsterAI.getAction(monster, gameState.player, gameState.map);
      
      if (action.type === 'move') {
        monster.x = action.x;
        monster.y = action.y;
      } else if (action.type === 'attack') {
        const damage = Math.max(1, monster.attack - gameState.player.defense);
        gameState.player.hp -= damage;
        gameState.messages.push(`${monster.name} attacks you for ${damage} damage!`);

        if (gameState.player.hp <= 0) {
          gameState.gameOver = true;
          gameState.messages.push('You have died... Game Over!');
        }
      }
    }
  }

  async handleEquipItem(gameId, playerId, inventorySlot, targetSlot) {
    const gameState = await this.getGameState(gameId);
    if (!gameState || gameState.gameOver) {
      return { success: false, message: 'Game not available' };
    }

    const player = gameState.player;
    if (player.id !== playerId) {
      return { success: false, message: 'Not your turn' };
    }

    const result = this.equipItem(player, inventorySlot, targetSlot);
    
    if (result.success) {
      gameState.messages.push(result.message);
      await this.saveGameState(gameId, gameState);
    }

    return { ...result, gameState: this.getClientGameState(gameState) };
  }

  async handleUnequipItem(gameId, playerId, slot) {
    const gameState = await this.getGameState(gameId);
    if (!gameState || gameState.gameOver) {
      return { success: false, message: 'Game not available' };
    }

    const player = gameState.player;
    if (player.id !== playerId) {
      return { success: false, message: 'Not your turn' };
    }

    const result = this.unequipItem(player, slot);
    
    if (result.success) {
      gameState.messages.push(result.message);
      await this.saveGameState(gameId, gameState);
    }

    return { ...result, gameState: this.getClientGameState(gameState) };
  }

  async handleUseItem(gameId, playerId, inventorySlot) {
    const gameState = await this.getGameState(gameId);
    if (!gameState || gameState.gameOver) {
      return { success: false, message: 'Game not available' };
    }

    const player = gameState.player;
    if (player.id !== playerId) {
      return { success: false, message: 'Not your turn' };
    }

    const result = this.useConsumable(player, inventorySlot);
    
    if (result.success) {
      gameState.messages.push(result.message);
      await this.saveGameState(gameId, gameState);
    }

    return { ...result, gameState: this.getClientGameState(gameState) };
  }

  async handleDropItem(gameId, playerId, inventorySlot) {
    const gameState = await this.getGameState(gameId);
    if (!gameState || gameState.gameOver) {
      return { success: false, message: 'Game not available' };
    }

    const player = gameState.player;
    if (player.id !== playerId) {
      return { success: false, message: 'Not your turn' };
    }

    const result = this.dropItem(gameState, player, inventorySlot);
    
    if (result.success) {
      gameState.messages.push(result.message);
      await this.saveGameState(gameId, gameState);
    }

    return { ...result, gameState: this.getClientGameState(gameState) };
  }

  async handleSwapInventoryItems(gameId, playerId, slot1, slot2) {
    const gameState = await this.getGameState(gameId);
    if (!gameState || gameState.gameOver) {
      return { success: false, message: 'Game not available' };
    }

    const player = gameState.player;
    if (player.id !== playerId) {
      return { success: false, message: 'Not your turn' };
    }

    const result = this.swapInventoryItems(player, slot1, slot2);
    
    if (result.success) {
      await this.saveGameState(gameId, gameState);
    }

    return { ...result, gameState: this.getClientGameState(gameState) };
  }

  async gameExists(gameId) {
    const exists = await this.redis.exists(`game:${gameId}`);
    return exists === 1;
  }

  async getGameState(gameId) {
    const data = await this.redis.get(`game:${gameId}`);
    if (!data) return null;
    return JSON.parse(data);
  }

  async saveGameState(gameId, gameState) {
    await this.redis.set(`game:${gameId}`, JSON.stringify(gameState), {
      EX: 3600
    });
  }

  getClientGameState(gameState) {
    return {
      gameId: gameState.gameId,
      map: gameState.map,
      player: {
        id: gameState.player.id,
        name: gameState.player.name,
        x: gameState.player.x,
        y: gameState.player.y,
        hp: gameState.player.hp,
        maxHp: gameState.player.maxHp,
        attack: gameState.player.attack,
        defense: gameState.player.defense,
        baseAttack: gameState.player.baseAttack,
        baseDefense: gameState.player.baseDefense,
        level: gameState.player.level,
        xp: gameState.player.xp,
        equipment: gameState.player.equipment,
        inventory: gameState.player.inventory,
        tempEffects: gameState.player.tempEffects,
        visibleTiles: undefined
      },
      monsters: gameState.monsters.filter(m => m.alive).map(m => ({
        id: m.id,
        name: m.name,
        x: m.x,
        y: m.y,
        hp: m.hp,
        maxHp: m.maxHp,
        symbol: m.symbol,
        color: m.color
      })),
      items: gameState.items.filter(i => !i.collected).map(i => ({
        id: i.id,
        name: i.name,
        x: i.x,
        y: i.y,
        symbol: i.symbol,
        color: i.color,
        type: i.type
      })),
      visibleTiles: gameState.player.visibleTiles,
      exploredTiles: gameState.exploredTiles,
      turn: gameState.turn,
      level: gameState.level,
      gameOver: gameState.gameOver,
      messages: gameState.messages.slice(-10),
      inventorySize: INVENTORY_SIZE,
      equipmentSlots: EQUIPMENT_SLOTS,
      slotNames: SLOT_NAMES
    };
  }
}

module.exports = GameManager;
