import FeedbackRepository from '../repositories/FeedbackRepository.js';
import ABTestRepository from '../repositories/ABTestRepository.js';
import ArticleClickStatsRepository from '../repositories/ArticleClickStatsRepository.js';

class FeedbackService {
  submitFeedback(
    query: string,
    articleId: string,
    articleTitle: string,
    feedbackType: 'useful' | 'useless',
    userDepartment: string
  ): string {
    let algorithmGroup: 'A' | 'B' | undefined;
    const runningTest = ABTestRepository.getRunningTest();
    if (runningTest) {
      const assignment = ABTestRepository.getAssignment(runningTest.id, userDepartment);
      algorithmGroup = assignment || undefined;
    }
    
    ArticleClickStatsRepository.incrementClick(articleId, articleTitle, query);
    
    return FeedbackRepository.create(
      query,
      articleId,
      articleTitle,
      feedbackType,
      userDepartment,
      algorithmGroup
    );
  }
}

export default new FeedbackService();
