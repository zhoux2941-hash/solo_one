import { useCallback, useRef, useEffect } from 'react';
import { BlockTask, BLOCK_SIZE, ViewState, IterationDataResult, PaletteName } from '../types/fractal';
import { useFractalStore } from '../store/fractalStore';
import { globalTileCache, bumpCacheVersion } from '../utils/tileCache';
import { colorizeEscapeTimes } from '../utils/mandelbrot';
import { getPalette } from '../utils/palettes';

interface CachedTile {
  startX: number;
  startY: number;
  width: number;
  height: number;
  data: Float32Array;
}

export function useFractalRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  canvasWidth: number,
  canvasHeight: number
) {
  const { viewState, setRenderProgress } = useFractalStore();
  const workerRef = useRef<Worker | null>(null);
  const isRenderingRef = useRef(false);
  const cachedTilesRef = useRef<Map<string, CachedTile>>(new Map());

  const colorizeAndDrawTile = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      startX: number,
      startY: number,
      width: number,
      height: number,
      escapeTimes: Float32Array,
      displayIterations: number,
      palette: Uint8ClampedArray
    ) => {
      const imageData = colorizeEscapeTimes(
        escapeTimes,
        width,
        height,
        displayIterations,
        palette
      );
      ctx.putImageData(imageData, startX, startY);
    },
    []
  );

  const getAllTilePositions = useCallback((): { startX: number; startY: number; width: number; height: number }[] => {
    const positions: { startX: number; startY: number; width: number; height: number }[] = [];
    for (let y = 0; y < canvasHeight; y += BLOCK_SIZE) {
      for (let x = 0; x < canvasWidth; x += BLOCK_SIZE) {
        positions.push({
          startX: x,
          startY: y,
          width: Math.min(BLOCK_SIZE, canvasWidth - x),
          height: Math.min(BLOCK_SIZE, canvasHeight - y),
        });
      }
    }
    return positions;
  }, [canvasWidth, canvasHeight]);

  const recolorAllTiles = useCallback(
    (vs: ViewState) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const palette = getPalette(vs.palette as PaletteName);
      const positions = getAllTilePositions();
      let colored = 0;

      for (const pos of positions) {
        const cached = globalTileCache.get(
          vs,
          pos.startX,
          pos.startY,
          canvasWidth,
          canvasHeight
        );
        if (cached) {
          colorizeAndDrawTile(
            ctx,
            pos.startX,
            pos.startY,
            pos.width,
            pos.height,
            cached.data,
            vs.maxIterations,
            palette
          );
          colored++;
        }
      }

      return colored === positions.length;
    },
    [canvasRef, canvasWidth, canvasHeight, getAllTilePositions, colorizeAndDrawTile]
  );

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/fractal.worker.ts', import.meta.url),
      { type: 'module' }
    );

    const worker = workerRef.current;

    worker.onmessage = (e) => {
      const { type, result } = e.data;

      if (type === 'blockComplete') {
        const r = result as IterationDataResult;
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const escapeTimes = new Float32Array(r.data);

            globalTileCache.set(
              viewState,
              r.startX,
              r.startY,
              canvasWidth,
              canvasHeight,
              escapeTimes.slice(),
              r.width,
              r.height
            );
            bumpCacheVersion();

            const palette = getPalette(viewState.palette as PaletteName);
            colorizeAndDrawTile(
              ctx,
              r.startX,
              r.startY,
              r.width,
              r.height,
              escapeTimes,
              viewState.maxIterations,
              palette
            );
          }
        }

        setRenderProgress((prev) => {
          const completedBlocks = prev.completedBlocks + 1;
          const percentage = Math.round((completedBlocks / prev.totalBlocks) * 100);
          return {
            completedBlocks,
            percentage,
          };
        });
      } else if (type === 'complete') {
        isRenderingRef.current = false;
        setRenderProgress({ isRendering: false, percentage: 100 });
      } else if (type === 'cancelled') {
        isRenderingRef.current = false;
        setRenderProgress({ isRendering: false });
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [canvasRef, setRenderProgress, canvasWidth, canvasHeight, colorizeAndDrawTile, viewState]);

  const createBlockTasks = useCallback(
    (vs: ViewState): BlockTask[] => {
      const tasks: BlockTask[] = [];
      let blockId = 0;

      for (let y = 0; y < canvasHeight; y += BLOCK_SIZE) {
        for (let x = 0; x < canvasWidth; x += BLOCK_SIZE) {
          const width = Math.min(BLOCK_SIZE, canvasWidth - x);
          const height = Math.min(BLOCK_SIZE, canvasHeight - y);

          tasks.push({
            startX: x,
            startY: y,
            width,
            height,
            viewState: vs,
            canvasWidth,
            canvasHeight,
            blockId: blockId++,
          });
        }
      }

      return tasks;
    },
    [canvasWidth, canvasHeight]
  );

  const render = useCallback(
    (customViewState?: Partial<ViewState>) => {
      if (!workerRef.current || !canvasRef.current) return;

      const currentViewState = {
        ...viewState,
        ...customViewState,
      };

      if (isRenderingRef.current) {
        workerRef.current.postMessage({ type: 'cancel' });
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0a0e27';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      const allTasks = createBlockTasks(currentViewState);
      const palette = getPalette(currentViewState.palette as PaletteName);

      const uncachedTasks: BlockTask[] = [];
      let cachedCount = 0;

      for (const task of allTasks) {
        const cached = globalTileCache.get(
          currentViewState,
          task.startX,
          task.startY,
          canvasWidth,
          canvasHeight
        );
        if (cached && ctx) {
          colorizeAndDrawTile(
            ctx,
            task.startX,
            task.startY,
            task.width,
            task.height,
            cached.data,
            currentViewState.maxIterations,
            palette
          );
          cachedCount++;
        } else {
          uncachedTasks.push(task);
        }
      }

      const totalBlocks = allTasks.length;

      if (uncachedTasks.length === 0) {
        isRenderingRef.current = false;
        setRenderProgress({
          totalBlocks,
          completedBlocks: totalBlocks,
          percentage: 100,
          isRendering: false,
        });
        return;
      }

      isRenderingRef.current = true;

      setRenderProgress({
        totalBlocks,
        completedBlocks: cachedCount,
        percentage: Math.round((cachedCount / totalBlocks) * 100),
        isRendering: true,
      });

      workerRef.current.postMessage({
        type: 'render',
        tasks: uncachedTasks,
      });
    },
    [viewState, canvasRef, canvasWidth, canvasHeight, createBlockTasks, setRenderProgress, colorizeAndDrawTile]
  );

  const recolor = useCallback(() => {
    const allFullyCached = recolorAllTiles(viewState);
    if (allFullyCached) {
      setRenderProgress((prev) => ({
        ...prev,
        percentage: 100,
        isRendering: false,
      }));
    }
  }, [viewState, recolorAllTiles, setRenderProgress]);

  const stopRender = useCallback(() => {
    if (workerRef.current && isRenderingRef.current) {
      workerRef.current.postMessage({ type: 'cancel' });
      isRenderingRef.current = false;
      setRenderProgress({ isRendering: false });
    }
  }, [setRenderProgress]);

  return { render, recolor, stopRender, isRendering: isRenderingRef.current };
}