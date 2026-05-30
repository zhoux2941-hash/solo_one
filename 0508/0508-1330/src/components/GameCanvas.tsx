import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { BOW_POSITION } from '@/types/game';

const CANVAS_WIDTH = 1100;
const CANVAS_HEIGHT = 700;

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const {
    isDrawing,
    currentDrawX,
    currentDrawY,
    arrows,
    targetConfig,
    updateArrowPositions,
    startDrawing,
    updateDrawing,
    releaseArrow,
    drawStrength,
  } = useGameStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawBackground = () => {
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, '#1e3a5f');
      gradient.addColorStop(0.5, '#2d5a87');
      gradient.addColorStop(1, '#87a96b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      for (let i = 0; i < 50; i++) {
        const x = (i * 73) % CANVAS_WIDTH;
        const y = (i * 37) % (CANVAS_HEIGHT * 0.6);
        ctx.beginPath();
        ctx.arc(x, y, 1 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#6b8e4e';
      ctx.fillRect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);
      
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 2;
      for (let i = 0; i < CANVAS_WIDTH; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, CANVAS_HEIGHT - 100);
        ctx.lineTo(i + 15, CANVAS_HEIGHT);
        ctx.stroke();
      }
    };

    const drawTarget = () => {
      const { centerX, centerY, rings } = targetConfig;
      
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;

      for (let i = 0; i < rings.length; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, rings[i].radius, 0, Math.PI * 2);
        ctx.fillStyle = rings[i].color;
        ctx.fill();
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();

      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 16px "Noto Serif", serif';
      ctx.textAlign = 'center';
      
      rings.forEach((ring, i) => {
        const y = centerY - ring.radius + 20;
        if (i === 0) {
          ctx.fillStyle = '#1a1a1a';
        } else {
          ctx.fillStyle = '#ffffff';
        }
        ctx.fillText(`${ring.score}`, centerX, y);
      });

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(centerX - 220, centerY);
      ctx.lineTo(centerX + 220, centerY);
      ctx.moveTo(centerX, centerY - 220);
      ctx.lineTo(centerX, centerY + 220);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawBow = () => {
      const bowX = BOW_POSITION.x;
      const bowY = BOW_POSITION.y;

      ctx.save();
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.arc(bowX - 10, bowY, 80, -Math.PI / 2.5, Math.PI / 2.5);
      ctx.stroke();

      ctx.strokeStyle = '#DAA520';
      ctx.lineWidth = 3;
      
      if (isDrawing) {
        ctx.beginPath();
        ctx.moveTo(bowX - 10 + Math.cos(-Math.PI / 2.5) * 80, bowY + Math.sin(-Math.PI / 2.5) * 80);
        ctx.lineTo(currentDrawX, currentDrawY);
        ctx.lineTo(bowX - 10 + Math.cos(Math.PI / 2.5) * 80, bowY + Math.sin(Math.PI / 2.5) * 80);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(bowX - 10 + Math.cos(-Math.PI / 2.5) * 80, bowY + Math.sin(-Math.PI / 2.5) * 80);
        ctx.lineTo(bowX - 10 + Math.cos(Math.PI / 2.5) * 80, bowY + Math.sin(Math.PI / 2.5) * 80);
        ctx.stroke();
      }

      ctx.restore();

      if (isDrawing && drawStrength > 0) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(currentDrawX, currentDrawY);
        const aimX = currentDrawX + (bowX - currentDrawX) * 10;
        const aimY = currentDrawY + (bowY - currentDrawY) * 10;
        ctx.lineTo(aimX, aimY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    };

    const drawArrow = (x: number, y: number, angle: number, isFlying: boolean = false) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.fillStyle = '#8B4513';
      ctx.fillRect(-30, -2, 50, 4);

      ctx.fillStyle = '#C0C0C0';
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(10, -5);
      ctx.lineTo(10, 5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(-30, 0);
      ctx.lineTo(-40, -8);
      ctx.lineTo(-35, 0);
      ctx.lineTo(-40, 8);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      if (isFlying) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.translate(x - 15, y);
        ctx.rotate(angle);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-20, -1, 15, 2);
        ctx.restore();
      }
    };

    const drawArrows = () => {
      arrows.forEach((arrow) => {
        if (arrow.trail.length > 1) {
          ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(arrow.trail[0].x, arrow.trail[0].y);
          arrow.trail.forEach((point, i) => {
            if (i > 0) {
              ctx.globalAlpha = i / arrow.trail.length;
              ctx.lineTo(point.x, point.y);
            }
          });
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        if (arrow.active) {
          const angle = Math.atan2(arrow.vy, arrow.vx);
          drawArrow(arrow.x, arrow.y, angle, true);
        } else if (arrow.hitPosition) {
          const angle = Math.atan2(arrow.vy, arrow.vx);
          drawArrow(arrow.hitPosition.x, arrow.hitPosition.y, angle);
          
          ctx.save();
          ctx.fillStyle = '#FFD700';
          ctx.strokeStyle = '#8B4513';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(arrow.hitPosition.x, arrow.hitPosition.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          ctx.fillStyle = '#1a1a1a';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${arrow.score}`, arrow.hitPosition.x, arrow.hitPosition.y + 4);
          ctx.restore();
        }
      });

      if (isDrawing) {
        const angle = Math.atan2(
          BOW_POSITION.y - currentDrawY,
          BOW_POSITION.x - currentDrawX
        );
        drawArrow(BOW_POSITION.x, BOW_POSITION.y, angle);
      } else if (arrows.filter(a => a.hitPosition).length < 3) {
        drawArrow(BOW_POSITION.x, BOW_POSITION.y, 0);
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      drawBackground();
      drawTarget();
      drawBow();
      drawArrows();

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDrawing, currentDrawX, currentDrawY, arrows, targetConfig, drawStrength]);

  useEffect(() => {
    const gameLoop = setInterval(() => {
      updateArrowPositions();
    }, 16);

    return () => clearInterval(gameLoop);
  }, [updateArrowPositions]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    startDrawing(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    updateDrawing(x, y);
  };

  const handleMouseUp = () => {
    releaseArrow();
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      releaseArrow();
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="border-4 border-amber-600 rounded-xl shadow-2xl cursor-crosshair max-w-full"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
}
