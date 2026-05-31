import { computeEscapeTimes } from '../utils/mandelbrot';
import { BlockTask, IterationDataResult, MAX_ITERATIONS_CAP } from '../types/fractal';

let isCancelled = false;

self.onmessage = (e: MessageEvent) => {
  const { type, tasks } = e.data;

  if (type === 'cancel') {
    isCancelled = true;
    return;
  }

  if (type === 'render' && Array.isArray(tasks)) {
    isCancelled = false;
    processTasks(tasks);
  }
};

async function processTasks(tasks: BlockTask[]) {
  for (const task of tasks) {
    if (isCancelled) {
      self.postMessage({ type: 'cancelled' });
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 0));

    const escapeTimes = computeEscapeTimes(
      task.viewState,
      task.canvasWidth,
      task.canvasHeight,
      task.startX,
      task.startY,
      task.width,
      task.height,
      MAX_ITERATIONS_CAP
    );

    const result: IterationDataResult = {
      blockId: task.blockId,
      startX: task.startX,
      startY: task.startY,
      width: task.width,
      height: task.height,
      data: escapeTimes,
    };

    self.postMessage(
      { type: 'blockComplete', result },
      { transfer: [escapeTimes.buffer] }
    );
  }

  self.postMessage({ type: 'complete' });
}
