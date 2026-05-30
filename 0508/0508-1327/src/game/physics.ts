import { PHYSICS, LAYOUT } from '@/constants/config';
import { Player, GameState } from '@/types/game';

export function updatePlayerPhysics(player: Player, boardAngle: number): Player {
  if (!player.isAirborne) {
    return player;
  }

  let newVelocityY = player.velocityY - PHYSICS.GRAVITY;
  let newY = player.y - newVelocityY;
  let newRotation = player.rotation;

  if (player.pose === 'twist') {
    newRotation += PHYSICS.TWIST_ROTATION_SPEED;
  }

  const boardYAtPlayer = getBoardYAtX(player.x, boardAngle);
  const landingY = boardYAtPlayer - LAYOUT.PLAYER_HEIGHT;

  if (newVelocityY < 0 && newY >= landingY) {
    newY = landingY;
    return {
      ...player,
      y: newY,
      velocityY: 0,
      isAirborne: false,
      rotation: 0,
      landingPose: player.pose,
      currentHeight: 0,
    };
  }

  const baseHeight = boardYAtPlayer - LAYOUT.PLAYER_HEIGHT;
  const currentHeight = Math.max(0, baseHeight - newY);
  const maxHeight = Math.max(player.maxHeight, currentHeight);

  return {
    ...player,
    y: newY,
    velocityY: newVelocityY,
    rotation: newRotation,
    currentHeight,
    maxHeight,
  };
}

export function getBoardYAtX(x: number, angle: number): number {
  const radians = (angle * Math.PI) / 180;
  const offsetX = x - LAYOUT.BOARD_CENTER_X;
  const yOffset = Math.sin(radians) * offsetX;
  return LAYOUT.BOARD_BASE_Y + yOffset;
}

export function calculateJumpForce(timingAccuracy: number, isPerfect: boolean): number {
  const timingMultiplier = PHYSICS.TIMING_MIN_MULTIPLIER + timingAccuracy * PHYSICS.TIMING_MAX_MULTIPLIER;
  const perfectBonus = isPerfect ? PHYSICS.PERFECT_TIMING_BONUS : 1;
  return PHYSICS.ELASTICITY * timingMultiplier * perfectBonus;
}

export function calculateTimingAccuracy(
  pressTime: number,
  windowStart: number,
  windowEnd: number
): { accuracy: number; isPerfect: boolean } {
  const windowCenter = (windowStart + windowEnd) / 2;
  const windowDuration = windowEnd - windowStart;
  const distanceFromCenter = Math.abs(pressTime - windowCenter);
  const halfWindow = windowDuration / 2;

  const accuracy = Math.max(0, 1 - distanceFromCenter / halfWindow);
  const isPerfect = accuracy >= PHYSICS.PERFECT_ACCURACY_THRESHOLD;

  return { accuracy, isPerfect };
}

export function checkLanding(player: Player, boardAngle: number): boolean {
  const boardY = getBoardYAtX(player.x, boardAngle);
  const playerBottom = player.y + LAYOUT.PLAYER_HEIGHT;
  return !player.isAirborne && Math.abs(playerBottom - boardY) < PHYSICS.LANDING_TOLERANCE;
}

export function getTargetBoardAngle(side: 'left' | 'right', pressDepth: number): number {
  const clampedDepth = Math.max(0, Math.min(1, pressDepth));
  const angle = clampedDepth * PHYSICS.MAX_BOARD_ANGLE;
  return side === 'left' ? angle : -angle;
}

export function updateBoardAngle(state: GameState, deltaTime: number): number {
  const { phase, currentTurn, boardAngle } = state;

  if (phase === 'pressing') {
    const side = currentTurn === 'player' ? 'left' : 'right';
    const targetAngle = getTargetBoardAngle(side, PHYSICS.PRESS_DEPTH);
    return boardAngle + (targetAngle - boardAngle) * PHYSICS.BOARD_TILT_SPEED;
  }

  if (phase === 'airborne' || phase === 'landing' || phase === 'scoring') {
    return boardAngle * PHYSICS.BOARD_RECOVERY_RATE;
  }

  return boardAngle * PHYSICS.BOARD_IDLE_RECOVERY_RATE;
}

export function createInitialPlayer(id: 'player' | 'ai'): Player {
  const x = id === 'player' ? LAYOUT.PLAYER_START_X_LEFT : LAYOUT.PLAYER_START_X_RIGHT;
  const boardY = getBoardYAtX(x, 0);
  return {
    id,
    x,
    y: boardY - LAYOUT.PLAYER_HEIGHT,
    velocityY: 0,
    pose: 'standing',
    rotation: 0,
    isAirborne: false,
    currentHeight: 0,
    maxHeight: 0,
    poseChanges: [],
    landingPose: null,
  };
}

export function resetPlayerForRound(player: Player): Player {
  const boardY = getBoardYAtX(player.x, 0);
  return {
    ...player,
    y: boardY - LAYOUT.PLAYER_HEIGHT,
    velocityY: 0,
    pose: 'standing',
    rotation: 0,
    isAirborne: false,
    currentHeight: 0,
    maxHeight: 0,
    poseChanges: [],
    landingPose: null,
  };
}
