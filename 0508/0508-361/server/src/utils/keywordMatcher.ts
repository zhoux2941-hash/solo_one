import { User } from '../entities/User';
import { Paper } from '../entities/Paper';

export interface MatchedReviewer {
  reviewer: User;
  matchScore: number;
  matchedKeywords: string[];
}

export const calculateMatchScore = (
  paperKeywords: string[],
  reviewerKeywords: string[] | null
): { score: number; matched: string[] } => {
  if (!reviewerKeywords || reviewerKeywords.length === 0) {
    return { score: 0, matched: [] };
  }

  const paperLower = paperKeywords.map(k => k.toLowerCase().trim());
  const reviewerLower = reviewerKeywords.map(k => k.toLowerCase().trim());

  const matched: string[] = [];
  for (const pk of paperLower) {
    for (const rk of reviewerLower) {
      if (pk === rk) {
        matched.push(pk);
        break;
      }
    }
  }

  const uniqueMatched = [...new Set(matched)];
  const score = uniqueMatched.length;

  return { score, matched: uniqueMatched };
};

export const matchReviewers = (
  paper: Paper,
  reviewers: User[],
  excludeReviewerIds: number[] = []
): MatchedReviewer[] => {
  const eligibleReviewers = reviewers.filter(
    r => r.role === 'reviewer' && 
         !excludeReviewerIds.includes(r.id) &&
         r.researchKeywords && 
         r.researchKeywords.length > 0
  );

  const matched: MatchedReviewer[] = eligibleReviewers.map(reviewer => {
    const { score, matched } = calculateMatchScore(paper.keywords, reviewer.researchKeywords);
    return {
      reviewer,
      matchScore: score,
      matchedKeywords: matched
    };
  });

  return matched
    .filter(m => m.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
};

export const autoAssignReviewers = (
  paper: Paper,
  reviewers: User[],
  existingReviewerIds: number[] = [],
  minCount: number = 2,
  maxCount: number = 3
): MatchedReviewer[] => {
  const matched = matchReviewers(paper, reviewers, [
    paper.authorId,
    ...existingReviewerIds
  ]);

  return matched.slice(0, Math.min(maxCount, Math.max(minCount, matched.length)));
};
