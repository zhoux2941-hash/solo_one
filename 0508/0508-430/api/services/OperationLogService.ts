import OperationLogRepository from '../repositories/OperationLogRepository.js';
import { OperationLog } from '../../shared/index.js';

class OperationLogService {
  getLogs(limit: number = 100, offset: number = 0): OperationLog[] {
    return OperationLogRepository.getAll(limit, offset);
  }

  getLogsByType(type: 'pin_set' | 'pin_remove' | 'abtest_create' | 'abtest_start' | 'abtest_stop', limit: number = 50): OperationLog[] {
    return OperationLogRepository.getByType(type, limit);
  }
}

export default new OperationLogService();
