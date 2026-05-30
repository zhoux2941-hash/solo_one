import { SCORING, PHYSICS } from '@/constants/config';
import { Player, RoundScore, Pose, POSE_SCORE_VALUES } from '@/types/game';

export function calculatePoseScore(player: Player): number {
  if (player.poseChanges.length === 0) {
    return 5;
  }

  const uniquePoses = new Set(player.poseChanges);
  const poseCount = player.poseChanges.length;
  const uniqueCount = uniquePoses.size;

  let totalPoseValue = 0;
  player.poseChanges.forEach((pose) => {
    totalPoseValue += POSE_SCORE_VALUES[pose];
  });

  const averagePoseValue = totalPoseValue / poseCount;
  const varietyBonus = Math.min(SCORING.VARIETY_BONUS_MAX, uniqueCount * SCORING.VARIETY_BONUS_PER_POSE);
  const frequencyBonus = Math.min(SCORING.FREQUENCY_BONUS_MAX, poseCount * SCORING.FREQUENCY_BONUS_PER_POSE);

  const baseScore = averagePoseValue + varietyBonus + frequencyBonus;
  return Math.min(SCORING.POSE_SCORE_MAX, Math.max(0, Math.round(baseScore)));
}

export function calculateHeightScore(maxHeight: number): number {
  const ratio = Math.min(1, maxHeight / SCORING.MAX_POSSIBLE_HEIGHT);
  return Math.round(ratio * SCORING.HEIGHT_SCORE_MAX);
}

export function calculateLandingScore(
  landingPose: Pose | null,
  velocityY: number,
  timingAccuracy: number
): number {
  if (!landingPose) {
    return 0;
  }

  let poseScore = 0;
  if (landingPose === 'standing') {
    poseScore = SCORING.LANDING_STANDING_SCORE;
  } else if (landingPose === 'layout') {
    poseScore = SCORING.LANDING_LAYOUT_SCORE;
  } else if (landingPose === 'split' || landingPose === 'pike') {
    poseScore = SCORING.LANDING_SPLIT_PIKE_SCORE;
  } else {
    poseScore = SCORING.LANDING_OTHER_SCORE;
  }

  const stabilityScore = Math.max(0, SCORING.STABILITY_BASE - Math.abs(velocityY) * SCORING.STABILITY_PENALTY_FACTOR);
  const timingBonus = Math.round(timingAccuracy * SCORING.TIMING_BONUS_MAX);

  return Math.min(SCORING.LANDING_SCORE_MAX, Math.max(0, poseScore + stabilityScore + timingBonus));
}

export function calculateRoundScore(
  round: number,
  playerId: 'player' | 'ai',
  player: Player,
  timingAccuracy: number
): RoundScore {
  const poseScore = calculatePoseScore(player);
  const heightScore = calculateHeightScore(player.maxHeight);
  const landingScore = calculateLandingScore(
    player.landingPose,
    player.velocityY,
    timingAccuracy
  );

  const total = poseScore + heightScore + landingScore;

  return {
    round,
    player: playerId,
    poseScore,
    heightScore,
    landingScore,
    total: Math.min(100, Math.max(0, total)),
    timestamp: Date.now(),
    timingAccuracy: Math.round(timingAccuracy * 100),
  };
}

export function getScoreRating(total: number): { rating: string; color: string } {
  if (total >= SCORING.RATING_PERFECT) return { rating: '完美!', color: '#4CAF50' };
  if (total >= SCORING.RATING_EXCELLENT) return { rating: '优秀', color: '#8BC34A' };
  if (total >= SCORING.RATING_GOOD) return { rating: '良好', color: '#FFC107' };
  if (total >= SCORING.RATING_AVERAGE) return { rating: '一般', color: '#FF9800' };
  return { rating: '加油', color: '#F44336' };
}

export function getTimingDescription(accuracy: number): { text: string; color: string } {
  if (accuracy >= PHYSICS.PERFECT_ACCURACY_THRESHOLD) return { text: '完美时机!', color: '#4CAF50' };
  if (accuracy >= SCORING.TIMING_GOOD_THRESHOLD) return { text: '不错', color: '#8BC34A' };
  if (accuracy >= SCORING.TIMING_OK_THRESHOLD) return { text: '一般', color: '#FFC107' };
  return { text: '时机欠佳', color: '#F44336' };
}
