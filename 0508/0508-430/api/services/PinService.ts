import PinConfigRepository from '../repositories/PinConfigRepository.js';
import OperationLogRepository from '../repositories/OperationLogRepository.js';
import { PinConfig } from '../../shared/index.js';

class PinService {
  setPin(keyword: string, articleId: string, articleTitle: string, operator: string): string {
    const id = PinConfigRepository.create(keyword, articleId, articleTitle, operator);
    
    OperationLogRepository.create(
      operator,
      'pin_set',
      `为关键词"${keyword}"设置置顶文章：${articleTitle}`,
      keyword,
      articleId,
      articleTitle
    );
    
    return id;
  }

  removePin(id: string, operator: string): boolean {
    const pinConfig = PinConfigRepository.getAll().find(p => p.id === id);
    const success = PinConfigRepository.deactivate(id);
    
    if (success && pinConfig) {
      OperationLogRepository.create(
        operator,
        'pin_remove',
        `取消关键词"${pinConfig.keyword}"的置顶文章`,
        pinConfig.keyword,
        pinConfig.articleId,
        pinConfig.articleTitle
      );
    }
    
    return success;
  }

  getAllPins(): PinConfig[] {
    return PinConfigRepository.getAll();
  }

  getActivePin(keyword: string): PinConfig | null {
    return PinConfigRepository.getActivePin(keyword);
  }
}

export default new PinService();
