import type { FacePattern, FacePatternExport, Shape, ShapeLayer, ColorPalette } from '../../shared/types';

const EXPORT_VERSION = '1.0.0';

export function getShapeLayer(shape: Shape): ShapeLayer {
  if (shape.layer) return shape.layer;
  if (shape.fill && shape.strokeWidth === 0) return 'base';
  if (!shape.fill && shape.strokeWidth > 0) return 'line';
  return 'feature';
}

export function groupShapesByLayer(shapes: Shape[]): {
  base: Shape[];
  line: Shape[];
  feature: Shape[];
} {
  return {
    base: shapes.filter((s) => getShapeLayer(s) === 'base'),
    line: shapes.filter((s) => getShapeLayer(s) === 'line'),
    feature: shapes.filter((s) => getShapeLayer(s) === 'feature'),
  };
}

export function createExportData(
  facePattern: FacePattern,
  characterName: string,
  customColors: ColorPalette
): FacePatternExport {
  const layers = groupShapesByLayer(facePattern.patternShapes);

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    characterName,
    patternType: facePattern.patternType,
    colors: {
      main: customColors.main,
      secondary: customColors.secondary,
      outline: customColors.outline,
      accent1: customColors.accent1,
      accent2: customColors.accent2,
    },
    layers: {
      base: layers.base.map(normalizeShapeForExport),
      line: layers.line.map(normalizeShapeForExport),
      feature: layers.feature.map(normalizeShapeForExport),
    },
    metadata: {
      patternFeatures: facePattern.patternFeatures,
    },
  };
}

function normalizeShapeForExport(shape: Shape): Shape {
  return {
    type: shape.type,
    points: shape.points,
    color: shape.color,
    fill: shape.fill,
    strokeWidth: shape.strokeWidth,
    layer: getShapeLayer(shape),
  };
}

export function exportToJson(data: FacePatternExport): string {
  return JSON.stringify(data, null, 2);
}

export function downloadJson(data: FacePatternExport, filename: string): void {
  const json = exportToJson(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function validateExportData(data: unknown): data is FacePatternExport {
  if (typeof data !== 'object' || data === null) return false;

  const obj = data as Record<string, unknown>;

  if (typeof obj.version !== 'string') return false;
  if (typeof obj.exportedAt !== 'string') return false;
  if (typeof obj.characterName !== 'string') return false;
  if (obj.patternType !== 'symmetric' && obj.patternType !== 'asymmetric') return false;

  if (typeof obj.colors !== 'object' || obj.colors === null) return false;
  const colors = obj.colors as Record<string, unknown>;
  if (typeof colors.main !== 'string') return false;
  if (typeof colors.secondary !== 'string') return false;
  if (typeof colors.outline !== 'string') return false;
  if (typeof colors.accent1 !== 'string') return false;
  if (typeof colors.accent2 !== 'string') return false;

  if (typeof obj.layers !== 'object' || obj.layers === null) return false;
  const layers = obj.layers as Record<string, unknown>;
  if (!Array.isArray(layers.base)) return false;
  if (!Array.isArray(layers.line)) return false;
  if (!Array.isArray(layers.feature)) return false;

  if (typeof obj.metadata !== 'object' || obj.metadata === null) return false;

  return true;
}
