import sharp from 'sharp';

export interface ImageFeatures {
  averageBrightness: number;
  contrast: number;
  edgeDensity: number;
  symmetryHint: number;
  isYang: boolean;
}

function gaussianBlur1D(
  data: Float32Array,
  width: number,
  height: number,
  sigma: number,
  horizontal: boolean
): Float32Array {
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

function gaussianBlur2D(
  data: Float32Array,
  width: number,
  height: number,
  sigma: number
): Float32Array {
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

export async function invertImage(
  inputPath: string,
  outputPath: string,
  direction: 'yang2yin' | 'yin2yang' = 'yang2yin',
  intensity: number = 1.0
): Promise<void> {
  const image = sharp(inputPath);
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;
  const pixelCount = width * height;

  const luminance = new Float32Array(pixelCount);
  const chrominanceR = new Float32Array(pixelCount);
  const chrominanceB = new Float32Array(pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * channels;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    luminance[i] = lum;

    if (lum > 0) {
      chrominanceR[i] = r / lum;
      chrominanceB[i] = b / lum;
    } else {
      chrominanceR[i] = 1;
      chrominanceB[i] = 1;
    }
  }

  const invertedLuminance = localToneMapping(luminance, width, height, direction);

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * channels;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];

    const newLum = invertedLuminance[i];

    const newR = Math.round(r + (newLum * chrominanceR[i] - r) * intensity);
    const newG = Math.round(g + (newLum - g) * intensity);
    const newB = Math.round(b + (newLum * chrominanceB[i] - b) * intensity);

    data[offset] = Math.min(255, Math.max(0, newR));
    data[offset + 1] = Math.min(255, Math.max(0, newG));
    data[offset + 2] = Math.min(255, Math.max(0, newB));
  }

  await sharp(data, {
    raw: { width, height, channels },
  })
    .png()
    .toFile(outputPath);
}

export async function enhanceEdges(
  inputPath: string,
  outputPath: string,
  algorithm: 'sobel' | 'laplacian' = 'sobel',
  strength: number = 1.0
): Promise<void> {
  const image = sharp(inputPath);
  const { data, info } = await image
    .ensureAlpha()
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = 1;
  const output = Buffer.alloc(data.length);

  const strengthFactor = Math.max(0.1, Math.min(3.0, strength));

  if (algorithm === 'sobel') {
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0;
        let gy = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = (y + ky) * width + (x + kx);
            const kidx = (ky + 1) * 3 + (kx + 1);
            gx += data[idx] * sobelX[kidx];
            gy += data[idx] * sobelY[kidx];
          }
        }
        const magnitude = Math.sqrt(gx * gx + gy * gy) * strengthFactor;
        output[y * width + x] = Math.min(255, Math.max(0, Math.round(magnitude)));
      }
    }
  } else {
    const laplacianKernel = [0, 1, 0, 1, -4, 1, 0, 1, 0];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = (y + ky) * width + (x + kx);
            const kidx = (ky + 1) * 3 + (kx + 1);
            sum += data[idx] * laplacianKernel[kidx];
          }
        }
        const edgeValue = Math.abs(sum) * strengthFactor;
        output[y * width + x] = Math.min(255, Math.max(0, Math.round(edgeValue)));
      }
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
        output[y * width + x] = 0;
      }
    }
  }

  await sharp(output, {
    raw: { width, height, channels },
  })
    .png()
    .toFile(outputPath);
}

export async function detectPatternType(inputPath: string): Promise<ImageFeatures> {
  const image = sharp(inputPath);
  const { data, info } = await image
    .ensureAlpha()
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const totalPixels = width * height;

  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < totalPixels; i++) {
    sum += data[i];
    sumSq += data[i] * data[i];
  }

  const averageBrightness = sum / totalPixels;
  const variance = sumSq / totalPixels - averageBrightness * averageBrightness;
  const contrast = Math.sqrt(Math.max(0, variance));

  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  let edgeCount = 0;
  const edgeThreshold = 50;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx);
          const kidx = (ky + 1) * 3 + (kx + 1);
          gx += data[idx] * sobelX[kidx];
          gy += data[idx] * sobelY[kidx];
        }
      }
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      if (magnitude > edgeThreshold) edgeCount++;
    }
  }

  const edgeDensity = edgeCount / totalPixels;

  let leftSum = 0;
  let rightSum = 0;
  const midX = Math.floor(width / 2);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < midX; x++) {
      leftSum += data[y * width + x];
    }
    for (let x = midX; x < width; x++) {
      rightSum += data[y * width + x];
    }
  }
  const leftAvg = leftSum / (height * midX);
  const rightAvg = rightSum / (height * (width - midX));
  const symmetryHint = 1 - Math.abs(leftAvg - rightAvg) / 255;

  const isYang = averageBrightness > 127;

  return {
    averageBrightness: averageBrightness / 255,
    contrast: contrast / 255,
    edgeDensity,
    symmetryHint,
    isYang,
  };
}
