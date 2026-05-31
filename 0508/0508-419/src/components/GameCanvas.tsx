import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useAudio } from '@/hooks/useAudio';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  JUDGE_LINE_Y_RATIO,
  NOTE_RADIUS,
  COLORS,
  BPM,
} from '@/constants/game';
import type { Note, Particle, JudgeResult } from '@/types/game';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { notes, particles, lastJudge, judgeTime, isPlaying, isPaused, lastJudge: storeLastJudge } =
    useGameStore();
  const { playJudgeSound } = useAudio();

  useGameLoop({ canvasRef });

  const lastJudgeRef = useRef<JudgeResult>(null);

  useEffect(() => {
    if (storeLastJudge && storeLastJudge !== lastJudgeRef.current && storeLastJudge !== 'miss') {
      playJudgeSound(storeLastJudge);
    }
    lastJudgeRef.current = storeLastJudge;
  }, [storeLastJudge, playJudgeSound]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      gradient.addColorStop(0, COLORS.backgroundGradientFrom);
      gradient.addColorStop(1, COLORS.backgroundGradientTo);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      drawGrid(ctx);
      drawJudgeLine(ctx);
      drawNotes(ctx, notes);
      drawParticles(ctx, particles);
      drawJudgeFeedback(ctx, lastJudge, judgeTime);
      drawCenterGuide(ctx);

      if (!isPlaying || isPaused) {
        drawOverlay(ctx);
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [notes, particles, lastJudge, judgeTime, isPlaying, isPaused]);

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)';
    ctx.lineWidth = 1;

    for (let i = 0; i < GAME_WIDTH; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, GAME_HEIGHT);
      ctx.stroke();
    }

    for (let i = 0; i < GAME_HEIGHT; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(GAME_WIDTH, i);
      ctx.stroke();
    }
  };

  const drawCenterGuide = (ctx: CanvasRenderingContext2D) => {
    const centerX = GAME_WIDTH / 2;
    const gradient = ctx.createLinearGradient(centerX, 0, centerX, GAME_HEIGHT);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
    gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.15)');
    gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - 2, 0, 4, GAME_HEIGHT);
  };

  const drawJudgeLine = (ctx: CanvasRenderingContext2D) => {
    const y = GAME_HEIGHT * JUDGE_LINE_Y_RATIO;
    const centerX = GAME_WIDTH / 2;

    const gradient = ctx.createLinearGradient(0, y, GAME_WIDTH, y);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
    gradient.addColorStop(0.3, 'rgba(6, 182, 212, 0.8)');
    gradient.addColorStop(0.7, 'rgba(6, 182, 212, 0.8)');
    gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');

    ctx.shadowColor = COLORS.judgeLine;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(GAME_WIDTH, y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(centerX, y, NOTE_RADIUS + 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, y, NOTE_RADIUS + 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const drawNotes = (ctx: CanvasRenderingContext2D, notes: Note[]) => {
    const centerX = GAME_WIDTH / 2;

    notes.forEach((note) => {
      if (note.y < -50 || note.y > GAME_HEIGHT + 50) return;

      const alpha = note.hit ? 0.3 : note.missed ? 0.2 : 1;
      const scale = note.hit ? 1.5 : 1;
      const radius = NOTE_RADIUS * scale;

      for (let i = 5; i > 0; i--) {
        const trailY = note.y - i * 15;
        if (trailY < 0) break;
        const trailAlpha = alpha * (1 - i * 0.18) * 0.4;
        ctx.beginPath();
        ctx.arc(centerX, trailY, radius * (1 - i * 0.12), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${trailAlpha})`;
        ctx.fill();
      }

      const glowGradient = ctx.createRadialGradient(centerX, note.y, 0, centerX, note.y, radius * 2);
      glowGradient.addColorStop(0, `rgba(168, 85, 247, ${alpha * 0.6})`);
      glowGradient.addColorStop(0.5, `rgba(168, 85, 247, ${alpha * 0.2})`);
      glowGradient.addColorStop(1, 'rgba(168, 85, 247, 0)');

      ctx.beginPath();
      ctx.arc(centerX, note.y, radius * 2, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();

      ctx.shadowColor = COLORS.note;
      ctx.shadowBlur = 15 * alpha;

      const noteGradient = ctx.createRadialGradient(
        centerX - radius * 0.3,
        note.y - radius * 0.3,
        0,
        centerX,
        note.y,
        radius
      );
      noteGradient.addColorStop(0, `rgba(216, 180, 254, ${alpha})`);
      noteGradient.addColorStop(0.5, `rgba(168, 85, 247, ${alpha})`);
      noteGradient.addColorStop(1, `rgba(109, 40, 217, ${alpha})`);

      ctx.beginPath();
      ctx.arc(centerX, note.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = noteGradient;
      ctx.fill();

      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(centerX, note.y, radius * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
    particles.forEach((particle) => {
      const alpha = particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;

      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });
  };

  const drawJudgeFeedback = (
    ctx: CanvasRenderingContext2D,
    judge: JudgeResult,
    time: number
  ) => {
    if (!judge) return;

    const elapsed = performance.now() - time;
    if (elapsed > 600) return;

    const centerX = GAME_WIDTH / 2;
    const y = GAME_HEIGHT * JUDGE_LINE_Y_RATIO - 80;

    const progress = elapsed / 600;
    const alpha = 1 - progress;
    const offsetY = -progress * 40;
    const scale = 1 + progress * 0.5;

    const colors: Record<string, string> = {
      perfect: COLORS.perfect,
      good: COLORS.good,
      miss: COLORS.miss,
    };

    const texts: Record<string, string> = {
      perfect: 'PERFECT',
      good: 'GOOD',
      miss: 'MISS',
    };

    ctx.save();
    ctx.translate(centerX, y + offsetY);
    ctx.scale(scale, scale);

    ctx.shadowColor = colors[judge];
    ctx.shadowBlur = 20;

    ctx.font = 'bold 36px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = colors[judge];
    ctx.globalAlpha = alpha;
    ctx.fillText(texts[judge], 0, 0);

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  const drawOverlay = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(10, 10, 26, 0.85)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    ctx.shadowColor = COLORS.note;
    ctx.shadowBlur = 30;

    ctx.font = 'bold 48px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.note;
    ctx.fillText('RHYTHM', centerX, centerY - 80);
    ctx.fillText('GAME', centerX, centerY - 20);

    ctx.shadowBlur = 0;

    ctx.font = '18px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`BPM: ${BPM}`, centerX, centerY + 40);
    ctx.fillText('按空格键或点击屏幕判定', centerX, centerY + 70);
    ctx.fillText('点击开始按钮开始游戏', centerX, centerY + 100);
  };

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      className="rounded-xl shadow-2xl cursor-pointer"
      style={{
        boxShadow: '0 0 60px rgba(139, 92, 246, 0.3), 0 25px 50px rgba(0, 0, 0, 0.5)',
      }}
    />
  );
}
