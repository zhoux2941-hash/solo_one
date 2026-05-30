import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BOARD_SIZE, Position, StoneColor, AISuggestion } from '../../shared/types';
import { playStoneSound } from '../utils/audio';

interface BoardProps {
  board: StoneColor[][];
  lastMove: Position | null;
  currentPlayer: StoneColor;
  onMove: (position: Position) => void;
  showSuggestions?: boolean;
  suggestions?: AISuggestion[];
}

export const Board: React.FC<BoardProps> = ({
  board,
  lastMove,
  currentPlayer,
  onMove,
  showSuggestions = false,
  suggestions = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverPos, setHoverPos] = useState<Position | null>(null);
  const [animatingStone, setAnimatingStone] = useState<Position | null>(null);

  const canvasSize = 600;
  const padding = 30;
  const boardInnerSize = canvasSize - padding * 2;
  const cellSize = boardInnerSize / (BOARD_SIZE - 1);
  const stoneRadius = cellSize * 0.42;

  const starPoints: Position[] = [
    { x: 3, y: 3 }, { x: 8, y: 3 }, { x: 13, y: 3 },
    { x: 3, y: 8 }, { x: 8, y: 8 }, { x: 13, y: 8 },
    { x: 3, y: 13 }, { x: 8, y: 13 }, { x: 13, y: 13 },
  ];

  const posToPixel = useCallback((pos: Position) => ({
    x: padding + pos.x * cellSize,
    y: padding + pos.y * cellSize,
  }), [cellSize]);

  const pixelToPos = useCallback((x: number, y: number): Position | null => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const scaleX = canvasSize / rect.width;
    const scaleY = canvasSize / rect.height;

    const canvasX = (x - rect.left) * scaleX;
    const canvasY = (y - rect.top) * scaleY;

    const boardX = Math.round((canvasX - padding) / cellSize);
    const boardY = Math.round((canvasY - padding) / cellSize);

    if (boardX >= 0 && boardX < BOARD_SIZE && boardY >= 0 && boardY < BOARD_SIZE) {
      const pixel = posToPixel({ x: boardX, y: boardY });
      const dist = Math.sqrt((canvasX - pixel.x) ** 2 + (canvasY - pixel.y) ** 2);
      if (dist < cellSize * 0.5) {
        return { x: boardX, y: boardY };
      }
    }
    return null;
  }, [cellSize, posToPixel]);

  const drawBoard = useCallback((ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
    gradient.addColorStop(0, '#DEB887');
    gradient.addColorStop(0.5, '#D2B48C');
    gradient.addColorStop(1, '#C4A574');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 1;

    for (let i = 0; i < BOARD_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(padding, padding + i * cellSize);
      ctx.lineTo(canvasSize - padding, padding + i * cellSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padding + i * cellSize, padding);
      ctx.lineTo(padding + i * cellSize, canvasSize - padding);
      ctx.stroke();
    }

    ctx.fillStyle = '#FFD54F';
    starPoints.forEach((pos) => {
      const pixel = posToPixel(pos);
      ctx.beginPath();
      ctx.arc(pixel.x, pixel.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#5D4037';
    ctx.font = 'bold 11px "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < BOARD_SIZE; i++) {
      const label = String.fromCharCode(65 + i);
      ctx.fillText(label, padding + i * cellSize, padding - 15);
      ctx.fillText(label, padding + i * cellSize, canvasSize - padding + 15);
      ctx.fillText(String(BOARD_SIZE - i), padding - 15, padding + i * cellSize);
      ctx.fillText(String(BOARD_SIZE - i), canvasSize - padding + 15, padding + i * cellSize);
    }
  }, [cellSize, posToPixel]);

  const drawStone = useCallback((
    ctx: CanvasRenderingContext2D,
    pos: Position,
    color: StoneColor,
    isLastMove: boolean = false,
    animationProgress: number = 1
  ) => {
    const pixel = posToPixel(pos);
    const radius = stoneRadius * animationProgress;

    ctx.save();

    if (color === 'black') {
      const gradient = ctx.createRadialGradient(
        pixel.x - radius * 0.3,
        pixel.y - radius * 0.3,
        radius * 0.1,
        pixel.x,
        pixel.y,
        radius
      );
      gradient.addColorStop(0, '#4A4A4A');
      gradient.addColorStop(0.5, '#212121');
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
    } else {
      const gradient = ctx.createRadialGradient(
        pixel.x - radius * 0.3,
        pixel.y - radius * 0.3,
        radius * 0.1,
        pixel.x,
        pixel.y,
        radius
      );
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(0.7, '#F5F5F5');
      gradient.addColorStop(1, '#E0E0E0');
      ctx.fillStyle = gradient;
    }

    ctx.beginPath();
    ctx.arc(pixel.x, pixel.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (color === 'white') {
      ctx.beginPath();
      ctx.arc(pixel.x - radius * 0.25, pixel.y - radius * 0.25, radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(pixel.x - radius * 0.25, pixel.y - radius * 0.25, radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fill();
    }

    if (isLastMove) {
      ctx.strokeStyle = '#E53935';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pixel.x, pixel.y, radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }, [posToPixel, stoneRadius]);

  const drawHoverPreview = useCallback((ctx: CanvasRenderingContext2D, pos: Position) => {
    if (board[pos.y][pos.x] !== null) return;

    const pixel = posToPixel(pos);
    ctx.globalAlpha = 0.4;

    if (currentPlayer === 'black') {
      ctx.fillStyle = '#000000';
    } else {
      ctx.fillStyle = '#FFFFFF';
    }

    ctx.beginPath();
    ctx.arc(pixel.x, pixel.y, stoneRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }, [board, currentPlayer, posToPixel, stoneRadius]);

  const drawSuggestions = useCallback((ctx: CanvasRenderingContext2D) => {
    suggestions.forEach((suggestion) => {
      if (board[suggestion.position.y][suggestion.position.x] !== null) {
        return;
      }
      
      const pixel = posToPixel(suggestion.position);
      
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.arc(pixel.x, pixel.y, stoneRadius + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
      ctx.beginPath();
      ctx.arc(pixel.x, pixel.y, stoneRadius + 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#4CAF50';
      ctx.font = 'bold 10px "Noto Serif SC", serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(suggestion.winRate)}%`, pixel.x, pixel.y + stoneRadius + 16);
    });
  }, [suggestions, posToPixel, stoneRadius, board]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    drawBoard(ctx);

    board.forEach((row, y) => {
      row.forEach((stone, x) => {
        if (stone) {
          const isLast = lastMove?.x === x && lastMove?.y === y;
          drawStone(ctx, { x, y }, stone, isLast);
        }
      });
    });

    if (hoverPos && !animatingStone) {
      drawHoverPreview(ctx, hoverPos);
    }

    if (showSuggestions) {
      drawSuggestions(ctx);
    }
  }, [board, lastMove, hoverPos, animatingStone, showSuggestions, drawBoard, drawStone, drawHoverPreview, drawSuggestions]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    if (animatingStone) {
      let progress = 0;
      const animate = () => {
        progress += 0.15;
        if (progress >= 1) {
          setAnimatingStone(null);
          return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        render();
        const color = board[animatingStone.y][animatingStone.x];
        if (color) {
          drawStone(ctx, animatingStone, color, true, progress);
        }
        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, [animatingStone, board, drawStone, render]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = pixelToPos(e.clientX, e.clientY);
    if (pos && board[pos.y][pos.x] === null) {
      setAnimatingStone(pos);
      playStoneSound();
      onMove(pos);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = pixelToPos(e.clientX, e.clientY);
    setHoverPos(pos);
  };

  const handleMouseLeave = () => {
    setHoverPos(null);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="rounded-lg shadow-2xl cursor-pointer"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
};
