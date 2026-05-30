import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import type { Shape, ShapeLayer } from '../../shared/types';
import { Loader2 } from 'lucide-react';

const FaceCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { facePattern, customColors, loading } = useStore();

  const getColor = (colorType: Shape['color']): string => {
    const colorMap: Record<Shape['color'], string> = {
      main: customColors.main,
      secondary: customColors.secondary,
      outline: customColors.outline,
      accent1: customColors.accent1,
      accent2: customColors.accent2,
    };
    return colorMap[colorType];
  };

  const getShapeLayer = (shape: Shape): ShapeLayer => {
    if (shape.layer) return shape.layer;
    if (shape.fill && shape.strokeWidth === 0) return 'base';
    if (!shape.fill && shape.strokeWidth > 0) return 'line';
    return 'feature';
  };

  const drawSingleShape = useCallback((ctx: CanvasRenderingContext2D, shape: Shape, isAsymmetric: boolean) => {
    const color = getColor(shape.color);
    
    const drawSymmetric = (drawFn: () => void) => {
      drawFn();
      if (!isAsymmetric) {
        ctx.save();
        ctx.translate(400, 0);
        ctx.scale(-1, 1);
        ctx.translate(-400, 0);
        drawFn();
        ctx.restore();
      }
    };

    switch (shape.type) {
      case 'ellipse': {
        const [cx, cy, rx, ry] = shape.points;
        drawSymmetric(() => {
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          if (shape.fill) {
            ctx.fillStyle = color;
            ctx.fill();
          }
          if (shape.strokeWidth > 0) {
            ctx.strokeStyle = color;
            ctx.lineWidth = shape.strokeWidth;
            ctx.stroke();
          }
        });
        break;
      }
      case 'circle': {
        const [cx, cy, r] = shape.points;
        drawSymmetric(() => {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          if (shape.fill) {
            ctx.fillStyle = color;
            ctx.fill();
          }
          if (shape.strokeWidth > 0) {
            ctx.strokeStyle = color;
            ctx.lineWidth = shape.strokeWidth;
            ctx.stroke();
          }
        });
        break;
      }
      case 'rect': {
        const [x, y, w, h] = shape.points;
        drawSymmetric(() => {
          if (shape.fill) {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, w, h);
          }
          if (shape.strokeWidth > 0) {
            ctx.strokeStyle = color;
            ctx.lineWidth = shape.strokeWidth;
            ctx.strokeRect(x, y, w, h);
          }
        });
        break;
      }
      case 'polygon':
      case 'path': {
        const points = shape.points;
        drawSymmetric(() => {
          ctx.beginPath();
          ctx.moveTo(points[0], points[1]);
          for (let i = 2; i < points.length; i += 2) {
            ctx.lineTo(points[i], points[i + 1]);
          }
          ctx.closePath();
          if (shape.fill) {
            ctx.fillStyle = color;
            ctx.fill();
          }
          if (shape.strokeWidth > 0) {
            ctx.strokeStyle = color;
            ctx.lineWidth = shape.strokeWidth;
            ctx.stroke();
          }
        });
        break;
      }
    }
  }, [customColors]);

  const drawLayer = useCallback((ctx: CanvasRenderingContext2D, shapes: Shape[], layer: ShapeLayer, isAsymmetric: boolean) => {
    const layerShapes = shapes.filter((s) => getShapeLayer(s) === layer);
    layerShapes.forEach((shape) => {
      drawSingleShape(ctx, shape, isAsymmetric);
    });
  }, [drawSingleShape]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!facePattern) return;

    const isAsymmetric = facePattern.patternType === 'asymmetric';
    const shapes = facePattern.patternShapes;

    drawLayer(ctx, shapes, 'base', isAsymmetric);
    drawLayer(ctx, shapes, 'line', isAsymmetric);
    drawLayer(ctx, shapes, 'feature', isAsymmetric);

    ctx.strokeStyle = customColors.outline;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(200, 200, 150, 180, 0, 0, Math.PI * 2);
    ctx.stroke();
  }, [facePattern, customColors, drawLayer]);

  if (!facePattern) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-paper rounded-2xl border-4 border-gold/30">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-ink-light">加载中...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-4">🎭</div>
            <p className="text-ink-light text-lg">请选择人物查看脸谱</p>
          </div>
        )}
      </div>
    );
  }

  const selectedCharacter = useStore.getState().characters.find(
    (c) => c.id === facePattern.characterId
  );

  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-primary/20 rounded-full blur-xl transform scale-110" />
        <div className="relative bg-paper rounded-full p-6 border-8 border-gold shadow-2xl">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="rounded-full"
          />
        </div>
      </div>
      
      {selectedCharacter && (
        <div className="text-center mb-4 animate-fade-in-up">
          <h3 className="text-3xl font-display text-ink mb-1">
            {selectedCharacter.name}
          </h3>
          {selectedCharacter.alias && (
            <p className="text-ink-light">「{selectedCharacter.alias}」</p>
          )}
          <p className="text-sm text-ink-light mt-2 max-w-md">
            {selectedCharacter.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default FaceCanvas;
