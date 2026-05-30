import type { PatternElement, SymmetryMode } from '@/store/editorStore';
import {
  generateFabricTexture,
  generateCrackEffect,
  applyDyeEffect,
} from '@/utils/batikEffects';

interface BatikOptions {
  showFabricTexture: boolean;
  fabricOpacity: number;
  showCrackEffect: boolean;
  crackIntensity: number;
  crackSeed: number;
}

export function computeTransformMatrix(element: PatternElement): DOMMatrix {
  const m = new DOMMatrix();
  m.translateSelf(element.x, element.y);
  m.rotateSelf(element.rotation);
  m.scaleSelf(
    element.flipX ? -element.scale : element.scale,
    element.flipY ? -element.scale : element.scale
  );
  m.translateSelf(-50, -50);
  return m;
}

export function computeInverseTransformMatrix(element: PatternElement): DOMMatrix {
  return computeTransformMatrix(element).inverse();
}

export function computeSymmetryMatrices(
  element: PatternElement,
  symmetryMode: SymmetryMode,
  canvasWidth: number,
  canvasHeight: number
): DOMMatrix[] {
  if (symmetryMode === 'none') return [];
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  if (symmetryMode === 'horizontal') {
    const mirror = new DOMMatrix();
    mirror.translateSelf(centerX, 0);
    mirror.scaleSelf(-1, 1);
    mirror.translateSelf(-centerX, 0);
    return [computeTransformMatrix(element).preMultiplySelf(mirror)];
  }
  if (symmetryMode === 'vertical') {
    const mirror = new DOMMatrix();
    mirror.translateSelf(0, centerY);
    mirror.scaleSelf(1, -1);
    mirror.translateSelf(0, -centerY);
    return [computeTransformMatrix(element).preMultiplySelf(mirror)];
  }
  if (symmetryMode === 'rotational') {
    const matrices: DOMMatrix[] = [];
    for (let i = 1; i < 4; i++) {
      const rotMatrix = new DOMMatrix();
      rotMatrix.translateSelf(centerX, centerY);
      rotMatrix.rotateSelf(i * 90);
      rotMatrix.translateSelf(-centerX, -centerY);
      const elMatrix = computeTransformMatrix(element);
      matrices.push(elMatrix.preMultiplySelf(rotMatrix));
    }
    return matrices;
  }
  return [];
}

export function computeBBox(element: PatternElement): { x: number; y: number; width: number; height: number } {
  const matrix = computeTransformMatrix(element);
  const corners = [
    new DOMPoint(0, 0),
    new DOMPoint(100, 0),
    new DOMPoint(100, 100),
    new DOMPoint(0, 100),
  ];
  const transformed = corners.map((c) => c.matrixTransform(matrix));
  const xs = transformed.map((p) => p.x);
  const ys = transformed.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function hitTestElement(
  element: PatternElement,
  canvasX: number,
  canvasY: number
): boolean {
  const invMatrix = computeInverseTransformMatrix(element);
  const localPt = new DOMPoint(canvasX, canvasY).matrixTransform(invMatrix);
  return localPt.x >= 0 && localPt.x <= 100 && localPt.y >= 0 && localPt.y <= 100;
}

export function renderGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(26, 35, 50, 0.1)';
  ctx.lineWidth = 0.5;
  const gridSize = 20;
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

export function renderPattern(
  ctx: CanvasRenderingContext2D,
  element: PatternElement,
  isSelected: boolean = false
): void {
  const matrix = computeTransformMatrix(element);
  const transformedPath = new Path2D();
  transformedPath.addPath(new Path2D(element.svgPath), matrix);
  ctx.save();
  ctx.strokeStyle = '#1A2332';
  ctx.lineWidth = 1.5 / element.scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(transformedPath);
  ctx.restore();
  if (isSelected) {
    ctx.save();
    ctx.strokeStyle = '#D4A84B';
    ctx.lineWidth = 2 / element.scale;
    ctx.setLineDash([5 / element.scale, 5 / element.scale]);
    const bbox = computeBBox(element);
    ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
    ctx.restore();
  }
}

export function renderSymmetryPatterns(
  ctx: CanvasRenderingContext2D,
  element: PatternElement,
  symmetryMode: SymmetryMode,
  canvasWidth: number,
  canvasHeight: number
): void {
  const matrices = computeSymmetryMatrices(element, symmetryMode, canvasWidth, canvasHeight);
  matrices.forEach((matrix) => {
    const transformedPath = new Path2D();
    transformedPath.addPath(new Path2D(element.svgPath), matrix);
    ctx.save();
    ctx.strokeStyle = '#1A2332';
    ctx.lineWidth = 1.5 / element.scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(transformedPath);
    ctx.restore();
  });
}

export function renderAllElements(
  ctx: CanvasRenderingContext2D,
  elements: PatternElement[],
  selectedId: string | null,
  symmetryMode: SymmetryMode,
  canvasWidth: number,
  canvasHeight: number,
  showGrid: boolean,
  batikOptions?: BatikOptions
): void {
  ctx.fillStyle = '#F5F0E8';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  if (batikOptions?.showFabricTexture) {
    const texture = generateFabricTexture(
      canvasWidth,
      canvasHeight,
      batikOptions.fabricOpacity
    );
    ctx.drawImage(texture, 0, 0);
  }
  if (showGrid) {
    renderGrid(ctx, canvasWidth, canvasHeight);
  }
  elements.forEach((element) => {
    renderSymmetryPatterns(ctx, element, symmetryMode, canvasWidth, canvasHeight);
  });
  elements.forEach((element) => {
    renderPattern(ctx, element, element.id === selectedId);
  });
  if (batikOptions?.showCrackEffect) {
    const crackCanvas = generateCrackEffect(
      canvasWidth,
      canvasHeight,
      batikOptions.crackIntensity,
      batikOptions.crackSeed
    );
    ctx.drawImage(crackCanvas, 0, 0);
  }
  if (batikOptions?.showFabricTexture || batikOptions?.showCrackEffect) {
    const dyeStrength =
      (batikOptions.showFabricTexture ? batikOptions.fabricOpacity : 0) +
      (batikOptions.showCrackEffect ? batikOptions.crackIntensity * 0.3 : 0);
    applyDyeEffect(ctx, canvasWidth, canvasHeight, Math.min(dyeStrength, 1));
  }
}
