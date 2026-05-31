import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { JUDGE_LINE_Y_RATIO, GAME_HEIGHT } from '@/constants/game';

interface UseGameLoopOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export function useGameLoop({ canvasRef }: UseGameLoopOptions) {
  const animationRef = useRef<number>();
  const { update, hit, isPlaying, isPaused, noteSpeed } = useGameStore();

  const judgeLineY = GAME_HEIGHT * JUDGE_LINE_Y_RATIO;
  const centerX = 200;

  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const gameLoop = (currentTime: number) => {
      update(currentTime, judgeLineY, noteSpeed);
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isPaused, update, judgeLineY, noteSpeed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying && !isPaused) {
          hit(performance.now(), judgeLineY, centerX);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused, hit, judgeLineY, centerX]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleClick = () => {
      if (isPlaying && !isPaused) {
        hit(performance.now(), judgeLineY, centerX);
      }
    };

    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [canvasRef, isPlaying, isPaused, hit, judgeLineY, centerX]);
}
