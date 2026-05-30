import { useRef, useEffect, useCallback, useState } from 'react';
import { GameState, GamePhase, Player, Pose, InputState, RoundScore } from '@/types/game';
import { PHYSICS, TIMING, EFFECTS, LAYOUT } from '@/constants/config';
import {
  createInitialPlayer,
  resetPlayerForRound,
  updatePlayerPhysics,
  updateBoardAngle,
  calculateTimingAccuracy,
  calculateJumpForce,
  checkLanding,
} from '@/game/physics';
import {
  createInitialInputState,
  handleKeyDown,
  handleKeyUp,
  consumeSpacePress,
} from '@/game/input';
import { calculateRoundScore, getTimingDescription, getScoreRating } from '@/game/scoring';
import { aiController } from '@/game/aiController';
import { GameRenderer } from '@/game/renderer';

function createInitialState(): GameState {
  const now = Date.now();
  const perfectWindowStart = now + TIMING.WAITING_DURATION * PHYSICS.PERFECT_WINDOW_START_RATIO;
  const perfectWindowEnd = perfectWindowStart + TIMING.PERFECT_WINDOW_DURATION;

  return {
    phase: 'waiting',
    currentTurn: 'player',
    round: 1,
    pressStartTime: now,
    pressDuration: 0,
    perfectWindow: { start: perfectWindowStart, end: perfectWindowEnd },
    timingAccuracy: 0,
    player: createInitialPlayer('player'),
    ai: createInitialPlayer('ai'),
    boardAngle: 0,
    boardShake: 0,
    scores: [],
    lastScore: null,
    airborneStartTime: 0,
    message: '准备开始！按空格键下压',
    flashEffect: 0,
  };
}

export function useGameEngine(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const gameStateRef = useRef<GameState>(createInitialState());
  const inputStateRef = useRef<InputState>(createInitialInputState());
  const rendererRef = useRef<GameRenderer | null>(null);
  const animationFrameRef = useRef<number>(0);
  const aiPressTimeRef = useRef<number>(0);
  const aiLastPoseChangeRef = useRef<number>(0);
  const pressTriggerTimeRef = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState>(gameStateRef.current);
  const [scores, setScores] = useState<RoundScore[]>([]);
  const [lastScore, setLastScore] = useState<RoundScore | null>(null);

  const syncState = useCallback(() => {
    setGameState({ ...gameStateRef.current });
    setScores([...gameStateRef.current.scores]);
    setLastScore(gameStateRef.current.lastScore);
  }, []);

  const startNewRound = useCallback((turn: 'player' | 'ai') => {
    const state = gameStateRef.current;
    const now = Date.now();
    const perfectWindowStart = now + TIMING.WAITING_DURATION * PHYSICS.PERFECT_WINDOW_START_RATIO;
    const perfectWindowEnd = perfectWindowStart + TIMING.PERFECT_WINDOW_DURATION;

    const round = turn === 'player' ? state.round : state.round + 1;

    gameStateRef.current = {
      ...state,
      phase: 'waiting',
      currentTurn: turn,
      round,
      pressStartTime: now,
      pressDuration: 0,
      perfectWindow: { start: perfectWindowStart, end: perfectWindowEnd },
      timingAccuracy: 0,
      player: turn === 'player' ? resetPlayerForRound(state.player) : state.player,
      ai: turn === 'ai' ? resetPlayerForRound(state.ai) : state.ai,
      boardAngle: 0,
      boardShake: 0,
      airborneStartTime: 0,
      message: turn === 'player' ? '你的回合！按空格键下压' : 'AI回合...',
      flashEffect: 0,
    };

    if (turn === 'ai') {
      aiPressTimeRef.current = aiController.calculatePressTime(
        perfectWindowStart,
        perfectWindowEnd
      );
      aiLastPoseChangeRef.current = 0;
    }

    syncState();
  }, [syncState]);

  const launchPlayer = useCallback((timingAccuracy: number, isPerfect: boolean) => {
    const state = gameStateRef.current;
    const jumpForce = calculateJumpForce(timingAccuracy, isPerfect);
    const activePlayer = state.currentTurn === 'player' ? 'player' : 'ai';

    const player = { ...state[activePlayer] };
    player.velocityY = jumpForce;
    player.isAirborne = true;
    player.pose = 'jump';
    player.poseChanges = ['jump'];

    const timingInfo = getTimingDescription(timingAccuracy);

    gameStateRef.current = {
      ...state,
      phase: 'airborne',
      timingAccuracy,
      [activePlayer]: player,
      airborneStartTime: Date.now(),
      message: timingInfo.text,
      flashEffect: isPerfect ? EFFECTS.PERFECT_FLASH_INTENSITY : EFFECTS.GOOD_FLASH_INTENSITY,
    };

    syncState();
  }, [syncState]);

  const triggerPress = useCallback((pressTime: number) => {
    const state = gameStateRef.current;
    const { accuracy, isPerfect } = calculateTimingAccuracy(
      pressTime,
      state.perfectWindow.start,
      state.perfectWindow.end
    );

    gameStateRef.current = {
      ...state,
      phase: 'pressing',
      timingAccuracy: accuracy,
      pressDuration: 0,
      message: isPerfect ? '完美时机!' : '下压中...',
      flashEffect: isPerfect ? EFFECTS.PRESS_FLASH_PERFECT : EFFECTS.PRESS_FLASH_NORMAL,
    };

    pressTriggerTimeRef.current = Date.now();

    inputStateRef.current = consumeSpacePress(inputStateRef.current);
    syncState();

    setTimeout(() => {
      const currentState = gameStateRef.current;
      if (currentState.phase !== 'pressing') return;
      launchPlayer(accuracy, isPerfect);
    }, PHYSICS.PRESS_DURATION_MS);
  }, [syncState, launchPlayer]);

  const handleLanding = useCallback(() => {
    const state = gameStateRef.current;
    const activePlayer = state.currentTurn === 'player' ? 'player' : 'ai';
    const player = state[activePlayer];

    if (checkLanding(player, state.boardAngle)) {
      const score = calculateRoundScore(
        state.round,
        activePlayer,
        player,
        state.timingAccuracy
      );

      const rating = getScoreRating(score.total);

      gameStateRef.current = {
        ...state,
        phase: 'scoring',
        scores: [...state.scores, score],
        lastScore: score,
        boardShake: EFFECTS.LANDING_SHAKE_INTENSITY,
        message: `${rating.rating}！得分：${score.total}`,
        flashEffect: EFFECTS.LANDING_FLASH,
      };

      syncState();

      setTimeout(() => {
        const nextTurn = activePlayer === 'player' ? 'ai' : 'player';
        startNewRound(nextTurn);
      }, TIMING.SCORE_DISPLAY_DURATION);
    }
  }, [syncState, startNewRound]);

  const changePose = useCallback((newPose: Pose) => {
    const state = gameStateRef.current;
    const activePlayer = state.currentTurn === 'player' ? 'player' : 'ai';

    if (state[activePlayer].isAirborne) {
      const player = { ...state[activePlayer] };
      player.pose = newPose;
      player.poseChanges = [...player.poseChanges, newPose];

      gameStateRef.current = {
        ...state,
        [activePlayer]: player,
      };

      syncState();
    }
  }, [syncState]);

  const updateAI = useCallback((currentTime: number) => {
    const state = gameStateRef.current;

    if (state.currentTurn !== 'ai') return;

    if (state.phase === 'waiting') {
      if (currentTime >= aiPressTimeRef.current) {
        triggerPress(currentTime);
      }
    } else if (state.phase === 'airborne') {
      const activePlayer = state.ai;
      if (activePlayer.isAirborne) {
        if (currentTime - aiLastPoseChangeRef.current > TIMING.AI_POSE_CHANGE_INTERVAL) {
          const newPose = aiController.getRandomPose();
          aiLastPoseChangeRef.current = currentTime;
          changePose(newPose);
        }
      }
    }
  }, [triggerPress, changePose]);

  const gameLoop = useCallback(() => {
    const state = gameStateRef.current;
    const currentTime = Date.now();

    if (rendererRef.current) {
      rendererRef.current.render(gameStateRef.current);
    }

    if (state.flashEffect > 0) {
      gameStateRef.current.flashEffect = Math.max(0, state.flashEffect - EFFECTS.FLASH_DECAY_RATE);
    }

    if (state.boardShake > 0) {
      gameStateRef.current.boardShake = Math.max(0, state.boardShake - EFFECTS.SHAKE_DECAY_RATE);
    }

    if (state.currentTurn === 'ai') {
      updateAI(currentTime);
    }

    const activePlayer = state.currentTurn === 'player' ? 'player' : 'ai';

    if (state.phase === 'waiting' && state.currentTurn === 'player') {
      if (inputStateRef.current.spacePressed) {
        triggerPress(currentTime);
      } else if (currentTime > state.perfectWindow.end + TIMING.MISS_TIMEOUT) {
        gameStateRef.current.message = '太慢了！请在时机窗口内按下空格键';
        gameStateRef.current.flashEffect = EFFECTS.MISS_FLASH;
        setTimeout(() => startNewRound('player'), TIMING.MISS_RETRY_DELAY);
        syncState();
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }
    }

    if (state.phase === 'pressing') {
      const newBoardAngle = updateBoardAngle(gameStateRef.current, 16);
      gameStateRef.current.boardAngle = newBoardAngle;
      gameStateRef.current.pressDuration = currentTime - pressTriggerTimeRef.current;
    }

    if (state.phase === 'airborne') {
      const player = state[activePlayer];
      const updatedPlayer = updatePlayerPhysics(player, state.boardAngle);
      gameStateRef.current[activePlayer] = updatedPlayer;

      const newBoardAngle = updateBoardAngle(gameStateRef.current, 16);
      gameStateRef.current.boardAngle = newBoardAngle;

      if (!updatedPlayer.isAirborne && state.airborneStartTime > 0) {
        if (currentTime - state.airborneStartTime > TIMING.AIRBORNE_TIME_MIN) {
          gameStateRef.current.phase = 'landing';
          handleLanding();
        }
      }
    }

    if (state.phase === 'landing' || state.phase === 'scoring') {
      const newBoardAngle = updateBoardAngle(gameStateRef.current, 16);
      gameStateRef.current.boardAngle = newBoardAngle;
    }

    if (state.phase !== 'scoring') {
      syncState();
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [updateAI, triggerPress, handleLanding, syncState, startNewRound]);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    const state = gameStateRef.current;
    const activePlayer = state.currentTurn === 'player' ? 'player' : 'ai';
    const player = state[activePlayer];

    const result = handleKeyDown(
      e,
      inputStateRef.current,
      player.pose,
      player.isAirborne,
      Date.now()
    );

    inputStateRef.current = result.inputState;

    if (result.newPose && state.currentTurn === 'player') {
      changePose(result.newPose);
    }
  }, [changePose]);

  const onKeyUp = useCallback((e: KeyboardEvent) => {
    inputStateRef.current = handleKeyUp(e, inputStateRef.current);
  }, []);

  const resetGame = useCallback(() => {
    gameStateRef.current = createInitialState();
    syncState();
  }, [syncState]);

  useEffect(() => {
    if (canvasRef.current) {
      rendererRef.current = new GameRenderer(canvasRef.current);
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [canvasRef, onKeyDown, onKeyUp, gameLoop]);

  return {
    gameState,
    scores,
    lastScore,
    resetGame,
  };
}
