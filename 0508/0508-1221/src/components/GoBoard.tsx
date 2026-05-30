import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  getBoardDimensions,
  getIntersectionFromCoords,
  redrawBoard,
} from '@/utils/boardRenderer';

interface GoBoardProps {
  size?: number;
}

export default function GoBoard({ size = 480 }: GoBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [animatingStone, setAnimatingStone] = useState<{
    x: number;
    y: number;
    color: 'black' | 'white';
    progress: number;
  } | null>(null);

  const currentProblem = useGameStore(state => state.currentProblem);
  const boardStones = useGameStore(state => state.boardStones);
  const lastMove = useGameStore(state => state.lastMove);
  const showHints = useGameStore(state => state.showHints);
  const showAnswer = useGameStore(state => state.showAnswer);
  const placeStone = useGameStore(state => state.placeStone);
  const hintPoints = useGameStore(state => state.hintPoints);
  const refMoves = useGameStore(state => state.refMoves);

  const boardSize = currentProblem?.boardSize || 9;
  const { padding, cellSize } = getBoardDimensions(boardSize, size);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    redrawBoard(
      ctx,
      boardSize,
      cellSize,
      padding,
      boardStones,
      lastMove,
      showHints,
      hintPoints,
      showAnswer,
      refMoves,
      animatingStone
    );
  }, [boardSize, cellSize, padding, boardStones, lastMove, showHints, hintPoints, showAnswer, refMoves, animatingStone]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !currentProblem) return;

    const intersection = getIntersectionFromCoords(
      e.clientX,
      e.clientY,
      canvas,
      boardSize,
      cellSize,
      padding
    );

    if (intersection) {
      const success = placeStone(intersection.x, intersection.y);
      if (success) {
        setAnimatingStone({
          x: intersection.x,
          y: intersection.y,
          color: currentProblem.playerColor,
          progress: 0,
        });
      }
    }
  }, [boardSize, cellSize, padding, currentProblem, placeStone]);

  useEffect(() => {
    if (!animatingStone) return;

    const startTime = Date.now();
    const duration = 200;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setAnimatingStone(prev => prev ? { ...prev, progress } : null);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setAnimatingStone(null);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animatingStone?.x, animatingStone?.y]);

  useEffect(() => {
    render();
  }, [render]);

  if (!currentProblem) {
    return (
      <div
        className="flex items-center justify-center bg-board-wood rounded-lg board-shadow"
        style={{ width: size, height: size }}
      >
        <p className="text-gray-600 font-serif">请选择一道题目开始练习</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        onClick={handleClick}
        className="rounded-lg board-shadow cursor-pointer"
        style={{ display: 'block' }}
      />
    </div>
  );
}
