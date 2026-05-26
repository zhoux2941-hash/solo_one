import { Router, Response } from 'express';
import { In } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Paper } from '../entities/Paper';
import { User } from '../entities/User';
import { Review } from '../entities/Review';
import { authenticate, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types';
import { autoAssignReviewers, matchReviewers } from '../utils/keywordMatcher';
import { sendBulkAcceptanceEmails, getEmailLogs, EmailLog } from '../utils/emailService';
import { calculateReviewerQualityStats } from '../utils/reviewQuality';

const router = Router();

router.get('/papers', authenticate, requireRole('chair'), async (req: AuthRequest, res: Response) => {
  try {
    const paperRepository = AppDataSource.getRepository(Paper);
    const papers = await paperRepository.find({
      order: { submittedAt: 'DESC' },
      relations: ['author', 'reviews', 'reviews.reviewer']
    });

    const papersWithDetails = papers.map(paper => {
      const totalReviews = paper.reviews.length;
      const completedReviews = paper.reviews.filter(r => r.completed).length;
      const reviewProgress = totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 0;

      const avgRating = completedReviews > 0
        ? paper.reviews
            .filter(r => r.completed && r.rating !== null)
            .reduce((sum, r) => sum + (r.rating || 0), 0) / completedReviews
        : null;

      return {
        id: paper.id,
        title: paper.title,
        abstract: paper.abstract,
        keywords: paper.keywords,
        originalFileName: paper.originalFileName,
        status: paper.status,
        submittedAt: paper.submittedAt,
        authorId: paper.authorId,
        authorName: paper.author?.name,
        authorEmail: paper.author?.email,
        reviewProgress,
        totalReviews,
        completedReviews,
        avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        finalDecision: paper.finalDecision,
        decisionSummary: paper.decisionSummary,
        emailSent: paper.emailSent,
        reviews: paper.reviews.map(r => ({
          id: r.id,
          reviewerId: r.reviewerId,
          reviewerName: r.reviewer?.name,
          rating: r.rating,
          recommendation: r.recommendation,
          completed: r.completed
        }))
      };
    });

    res.json(papersWithDetails);
  } catch (error) {
    console.error('获取所有论文错误:', error);
    res.status(500).json({ message: '获取论文列表失败' });
  }
});

router.get('/reviewers', authenticate, requireRole('chair'), async (req: AuthRequest, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const reviewRepository = AppDataSource.getRepository(Review);
    const paperRepository = AppDataSource.getRepository(Paper);

    const reviewers = await userRepository.find({
      where: { role: 'reviewer' },
      order: { name: 'ASC' }
    });

    const allReviews = await reviewRepository.find();
    const allPapers = await paperRepository.find();

    const reviewersWithStats = calculateReviewerQualityStats(reviewers, allReviews, allPapers);

    res.json(reviewersWithStats);
  } catch (error) {
    console.error('获取审稿人列表错误:', error);
    res.status(500).json({ message: '获取审稿人列表失败' });
  }
});

router.get('/match-reviewers/:paperId', authenticate, requireRole('chair'), async (req: AuthRequest, res: Response) => {
  try {
    const paperId = parseInt(req.params.paperId);
    const paperRepository = AppDataSource.getRepository(Paper);
    const userRepository = AppDataSource.getRepository(User);

    const paper = await paperRepository.findOneBy({ id: paperId });
    if (!paper) {
      return res.status(404).json({ message: '论文不存在' });
    }

    const reviewers = await userRepository.find({ where: { role: 'reviewer' } });

    const reviewRepository = AppDataSource.getRepository(Review);
    const existingReviews = await reviewRepository.find({ where: { paperId } });
    const existingReviewerIds = existingReviews.map(r => r.reviewerId);

    const matched = matchReviewers(paper, reviewers, [paper.authorId, ...existingReviewerIds]);

    res.json({
      paperId: paper.id,
      paperTitle: paper.title,
      paperKeywords: paper.keywords,
      matchedReviewers: matched.map(m => ({
        id: m.reviewer.id,
        name: m.reviewer.name,
        email: m.reviewer.email,
        affiliation: m.reviewer.affiliation,
        researchKeywords: m.reviewer.researchKeywords,
        matchScore: m.matchScore,
        matchedKeywords: m.matchedKeywords
      }))
    });
  } catch (error) {
    console.error('匹配审稿人错误:', error);
    res.status(500).json({ message: '匹配审稿人失败' });
  }
});

router.post('/auto-assign-reviewers/:paperId', authenticate, requireRole('chair'), async (req: AuthRequest, res: Response) => {
  try {
    const paperId = parseInt(req.params.paperId);
    const { minCount = 2, maxCount = 3 } = req.body;

    const paperRepository = AppDataSource.getRepository(Paper);
    const userRepository = AppDataSource.getRepository(User);
    const reviewRepository = AppDataSource.getRepository(Review);

    const paper = await paperRepository.findOneBy({ id: paperId });
    if (!paper) {
      return res.status(404).json({ message: '论文不存在' });
    }

    if (paper.status !== 'submitted') {
      return res.status(400).json({ message: '论文状态不允许分配审稿人' });
    }

    const existingReviews = await reviewRepository.find({ where: { paperId } });
    const existingReviewerIds = existingReviews.map(r => r.reviewerId);

    if (existingReviewerIds.length >= maxCount) {
      return res.status(400).json({ message: '已分配足够的审稿人' });
    }

    const reviewers = await userRepository.find({ where: { role: 'reviewer' } });

    const autoMatched = autoAssignReviewers(
      paper,
      reviewers,
      existingReviewerIds,
      minCount - existingReviewerIds.length,
      maxCount - existingReviewerIds.length
    );

    if (autoMatched.length === 0) {
      return res.status(400).json({ message: '没有找到匹配的审稿人，请手动分配' });
    }

    const newReviews: Review[] = [];
    for (const matched of autoMatched) {
      const review = reviewRepository.create({
        paperId: paper.id,
        reviewerId: matched.reviewer.id
      });
      newReviews.push(review);
    }

    await reviewRepository.save(newReviews);

    paper.status = 'reviewing';
    await paperRepository.save(paper);

    const allReviews = await reviewRepository.find({
      where: { paperId },
      relations: ['reviewer']
    });

    res.json({
      message: `成功自动分配 ${newReviews.length} 位审稿人`,
      paperId: paper.id,
      status: paper.status,
      reviews: allReviews.map(r => ({
        id: r.id,
        reviewerId: r.reviewerId,
        reviewerName: r.reviewer?.name,
        reviewerEmail: r.reviewer?.email,
        completed: r.completed,
        assignedAt: r.assignedAt
      }))
    });
  } catch (error) {
    console.error('自动分配审稿人错误:', error);
    res.status(500).json({ message: '自动分配审稿人失败' });
  }
});

router.post('/assign-reviewer', authenticate, requireRole('chair'), async (req: AuthRequest, res: Response) => {
  try {
    const { paperId, reviewerIds }: { paperId: number; reviewerIds: number[] } = req.body;

    if (!paperId || !reviewerIds || reviewerIds.length === 0) {
      return res.status(400).json({ message: '请提供论文ID和审稿人ID列表' });
    }

    const paperRepository = AppDataSource.getRepository(Paper);
    const userRepository = AppDataSource.getRepository(User);
    const reviewRepository = AppDataSource.getRepository(Review);

    const paper = await paperRepository.findOneBy({ id: paperId });
    if (!paper) {
      return res.status(404).json({ message: '论文不存在' });
    }

    const existingReviews = await reviewRepository.find({ where: { paperId } });
    const existingReviewerIds = existingReviews.map(r => r.reviewerId);

    if (paper.authorId) {
      if (reviewerIds.includes(paper.authorId)) {
        return res.status(400).json({ message: '不能将作者分配为审稿人' });
      }
    }

    const validReviewers = await userRepository.find({
      where: { id: In(reviewerIds), role: 'reviewer' }
    });

    if (validReviewers.length !== reviewerIds.length) {
      return res.status(400).json({ message: '存在无效的审稿人ID' });
    }

    const duplicateReviewers = reviewerIds.filter(id => existingReviewerIds.includes(id));
    if (duplicateReviewers.length > 0) {
      return res.status(400).json({ message: '审稿人已分配到此论文' });
    }

    const newReviews: Review[] = [];
    for (const reviewerId of reviewerIds) {
      const review = reviewRepository.create({
        paperId: paper.id,
        reviewerId
      });
      newReviews.push(review);
    }

    await reviewRepository.save(newReviews);

    if (paper.status === 'submitted') {
      paper.status = 'reviewing';
      await paperRepository.save(paper);
    }

    const allReviews = await reviewRepository.find({
      where: { paperId },
      relations: ['reviewer']
    });

    res.json({
      message: `成功分配 ${newReviews.length} 位审稿人`,
      paperId: paper.id,
      status: paper.status,
      reviews: allReviews.map(r => ({
        id: r.id,
        reviewerId: r.reviewerId,
        reviewerName: r.reviewer?.name,
        reviewerEmail: r.reviewer?.email,
        completed: r.completed,
        assignedAt: r.assignedAt
      }))
    });
  } catch (error) {
    console.error('分配审稿人错误:', error);
    res.status(500).json({ message: '分配审稿人失败' });
  }
});

router.post('/set-decision/:paperId', authenticate, requireRole('chair'), async (req: AuthRequest, res: Response) => {
  try {
    const paperId = parseInt(req.params.paperId);
    const { decision, summary }: { decision: 'accept' | 'minor_revision' | 'major_revision' | 'reject'; summary?: string } = req.body;

    if (!decision) {
      return res.status(400).json({ message: '请提供最终决定' });
    }

    const paperRepository = AppDataSource.getRepository(Paper);
    const paper = await paperRepository.findOne({
      where: { id: paperId },
      relations: ['reviews']
    });

    if (!paper) {
      return res.status(404).json({ message: '论文不存在' });
    }

    const completedReviews = paper.reviews.filter(r => r.completed);
    if (completedReviews.length < 2) {
      return res.status(400).json({ message: '至少需要2位审稿人完成审稿才能做出决定' });
    }

    paper.finalDecision = decision;
    paper.decisionSummary = summary || null;

    switch (decision) {
      case 'accept':
        paper.status = 'accepted';
        break;
      case 'minor_revision':
        paper.status = 'minor_revision';
        break;
      case 'major_revision':
        paper.status = 'major_revision';
        break;
      case 'reject':
        paper.status = 'rejected';
        break;
    }

    await paperRepository.save(paper);

    res.json({
      message: '已设置最终决定',
      paperId: paper.id,
      status: paper.status,
      finalDecision: paper.finalDecision,
      decisionSummary: paper.decisionSummary
    });
  } catch (error) {
    console.error('设置最终决定错误:', error);
    res.status(500).json({ message: '设置最终决定失败' });
  }
});

router.post('/send-emails', authenticate, requireRole('chair'), async (req: AuthRequest, res: Response) => {
  try {
    const { paperIds }: { paperIds?: number[] } = req.body;

    const paperRepository = AppDataSource.getRepository(Paper);
    const userRepository = AppDataSource.getRepository(User);

    let papers: Paper[];
    if (paperIds && paperIds.length > 0) {
      papers = await paperRepository.find({
        where: { id: In(paperIds), emailSent: false },
        relations: ['author']
      });
    } else {
      papers = await paperRepository.find({
        where: { emailSent: false },
        relations: ['author']
      });
    }

    const papersWithDecision = papers.filter(p => p.finalDecision !== null);

    if (papersWithDecision.length === 0) {
      return res.status(400).json({ message: '没有需要发送通知的论文' });
    }

    const authorMap = new Map<number, User>();
    for (const paper of papersWithDecision) {
      if (paper.author) {
        authorMap.set(paper.authorId, paper.author);
      }
    }

    const { success, failed } = sendBulkAcceptanceEmails(papersWithDecision, authorMap);

    const successfulPaperIds = success.map(log => log.paperId).filter(Boolean) as number[];
    if (successfulPaperIds.length > 0) {
      await paperRepository.update(
        { id: In(successfulPaperIds) },
        { emailSent: true }
      );
    }

    res.json({
      message: `成功发送 ${success.length} 封邮件，失败 ${failed.length} 封`,
      successCount: success.length,
      failedCount: failed.length,
      sentPaperIds: successfulPaperIds,
      failedPaperIds: failed,
      emails: success.map((log: EmailLog) => ({
        id: log.id,
        to: log.to,
        subject: log.subject,
        paperId: log.paperId,
        timestamp: log.timestamp
      }))
    });
  } catch (error) {
    console.error('发送邮件错误:', error);
    res.status(500).json({ message: '发送邮件失败' });
  }
});

router.get('/email-logs', authenticate, requireRole('chair'), async (req: AuthRequest, res: Response) => {
  try {
    const logs = getEmailLogs();
    res.json(logs);
  } catch (error) {
    console.error('获取邮件日志错误:', error);
    res.status(500).json({ message: '获取邮件日志失败' });
  }
});

router.get('/statistics', authenticate, requireRole('chair'), async (req: AuthRequest, res: Response) => {
  try {
    const paperRepository = AppDataSource.getRepository(Paper);
    const userRepository = AppDataSource.getRepository(User);
    const reviewRepository = AppDataSource.getRepository(Review);

    const totalPapers = await paperRepository.count();
    const totalAuthors = await userRepository.count({ where: { role: 'author' } });
    const totalReviewers = await userRepository.count({ where: { role: 'reviewer' } });
    const totalReviews = await reviewRepository.count();
    const completedReviews = await reviewRepository.count({ where: { completed: true } });

    const statusCounts = await paperRepository
      .createQueryBuilder('paper')
      .select('paper.status, COUNT(*) as count')
      .groupBy('paper.status')
      .getRawMany();

    const decisionCounts = await paperRepository
      .createQueryBuilder('paper')
      .select('paper.finalDecision as decision, COUNT(*) as count')
      .where('paper.finalDecision IS NOT NULL')
      .groupBy('paper.finalDecision')
      .getRawMany();

    const emailsSent = await paperRepository.count({ where: { emailSent: true } });
    const emailsPending = await paperRepository
      .createQueryBuilder('paper')
      .where('paper.emailSent = :emailSent', { emailSent: false })
      .andWhere('paper.finalDecision IS NOT NULL')
      .getCount();

    const statusMap: Record<string, number> = {};
    for (const item of statusCounts) {
      statusMap[item.status] = parseInt(item.count);
    }

    const decisionMap: Record<string, number> = {};
    for (const item of decisionCounts) {
      decisionMap[item.decision] = parseInt(item.count);
    }

    res.json({
      totalPapers,
      totalAuthors,
      totalReviewers,
      totalReviews,
      completedReviews,
      reviewProgress: totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 0,
      byStatus: {
        submitted: statusMap['submitted'] || 0,
        reviewing: statusMap['reviewing'] || 0,
        reviewed: statusMap['reviewed'] || 0,
        accepted: statusMap['accepted'] || 0,
        rejected: statusMap['rejected'] || 0,
        minor_revision: statusMap['minor_revision'] || 0,
        major_revision: statusMap['major_revision'] || 0
      },
      byDecision: {
        accept: decisionMap['accept'] || 0,
        minor_revision: decisionMap['minor_revision'] || 0,
        major_revision: decisionMap['major_revision'] || 0,
        reject: decisionMap['reject'] || 0
      },
      emailsSent,
      emailsPending
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({ message: '获取统计数据失败' });
  }
});

export default router;
