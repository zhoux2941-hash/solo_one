import { FoodOption, GameState, HistoryRecord, EndingType, Debuff, DebuffType } from '../types/game';

export const randomInRange = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const calcPoisonDamage = (debuff: Debuff): number => {
  return Math.floor(debuff.intensity * Math.pow(1.3, debuff.turnsActive) * 0.3);
};

const calcInjuryDamage = (debuff: Debuff): number => {
  return Math.floor(debuff.intensity * 0.6);
};

const calcHungerDamage = (satiety: number): number => {
  if (satiety < 10) return 12;
  if (satiety < 20) return 7;
  if (satiety < 35) return 3;
  return 0;
};

const getHungerLevel = (satiety: number): string => {
  if (satiety < 10) return '极度饥饿';
  if (satiety < 20) return '严重饥饿';
  if (satiety < 35) return '轻度饥饿';
  return '';
};

const decayDebuff = (debuff: Debuff): Debuff | null => {
  let newIntensity: number;
  
  switch (debuff.type) {
    case 'poison':
      newIntensity = Math.floor(debuff.intensity * 0.75);
      break;
    case 'injury':
      newIntensity = Math.floor(debuff.intensity * 0.5);
      break;
    case 'hunger':
      return { ...debuff, turnsActive: debuff.turnsActive + 1 };
  }
  
  if (newIntensity < 1) return null;
  return { ...debuff, intensity: newIntensity, turnsActive: debuff.turnsActive + 1 };
};

const calcTotalDebuffDamage = (debuffs: Debuff[], satiety: number): { poisonDmg: number; injuryDmg: number; hungerDmg: number } => {
  let poisonDmg = 0;
  let injuryDmg = 0;
  
  for (const debuff of debuffs) {
    switch (debuff.type) {
      case 'poison':
        poisonDmg += calcPoisonDamage(debuff);
        break;
      case 'injury':
        injuryDmg += calcInjuryDamage(debuff);
        break;
    }
  }
  
  const hungerDmg = calcHungerDamage(satiety);
  
  return { poisonDmg, injuryDmg, hungerDmg };
};

export const getDebuffSummary = (debuffs: Debuff[], satiety: number) => {
  const { poisonDmg, injuryDmg, hungerDmg } = calcTotalDebuffDamage(debuffs, satiety);
  const poisonLevel = debuffs.filter(d => d.type === 'poison').reduce((s, d) => s + d.intensity, 0);
  const injuryLevel = debuffs.filter(d => d.type === 'injury').reduce((s, d) => s + d.intensity, 0);
  const hungerLevel = satiety < 35 ? getHungerLevel(satiety) : '';
  const hungerIntensity = satiety < 10 ? 3 : satiety < 20 ? 2 : satiety < 35 ? 1 : 0;
  
  return {
    poisonLevel,
    injuryLevel,
    hungerLevel,
    hungerIntensity,
    poisonDmg,
    injuryDmg,
    hungerDmg,
    totalDmg: poisonDmg + injuryDmg + hungerDmg,
  };
};

export const processFoodSelection = (
  state: GameState,
  food: FoodOption
): { newState: GameState; record: HistoryRecord } => {
  const satietyGain = randomInRange(food.satiety.min, food.satiety.max);
  const satietyTimeCost = food.timeCost * 2;
  const satietyChange = satietyGain - satietyTimeCost;
  const newSatietyBeforeDebuff = Math.min(100, Math.max(0, state.satiety + satietyChange));
  
  let healthChange = 0;
  let riskEvent: string | null = null;
  const newDebuffs: Debuff[] = state.debuffs.map(d => ({ ...d }));
  const debuffChanges: HistoryRecord['debuffChanges'] = [];
  
  if (Math.random() < food.healthRisk.probability) {
    const damage = randomInRange(food.healthRisk.damage.min, food.healthRisk.damage.max);
    
    if (food.healthRisk.type === 'poison') {
      const existing = newDebuffs.find(d => d.type === 'poison');
      if (existing) {
        existing.intensity += damage;
        existing.turnsActive = 0;
        debuffChanges.push({ type: 'poison', action: 'add', detail: `毒性叠加 +${damage}，当前强度 ${existing.intensity}` });
      } else {
        newDebuffs.push({
          id: `poison_${state.round}`,
          type: 'poison',
          intensity: damage,
          turnsActive: 0,
          source: food.name,
        });
        debuffChanges.push({ type: 'poison', action: 'add', detail: `新增中毒，强度 ${damage}` });
      }
      healthChange -= Math.floor(damage * 0.3);
      riskEvent = `中毒！强度 +${damage}`;
    } else if (food.healthRisk.type === 'injury') {
      const existing = newDebuffs.find(d => d.type === 'injury');
      if (existing) {
        existing.intensity += damage;
        existing.turnsActive = 0;
        debuffChanges.push({ type: 'injury', action: 'add', detail: `伤势加重 +${damage}，当前强度 ${existing.intensity}` });
      } else {
        newDebuffs.push({
          id: `injury_${state.round}`,
          type: 'injury',
          intensity: damage,
          turnsActive: 0,
          source: food.name,
        });
        debuffChanges.push({ type: 'injury', action: 'add', detail: `新增受伤，强度 ${damage}` });
      }
      healthChange -= damage;
      riskEvent = `受伤！强度 +${damage}`;
    }
  } else {
    healthChange += Math.max(0, 8 - food.timeCost);
  }
  
  const { poisonDmg, injuryDmg, hungerDmg } = calcTotalDebuffDamage(newDebuffs, newSatietyBeforeDebuff);
  const totalDebuffDmg = poisonDmg + injuryDmg + hungerDmg;
  
  if (poisonDmg > 0) {
    debuffChanges.push({ type: 'poison', action: 'tick', detail: `毒素发作 -${poisonDmg} 健康` });
    if (!riskEvent) riskEvent = `毒素发作 -${poisonDmg}`;
  }
  if (injuryDmg > 0) {
    debuffChanges.push({ type: 'injury', action: 'tick', detail: `伤口疼痛 -${injuryDmg} 健康` });
    if (!riskEvent) riskEvent = `伤口发作 -${injuryDmg}`;
  }
  if (hungerDmg > 0) {
    const level = getHungerLevel(newSatietyBeforeDebuff);
    debuffChanges.push({ type: 'hunger', action: 'tick', detail: `${level} -${hungerDmg} 健康` });
    if (!riskEvent) riskEvent = `${level} -${hungerDmg}`;
  }
  
  healthChange -= totalDebuffDmg;
  
  const hungerSatietyDrain = newSatietyBeforeDebuff < 20 ? 3 : newSatietyBeforeDebuff < 35 ? 1 : 0;
  const finalSatietyChange = satietyChange - hungerSatietyDrain;
  const newSatiety = Math.min(100, Math.max(0, state.satiety + finalSatietyChange));
  const newHealth = Math.min(100, Math.max(0, state.health + healthChange));
  const newTimeRemaining = Math.max(0, state.timeRemaining - food.timeCost);
  
  const decayedDebuffs: Debuff[] = [];
  for (const debuff of newDebuffs) {
    const decayed = decayDebuff(debuff);
    if (decayed) {
      decayedDebuffs.push(decayed);
      if (decayed.intensity < debuff.intensity) {
        debuffChanges.push({
          type: debuff.type,
          action: 'decay',
          detail: `${debuff.type === 'poison' ? '毒素' : '伤势'}自然消退，强度 ${debuff.intensity} → ${decayed.intensity}`,
        });
      }
    } else {
      debuffChanges.push({
        type: debuff.type,
        action: 'decay',
        detail: `${debuff.type === 'poison' ? '毒素' : '伤势'}已完全消退`,
      });
    }
  }
  
  const record: HistoryRecord = {
    round: state.round,
    foodId: food.id,
    foodName: food.name,
    foodIcon: food.icon,
    satietyGain,
    healthChange,
    satietyChange: finalSatietyChange,
    timeCost: food.timeCost,
    riskEvent,
    debuffChanges,
  };
  
  let isGameOver = newHealth <= 0 || newSatiety <= 0 || state.round >= state.maxRounds;
  let ending: EndingType = null;
  
  if (newTimeRemaining <= 0) {
    isGameOver = true;
    ending = 'timeout';
  }
  
  if (isGameOver && !ending) {
    ending = determineEnding(newSatiety, newHealth);
  }
  
  const newState: GameState = {
    ...state,
    round: isGameOver ? state.round : state.round + 1,
    satiety: newSatiety,
    health: newHealth,
    debuffs: decayedDebuffs,
    timeRemaining: newTimeRemaining,
    isGameOver,
    ending,
    history: [...state.history, record],
    selectedFood: null
  };
  
  return { newState, record };
};

export const determineEnding = (satiety: number, health: number): EndingType => {
  if (health <= 0 || satiety <= 0) {
    return 'dead';
  }
  if (satiety >= 60 && health >= 70) {
    return 'rescued';
  }
  return 'survived';
};

export const getEndingInfo = (ending: EndingType): { title: string; description: string; icon: string; color: string } => {
  switch (ending) {
    case 'rescued':
      return {
        title: '🎉 获救成功！',
        description: '救援队发现了你的信号！你保持了良好的身体状态，成功等到了救援。经过短暂的休养，你完全恢复了健康。',
        icon: '🚁',
        color: 'text-emerald-400'
      };
    case 'survived':
      return {
        title: '😮‍💨 勉强存活',
        description: '你艰难地度过了这五天。虽然身体虚弱，但你还活着。救援队在第六天发现了你，你需要长期调养才能完全康复。',
        icon: '🏥',
        color: 'text-amber-400'
      };
    case 'timeout':
      return {
        title: '🥶 耗尽时间',
        description: '你在野外耗费了太多时间，体力在漫长的等待中逐渐耗尽。寒冷和饥饿最终击垮了你，你没能等到救援的到来...',
        icon: '⏰',
        color: 'text-blue-400'
      };
    case 'dead':
      return {
        title: '💀 不幸遇难',
        description: '你没能撑过这次野外生存挑战。恶劣的环境和错误的选择耗尽了你的生命力。也许下次会做出更明智的选择...',
        icon: '🕯️',
        color: 'text-red-500'
      };
    default:
      return {
        title: '游戏进行中',
        description: '',
        icon: '🌲',
        color: 'text-white'
      };
  }
};

export const getInitialState = (): GameState => ({
  round: 1,
  maxRounds: 5,
  satiety: 50,
  health: 100,
  debuffs: [],
  timeRemaining: 48,
  maxTime: 48,
  isGameOver: false,
  ending: null,
  history: [],
  selectedFood: null
});
