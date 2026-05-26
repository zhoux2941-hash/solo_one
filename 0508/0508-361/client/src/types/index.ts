export type UserRole = 'author' | 'reviewer' | 'chair';
export type PaperStatus = 'submitted' | 'reviewing' | 'reviewed' | 'accepted' | 'rejected' | 'minor_revision' | 'major_revision';
export type FinalDecision = 'accept' | 'minor_revision' | 'major_revision' | 'reject' | null;
export type Recommendation = 'accept' | 'minor_revision' | 'major_revision' | 'reject';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  affiliation?: string;
  researchKeywords?: string[] | null;
}

export interface Paper {
  id: number;
  title: string;
  abstract: string;
  keywords: string[];
  originalFileName: string;
  status: PaperStatus;
  submittedAt: string;
  reviewProgress: number;
  totalReviews: number;
  completedReviews: number;
  finalDecision: FinalDecision;
  decisionSummary: string | null;
  emailSent: boolean;
  authorId: number;
  authorName?: string;
  authorEmail?: string;
  avgRating?: number | null;
  reviews?: Review[];
  reviewsSummary?: ReviewSummary[];
}

export interface Review {
  id: number;
  paperId: number;
  reviewerId: number;
  reviewerName?: string;
  reviewerKeywords?: string[];
  rating: number | null;
  comment: string | null;
  recommendation: Recommendation | null;
  completed: boolean;
  assignedAt: string;
  completedAt?: string;
}

export interface ReviewSummary {
  rating: number | null;
  comment: string | null;
  recommendation: Recommendation | null;
  reviewerName: string;
}

export interface ReviewTask {
  id: number;
  paperId: number;
  paperTitle: string;
  paperAbstract: string;
  paperKeywords: string[];
  originalFileName: string;
  paperStatus: PaperStatus;
  authorName: string;
  rating: number | null;
  comment: string | null;
  recommendation: Recommendation | null;
  completed: boolean;
  assignedAt: string;
  completedAt?: string;
}

export interface MatchedReviewer {
  id: number;
  name: string;
  email: string;
  affiliation: string;
  researchKeywords: string[] | null;
  matchScore: number;
  matchedKeywords: string[];
}

export interface QualityDistribution {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}

export interface ReviewerWithStats {
  reviewerId: number;
  reviewerEmail: string;
  reviewerName: string;
  affiliation: string | null;
  researchKeywords: string[] | null;
  totalReviews: number;
  completedReviews: number;
  avgRating: number;
  avgQualityScore: number;
  qualityDistribution: QualityDistribution;
}

export interface Statistics {
  totalPapers: number;
  totalAuthors: number;
  totalReviewers: number;
  totalReviews: number;
  completedReviews: number;
  reviewProgress: number;
  byStatus: Record<string, number>;
  byDecision: Record<string, number>;
  emailsSent: number;
  emailsPending: number;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  paperId?: number;
}

export const statusText: Record<PaperStatus, string> = {
  submitted: '已提交',
  reviewing: '审稿中',
  reviewed: '审稿完成',
  accepted: '已录用',
  rejected: '已拒稿',
  minor_revision: '小修',
  major_revision: '大修'
};

export const statusColor: Record<PaperStatus, string> = {
  submitted: 'default',
  reviewing: 'processing',
  reviewed: 'warning',
  accepted: 'success',
  rejected: 'error',
  minor_revision: 'blue',
  major_revision: 'orange'
};

export const decisionText: Record<string, string> = {
  accept: '录用',
  minor_revision: '小修后录用',
  major_revision: '大修后再审',
  reject: '拒稿'
};

export const roleText: Record<UserRole, string> = {
  author: '作者',
  reviewer: '审稿人',
  chair: '主席'
};
