const textureCache = new Map<string, HTMLCanvasElement>();
const crackCache = new Map<string, HTMLCanvasElement>();

export function generateFabricTexture(
  width: number,
  height: number,
  opacity: number
): HTMLCanvasElement {
  const key = `${width}-${height}-${opacity}`;
  const cached = textureCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(245, 240, 232, 1)';
  ctx.fillRect(0, 0, width, height);
  const threadSpacing = 3;
  ctx.globalAlpha = opacity * 0.3;
  ctx.strokeStyle = 'rgba(180, 170, 150, 1)';
  ctx.lineWidth = 0.5;
  for (let y = 0; y < height; y += threadSpacing) {
    ctx.beginPath();
    for (let x = 0; x < width; x += 2) {
      const offset = Math.sin(x * 0.05 + y * 0.01) * 0.3;
      if (x === 0) {
        ctx.moveTo(x, y + offset);
      } else {
        ctx.lineTo(x, y + offset);
      }
    }
    ctx.stroke();
  }
  for (let x = 0; x < width; x += threadSpacing) {
    ctx.beginPath();
    for (let y = 0; y < height; y += 2) {
      const offset = Math.sin(y * 0.05 + x * 0.01) * 0.3;
      if (y === 0) {
        ctx.moveTo(x + offset, y);
      } else {
        ctx.lineTo(x + offset, y);
      }
    }
    ctx.stroke();
  }
  ctx.globalAlpha = opacity * 0.15;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 20;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);
  ctx.globalAlpha = 1;
  textureCache.set(key, canvas);
  return canvas;
}

interface CrackSegment {
  x: number;
  y: number;
  angle: number;
  length: number;
  children: CrackSegment[];
}

function generateCrackTree(
  startX: number,
  startY: number,
  startAngle: number,
  maxLength: number,
  depth: number
): CrackSegment {
  const length = maxLength * (0.5 + Math.random() * 0.5);
  const angleVariation = (Math.random() - 0.5) * 0.4;
  const angle = startAngle + angleVariation;
  const children: CrackSegment[] = [];
  if (depth > 0 && length > 15) {
    const branchCount = Math.random() < 0.4 ? 1 : 0;
    for (let i = 0; i < branchCount; i++) {
      const branchAngle = angle + (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.8);
      children.push(
        generateCrackTree(
          startX + Math.cos(angle) * length * 0.6,
          startY + Math.sin(angle) * length * 0.6,
          branchAngle,
          length * 0.5,
          depth - 1
        )
      );
    }
  }
  return { x: startX, y: startY, angle, length, children };
}

function drawCrackSegment(ctx: CanvasRenderingContext2D, seg: CrackSegment, intensity: number) {
  const endX = seg.x + Math.cos(seg.angle) * seg.length;
  const endY = seg.y + Math.sin(seg.angle) * seg.length;
  const midX = (seg.x + endX) / 2 + (Math.random() - 0.5) * 3;
  const midY = (seg.y + endY) / 2 + (Math.random() - 0.5) * 3;
  ctx.beginPath();
  ctx.moveTo(seg.x, seg.y);
  ctx.quadraticCurveTo(midX, midY, endX, endY);
  ctx.strokeStyle = `rgba(26, 35, 50, ${intensity * 0.6})`;
  ctx.lineWidth = 0.8 + Math.random() * 0.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(seg.x, seg.y);
  ctx.quadraticCurveTo(midX, midY, endX, endY);
  ctx.strokeStyle = `rgba(60, 50, 40, ${intensity * 0.3})`;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  seg.children.forEach((child) => drawCrackSegment(ctx, child, intensity * 0.7));
}

export function generateCrackEffect(
  width: number,
  height: number,
  intensity: number,
  seed: number
): HTMLCanvasElement {
  const key = `${width}-${height}-${intensity}-${seed}`;
  const cached = crackCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const crackCount = Math.floor(3 + intensity * 5);
  const rng = seededRandom(seed);
  for (let i = 0; i < crackCount; i++) {
    const startX = rng() * width;
    const startY = rng() * height;
    const angle = rng() * Math.PI * 2;
    const maxLen = 40 + rng() * 120 * intensity;
    const tree = generateCrackTree(startX, startY, angle, maxLen, 3);
    drawCrackSegment(ctx, tree, intensity);
  }
  ctx.globalAlpha = 0.5;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      if (alpha > 0) {
        const dyM = Math.sin(x * 0.8) * 0.5;
        const dxM = Math.cos(y * 0.8) * 0.5;
        const nx = Math.max(0, Math.min(width - 1, Math.floor(x + dxM)));
        const ny = Math.max(0, Math.min(height - 1, Math.floor(y + dyM)));
        const nIdx = (ny * width + nx) * 4;
        if (data[nIdx + 3] === 0) {
          data[nIdx] = 80;
          data[nIdx + 1] = 70;
          data[nIdx + 2] = 60;
          data[nIdx + 3] = Math.floor(intensity * 40);
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
  ctx.globalAlpha = 1;
  crackCache.set(key, canvas);
  return canvas;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function applyDyeEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
): void {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const dyeStrength = intensity * 0.12;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > 200 && g > 190 && b > 170) {
      const dye = (1 - Math.random() * 0.3) * dyeStrength;
      data[i] = Math.max(0, Math.floor(r * (1 - dye * 2)));
      data[i + 1] = Math.max(0, Math.floor(g * (1 - dye * 1.5)));
      data[i + 2] = Math.max(0, Math.floor(b * (1 - dye * 0.5)));
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

export function clearEffectCaches(): void {
  textureCache.clear();
  crackCache.clear();
}
