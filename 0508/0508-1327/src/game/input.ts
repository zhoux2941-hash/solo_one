import { DirectionKey, InputState, POSE_MAP, Pose } from '@/types/game';
import { TIMING } from '@/constants/config';

export function createInitialInputState(): InputState {
  return {
    spacePressed: false,
    spaceReleased: false,
    arrowKeys: {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
    },
    lastPoseChange: 0,
  };
}

export function handleKeyDown(
  e: KeyboardEvent,
  inputState: InputState,
  currentPose: Pose,
  isAirborne: boolean,
  currentTime: number
): { inputState: InputState; newPose: Pose | null } {
  const updatedInput = { ...inputState };
  let newPose: Pose | null = null;

  if (e.code === 'Space') {
    e.preventDefault();
    if (!inputState.spacePressed) {
      updatedInput.spacePressed = true;
      updatedInput.spaceReleased = false;
    }
  }

  if (isAirborne && currentTime - inputState.lastPoseChange >= TIMING.POSE_CHANGE_COOLDOWN) {
    const key = e.code as DirectionKey;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      e.preventDefault();
      updatedInput.arrowKeys = { ...inputState.arrowKeys, [key]: true };
      updatedInput.lastPoseChange = currentTime;
      newPose = POSE_MAP[key];
    }
  }

  return { inputState: updatedInput, newPose };
}

export function handleKeyUp(
  e: KeyboardEvent,
  inputState: InputState
): InputState {
  const updatedInput = { ...inputState };

  if (e.code === 'Space') {
    e.preventDefault();
    if (inputState.spacePressed) {
      updatedInput.spaceReleased = true;
      updatedInput.spacePressed = false;
    }
  }

  const key = e.code as DirectionKey;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
    updatedInput.arrowKeys = { ...inputState.arrowKeys, [key]: false };
  }

  return updatedInput;
}

export function consumeSpacePress(inputState: InputState): InputState {
  return {
    ...inputState,
    spacePressed: false,
    spaceReleased: false,
  };
}

export function canChangePose(inputState: InputState, currentTime: number): boolean {
  return currentTime - inputState.lastPoseChange >= TIMING.POSE_CHANGE_COOLDOWN;
}
