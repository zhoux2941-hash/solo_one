import { create } from 'zustand';
import {
  GameState,
  GameActions,
  TARGET_RINGS,
  BOW_POSITION,
  MAX_DRAW_DISTANCE,
  Arrow,
} from '@/types/game';
import {
  calculateWindForce,
  calculateLaunchVelocityFromPosition,
  updateArrowPhysics,
  checkTargetHit,
  checkOutOfBounds,
  calculateScore as calcScore,
  getDrawStrengthPercentage,
} from '@/utils/physics';

const createInitialState = (): Omit<GameState, keyof GameActions> => ({
  currentRound: 1,
  arrowsRemaining: 3,
  scores: [],
  totalScore: 0,
  isDrawing: false,
  drawStrength: 0,
  drawStartX: 0,
  drawStartY: 0,
  currentDrawX: BOW_POSITION.x,
  currentDrawY: BOW_POSITION.y,
  arrows: [],
  windDirection: Math.random() * 360,
  windSpeed: Math.random() * 5,
  targetConfig: {
    centerX: 900,
    centerY: 400,
    rings: TARGET_RINGS,
  },
  gameOver: false,
});

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...createInitialState(),

  startDrawing: (x: number, y: number) => {
    const state = get();
    if (state.arrowsRemaining <= 0 || state.gameOver) return;
    
    const activeArrow = state.arrows.find(a => a.active);
    if (activeArrow) return;

    set({
      isDrawing: true,
      drawStartX: x,
      drawStartY: y,
      currentDrawX: x,
      currentDrawY: y,
      drawStrength: 0,
    });
  },

  updateDrawing: (x: number, y: number) => {
    const state = get();
    if (!state.isDrawing) return;

    const dx = x - BOW_POSITION.x;
    const dy = y - BOW_POSITION.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return;

    const clampedDistance = Math.min(distance, MAX_DRAW_DISTANCE);
    const ratio = clampedDistance / distance;
    
    const pullX = BOW_POSITION.x + dx * ratio;
    const pullY = BOW_POSITION.y + dy * ratio;

    set({
      currentDrawX: pullX,
      currentDrawY: pullY,
      drawStrength: getDrawStrengthPercentage(clampedDistance),
    });
  },

  releaseArrow: () => {
    const state = get();
    if (!state.isDrawing || state.arrowsRemaining <= 0) return;

    const dx = BOW_POSITION.x - state.currentDrawX;
    const dy = BOW_POSITION.y - state.currentDrawY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 10) {
      set({ isDrawing: false, drawStrength: 0 });
      return;
    }

    const velocity = calculateLaunchVelocityFromPosition(
      state.currentDrawX,
      state.currentDrawY
    );
    
    const newArrow: Arrow = {
      id: Date.now(),
      x: BOW_POSITION.x,
      y: BOW_POSITION.y,
      vx: velocity.vx,
      vy: velocity.vy,
      active: true,
      score: 0,
      hitPosition: null,
      trail: [],
    };

    set((state) => ({
      isDrawing: false,
      drawStrength: 0,
      arrows: [...state.arrows, newArrow],
    }));
  },

  updateArrowPositions: () => {
    const state = get();
    const { targetConfig, windDirection, windSpeed } = state;

    const windForce = calculateWindForce(windDirection, windSpeed);

    let scoresUpdated = false;
    const newScores = [...state.scores];

    const updatedArrows = state.arrows.map((arrow) => {
      if (!arrow.active) return arrow;

      const physicsResult = updateArrowPhysics(arrow, windForce);
      const { x: newX, y: newY, vx: newVx } = physicsResult;

      if (checkTargetHit(newX, newY, targetConfig) && Math.abs(newVx) > 0) {
        const score = calcScore(newX, newY, targetConfig);
        newScores.push(score);
        scoresUpdated = true;
        
        return {
          ...arrow,
          ...physicsResult,
          active: false,
          score,
          hitPosition: { x: newX, y: newY },
        };
      }

      if (checkOutOfBounds(newX, newY)) {
        newScores.push(0);
        scoresUpdated = true;
        
        return {
          ...arrow,
          ...physicsResult,
          active: false,
          score: 0,
          hitPosition: null,
        };
      }

      return {
        ...arrow,
        ...physicsResult,
      };
    });

    if (scoresUpdated) {
      const totalScore = newScores.reduce((sum, s) => sum + s, 0);
      const remaining = Math.max(0, 3 - newScores.length);
      
      set({
        arrows: updatedArrows,
        scores: newScores,
        totalScore,
        arrowsRemaining: remaining,
        gameOver: remaining <= 0,
      });
    } else {
      set({ arrows: updatedArrows });
    }
  },

  resetGame: () => {
    set({
      ...createInitialState(),
      windDirection: Math.random() * 360,
      windSpeed: Math.random() * 5,
    });
  },

  generateWind: () => {
    set({
      windDirection: Math.random() * 360,
      windSpeed: Math.random() * 5,
    });
  },

  calculateScore: (x: number, y: number): number => {
    const state = get();
    return calcScore(x, y, state.targetConfig);
  },
}));
