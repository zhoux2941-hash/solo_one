import type { BrailleStrategy } from './BrailleStrategy';
import { CurrentBrailleStrategy } from './CurrentBrailleStrategy';
import { DoubleBrailleStrategy } from './DoubleBrailleStrategy';
import { GeneralBrailleStrategy } from './GeneralBrailleStrategy';
import type { BrailleType } from '../data/brailleTypes';

export class BrailleStrategyFactory {
  private static strategies: Record<BrailleType, BrailleStrategy> = {
    current: new CurrentBrailleStrategy(),
    double: new DoubleBrailleStrategy(),
    general: new GeneralBrailleStrategy(),
  };

  static getStrategy(type: BrailleType): BrailleStrategy {
    return BrailleStrategyFactory.strategies[type] || BrailleStrategyFactory.strategies.current;
  }

  static getAvailableStrategies(): { type: BrailleType; name: string; description: string }[] {
    return Object.entries(BrailleStrategyFactory.strategies).map(([type, strategy]) => ({
      type: type as BrailleType,
      name: strategy.getName(),
      description: strategy.getDescription(),
    }));
  }
}