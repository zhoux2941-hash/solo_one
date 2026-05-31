import { create } from 'zustand';
import type { Resources, DecisionOption, BattleResult, GameLog, FinalOutcome, General } from '../types/game';

const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getInitialResources = (): Resources => ({
  enemyTroops: getRandomInt(1500, 2500),
  enemyDistance: 100,
  ownTroops: getRandomInt(800, 1200),
  provisions: 100,
  wallDurability: 100,
  morale: 80,
});

const getInitialGenerals = (): General[] => [
  {
    id: 'qinyong',
    name: '秦勇',
    title: '先锋将军',
    icon: '⚔️',
    loyalty: 75,
    trait: '好战',
    traitDescription: '主张主动出击，对防守策略不满',
    isDefected: false,
  },
  {
    id: 'limu',
    name: '李牧',
    title: '守城将军',
    icon: '🏰',
    loyalty: 85,
    trait: '稳重',
    traitDescription: '擅长防守，反对冒险激进',
    isDefected: false,
  },
  {
    id: 'huoqubing',
    name: '霍去病',
    title: '骠骑将军',
    icon: '🔥',
    loyalty: 70,
    trait: '激进',
    traitDescription: '喜欢奇袭，认为防守是怯弱',
    isDefected: false,
  },
  {
    id: 'zhangliang',
    name: '张良',
    title: '军师谋士',
    icon: '📜',
    loyalty: 90,
    trait: '谨慎',
    traitDescription: '讲求谋略，反对无意义的硬拼',
    isDefected: false,
  },
];

const decisionPool: DecisionOption[] = [
  {
    id: 'attack',
    name: '出城迎战',
    description: '主动出击，与敌军正面交战。兵力占优时效果显著。',
    icon: '⚔️',
    strategyPower: 1.0,
    effects: {
      success: { enemyTroops: -300, ownTroops: -100, morale: 10, provisions: -10 },
      draw: { enemyTroops: -150, ownTroops: -150, morale: 0, provisions: -10 },
      failure: { ownTroops: -200, morale: -15, wallDurability: -10 },
    },
    loyaltyEffects: {
      qinyong: 15,
      limu: -10,
      huoqubing: 10,
      zhangliang: -5,
    },
  },
  {
    id: 'defend',
    name: '坚守待援',
    description: '加固城防，等待援军。城墙坚固时效果最佳。',
    icon: '🛡️',
    strategyPower: 1.3,
    effects: {
      success: { wallDurability: 10, morale: 5, enemyDistance: -10, provisions: -15 },
      draw: { wallDurability: -5, enemyDistance: -15, provisions: -15 },
      failure: { wallDurability: -15, enemyDistance: -20, morale: -5, provisions: -15 },
    },
    loyaltyEffects: {
      qinyong: -15,
      limu: 15,
      huoqubing: -10,
      zhangliang: 10,
    },
  },
  {
    id: 'nightRaid',
    name: '夜袭敌营',
    description: '趁夜偷袭敌军大营。高风险高收益，士气低落时不宜采用。',
    icon: '🌙',
    strategyPower: 0.8,
    effects: {
      success: { enemyTroops: -500, enemyDistance: 20, morale: 15, ownTroops: -50, provisions: -5 },
      draw: { enemyTroops: -200, ownTroops: -150, morale: 0, provisions: -5 },
      failure: { ownTroops: -250, morale: -20, provisions: -5 },
    },
    loyaltyEffects: {
      qinyong: 5,
      limu: -5,
      huoqubing: 20,
      zhangliang: -10,
    },
  },
  {
    id: 'archers',
    name: '弓弩齐发',
    description: '以弓弩压制敌军。城墙完好时可据高射击，效果更佳。',
    icon: '🏹',
    strategyPower: 1.1,
    effects: {
      success: { enemyTroops: -200, enemyDistance: 10, morale: 5, provisions: -5 },
      draw: { enemyTroops: -80, enemyDistance: -5, provisions: -5 },
      failure: { enemyDistance: -15, morale: -5, provisions: -5 },
    },
    loyaltyEffects: {
      qinyong: 0,
      limu: 10,
      huoqubing: -5,
      zhangliang: 15,
    },
  },
  {
    id: 'patrol',
    name: '加强巡逻',
    description: '增加城防巡逻，防止敌军偷袭。稳妥但收益有限。',
    icon: '🔍',
    strategyPower: 1.2,
    effects: {
      success: { morale: 10, wallDurability: 5, enemyDistance: -5, provisions: -10 },
      draw: { morale: 3, wallDurability: 0, enemyDistance: -8, provisions: -10 },
      failure: { morale: -5, enemyDistance: -10, provisions: -10 },
    },
    loyaltyEffects: {
      qinyong: -10,
      limu: 12,
      huoqubing: -12,
      zhangliang: 10,
    },
  },
  {
    id: 'ambush',
    name: '设伏诱敌',
    description: '设下埋伏，诱敌深入。需要兵力与士气兼备方可成功。',
    icon: '🪤',
    strategyPower: 0.9,
    effects: {
      success: { enemyTroops: -400, enemyDistance: 15, morale: 15, ownTroops: -80, provisions: -8 },
      draw: { enemyTroops: -180, ownTroops: -130, enemyDistance: 0, provisions: -8 },
      failure: { ownTroops: -180, morale: -10, enemyDistance: -15, provisions: -8 },
    },
    loyaltyEffects: {
      qinyong: 10,
      limu: -8,
      huoqubing: 18,
      zhangliang: 5,
    },
  },
];

interface GameStore {
  currentRound: number;
  maxRounds: number;
  resources: Resources;
  generals: General[];
  currentOptions: DecisionOption[];
  battleLogs: GameLog[];
  gameStatus: 'playing' | 'ended';
  finalOutcome: FinalOutcome;
  getRandomOptions: () => void;
  calculateBattleResult: (decision: DecisionOption) => BattleResult;
  makeDecision: (option: DecisionOption) => void;
  determineFinalOutcome: () => FinalOutcome;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  currentRound: 1,
  maxRounds: 5,
  resources: getInitialResources(),
  generals: getInitialGenerals(),
  currentOptions: [],
  battleLogs: [],
  gameStatus: 'playing',
  finalOutcome: null,

  getRandomOptions: () => {
    const shuffled = [...decisionPool].sort(() => Math.random() - 0.5);
    set({ currentOptions: shuffled.slice(0, 3) });
  },

  calculateBattleResult: (decision: DecisionOption): BattleResult => {
    const { resources, generals } = get();

    const activeGenerals = generals.filter(g => !g.isDefected);
    const avgLoyalty = activeGenerals.length > 0
      ? activeGenerals.reduce((sum, g) => sum + g.loyalty, 0) / activeGenerals.length
      : 50;

    const ownPower = resources.ownTroops
      * (1 + resources.wallDurability / 100)
      * (resources.morale / 80)
      * (avgLoyalty / 75)
      * decision.strategyPower;

    const enemyPower = resources.enemyTroops
      * (1 - resources.enemyDistance / 300);

    const ratio = ownPower / (ownPower + enemyPower);

    let outcome: 'victory' | 'draw' | 'defeat';
    if (ratio >= 0.58) {
      outcome = 'victory';
    } else if (ratio >= 0.40) {
      outcome = 'draw';
    } else {
      outcome = 'defeat';
    }

    const resourceChanges = outcome === 'victory'
      ? decision.effects.success
      : outcome === 'draw'
        ? decision.effects.draw
        : decision.effects.failure;

    const loyaltyChanges: Record<string, number> = {};
    Object.entries(decision.loyaltyEffects).forEach(([generalId, baseChange]) => {
      const general = generals.find(g => g.id === generalId);
      if (general && !general.isDefected) {
        let change = baseChange;
        if (outcome === 'victory') change += 5;
        if (outcome === 'defeat') change -= 8;
        loyaltyChanges[generalId] = change;
      }
    });

    let defectedGeneral: General | null = null;
    const updatedGenerals = generals.map(g => {
      if (g.isDefected) return g;
      const change = loyaltyChanges[g.id] || 0;
      const newLoyalty = Math.max(0, Math.min(100, g.loyalty + change));
      return { ...g, loyalty: newLoyalty };
    });

    const lowLoyaltyGenerals = updatedGenerals.filter(g => !g.isDefected && g.loyalty <= 25);
    if (lowLoyaltyGenerals.length > 0 && outcome === 'defeat') {
      const randomIndex = Math.floor(Math.random() * lowLoyaltyGenerals.length);
      defectedGeneral = lowLoyaltyGenerals[randomIndex];
    }

    const victoryMessages: Record<string, string> = {
      attack: '我军奋勇杀敌，敌军溃败而逃！',
      defend: '城墙固若金汤，敌军久攻不下，士气受挫。',
      nightRaid: '夜袭成功！敌军大营陷入混乱，损失惨重。',
      archers: '箭如雨下，敌军前锋死伤无数，被迫后退。',
      patrol: '巡逻队发现敌军异动，成功化解了一次偷袭！',
      ambush: '伏兵四起，敌军阵脚大乱，被我军分割围歼！',
    };

    const drawMessages: Record<string, string> = {
      attack: '双方激战，互有伤亡，僵持不下。',
      defend: '敌军攻势猛烈，城墙略有损伤，但守军未失阵地。',
      nightRaid: '夜袭未达预期，双方各有损失，暂时僵持。',
      archers: '箭矢造成一定杀伤，但敌军阵型未乱，继续逼近。',
      patrol: '巡逻队与敌军斥候小规模交锋，各有损伤。',
      ambush: '伏兵出击但敌军及时应对，双方僵持不下。',
    };

    const defeatMessages: Record<string, string> = {
      attack: '敌军早有防备，我军伤亡惨重，被迫退回城中。',
      defend: '敌军攻城器械猛烈，城墙多处受损，情势危急。',
      nightRaid: '夜袭被敌军察觉，我军陷入重围，损失惨重。',
      archers: '敌军盾牌严密，箭矢收效甚微，敌军继续逼近。',
      patrol: '巡逻队遭遇敌军斥候，虽奋力抵抗但敌军已逼近。',
      ambush: '敌军识破计谋，我军伏兵反被包围，损失惨重。',
    };

    const messageMap = outcome === 'victory' ? victoryMessages
      : outcome === 'draw' ? drawMessages
      : defeatMessages;

    let message = messageMap[decision.id] || (outcome === 'victory' ? '战斗取得胜利！' : outcome === 'draw' ? '双方僵持不下。' : '战斗失利！');

    if (defectedGeneral) {
      message = `${message} 不料${defectedGeneral.title}${defectedGeneral.name}因忠诚度过低，率军投敌！`;
    }

    return {
      decision,
      outcome,
      message,
      resourceChanges,
      loyaltyChanges,
      defectedGeneral,
    };
  },

  makeDecision: (option: DecisionOption) => {
    const state = get();
    if (state.gameStatus === 'ended') return;

    const result = state.calculateBattleResult(option);

    const newResources = { ...state.resources };
    Object.entries(result.resourceChanges).forEach(([key, value]) => {
      if (value !== undefined) {
        const k = key as keyof Resources;
        newResources[k] = Math.max(0, newResources[k] + value);
      }
    });

    if (result.defectedGeneral) {
      newResources.ownTroops = Math.max(0, newResources.ownTroops - 200);
      newResources.morale = Math.max(0, newResources.morale - 20);
    }

    newResources.enemyTroops = Math.max(0, newResources.enemyTroops);
    newResources.ownTroops = Math.max(0, newResources.ownTroops);
    newResources.provisions = Math.max(0, Math.min(100, newResources.provisions));
    newResources.wallDurability = Math.max(0, Math.min(100, newResources.wallDurability));
    newResources.morale = Math.max(0, Math.min(100, newResources.morale));
    newResources.enemyDistance = Math.max(0, Math.min(100, newResources.enemyDistance));

    let newGenerals = state.generals.map(g => {
      if (g.isDefected) return g;
      const change = result.loyaltyChanges[g.id] || 0;
      const newLoyalty = Math.max(0, Math.min(100, g.loyalty + change));
      return { ...g, loyalty: newLoyalty };
    });

    if (result.defectedGeneral) {
      newGenerals = newGenerals.map(g =>
        g.id === result.defectedGeneral!.id ? { ...g, isDefected: true, loyalty: 0 } : g
      );
    }

    const newLog: GameLog = {
      round: state.currentRound,
      timestamp: Date.now(),
      result,
    };

    const newRound = state.currentRound + 1;

    let finalOutcome: FinalOutcome = null;
    let gameStatus: 'playing' | 'ended' = 'playing';

    if (newResources.enemyTroops <= 0) {
      gameStatus = 'ended';
      finalOutcome = 'greatVictory';
    } else if (newResources.ownTroops <= 0 || newResources.wallDurability <= 0) {
      gameStatus = 'ended';
      finalOutcome = 'defeat';
    } else if (newRound > state.maxRounds) {
      gameStatus = 'ended';
      finalOutcome = get().determineFinalOutcome();
    }

    set({
      resources: newResources,
      generals: newGenerals,
      battleLogs: [...state.battleLogs, newLog],
      currentRound: newRound,
      gameStatus,
      finalOutcome,
    });

    if (gameStatus === 'playing') {
      get().getRandomOptions();
    }
  },

  determineFinalOutcome: (): FinalOutcome => {
    const { resources, generals } = get();

    if (resources.enemyTroops <= 0) {
      return 'greatVictory';
    }
    if (resources.ownTroops <= 0 || resources.wallDurability <= 0 || resources.enemyDistance <= 0) {
      return 'defeat';
    }

    const activeGenerals = generals.filter(g => !g.isDefected);
    const loyaltyFactor = activeGenerals.length > 0
      ? activeGenerals.reduce((sum, g) => sum + g.loyalty, 0) / activeGenerals.length / 100
      : 0.5;

    const enemyStrength = resources.enemyTroops * (1 - resources.enemyDistance / 200);
    const ownStrength = resources.ownTroops * (resources.wallDurability / 100) * (resources.morale / 100) * loyaltyFactor;

    if (ownStrength > enemyStrength * 1.5 && resources.morale >= 70) {
      return 'greatVictory';
    }
    if (ownStrength >= enemyStrength * 0.8) {
      return 'victory';
    }
    return 'defeat';
  },

  resetGame: () => {
    set({
      currentRound: 1,
      resources: getInitialResources(),
      generals: getInitialGenerals(),
      currentOptions: [],
      battleLogs: [],
      gameStatus: 'playing',
      finalOutcome: null,
    });
    get().getRandomOptions();
  },
}));
