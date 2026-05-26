import { Review } from '../entities/Review';
import { Paper } from '../entities/Paper';

export interface ReviewerQualityStats {
  reviewerId: number;
  reviewerName: string;
  reviewerEmail: string;
  affiliation: string | null;
  totalReviews: number;
  completedReviews: number;
  avgRating: number;
  avgQualityScore: number;
  qualityDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
}

const DECISION_ORDER: Record<string, number> = {
  accept: 4,
  minor_revision: 3,
  major_revision: 2,
  reject: 1
};

export const calculateReviewQualityScore = (
  reviewRecommendation: string,
  finalDecision: string
): number => {
  const reviewRank = DECISION_ORDER[reviewRecommendation] || 0;
  const decisionRank = DECISION_ORDER[finalDecision] || 0;

  if (reviewRank === 0 || decisionRank === 0) {
    return 0;
  }

  const diff = Math.abs(reviewRank - decisionRank);

  if (diff === 0) {
    return 5;
  } else if (diff === 1) {
    return 4;
  } else if (diff === 2) {
    return 2;
  } else {
    return 1;
  }
};

export const getQualityLevel = (score: number): 'excellent' | 'good' | 'fair' | 'poor' => {
  if (score >= 4.5) return 'excellent';
  if (score >= 3.5) return 'good';
  if (score >= 2.5) return 'fair';
  return 'poor';
};

export const calculateReviewerQualityStats = (
  reviewers: any[],
  reviews: Review[],
  papers: Paper[]
): ReviewerQualityStats[] => {
  const paperDecisionMap = new Map<number, string>();
  papers.forEach(p => {
    if (p.finalDecision) {
      paperDecisionMap.set(p.id, p.finalDecision);
    }
  });

  const reviewerStatsMap = new Map<number, {
    totalReviews: number;
    completedReviews: number;
    totalRating: number;
    totalQualityScore: number;
    qualityCounts: { excellent: number; good: number; fair: number; poor: number };
  }>();

  reviewers.forEach(r => {
    reviewerStatsMap.set(r.id, {
      totalReviews: 0,
      completedReviews: 0,
      totalRating: 0,
      totalQualityScore: 0,
      qualityCounts: { excellent: 0, good: 0, fair: 0, poor: 0 }
    });
  });

  reviews.forEach(review => {
    const stats = reviewerStatsMap.get(review.reviewerId);
    if (!stats) return;

    stats.totalReviews++;

    if (review.completed) {
      stats.completedReviews++;
      stats.totalRating += review.rating || 0;

      const finalDecision = paperDecisionMap.get(review.paperId);
      if (finalDecision && review.recommendation) {
        const qualityScore = calculateReviewQualityScore(review.recommendation, finalDecision);
        stats.totalQualityScore += qualityScore;
        const level = getQualityLevel(qualityScore);
        stats.qualityCounts[level]++;
      }
    }
  });

  return reviewers.map(reviewer => {
    const stats = reviewerStatsMap.get(reviewer.id)!;
    return {
      reviewerId: reviewer.id,
      reviewerName: reviewer.name,
      reviewerEmail: reviewer.email,
      affiliation: reviewer.affiliation,
      totalReviews: stats.totalReviews,
      completedReviews: stats.completedReviews,
      avgRating: stats.completedReviews > 0
        ? Math.round((stats.totalRating / stats.completedReviews) * 10) / 10
        : 0,
      avgQualityScore: stats.totalQualityScore > 0
        ? Math.round((stats.totalQualityScore / stats.completedReviews) * 10) / 10
        : 0,
      qualityDistribution: stats.qualityCounts
    };
  });
};
