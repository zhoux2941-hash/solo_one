import { Pose, POSE_MAP, DirectionKey } from '@/types/game';

export interface AIDecision {
  shouldPress: boolean;
  pressTime: number;
  desiredPose: Pose;
}

export class AIController {
  private difficulty: number;
  private perfectChance: number;
  private poseChangeFrequency: number;

  constructor(difficulty: number = 0.75) {
    this.difficulty = difficulty;
    this.perfectChance = 0.6 + difficulty * 0.25;
    this.poseChangeFrequency = 200 + (1 - difficulty) * 200;
  }

  calculatePressTime(windowStart: number, windowEnd: number): number {
    const windowCenter = (windowStart + windowEnd) / 2;
    const windowDuration = windowEnd - windowStart;

    const rand = Math.random();
    if (rand < this.perfectChance) {
      const offset = (Math.random() - 0.5) * windowDuration * 0.15;
      return windowCenter + offset;
    } else {
      const offset = (Math.random() - 0.5) * windowDuration * 0.6;
      return windowCenter + offset;
    }
  }

  getRandomPose(): Pose {
    const poses: Pose[] = ['split', 'twist', 'layout', 'pike', 'jump'];
    const weights = [0.2, 0.25, 0.25, 0.15, 0.15];

    const weightedPoses = poses.map((pose, index) => ({
      pose,
      weight: weights[index],
    }));

    weightedPoses.sort((a, b) => b.weight - a.weight);

    const rand = Math.random();
    let cumulative = 0;
    for (const item of weightedPoses) {
      cumulative += item.weight;
      if (rand < cumulative) {
        return item.pose;
      }
    }

    return 'layout';
  }

  shouldChangePose(currentTime: number, lastChangeTime: number): boolean {
    return currentTime - lastChangeTime > this.poseChangeFrequency;
  }

  getLandingPose(): Pose {
    const rand = Math.random();
    if (rand < this.difficulty * 0.8) {
      return 'standing';
    }
    return this.getRandomPose();
  }

  getPoseSequence(airborneDuration: number): Pose[] {
    const changeCount = Math.floor(airborneDuration / this.poseChangeFrequency);
    const sequence: Pose[] = [];

    for (let i = 0; i < changeCount; i++) {
      sequence.push(this.getRandomPose());
    }

    sequence.push(this.getLandingPose());
    return sequence;
  }

  updateDifficulty(playerScore: number, aiScore: number): void {
    const diff = playerScore - aiScore;
    if (diff > 50) {
      this.difficulty = Math.min(0.95, this.difficulty + 0.05);
    } else if (diff < -30) {
      this.difficulty = Math.max(0.5, this.difficulty - 0.05);
    }
    this.perfectChance = 0.6 + this.difficulty * 0.25;
    this.poseChangeFrequency = 200 + (1 - this.difficulty) * 200;
  }
}

export const aiController = new AIController(0.75);
