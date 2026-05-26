import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppDataSource } from '../data-source';
import { Paper } from '../entities/Paper';
import { Review } from '../entities/Review';
import { User } from '../entities/User';
import { authenticate, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('只允许上传PDF文件'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

router.post('/submit', authenticate, requireRole('author'), upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未认证' });
    }

    const { title, abstract, keywords } = req.body;

    if (!title || !abstract || !keywords) {
      return res.status(400).json({ message: '请填写标题、摘要和关键词' });
    }

    if (!req.file) {
      return res.status(400).json({ message: '请上传PDF文件' });
    }

    const keywordsArray = typeof keywords === 'string'
      ? keywords.split(',').map(k => k.trim()).filter(k => k)
      : keywords;

    const paperRepository = AppDataSource.getRepository(Paper);
    const paper = paperRepository.create({
      title,
      abstract,
      keywords: keywordsArray,
      filePath: req.file.filename,
      originalFileName: req.file.originalname,
      authorId: req.user.id,
      status: 'submitted'
    });

    await paperRepository.save(paper);

    res.status(201).json({
      id: paper.id,
      title: paper.title,
      abstract: paper.abstract,
      keywords: paper.keywords,
      originalFileName: paper.originalFileName,
      status: paper.status,
      submittedAt: paper.submittedAt
    });
  } catch (error) {
    console.error('投稿错误:', error);
    res.status(500).json({ message: '投稿失败' });
  }
});

router.get('/my', authenticate, requireRole('author'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未认证' });
    }

    const paperRepository = AppDataSource.getRepository(Paper);
    const papers = await paperRepository.find({
      where: { authorId: req.user.id },
      order: { submittedAt: 'DESC' },
      relations: ['reviews', 'reviews.reviewer']
    });

    const papersWithProgress = papers.map(paper => {
      const totalReviews = paper.reviews.length;
      const completedReviews = paper.reviews.filter(r => r.completed).length;
      const reviewProgress = totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 0;

      const reviewsSummary = paper.reviews
        .filter(r => r.completed)
        .map(r => ({
          rating: r.rating,
          comment: r.comment,
          recommendation: r.recommendation,
          reviewerName: r.reviewer?.name || '匿名审稿人'
        }));

      return {
        id: paper.id,
        title: paper.title,
        abstract: paper.abstract,
        keywords: paper.keywords,
        originalFileName: paper.originalFileName,
        status: paper.status,
        submittedAt: paper.submittedAt,
        reviewProgress,
        totalReviews,
        completedReviews,
        finalDecision: paper.finalDecision,
        decisionSummary: paper.decisionSummary,
        reviewsSummary,
        emailSent: paper.emailSent
      };
    });

    res.json(papersWithProgress);
  } catch (error) {
    console.error('获取我的论文错误:', error);
    res.status(500).json({ message: '获取论文列表失败' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未认证' });
    }

    const paperId = parseInt(req.params.id);
    const paperRepository = AppDataSource.getRepository(Paper);
    const paper = await paperRepository.findOne({
      where: { id: paperId },
      relations: ['author', 'reviews', 'reviews.reviewer']
    });

    if (!paper) {
      return res.status(404).json({ message: '论文不存在' });
    }

    if (req.user.role === 'author' && paper.authorId !== req.user.id) {
      return res.status(403).json({ message: '无权查看此论文' });
    }

    if (req.user.role === 'reviewer') {
      const hasReview = paper.reviews.some(r => r.reviewerId === req.user!.id);
      if (!hasReview) {
        return res.status(403).json({ message: '无权查看此论文' });
      }
    }

    const totalReviews = paper.reviews.length;
    const completedReviews = paper.reviews.filter(r => r.completed).length;
    const reviewProgress = totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 0;

    let reviews;
    if (req.user.role === 'chair' || req.user.role === 'reviewer') {
      reviews = paper.reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        recommendation: r.recommendation,
        completed: r.completed,
        reviewerId: r.reviewerId,
        reviewerName: r.reviewer?.name,
        reviewerKeywords: r.reviewer?.researchKeywords,
        assignedAt: r.assignedAt,
        completedAt: r.completedAt
      }));
    } else {
      reviews = paper.reviews
        .filter(r => r.completed)
        .map(r => ({
          rating: r.rating,
          comment: r.comment,
          recommendation: r.recommendation,
          reviewerName: '匿名审稿人'
        }));
    }

    res.json({
      id: paper.id,
      title: paper.title,
      abstract: paper.abstract,
      keywords: paper.keywords,
      originalFileName: paper.originalFileName,
      status: paper.status,
      submittedAt: paper.submittedAt,
      reviewProgress,
      totalReviews,
      completedReviews,
      finalDecision: paper.finalDecision,
      decisionSummary: paper.decisionSummary,
      emailSent: paper.emailSent,
      authorId: paper.authorId,
      authorName: paper.author?.name,
      authorEmail: paper.author?.email,
      reviews
    });
  } catch (error) {
    console.error('获取论文详情错误:', error);
    res.status(500).json({ message: '获取论文详情失败' });
  }
});

router.get('/download/:filename', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未认证' });
    }

    const filename = req.params.filename;
    const paperRepository = AppDataSource.getRepository(Paper);
    const paper = await paperRepository.findOneBy({ filePath: filename });

    if (!paper) {
      return res.status(404).json({ message: '文件不存在' });
    }

    if (req.user.role === 'author' && paper.authorId !== req.user.id) {
      return res.status(403).json({ message: '无权下载此文件' });
    }

    if (req.user.role === 'reviewer') {
      const reviewRepository = AppDataSource.getRepository(Review);
      const hasReview = await reviewRepository.findOneBy({
        paperId: paper.id,
        reviewerId: req.user.id
      });
      if (!hasReview) {
        return res.status(403).json({ message: '无权下载此文件' });
      }
    }

    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: '文件不存在' });
    }

    res.download(filePath, paper.originalFileName);
  } catch (error) {
    console.error('下载文件错误:', error);
    res.status(500).json({ message: '下载文件失败' });
  }
});

export default router;
