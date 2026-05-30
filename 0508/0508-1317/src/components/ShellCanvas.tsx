import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useDivinationStore } from '@/stores/divinationStore';
import {
  drawPlastronOutline,
  drawCarapaceOutline,
  drawPitMark,
  drawCrackBranch,
  drawInscription,
  drawBurnMark,
} from '@/utils/shellRenderer';
import type { CrackPoint } from '@/types';

const W = 600;
const H = 500;
const CX = 300;
const CY = 250;
const SHELL_DIMS = {
  plastron: { width: 440, height: 360 },
  carapace: { width: 400, height: 380 },
};

function drawNoiseTexture(ctx: CanvasRenderingContext2D) {
  const imageData = ctx.getImageData(0, 0, W, H);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 18;
    data[i] += noise;
    data[i + 1] += noise;
    data[i + 2] += noise;
  }
  ctx.globalAlpha = 0.08;
  ctx.putImageData(imageData, 0, 0);
  ctx.globalAlpha = 1;
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#1a1208');
  grad.addColorStop(1, '#2a1f10');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  drawNoiseTexture(ctx);
}

function drawCracks(
  ctx: CanvasRenderingContext2D,
  crackPoints: CrackPoint[],
  pitShape: 'circle' | 'jujube',
  progress: number
) {
  for (const cp of crackPoints) {
    drawBurnMark(ctx, cp.x, cp.y, 0.5 + progress * 0.5);
    drawPitMark(ctx, cp.x, cp.y, pitShape);
    for (const branch of cp.branches) {
      drawCrackBranch(ctx, cp.x, cp.y, branch, progress);
    }
  }
}

const ShellCanvas = forwardRef<HTMLCanvasElement>(function ShellCanvas(_props, ref) {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const progressRef = useRef(1);
  const [inputState, setInputState] = useState<{
    x: number;
    y: number;
    text: string;
    visible: boolean;
  }>({ x: 0, y: 0, text: '', visible: false });

  useImperativeHandle(ref, () => internalCanvasRef.current!);

  const {
    shellType,
    pitShape,
    crackPoints,
    inscriptions,
    hasCracked,
    isCracking,
    addInscription,
  } = useDivinationStore();

  const redraw = useCallback(
    (progress: number) => {
      const canvas = internalCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      drawBackground(ctx);

      const dims = SHELL_DIMS[shellType];
      if (shellType === 'plastron') {
        drawPlastronOutline(ctx, CX, CY, dims.width, dims.height);
      } else {
        drawCarapaceOutline(ctx, CX, CY, dims.width, dims.height);
      }

      drawCracks(ctx, crackPoints, pitShape, progress);

      for (const ins of inscriptions) {
        drawInscription(ctx, ins);
      }
    },
    [shellType, pitShape, crackPoints, inscriptions]
  );

  useEffect(() => {
    if (isCracking) {
      progressRef.current = 0;
      const start = performance.now();
      const duration = 2000;

      const animate = (now: number) => {
        const elapsed = now - start;
        progressRef.current = Math.min(elapsed / duration, 1);
        redraw(progressRef.current);
        if (progressRef.current < 1) {
          animRef.current = requestAnimationFrame(animate);
        }
      };
      animRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animRef.current);
    } else {
      progressRef.current = hasCracked ? 1 : 0;
      redraw(progressRef.current);
    }
  }, [isCracking, hasCracked, redraw]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!hasCracked) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      setInputState({ x, y, text: '', visible: true });
    },
    [hasCracked]
  );

  const handleSubmit = useCallback(() => {
    if (!inputState.text.trim()) return;
    addInscription({
      id: Date.now().toString(),
      x: inputState.x,
      y: inputState.y,
      text: inputState.text.trim(),
      fontSize: 18,
      rotation: -5 + Math.random() * 10,
    });
    setInputState((prev) => ({ ...prev, visible: false, text: '' }));
  }, [inputState, addInscription]);

  return (
    <div className="relative inline-block max-w-full">
      <canvas
        ref={internalCanvasRef}
        width={W}
        height={H}
        onClick={handleCanvasClick}
        className="max-w-full h-auto cursor-crosshair"
      />
      {inputState.visible && (
        <div
          className="absolute flex gap-1 p-1.5 rounded border border-yellow-700/70 bg-[#1a1208]/95 shadow-lg shadow-black/50"
          style={{
            left: `${(inputState.x / W) * 100}%`,
            top: `${(inputState.y / H) * 100}%`,
            transform: 'translate(-50%, -120%)',
          }}
        >
          <input
            value={inputState.text}
            onChange={(e) =>
              setInputState((prev) => ({ ...prev, text: e.target.value }))
            }
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="刻辞"
            className="w-16 px-1 py-0.5 text-sm text-yellow-200 bg-[#2a1f10] border border-yellow-800/50 rounded outline-none placeholder:text-yellow-800"
            autoFocus
          />
          <button
            onClick={handleSubmit}
            className="px-1.5 py-0.5 text-xs text-yellow-300 bg-yellow-900/60 border border-yellow-700/50 rounded hover:bg-yellow-800/70"
          >
            刻
          </button>
        </div>
      )}
    </div>
  );
});

export default ShellCanvas;
