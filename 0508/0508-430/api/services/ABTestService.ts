import ABTestRepository from '../repositories/ABTestRepository.js';
import SearchLogRepository from '../repositories/SearchLogRepository.js';
import FeedbackRepository from '../repositories/FeedbackRepository.js';
import OperationLogRepository from '../repositories/OperationLogRepository.js';
import { ABTest, ABTestReport } from '../../shared/index.js';

function calculateConfidence(
  clicksA: number, conversionsA: number,
  clicksB: number, conversionsB: number
): number {
  const rateA = conversionsA / Math.max(clicksA, 1);
  const rateB = conversionsB / Math.max(clicksB, 1);
  
  const seA = Math.sqrt((rateA * (1 - rateA)) / Math.max(clicksA, 1));
  const seB = Math.sqrt((rateB * (1 - rateB)) / Math.max(clicksB, 1));
  const seDiff = Math.sqrt(seA * seA + seB * seB);
  
  const zScore = (rateB - rateA) / Math.max(seDiff, 0.0001);
  const confidence = Math.min(0.99, Math.abs(zScore) / 3);
  
  return confidence;
}

class ABTestService {
  createTest(name: string, algorithmA: string, algorithmB: string, createdBy: string): string {
    const id = ABTestRepository.create(name, algorithmA, algorithmB, createdBy);
    
    OperationLogRepository.create(
      createdBy,
      'abtest_create',
      `创建A/B测试：${name}，算法A: ${algorithmA}，算法B: ${algorithmB}`
    );
    
    return id;
  }

  startTest(id: string, operator: string): boolean {
    const success = ABTestRepository.startTest(id);
    
    if (success) {
      const test = ABTestRepository.getById(id);
      if (test) {
        OperationLogRepository.create(
          operator,
          'abtest_start',
          `启动A/B测试：${test.name}`
        );
      }
    }
    
    return success;
  }

  stopTest(id: string, operator: string): boolean {
    const success = ABTestRepository.stopTest(id);
    
    if (success) {
      const test = ABTestRepository.getById(id);
      if (test) {
        OperationLogRepository.create(
          operator,
          'abtest_stop',
          `停止A/B测试：${test.name}`
        );
      }
    }
    
    return success;
  }

  getTestById(id: string): ABTest | null {
    return ABTestRepository.getById(id);
  }

  getAllTests(): ABTest[] {
    return ABTestRepository.getAll();
  }

  getRunningTest(): ABTest | null {
    return ABTestRepository.getRunningTest();
  }

  getTestReport(id: string): ABTestReport | null {
    const test = ABTestRepository.getById(id);
    if (!test) return null;
    
    const startTime = test.startTime;
    const endTime = test.endTime;
    
    const searchesA = SearchLogRepository.getSearchCountByGroup('A', startTime, endTime);
    const searchesB = SearchLogRepository.getSearchCountByGroup('B', startTime, endTime);
    
    const feedbacksA = FeedbackRepository.getFeedbackCountByGroup('A', startTime, endTime);
    const feedbacksB = FeedbackRepository.getFeedbackCountByGroup('B', startTime, endTime);
    
    const usefulRateA = feedbacksA.total > 0 ? feedbacksA.useful / feedbacksA.total : 0;
    const usefulRateB = feedbacksB.total > 0 ? feedbacksB.useful / feedbacksB.total : 0;
    
    const ctrA = searchesA > 0 ? feedbacksA.total / searchesA : 0;
    const ctrB = searchesB > 0 ? feedbacksB.total / searchesB : 0;
    
    let winner: 'A' | 'B' | 'tie' = 'tie';
    if (usefulRateB > usefulRateA) winner = 'B';
    else if (usefulRateA > usefulRateB) winner = 'A';
    
    const confidence = calculateConfidence(
      feedbacksA.total, feedbacksA.useful,
      feedbacksB.total, feedbacksB.useful
    );
    
    return {
      testId: id,
      groupAStats: {
        totalSearches: searchesA,
        totalFeedbacks: feedbacksA.total,
        usefulRate: usefulRateA,
        clickThroughRate: ctrA
      },
      groupBStats: {
        totalSearches: searchesB,
        totalFeedbacks: feedbacksB.total,
        usefulRate: usefulRateB,
        clickThroughRate: ctrB
      },
      winner,
      confidence
    };
  }
}

export default new ABTestService();
