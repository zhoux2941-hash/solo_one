import { Router, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Review } from '../entities/Review';
import { Paper } from '../entities/Paper';
import { authenticate, requireRole } from '../middleware/auth';
import { AuthRequest, ReviewDto } from '../types';

const router = Router();

router.get('/my', authenticate, requireRole('reviewer'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未认证' });
    }

    const reviewRepository = AppDataSource.getRepository(Review);
    const reviews = await reviewRepository.find({
      where: { reviewerId: req.user.id },
      order: { assignedAt: 'DESC' },
      relations: ['paper', 'paper.author']
    });

    const reviewsWithPaper = reviews.map(review => ({
      id: review.id,
      paperId: review.paperId,
      paperTitle: review.paper?.title,
      paperAbstract: review.paper?.abstract,
      paperKeywords: review.paper?.keywords,
      originalFileName: review.paper?.originalFileName,
      paperStatus: review.paper?.status,
      authorName: review.paper?.author?.name,
      rating: review.rating,
      comment: review.comment,
      recommendation: review.recommendation,
      completed: review.completed,
      assignedAt: review.assignedAt,
      completedAt: review.completedAt
    }));

    res.json(reviewsWithPaper);
  } catch (error) {
    console.error('获取我的审稿任务错误:', error);
    res.status(500).json({ message: '获取审稿任务失败' });
  }
});

router.put('/:reviewId', authenticate, requireRole('reviewer'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未认证' });
    }

    const reviewId = parseInt(req.params.reviewId);
    const { rating, comment, recommendation }: ReviewDto = req.body;

    if (!rating || !comment || !recommendation) {
      return res.status(400).json({ message: '请填写完整的审稿意见' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: '评分必须在1-5之间' });
    }

    const reviewRepository = AppDataSource.getRepository(Review);
    const review = await reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['paper']
    });

    if (!review) {
      return res.status(404).json({ message: '审稿任务不存在' });
    }

    if (review.reviewerId !== req.user.id) {
      return res.status(403).json({ message: '无权编辑此审稿' });
    }

    if (review.completed) {
      return res.status(400).json({ message: '此审稿已完成，无法修改' });
    }

    review.rating = rating;
    review.comment = comment;
    review.recommendation = recommendation;
    review.completed = true;

    await reviewRepository.save(review);

    const paperRepository = AppDataSource.getRepository(Paper);
    const paper = await paperRepository.findOne({
      where: { id: review.paperId },
      relations: ['reviews']
    });

    if (paper) {
      const allCompleted = paper.reviews.every(r => r.completed);
      if (allCompleted && paper.reviews.length >= 2) {
        paper.status = 'reviewed';
        await paperRepository.save(paper);
      }
    }

    res.json({
      id: review.id,
      paperId: review.paperId,
      rating: review.rating,
      comment: review.comment,
      recommendation: review.recommendation,
      completed: review.completed,
      completedAt: review.completedAt
    });
  } catch (error) {
    console.error('提交审稿意见错误:', error);
    res.status(500).json({ message: '提交审稿意见失败' });
  }
});

router.get('/:reviewId', authenticate, requireRole('reviewer'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未认证' });
    }

    const reviewId = parseInt(req.params.reviewId);
    const reviewRepository = AppDataSource.getRepository(Review);
    const review = await reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['paper', 'paper.author']
    });

    if (!review) {
      return res.status(404).json({ message: '审稿任务不存在' });
    }

    if (review.reviewerId !== req.user.id) {
      return res.status(403).json({ message: '无权查看此审稿' });
    }

    res.json({
      id: review.id,
      paperId: review.paperId,
      paperTitle: review.paper?.title,
      paperAbstract: review.paper?.abstract,
      paperKeywords: review.paper?.keywords,
      originalFileName: review.paper?.originalFileName,
      paperStatus: review.paper?.status,
      authorName: review.paper?.author?.name,
      rating: review.rating,
      comment: review.comment,
      recommendation: review.recommendation,
      completed: review.completed,
      assignedAt: review.assignedAt,
      completedAt: review.completedAt
    });
  } catch (error) {
    console.error('获取审稿详情错误:', error);
    res.status(500).json({ message: '获取审稿详情失败' });
  }
});

export default router;
