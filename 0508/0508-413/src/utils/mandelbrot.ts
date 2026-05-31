import { ViewState } from '../types/fractal';

export function mandelbrot(cx: number, cy: number, maxIter: number): number {
  let x = 0;
  let y = 0;
  let iteration = 0;

  while (x * x + y * y <= 4 && iteration < maxIter) {
    const xtemp = x * x - y * y + cx;
    y = 2 * x * y + cy;
    x = xtemp;
    iteration++;
  }

  if (iteration < maxIter) {
    const logZn = Math.log(x * x + y * y) / 2;
    const nu = Math.log(logZn / Math.log(2)) / Math.log(2);
    iteration = iteration + 1 - nu;
  }

  return iteration;
}

export function pixelToComplex(
  px: number,
  py: number,
  viewState: ViewState,
  canvasWidth: number,
  canvasHeight: number
): { cx: number; cy: number } {
  const { centerX, centerY, zoom } = viewState;
  const planeWidth = 4 / zoom;
  const planeHeight = (4 / zoom) * (canvasHeight / canvasWidth);

  const cx = centerX + (px - canvasWidth / 2) * (planeWidth / canvasWidth);
  const cy = centerY + (py - canvasHeight / 2) * (planeHeight / canvasHeight);

  return { cx, cy };
}

export function complexToPixel(
  cx: number,
  cy: number,
  viewState: ViewState,
  canvasWidth: number,
  canvasHeight: number
): { px: number; py: number } {
  const { centerX, centerY, zoom } = viewState;
  const planeWidth = 4 / zoom;
  const planeHeight = (4 / zoom) * (canvasHeight / canvasWidth);

  const px = ((cx - centerX) / planeWidth) * canvasWidth + canvasWidth / 2;
  const py = ((cy - centerY) / planeHeight) * canvasHeight + canvasHeight / 2;

  return { px, py };
}

export function computeEscapeTimes(
  viewState: ViewState,
  canvasWidth: number,
  canvasHeight: number,
  startX: number,
  startY: number,
  blockWidth: number,
  blockHeight: number,
  maxIterCap: number
): Float32Array {
  const escapeTimes = new Float32Array(blockWidth * blockHeight);

  let idx = 0;
  for (let y = 0; y < blockHeight; y++) {
    for (let x = 0; x < blockWidth; x++) {
      const { cx, cy } = pixelToComplex(
        startX + x,
        startY + y,
        viewState,
        canvasWidth,
        canvasHeight
      );
      escapeTimes[idx++] = mandelbrot(cx, cy, maxIterCap);
    }
  }

  return escapeTimes;
}

export function colorizeEscapeTimes(
  escapeTimes: Float32Array,
  width: number,
  height: number,
  displayIterations: number,
  palette: Uint8ClampedArray
): ImageData {
  const imageData = new ImageData(width, height);
  const data = imageData.data;
  const paletteLength = palette.length / 3;

  let pixelIdx = 0;
  for (let i = 0; i < escapeTimes.length; i++) {
    const iter = escapeTimes[i];
    let r: number, g: number, b: number;

    if (iter >= displayIterations) {
      r = 0;
      g = 0;
      b = 0;
    } else {
      const colorIndex = Math.floor((iter / displayIterations) * paletteLength * 10) % paletteLength;
      const paletteIndex = colorIndex * 3;
      r = palette[paletteIndex];
      g = palette[paletteIndex + 1];
      b = palette[paletteIndex + 2];
    }

    data[pixelIdx] = r;
    data[pixelIdx + 1] = g;
    data[pixelIdx + 2] = b;
    data[pixelIdx + 3] = 255;
    pixelIdx += 4;
  }

  return imageData;
}

export function renderBlock(
  viewState: ViewState,
  canvasWidth: number,
  canvasHeight: number,
  startX: number,
  startY: number,
  blockWidth: number,
  blockHeight: number,
  palette: Uint8ClampedArray
): ImageData {
  const imageData = new ImageData(blockWidth, blockHeight);
  const data = imageData.data;
  const { maxIterations } = viewState;
  const paletteLength = palette.length / 3;

  let pixelIndex = 0;
  for (let y = 0; y < blockHeight; y++) {
    for (let x = 0; x < blockWidth; x++) {
      const { cx, cy } = pixelToComplex(
        startX + x,
        startY + y,
        viewState,
        canvasWidth,
        canvasHeight
      );

      const iter = mandelbrot(cx, cy, maxIterations);
      let r: number, g: number, b: number;

      if (iter >= maxIterations) {
        r = 0;
        g = 0;
        b = 0;
      } else {
        const colorIndex = Math.floor((iter / maxIterations) * paletteLength * 10) % paletteLength;
        const paletteIndex = colorIndex * 3;
        r = palette[paletteIndex];
        g = palette[paletteIndex + 1];
        b = palette[paletteIndex + 2];
      }

      data[pixelIndex] = r;
      data[pixelIndex + 1] = g;
      data[pixelIndex + 2] = b;
      data[pixelIndex + 3] = 255;
      pixelIndex += 4;
    }
  }

  return imageData;
}
