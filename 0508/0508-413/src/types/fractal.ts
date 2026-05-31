export interface ViewState {
  centerX: number;
  centerY: number;
  zoom: number;
  maxIterations: number;
  palette: string;
}

export interface RenderProgress {
  totalBlocks: number;
  completedBlocks: number;
  percentage: number;
  isRendering: boolean;
}

export interface BlockTask {
  startX: number;
  startY: number;
  width: number;
  height: number;
  viewState: ViewState;
  canvasWidth: number;
  canvasHeight: number;
  blockId: number;
}

export interface IterationDataResult {
  blockId: number;
  startX: number;
  startY: number;
  width: number;
  height: number;
  data: Float32Array;
}

export interface BlockResult {
  blockId: number;
  startX: number;
  startY: number;
  width: number;
  height: number;
  imageData: ImageData;
}

export type PaletteName = 'grayscale' | 'fire' | 'ocean' | 'rainbow' | 'neon' | 'vintage';

export const DEFAULT_VIEW_STATE: ViewState = {
  centerX: -0.7269,
  centerY: 0.1889,
  zoom: 1,
  maxIterations: 100,
  palette: 'fire',
};

export const BLOCK_SIZE = 32;

export const MAX_ITERATIONS_CAP = 512;
