export type FoldStep = 0 | 1 | 2 | 3;

export type CanvasTransform = [number, number, number, number, number, number];

export interface Point {
  x: number;
  y: number;
}

export interface DrawPath {
  id: string;
  points: Point[];
  color: string;
  lineWidth: number;
  foldStep: FoldStep;
}

export interface FoldRegion {
  vertices: Point[];
  clipPath: string;
}

export interface ToolSettings {
  lineWidth: number;
  color: string;
  tool: 'brush' | 'eraser';
}

export interface AppState {
  currentFoldStep: FoldStep;
  drawPaths: DrawPath[];
  currentPath: DrawPath | null;
  isDrawing: boolean;
  isUnfolding: boolean;
  showFinalResult: boolean;
  unfoldProgress: number;
  toolSettings: ToolSettings;
  isAnimating: boolean;
}

export interface FoldAction {
  type: 'leftRight' | 'topBottom' | 'diagonal';
  label: string;
  description: string;
}

export const CANVAS_SIZE = 600;
export const PREVIEW_SIZE = 200;

export const FOLD_ACTIONS: FoldAction[] = [
  { type: 'leftRight', label: '左右对折', description: '沿竖中线将纸左右对折' },
  { type: 'topBottom', label: '上下对折', description: '沿横中线将纸上下对折' },
  { type: 'diagonal', label: '角对角折', description: '沿对角线将纸对角折叠' },
];

export const DEFAULT_TOOL_SETTINGS: ToolSettings = {
  lineWidth: 4,
  color: '#1A1A1A',
  tool: 'brush',
};
