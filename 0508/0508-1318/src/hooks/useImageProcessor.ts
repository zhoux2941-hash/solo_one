function gaussianBlur1D(data: Float32Array, width: number, height: number, sigma: number, horizontal: boolean): Float32Array {
  const result = new Float32Array(width * height);
  const radius = Math.ceil(sigma * 3);
  const kernelSize = radius * 2 + 1;
  const kernel = new Float32Array(kernelSize);

  let sum = 0;
  for (let i = 0; i < kernelSize; i++) {
    const x = i - radius;
    kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
    sum += kernel[i];
  }
  for (let i = 0; i < kernelSize; i++) {
    kernel[i] /= sum;
  }

  if (horizontal) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let val = 0;
        for (let k = -radius; k <= radius; k++) {
          const px = Math.min(Math.max(x + k, 0), width - 1);
          val += data[y * width + px] * kernel[k + radius];
        }
        result[y * width + x] = val;
      }
    }
  } else {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let val = 0;
        for (let k = -radius; k <= radius; k++) {
          const py = Math.min(Math.max(y + k, 0), height - 1);
          val += data[py * width + x] * kernel[k + radius];
        }
        result[y * width + x] = val;
      }
    }
  }

  return result;
}

function gaussianBlur2D(data: Float32Array, width: number, height: number, sigma: number): Float32Array {
  const horizontal = gaussianBlur1D(data, width, height, sigma, true);
  return gaussianBlur1D(horizontal, width, height, sigma, false);
}

function buildBaseLayerLUT(baseLayer: Float32Array, pixelCount: number): Float32Array {
  const histogram = new Uint32Array(256);
  for (let i = 0; i < pixelCount; i++) {
    const val = Math.round(Math.min(255, Math.max(0, baseLayer[i])));
    histogram[val]++;
  }

  const lowPercentile = 0.02;
  const highPercentile = 0.98;
  const lowCount = pixelCount * lowPercentile;
  const highCount = pixelCount * highPercentile;

  let cumulative = 0;
  let minVal = 0;
  for (let i = 0; i < 256; i++) {
    cumulative += histogram[i];
    if (cumulative >= lowCount) {
      minVal = i;
      break;
    }
  }

  cumulative = 0;
  let maxVal = 255;
  for (let i = 0; i < 256; i++) {
    cumulative += histogram[i];
    if (cumulative >= highCount) {
      maxVal = i;
      break;
    }
  }

  if (maxVal - minVal < 10) {
    minVal = Math.max(0, minVal - 10);
    maxVal = Math.min(255, maxVal + 10);
  }

  const lut = new Float32Array(256);
  const range = maxVal - minVal;

  for (let i = 0; i < 256; i++) {
    let normalized = 0;
    if (i <= minVal) {
      normalized = 0;
    } else if (i >= maxVal) {
      normalized = 1;
    } else {
      normalized = (i - minVal) / range;
    }

    const sCurve = Math.sin(normalized * Math.PI - Math.PI / 2) * 0.5 + 0.5;
    const inverted = 1 - sCurve;
    lut[i] = inverted * 255;
  }

  return lut;
}

function localToneMapping(
  luminance: Float32Array,
  width: number,
  height: number,
  direction: 'yang2yin' | 'yin2yang'
): Float32Array {
  const pixelCount = width * height;

  const sigma1 = Math.min(width, height) * 0.02;
  const sigma2 = Math.min(width, height) * 0.08;

  const blur1 = gaussianBlur2D(luminance, width, height, sigma1);
  const blur2 = gaussianBlur2D(luminance, width, height, sigma2);

  const baseLayer = new Float32Array(pixelCount);
  const detailLayer = new Float32Array(pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    baseLayer[i] = (blur1[i] + blur2[i]) * 0.5;
    detailLayer[i] = luminance[i] - baseLayer[i];
  }

  const baseLUT = buildBaseLayerLUT(baseLayer, pixelCount);

  const result = new Float32Array(pixelCount);
  const detailBoost = 1.3;

  for (let i = 0; i < pixelCount; i++) {
    const baseVal = Math.round(Math.min(255, Math.max(0, baseLayer[i])));
    let invertedBase = baseLUT[baseVal];

    if (direction === 'yin2yang') {
      invertedBase = 255 - invertedBase;
    }

    const enhancedDetail = detailLayer[i] * detailBoost;
    result[i] = Math.min(255, Math.max(0, invertedBase + enhancedDetail));
  }

  return result;
}

export function invertImage(
  imageData: ImageData,
  direction: 'yang2yin' | 'yin2yang',
  intensity: number
): ImageData {
  const { width, height, data } = imageData;
  const pixelCount = width * height;
  const result = new ImageData(
    new Uint8ClampedArray(data.length),
    width,
    height
  );
  const out = result.data;
  const factor = intensity / 100;

  const luminance = new Float32Array(pixelCount);
  const chrominance = new Float32Array(pixelCount * 2);

  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    luminance[i] = 0.299 * r + 0.587 * g + 0.114 * b;

    if (luminance[i] > 0) {
      chrominance[i * 2] = r / luminance[i];
      chrominance[i * 2 + 1] = b / luminance[i];
    } else {
      chrominance[i * 2] = 1;
      chrominance[i * 2 + 1] = 1;
    }
  }

  const invertedLuminance = localToneMapping(luminance, width, height, direction);

  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];

    const origLum = luminance[i];
    const newLum = invertedLuminance[i];

    const blendedR = Math.round(r + (newLum * chrominance[i * 2] - r) * factor);
    const blendedG = Math.round(g + (newLum - g) * factor);
    const blendedB = Math.round(b + (newLum * chrominance[i * 2 + 1] - b) * factor);

    out[idx] = Math.min(255, Math.max(0, blendedR));
    out[idx + 1] = Math.min(255, Math.max(0, blendedG));
    out[idx + 2] = Math.min(255, Math.max(0, blendedB));
    out[idx + 3] = a;
  }

  return result;
}

export function applyEdgeDetection(
  imageData: ImageData,
  algorithm: 'sobel' | 'laplacian',
  strength: number
): ImageData {
  const { width, height, data } = imageData;
  const result = new ImageData(
    new Uint8ClampedArray(data.length),
    width,
    height
  );
  const out = result.data;
  const factor = strength / 100;

  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  const edges = new Float32Array(width * height);

  if (algorithm === 'sobel') {
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = (y + ky) * width + (x + kx);
            const ki = (ky + 1) * 3 + (kx + 1);
            gx += gray[idx] * sobelX[ki];
            gy += gray[idx] * sobelY[ki];
          }
        }
        edges[y * width + x] = Math.sqrt(gx * gx + gy * gy);
      }
    }
  } else {
    const laplacian = [0, 1, 0, 1, -4, 1, 0, 1, 0];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = (y + ky) * width + (x + kx);
            const ki = (ky + 1) * 3 + (kx + 1);
            sum += gray[idx] * laplacian[ki];
          }
        }
        edges[y * width + x] = Math.abs(sum);
      }
    }
  }

  let maxEdge = 0;
  for (let i = 0; i < edges.length; i++) {
    if (edges[i] > maxEdge) maxEdge = edges[i];
  }
  if (maxEdge === 0) maxEdge = 1;

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const edgeVal = (edges[i] / maxEdge) * 255 * factor;

    out[idx] = Math.min(255, data[idx] + edgeVal * 0.5);
    out[idx + 1] = Math.min(255, data[idx + 1] + edgeVal * 0.3);
    out[idx + 2] = Math.min(255, data[idx + 2] + edgeVal * 0.2);
    out[idx + 3] = data[idx + 3];
  }

  return result;
}

export function loadImageToCanvas(dataUrl: string): Promise<{ canvas: HTMLCanvasElement; imageData: ImageData }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve({ canvas, imageData });
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export function imageDataToDataUrl(imageData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export function exportFullResolution(dataUrl: string): void {
  const link = document.createElement('a');
  link.download = `wadang-inverted-${Date.now()}.png`;
  link.href = dataUrl;
  link.click();
}

export function useImageProcessor() {
  return {
    invertImage,
    applyEdgeDetection,
    loadImageToCanvas,
    imageDataToDataUrl,
    exportFullResolution,
  };
}
