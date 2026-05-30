class GaborFilterBank {
    constructor() {
        this.orientations = [0, Math.PI / 6, Math.PI / 3, Math.PI / 2, 2 * Math.PI / 3, 5 * Math.PI / 6];
        this.frequencies = [0.15, 0.3, 0.5];
        this.kernelSize = 15;
    }

    createKernel(theta, frequency, sigmaX, sigmaY) {
        const half = Math.floor(this.kernelSize / 2);
        const kernel = [];
        let sum = 0;

        for (let y = -half; y <= half; y++) {
            const row = [];
            for (let x = -half; x <= half; x++) {
                const xTheta = x * Math.cos(theta) + y * Math.sin(theta);
                const yTheta = -x * Math.sin(theta) + y * Math.cos(theta);
                const gaussian = Math.exp(-0.5 * (xTheta * xTheta / (sigmaX * sigmaX) + yTheta * yTheta / (sigmaY * sigmaY)));
                const sinusoidal = Math.cos(2 * Math.PI * frequency * xTheta);
                const value = gaussian * sinusoidal;
                row.push(value);
                sum += Math.abs(value);
            }
            kernel.push(row);
        }

        if (sum > 0) {
            for (let y = 0; y < kernel.length; y++) {
                for (let x = 0; x < kernel[y].length; x++) {
                    kernel[y][x] /= sum;
                }
            }
        }

        return kernel;
    }

    applyKernel(grayData, width, height, kernel) {
        const result = new Float32Array(width * height);
        const half = Math.floor(kernel.length / 2);

        for (let y = half; y < height - half; y++) {
            for (let x = half; x < width - half; x++) {
                let sum = 0;
                for (let ky = -half; ky <= half; ky++) {
                    for (let kx = -half; kx <= half; kx++) {
                        sum += grayData[(y + ky) * width + (x + kx)] * kernel[ky + half][kx + half];
                    }
                }
                result[y * width + x] = sum;
            }
        }

        return result;
    }

    extract(grayData, width, height) {
        const features = {
            orientations: this.orientations.length,
            frequencies: this.frequencies.length,
            responses: [],
            meanByOrientation: new Array(this.orientations.length).fill(0),
            meanByFrequency: new Array(this.frequencies.length).fill(0),
            varByOrientation: new Array(this.orientations.length).fill(0),
            varByFrequency: new Array(this.frequencies.length).fill(0),
            dominantOrientation: 0,
            dominantFrequency: 0,
            orientationSelectivity: 0,
            frequencyBandwidth: 0,
            texturePeriodicity: 0,
            directionality: 0
        };

        let maxMean = -Infinity;
        let maxFreqMean = -Infinity;
        const allMeans = [];

        for (let oi = 0; oi < this.orientations.length; oi++) {
            for (let fi = 0; fi < this.frequencies.length; fi++) {
                const theta = this.orientations[oi];
                const freq = this.frequencies[fi];
                const sigmaX = 1.0 / (2 * Math.PI * freq);
                const sigmaY = sigmaX * 2.5;

                const kernel = this.createKernel(theta, freq, sigmaX, sigmaY);
                const response = this.applyKernel(grayData, width, height, kernel);

                let sum = 0;
                let sumSq = 0;
                let count = 0;
                for (let i = 0; i < response.length; i++) {
                    const absVal = Math.abs(response[i]);
                    sum += absVal;
                    sumSq += absVal * absVal;
                    count++;
                }

                const mean = sum / count;
                const variance = sumSq / count - mean * mean;

                features.responses.push({
                    orientation: theta,
                    frequency: freq,
                    meanEnergy: mean,
                    variance: variance,
                    orientationIdx: oi,
                    frequencyIdx: fi
                });

                features.meanByOrientation[oi] += mean;
                features.varByOrientation[oi] += variance;
                features.meanByFrequency[fi] += mean;
                features.varByFrequency[fi] += variance;
                allMeans.push(mean);
            }
        }

        for (let oi = 0; oi < this.orientations.length; oi++) {
            features.meanByOrientation[oi] /= this.frequencies.length;
            features.varByOrientation[oi] /= this.frequencies.length;
            if (features.meanByOrientation[oi] > maxMean) {
                maxMean = features.meanByOrientation[oi];
                features.dominantOrientation = oi;
            }
        }

        for (let fi = 0; fi < this.frequencies.length; fi++) {
            features.meanByFrequency[fi] /= this.orientations.length;
            if (features.meanByFrequency[fi] > maxFreqMean) {
                maxFreqMean = features.meanByFrequency[fi];
                features.dominantFrequency = fi;
            }
        }

        const orientationMeans = features.meanByOrientation;
        const maxOrientMean = Math.max(...orientationMeans);
        const minOrientMean = Math.min(...orientationMeans);
        const orientRange = maxOrientMean - minOrientMean;
        features.directionality = maxOrientMean > 0 ? orientRange / maxOrientMean : 0;

        let orientEntropy = 0;
        const orientTotal = orientationMeans.reduce((a, b) => a + b, 0);
        for (const m of orientationMeans) {
            const p = m / (orientTotal || 1);
            if (p > 0) orientEntropy -= p * Math.log2(p);
        }
        features.orientationSelectivity = 1 - orientEntropy / Math.log2(this.orientations.length);

        let freqEntropy = 0;
        const freqTotal = features.meanByFrequency.reduce((a, b) => a + b, 0);
        for (const m of features.meanByFrequency) {
            const p = m / (freqTotal || 1);
            if (p > 0) freqEntropy -= p * Math.log2(p);
        }
        features.frequencyBandwidth = 1 - freqEntropy / Math.log2(this.frequencies.length);

        const sortedMeans = [...allMeans].sort((a, b) => a - b);
        let peaks = 0;
        for (let i = 1; i < sortedMeans.length - 1; i++) {
            if (sortedMeans[i] > sortedMeans[i - 1] * 1.2 && sortedMeans[i] > sortedMeans[i + 1] * 1.2) {
                peaks++;
            }
        }
        features.texturePeriodicity = Math.min(1, peaks / 3);

        return features;
    }
}

class AutoencoderReducer {
    constructor(inputDim, latentDim) {
        this.inputDim = inputDim;
        this.latentDim = latentDim;
        this.encoderWeights = [];
        this.encoderBias = [];
        this.decoderWeights = [];
        this.decoderBias = [];
        this.trained = false;
        this._initializeWeights();
    }

    _initializeWeights() {
        const encScale = Math.sqrt(2.0 / this.inputDim);
        for (let j = 0; j < this.latentDim; j++) {
            const row = [];
            for (let i = 0; i < this.inputDim; i++) {
                row.push((Math.random() * 2 - 1) * encScale);
            }
            this.encoderWeights.push(row);
            this.encoderBias.push(0);
        }

        const decScale = Math.sqrt(2.0 / this.latentDim);
        for (let j = 0; j < this.inputDim; j++) {
            const row = [];
            for (let i = 0; i < this.latentDim; i++) {
                row.push((Math.random() * 2 - 1) * decScale);
            }
            this.decoderWeights.push(row);
            this.decoderBias.push(0);
        }
    }

    _sigmoid(x) {
        return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
    }

    _sigmoidDerivative(x) {
        return x * (1 - x);
    }

    encode(input) {
        const latent = [];
        for (let j = 0; j < this.latentDim; j++) {
            let sum = this.encoderBias[j];
            for (let i = 0; i < this.inputDim; i++) {
                sum += this.encoderWeights[j][i] * input[i];
            }
            latent.push(this._sigmoid(sum));
        }
        return latent;
    }

    decode(latent) {
        const reconstructed = [];
        for (let j = 0; j < this.inputDim; j++) {
            let sum = this.decoderBias[j];
            for (let i = 0; i < this.latentDim; i++) {
                sum += this.decoderWeights[j][i] * latent[i];
            }
            reconstructed.push(this._sigmoid(sum));
        }
        return reconstructed;
    }

    forward(input) {
        const latent = this.encode(input);
        const reconstructed = this.decode(latent);
        return { latent, reconstructed };
    }

    train(inputs, learningRate, epochs) {
        for (let epoch = 0; epoch < epochs; epoch++) {
            let totalLoss = 0;

            for (const input of inputs) {
                const { latent, reconstructed } = this.forward(input);

                let loss = 0;
                const outputDeltas = [];
                for (let i = 0; i < this.inputDim; i++) {
                    const diff = reconstructed[i] - input[i];
                    loss += diff * diff;
                    outputDeltas.push(diff * this._sigmoidDerivative(reconstructed[i]));
                }
                totalLoss += loss / this.inputDim;

                const latentDeltas = [];
                for (let i = 0; i < this.latentDim; i++) {
                    let error = 0;
                    for (let j = 0; j < this.inputDim; j++) {
                        error += outputDeltas[j] * this.decoderWeights[j][i];
                    }
                    latentDeltas.push(error * this._sigmoidDerivative(latent[i]));
                }

                for (let j = 0; j < this.inputDim; j++) {
                    for (let i = 0; i < this.latentDim; i++) {
                        this.decoderWeights[j][i] -= learningRate * outputDeltas[j] * latent[i];
                    }
                    this.decoderBias[j] -= learningRate * outputDeltas[j];
                }

                for (let j = 0; j < this.latentDim; j++) {
                    for (let i = 0; i < this.inputDim; i++) {
                        this.encoderWeights[j][i] -= learningRate * latentDeltas[j] * input[i];
                    }
                    this.encoderBias[j] -= learningRate * latentDeltas[j];
                }
            }

            if (epoch > 0 && epoch % 10 === 0) {
                const avgLoss = totalLoss / inputs.length;
                if (avgLoss < 0.001) break;
            }
        }

        this.trained = true;
    }

    reduce(input) {
        return this.encode(input);
    }

    getReconstructionError(input) {
        const { reconstructed } = this.forward(input);
        let error = 0;
        for (let i = 0; i < this.inputDim; i++) {
            error += (reconstructed[i] - input[i]) ** 2;
        }
        return error / this.inputDim;
    }
}

class PCAReducer {
    constructor(targetDim) {
        this.targetDim = targetDim;
        this.components = null;
        this.mean = null;
        this.explainedVariance = null;
    }

    fit(data) {
        const n = data.length;
        const d = data[0].length;

        this.mean = new Array(d).fill(0);
        for (const row of data) {
            for (let i = 0; i < d; i++) {
                this.mean[i] += row[i] / n;
            }
        }

        const centered = data.map(row => row.map((v, i) => v - this.mean[i]));

        const cov = new Array(d).fill(null).map(() => new Array(d).fill(0));
        for (const row of centered) {
            for (let i = 0; i < d; i++) {
                for (let j = i; j < d; j++) {
                    cov[i][j] += row[i] * row[j] / (n - 1);
                    if (i !== j) cov[j][i] = cov[i][j];
                }
            }
        }

        this.components = [];
        this.explainedVariance = [];
        const totalVariance = cov.reduce((s, row, i) => s + row[i], 0);

        for (let k = 0; k < this.targetDim; k++) {
            const { eigenvector, eigenvalue } = this._powerIteration(cov, d);
            this.components.push(eigenvector);
            this.explainedVariance.push(eigenvalue / totalVariance);

            for (let i = 0; i < d; i++) {
                for (let j = 0; j < d; j++) {
                    cov[i][j] -= eigenvalue * eigenvector[i] * eigenvector[j];
                }
            }
        }
    }

    _powerIteration(matrix, d, maxIter, tol) {
        maxIter = maxIter || 100;
        tol = tol || 1e-6;
        let v = new Array(d).fill(0).map(() => Math.random() - 0.5);
        let norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
        v = v.map(x => x / norm);

        let eigenvalue = 0;

        for (let iter = 0; iter < maxIter; iter++) {
            const newV = new Array(d).fill(0);
            for (let i = 0; i < d; i++) {
                for (let j = 0; j < d; j++) {
                    newV[i] += matrix[i][j] * v[j];
                }
            }

            eigenvalue = 0;
            for (let i = 0; i < d; i++) {
                eigenvalue += newV[i] * v[i];
            }

            norm = Math.sqrt(newV.reduce((s, x) => s + x * x, 0));
            if (norm < 1e-10) break;

            const newVNorm = newV.map(x => x / norm);

            let converged = true;
            for (let i = 0; i < d; i++) {
                if (Math.abs(newVNorm[i] - v[i]) > tol) {
                    converged = false;
                    break;
                }
            }

            v = newVNorm;
            if (converged) break;
        }

        return { eigenvector: v, eigenvalue: eigenvalue };
    }

    transform(input) {
        const centered = input.map((v, i) => v - (this.mean ? this.mean[i] : 0));
        const result = [];
        for (const component of this.components) {
            let dot = 0;
            for (let i = 0; i < centered.length; i++) {
                dot += centered[i] * component[i];
            }
            result.push(dot);
        }
        return result;
    }

    getExplainedVarianceRatio() {
        return this.explainedVariance || [];
    }
}

class FeatureFusionPipeline {
    constructor() {
        this.gabor = new GaborFilterBank();
        this.rawFeatureDim = 0;
        this.fusedFeatureDim = 5;
        this.autoencoder = null;
        this.pca = null;
        this.isFitted = false;
        this.featureNames = [];
    }

    buildRawFeatureVector(glcm, gabor, linear, color) {
        const hsv = ImageProcessor.rgbToHsv(color.avgColor.r, color.avgColor.g, color.avgColor.b);

        const features = [
            glcm.contrast,
            glcm.homogeneity,
            glcm.energy,
            glcm.correlation,
            glcm.dissimilarity,
            linear.linearityScore,
            Math.min(1, linear.lineCount / 20),
            linear.horizontalLines / Math.max(1, linear.lineCount),
            linear.verticalLines / Math.max(1, linear.lineCount),
            linear.diagonalLines / Math.max(1, linear.lineCount),
            gabor.directionality,
            gabor.orientationSelectivity,
            gabor.frequencyBandwidth,
            gabor.texturePeriodicity,
            gabor.meanByOrientation[0] || 0,
            gabor.meanByOrientation[1] || 0,
            gabor.meanByOrientation[2] || 0,
            gabor.meanByOrientation[3] || 0,
            gabor.meanByOrientation[4] || 0,
            gabor.meanByOrientation[5] || 0,
            gabor.meanByFrequency[0] || 0,
            gabor.meanByFrequency[1] || 0,
            gabor.meanByFrequency[2] || 0,
            hsv.h / 360,
            hsv.s,
            hsv.v
        ];

        this.featureNames = [
            'GLCM对比度', 'GLCM同质性', 'GLCM能量', 'GLCM相关性', 'GLCM差异性',
            '线性度', '线条密度', '水平线比', '垂直线比', '对角线比',
            'Gabor方向性', 'Gabor方向选择性', 'Gabor频率带宽', 'Gabor周期性',
            'Gabor方向0°', 'Gabor方向30°', 'Gabor方向60°', 'Gabor方向90°', 'Gabor方向120°', 'Gabor方向150°',
            'Gabor低频', 'Gabor中频', 'Gabor高频',
            '色相', '饱和度', '明度'
        ];

        this.rawFeatureDim = features.length;
        return features;
    }

    normalize(features) {
        return features.map(v => {
            if (!isFinite(v)) return 0;
            return Math.max(0, Math.min(1, (v + 1) / 2));
        });
    }

    fit(featureVectors) {
        const normalized = featureVectors.map(f => this.normalize(f));

        this.pca = new PCAReducer(this.fusedFeatureDim);
        this.pca.fit(normalized);

        this.autoencoder = new AutoencoderReducer(this.rawFeatureDim, this.fusedFeatureDim);
        this.autoencoder.train(normalized, 0.05, 50);

        this.isFitted = true;
    }

    transform(rawFeatures) {
        const normalized = this.normalize(rawFeatures);

        if (!this.isFitted) {
            this.fit([normalized]);
        }

        const pcaLatent = this.pca.transform(normalized);
        const aeLatent = this.autoencoder.reduce(normalized);
        const aeReconError = this.autoencoder.getReconstructionError(normalized);

        const fused = [];
        for (let i = 0; i < this.fusedFeatureDim; i++) {
            fused.push(0.6 * pcaLatent[i] + 0.4 * aeLatent[i]);
        }

        const pcaVariance = this.pca.getExplainedVarianceRatio();
        let totalExplained = 0;
        for (const v of pcaVariance) totalExplained += v;

        return {
            raw: rawFeatures,
            rawNormalized: normalized,
            fused: fused,
            pcaLatent: pcaLatent,
            aeLatent: aeLatent,
            aeReconstructionError: aeReconError,
            explainedVariance: pcaVariance,
            totalExplainedVariance: totalExplained,
            featureNames: this.featureNames,
            dimensionReduction: {
                original: this.rawFeatureDim,
                reduced: this.fusedFeatureDim,
                ratio: (this.fusedFeatureDim / this.rawFeatureDim).toFixed(2)
            }
        };
    }
}

class ImageProcessor {
    constructor(imageElement) {
        this.image = imageElement;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 0;
        this.height = 0;
        this.imageData = null;
    }

    loadImage() {
        return new Promise((resolve) => {
            const maxSize = 400;
            let width = this.image.naturalWidth || this.image.width;
            let height = this.image.naturalHeight || this.image.height;

            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = (height / width) * maxSize;
                    width = maxSize;
                } else {
                    width = (width / height) * maxSize;
                    height = maxSize;
                }
            }

            this.width = Math.floor(width);
            this.height = Math.floor(height);
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.ctx.drawImage(this.image, 0, 0, this.width, this.height);
            this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);

            resolve(this);
        });
    }

    getGrayScale() {
        const data = this.imageData.data;
        const grayData = new Uint8Array(this.width * this.height);

        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            grayData[j] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        }

        return grayData;
    }

    sobelEdgeDetection() {
        const grayData = this.getGrayScale();
        const width = this.width;
        const height = this.height;
        const edges = new Uint8Array(width * height);

        const gx = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1]
        ];
        const gy = [
            [-1, -2, -1],
            [0, 0, 0],
            [1, 2, 1]
        ];

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let sumX = 0;
                let sumY = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = (y + ky) * width + (x + kx);
                        const pixel = grayData[idx];
                        sumX += pixel * gx[ky + 1][kx + 1];
                        sumY += pixel * gy[ky + 1][kx + 1];
                    }
                }

                const magnitude = Math.sqrt(sumX * sumX + sumY * sumY);
                edges[y * width + x] = Math.min(255, Math.round(magnitude));
            }
        }

        return edges;
    }

    calculateGLCM(distance, angle) {
        distance = distance || 1;
        angle = angle || 0;
        const grayData = this.getGrayScale();
        const width = this.width;
        const height = this.height;
        const levels = 16;
        const glcm = new Array(levels).fill(null).map(() => new Array(levels).fill(0));

        const quantized = grayData.map(v => Math.floor(v / (256 / levels)));

        let dx = 0, dy = 0;
        switch (angle) {
            case 0: dx = distance; dy = 0; break;
            case 45: dx = distance; dy = -distance; break;
            case 90: dx = 0; dy = -distance; break;
            case 135: dx = -distance; dy = -distance; break;
        }

        let count = 0;
        for (let y = Math.max(0, -dy); y < height - Math.max(0, dy); y++) {
            for (let x = Math.max(0, -dx); x < width - Math.max(0, dx); x++) {
                const i = quantized[y * width + x];
                const j = quantized[(y + dy) * width + (x + dx)];
                if (i >= 0 && i < levels && j >= 0 && j < levels) {
                    glcm[i][j]++;
                    count++;
                }
            }
        }

        for (let i = 0; i < levels; i++) {
            for (let j = 0; j < levels; j++) {
                glcm[i][j] /= count;
            }
        }

        return glcm;
    }

    extractGLCMFeatures() {
        const angles = [0, 45, 90, 135];
        let totalContrast = 0;
        let totalHomogeneity = 0;
        let totalEnergy = 0;
        let totalCorrelation = 0;
        let totalDissimilarity = 0;

        angles.forEach(angle => {
            const glcm = this.calculateGLCM(1, angle);
            const levels = glcm.length;

            let meanI = 0, meanJ = 0;
            let varI = 0, varJ = 0;

            for (let i = 0; i < levels; i++) {
                for (let j = 0; j < levels; j++) {
                    meanI += i * glcm[i][j];
                    meanJ += j * glcm[i][j];
                }
            }

            for (let i = 0; i < levels; i++) {
                for (let j = 0; j < levels; j++) {
                    varI += Math.pow(i - meanI, 2) * glcm[i][j];
                    varJ += Math.pow(j - meanJ, 2) * glcm[i][j];
                }
            }

            let contrast = 0;
            let homogeneity = 0;
            let energy = 0;
            let correlation = 0;
            let dissimilarity = 0;

            for (let i = 0; i < levels; i++) {
                for (let j = 0; j < levels; j++) {
                    const value = glcm[i][j];
                    const diff = Math.abs(i - j);

                    contrast += diff * diff * value;
                    homogeneity += value / (1 + diff * diff);
                    energy += value * value;
                    dissimilarity += diff * value;

                    if (varI > 0 && varJ > 0) {
                        correlation += ((i - meanI) * (j - meanJ) * value) / Math.sqrt(varI * varJ);
                    }
                }
            }

            totalContrast += contrast;
            totalHomogeneity += homogeneity;
            totalEnergy += energy;
            totalCorrelation += correlation;
            totalDissimilarity += dissimilarity;
        });

        return {
            contrast: totalContrast / angles.length,
            homogeneity: totalHomogeneity / angles.length,
            energy: totalEnergy / angles.length,
            correlation: (totalCorrelation / angles.length + 1) / 2,
            dissimilarity: totalDissimilarity / angles.length
        };
    }

    extractGaborFeatures() {
        const grayData = this.getGrayScale();
        return this.gaborBank.extract(grayData, this.width, this.height);
    }

    houghLineDetection() {
        const edges = this.sobelEdgeDetection();
        const width = this.width;
        const height = this.height;

        const threshold = 50;
        const strongEdges = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (edges[y * width + x] > threshold) {
                    strongEdges.push({ x, y });
                }
            }
        }

        const maxDist = Math.sqrt(width * width + height * height);
        const rhoBins = 360;
        const thetaBins = 180;
        const accumulator = new Array(rhoBins).fill(null).map(() => new Array(thetaBins).fill(0));

        const rhoStep = (2 * maxDist) / rhoBins;
        const thetaStep = Math.PI / thetaBins;

        strongEdges.forEach(({ x, y }) => {
            for (let t = 0; t < thetaBins; t++) {
                const theta = t * thetaStep;
                const rho = x * Math.cos(theta) + y * Math.sin(theta);
                const rhoIdx = Math.floor((rho + maxDist) / rhoStep);
                if (rhoIdx >= 0 && rhoIdx < rhoBins) {
                    accumulator[rhoIdx][t]++;
                }
            }
        });

        const lines = [];
        const voteThreshold = Math.max(30, strongEdges.length * 0.02);

        for (let r = 1; r < rhoBins - 1; r++) {
            for (let t = 1; t < thetaBins - 1; t++) {
                const votes = accumulator[r][t];
                if (votes > voteThreshold) {
                    let isLocalMax = true;
                    for (let dr = -1; dr <= 1 && isLocalMax; dr++) {
                        for (let dt = -1; dt <= 1 && isLocalMax; dt++) {
                            if (dr === 0 && dt === 0) continue;
                            if (accumulator[r + dr][t + dt] >= votes) {
                                isLocalMax = false;
                            }
                        }
                    }

                    if (isLocalMax) {
                        const rho = (r * rhoStep) - maxDist;
                        const theta = t * thetaStep;
                        const angleDeg = theta * 180 / Math.PI;
                        lines.push({
                            rho,
                            theta,
                            angleDeg,
                            votes,
                            normalizedVotes: votes / strongEdges.length
                        });
                    }
                }
            }
        }

        lines.sort((a, b) => b.votes - a.votes);
        return lines.slice(0, 20);
    }

    extractLinearFeatures() {
        const lines = this.houghLineDetection();

        if (lines.length === 0) {
            return {
                lineCount: 0,
                avgLineStrength: 0,
                horizontalLines: 0,
                verticalLines: 0,
                diagonalLines: 0,
                linearityScore: 0,
                dominantAngle: 0
            };
        }

        const totalVotes = lines.reduce((sum, l) => sum + l.votes, 0);
        const avgStrength = totalVotes / lines.length;

        let horizontal = 0;
        let vertical = 0;
        let diagonal = 0;
        let angleHistogram = new Array(18).fill(0);

        lines.forEach(line => {
            const angle = line.angleDeg % 180;
            const angleBin = Math.floor(angle / 10);
            angleHistogram[angleBin] += line.votes;

            if ((angle >= 80 && angle <= 100) || (angle >= 260 && angle <= 280)) {
                horizontal++;
            } else if ((angle >= 0 && angle <= 10) || (angle >= 170 && angle <= 190) ||
                       (angle >= 350 && angle <= 360)) {
                vertical++;
            } else {
                diagonal++;
            }
        });

        const linearityScore = Math.min(1, lines.length / 15) * Math.min(1, avgStrength / 100);
        const dominantAngleBin = angleHistogram.indexOf(Math.max(...angleHistogram));

        return {
            lineCount: lines.length,
            avgLineStrength: avgStrength,
            horizontalLines: horizontal,
            verticalLines: vertical,
            diagonalLines: diagonal,
            linearityScore: linearityScore,
            dominantAngle: dominantAngleBin * 10 + 5,
            angleDistribution: angleHistogram,
            topLines: lines.slice(0, 5)
        };
    }

    extractColorFeatures() {
        const data = this.imageData.data;
        const width = this.width;
        const height = this.height;

        const hsvBins = { h: 12, s: 4, v: 4 };
        const histogram = new Array(hsvBins.h * hsvBins.s * hsvBins.v).fill(0);

        let totalR = 0, totalG = 0, totalB = 0;
        let pixelCount = 0;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a < 128) continue;

            totalR += r;
            totalG += g;
            totalB += b;
            pixelCount++;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const diff = max - min;

            let h = 0, s = 0, v = max / 255;

            if (diff > 0) {
                s = diff / max;
                switch (max) {
                    case r: h = ((g - b) / diff) % 6; break;
                    case g: h = (b - r) / diff + 2; break;
                    case b: h = (r - g) / diff + 4; break;
                }
                h *= 60;
                if (h < 0) h += 360;
            }

            const hIdx = Math.floor((h / 360) * hsvBins.h) % hsvBins.h;
            const sIdx = Math.min(hsvBins.s - 1, Math.floor(s * hsvBins.s));
            const vIdx = Math.min(hsvBins.v - 1, Math.floor(v * hsvBins.v));

            const idx = hIdx * hsvBins.s * hsvBins.v + sIdx * hsvBins.v + vIdx;
            histogram[idx]++;
        }

        const total = histogram.reduce((a, b) => a + b, 0);
        const normalizedHistogram = histogram.map(v => v / total);

        return {
            avgColor: {
                r: totalR / pixelCount / 255,
                g: totalG / pixelCount / 255,
                b: totalB / pixelCount / 255
            },
            hsvHistogram: normalizedHistogram,
            histogramBins: hsvBins
        };
    }

    static rgbToHsv(r, g, b) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;

        let h = 0, s = 0, v = max;

        if (diff > 0) {
            s = diff / max;
            switch (max) {
                case r: h = ((g - b) / diff) % 6; break;
                case g: h = (b - r) / diff + 2; break;
                case b: h = (r - g) / diff + 4; break;
            }
            h *= 60;
            if (h < 0) h += 360;
        }

        return { h, s, v };
    }

    async extractAllFeatures() {
        await this.loadImage();

        this.gaborBank = new GaborFilterBank();

        const glcmFeatures = this.extractGLCMFeatures();
        const gaborFeatures = this.extractGaborFeatures();
        const linearFeatures = this.extractLinearFeatures();
        const colorFeatures = this.extractColorFeatures();

        const pipeline = new FeatureFusionPipeline();
        const rawVector = pipeline.buildRawFeatureVector(glcmFeatures, gaborFeatures, linearFeatures, colorFeatures);
        const fusionResult = pipeline.transform(rawVector);

        return {
            glcm: glcmFeatures,
            gabor: gaborFeatures,
            linear: linearFeatures,
            color: colorFeatures,
            fusion: fusionResult,
            dimensions: { width: this.width, height: this.height }
        };
    }
}

class StoneClassifier {
    constructor() {
        this.stoneTypes = [
            {
                id: 1, name: '端砚-鱼脑冻', category: '端砚',
                description: '鱼脑冻是端砚中的名贵石品，形似鱼脑，半透明，温润细腻',
                features: '半透明纹理, 圆润形态, 灰白色调',
                ink_performance: '上发墨', rating: 5, grind_time_coefficient: 0.8,
                featureProfile: {
                    linearity: { min: 0, max: 0.3 },
                    contrast: { min: 0, max: 0.3 },
                    homogeneity: { min: 0.7, max: 1.0 },
                    colorHue: { min: 0, max: 60 },
                    saturation: { min: 0, max: 0.3 },
                    lineCount: { min: 0, max: 5 }
                },
                fusedProfile: [-0.3, 0.6, -0.2, 0.4, 0.1]
            },
            {
                id: 2, name: '端砚-火捺', category: '端砚',
                description: '火捺如火焰般的纹理，色泽青紫，是端砚的重要特征',
                features: '火焰状纹理, 青紫色, 层次感强',
                ink_performance: '下发墨', rating: 4, grind_time_coefficient: 1.0,
                featureProfile: {
                    linearity: { min: 0.1, max: 0.4 },
                    contrast: { min: 0.3, max: 0.6 },
                    homogeneity: { min: 0.4, max: 0.7 },
                    colorHue: { min: 240, max: 300 },
                    saturation: { min: 0.2, max: 0.5 },
                    lineCount: { min: 0, max: 8 }
                },
                fusedProfile: [0.2, 0.1, 0.4, -0.3, 0.5]
            },
            {
                id: 3, name: '端砚-金银线', category: '端砚',
                description: '金银线是端砚中独特的石品，黄者为金，白者为银',
                features: '线状纹理, 金黄色或银白色, 细长分布',
                ink_performance: '上发墨', rating: 5, grind_time_coefficient: 0.7,
                featureProfile: {
                    linearity: { min: 0.6, max: 1.0 },
                    contrast: { min: 0.4, max: 0.8 },
                    homogeneity: { min: 0.3, max: 0.6 },
                    colorHue: { min: 30, max: 60 },
                    saturation: { min: 0.3, max: 0.6 },
                    lineCount: { min: 10, max: 30 }
                },
                fusedProfile: [0.7, -0.4, 0.3, 0.2, -0.5]
            },
            {
                id: 4, name: '歙砚-眉纹', category: '歙砚',
                description: '眉纹如人之眉毛，是歙砚中的精品',
                features: '眉毛状纹理, 黑色或深灰色, 排列有序',
                ink_performance: '下发墨', rating: 4, grind_time_coefficient: 0.9,
                featureProfile: {
                    linearity: { min: 0.5, max: 0.9 },
                    contrast: { min: 0.5, max: 0.8 },
                    homogeneity: { min: 0.3, max: 0.6 },
                    colorHue: { min: 0, max: 30 },
                    saturation: { min: 0, max: 0.3 },
                    lineCount: { min: 8, max: 25 }
                },
                fusedProfile: [0.6, -0.3, 0.1, -0.1, -0.4]
            },
            {
                id: 5, name: '歙砚-金星', category: '歙砚',
                description: '金星是歙砚的特色石品，金黄色星点分布',
                features: '星点状纹理, 金黄色, 分布均匀',
                ink_performance: '上发墨', rating: 4, grind_time_coefficient: 0.85,
                featureProfile: {
                    linearity: { min: 0, max: 0.3 },
                    contrast: { min: 0.4, max: 0.7 },
                    homogeneity: { min: 0.5, max: 0.8 },
                    colorHue: { min: 30, max: 60 },
                    saturation: { min: 0.4, max: 0.7 },
                    lineCount: { min: 0, max: 5 }
                },
                fusedProfile: [-0.1, 0.3, 0.5, 0.6, -0.2]
            },
            {
                id: 6, name: '洮河砚-鸭头绿', category: '洮河砚',
                description: '鸭头绿是洮河砚的代表石品，色绿如鸭头',
                features: '绿色纹理, 细腻质地, 波纹状',
                ink_performance: '下发墨', rating: 5, grind_time_coefficient: 0.75,
                featureProfile: {
                    linearity: { min: 0.2, max: 0.5 },
                    contrast: { min: 0.2, max: 0.5 },
                    homogeneity: { min: 0.6, max: 0.9 },
                    colorHue: { min: 90, max: 150 },
                    saturation: { min: 0.3, max: 0.6 },
                    lineCount: { min: 2, max: 10 }
                },
                fusedProfile: [0.1, 0.5, -0.4, 0.7, 0.3]
            },
            {
                id: 7, name: '洮河砚-鹦哥绿', category: '洮河砚',
                description: '鹦哥绿如鹦鹉羽毛般翠绿，是洮河砚中的珍品',
                features: '翠绿色调, 纹理细密, 光泽度高',
                ink_performance: '上发墨', rating: 5, grind_time_coefficient: 0.7,
                featureProfile: {
                    linearity: { min: 0.1, max: 0.4 },
                    contrast: { min: 0.3, max: 0.6 },
                    homogeneity: { min: 0.5, max: 0.8 },
                    colorHue: { min: 120, max: 160 },
                    saturation: { min: 0.5, max: 0.8 },
                    lineCount: { min: 0, max: 8 }
                },
                fusedProfile: [0.0, 0.4, -0.3, 0.8, 0.5]
            },
            {
                id: 8, name: '澄泥砚-鳝鱼黄', category: '澄泥砚',
                description: '鳝鱼黄是澄泥砚的经典品种，色黄如鳝鱼',
                features: '黄色纹理, 细腻泥质, 温润光泽',
                ink_performance: '下发墨', rating: 3, grind_time_coefficient: 1.2,
                featureProfile: {
                    linearity: { min: 0, max: 0.3 },
                    contrast: { min: 0.1, max: 0.4 },
                    homogeneity: { min: 0.7, max: 1.0 },
                    colorHue: { min: 30, max: 60 },
                    saturation: { min: 0.2, max: 0.5 },
                    lineCount: { min: 0, max: 5 }
                },
                fusedProfile: [-0.2, 0.5, -0.1, 0.3, -0.1]
            },
            {
                id: 9, name: '端砚-冰纹', category: '端砚',
                description: '冰纹如冰霜冻结，纹理清晰自然',
                features: '冰霜状纹理, 白色透明感, 网状分布',
                ink_performance: '上发墨', rating: 4, grind_time_coefficient: 0.85,
                featureProfile: {
                    linearity: { min: 0.7, max: 1.0 },
                    contrast: { min: 0.5, max: 0.9 },
                    homogeneity: { min: 0.2, max: 0.5 },
                    colorHue: { min: 180, max: 240 },
                    saturation: { min: 0.1, max: 0.4 },
                    lineCount: { min: 12, max: 30 }
                },
                fusedProfile: [0.8, -0.5, 0.6, -0.2, 0.4]
            },
            {
                id: 10, name: '歙砚-罗纹', category: '歙砚',
                description: '罗纹如丝罗般细腻，纹理细密有致',
                features: '丝状纹理, 细密排列, 灰色调',
                ink_performance: '下发墨', rating: 4, grind_time_coefficient: 0.95,
                featureProfile: {
                    linearity: { min: 0.6, max: 0.95 },
                    contrast: { min: 0.3, max: 0.6 },
                    homogeneity: { min: 0.4, max: 0.7 },
                    colorHue: { min: 0, max: 30 },
                    saturation: { min: 0, max: 0.2 },
                    lineCount: { min: 10, max: 25 }
                },
                fusedProfile: [0.5, -0.2, 0.2, -0.3, -0.5]
            }
        ];
    }

    rgbToHsv(r, g, b) {
        return ImageProcessor.rgbToHsv(r, g, b);
    }

    calculateMatchingScore(features, stoneType) {
        const profile = stoneType.featureProfile;
        let totalScore = 0;
        let weights = 0;

        const { linear, glcm, color } = features;

        const hsv = this.rgbToHsv(color.avgColor.r, color.avgColor.g, color.avgColor.b);

        const featureWeights = {
            linearity: 0.20,
            contrast: 0.10,
            homogeneity: 0.10,
            colorHue: 0.15,
            saturation: 0.08,
            lineCount: 0.12
        };

        const normalizedFeatures = {
            linearity: linear.linearityScore,
            contrast: Math.min(1, glcm.contrast / 0.5),
            homogeneity: glcm.homogeneity,
            colorHue: hsv.h,
            saturation: hsv.s,
            lineCount: Math.min(1, linear.lineCount / 20)
        };

        for (const [feature, weight] of Object.entries(featureWeights)) {
            const range = profile[feature];
            const value = normalizedFeatures[feature];
            let score = 0;

            if (feature === 'colorHue') {
                const midPoint = (range.min + range.max) / 2;
                const rangeWidth = range.max - range.min;
                let diff = Math.abs(value - midPoint);
                diff = Math.min(diff, 360 - diff);
                score = Math.max(0, 1 - diff / (rangeWidth / 2));
            } else {
                if (value >= range.min && value <= range.max) {
                    score = 1;
                } else if (value < range.min) {
                    score = Math.max(0, 1 - (range.min - value) / (range.min + 0.1));
                } else {
                    score = Math.max(0, 1 - (value - range.max) / (1 - range.max + 0.1));
                }
            }

            totalScore += score * weight;
            weights += weight;
        }

        return totalScore / weights;
    }

    calculateFusedDistance(fusedVector, fusedProfile) {
        if (!fusedProfile || !fusedVector) return 0.5;

        let sumSq = 0;
        const dim = Math.min(fusedVector.length, fusedProfile.length);
        for (let i = 0; i < dim; i++) {
            const diff = fusedVector[i] - fusedProfile[i];
            sumSq += diff * diff;
        }

        const maxDist = Math.sqrt(dim * 4);
        const dist = Math.sqrt(sumSq);
        return Math.max(0, 1 - dist / maxDist);
    }

    classify(features) {
        const results = this.stoneTypes.map(stone => {
            const traditionalScore = this.calculateMatchingScore(features, stone);
            let fusedScore = 0;

            if (features.fusion && features.fusion.fused && stone.fusedProfile) {
                fusedScore = this.calculateFusedDistance(features.fusion.fused, stone.fusedProfile);
            }

            const combinedScore = 0.5 * traditionalScore + 0.5 * fusedScore;

            return {
                stone,
                score: combinedScore,
                traditionalScore,
                fusedScore
            };
        });

        results.sort((a, b) => b.score - a.score);

        const topResult = results[0];
        const adjustedConfidence = 0.4 + topResult.score * 0.6;

        const featuresUsed = {
            linearity: features.linear.linearityScore.toFixed(3),
            lineCount: features.linear.lineCount,
            contrast: features.glcm.contrast.toFixed(3),
            homogeneity: features.glcm.homogeneity.toFixed(3),
            dominantAngle: features.linear.dominantAngle
        };

        if (features.gabor) {
            featuresUsed.gaborDirectionality = features.gabor.directionality.toFixed(3);
            featuresUsed.gaborSelectivity = features.gabor.orientationSelectivity.toFixed(3);
            featuresUsed.gaborPeriodicity = features.gabor.texturePeriodicity.toFixed(3);
        }

        if (features.fusion) {
            featuresUsed.fusedDim = features.fusion.dimensionReduction.reduced + '/' + features.fusion.dimensionReduction.original;
            featuresUsed.explainedVar = (features.fusion.totalExplainedVariance * 100).toFixed(1) + '%';
            featuresUsed.aeReconError = features.fusion.aeReconstructionError.toFixed(4);
        }

        return {
            bestMatch: topResult.stone,
            confidence: adjustedConfidence,
            allMatches: results.slice(0, 3),
            featuresUsed
        };
    }
}

function generateFeatureDescription(features, classification) {
    const descriptions = [];
    const { linear, glcm, color, gabor } = features;

    if (linear.linearityScore > 0.6) {
        descriptions.push('强线性纹理');
        if (linear.lineCount > 15) {
            descriptions.push('网状纹理分布');
        }
        if (linear.linearityScore > 0.8 && linear.lineCount > 12) {
            descriptions.push('冰纹特征明显');
        }
    } else if (linear.linearityScore > 0.3) {
        descriptions.push('中等线性纹理');
    } else {
        descriptions.push('无明显线性纹理');
    }

    if (glcm.contrast > 0.4) {
        descriptions.push('高对比度纹理');
    } else if (glcm.contrast > 0.2) {
        descriptions.push('中等对比度');
    } else {
        descriptions.push('低对比度细腻质地');
    }

    if (glcm.homogeneity > 0.7) {
        descriptions.push('质地均匀细腻');
    } else if (glcm.homogeneity > 0.5) {
        descriptions.push('质地较均匀');
    } else {
        descriptions.push('纹理结构丰富');
    }

    if (gabor) {
        if (gabor.directionality > 0.6) {
            descriptions.push('强方向性纹理');
        } else if (gabor.directionality > 0.3) {
            descriptions.push('中等方向性');
        }

        if (gabor.orientationSelectivity > 0.7) {
            descriptions.push('纹理方向集中');
        }

        if (gabor.texturePeriodicity > 0.5) {
            descriptions.push('周期性纹理');
        }
    }

    const avgR = color.avgColor.r * 255;
    const avgG = color.avgColor.g * 255;
    const avgB = color.avgColor.b * 255;

    if (avgG > avgR && avgG > avgB) {
        if (avgG > 180) {
            descriptions.push('翠绿色调');
        } else {
            descriptions.push('绿色调');
        }
    } else if (avgR > avgG && avgR > avgB && avgR > 150 && avgG > 100) {
        descriptions.push('金黄色调');
    } else if (avgB > avgR && avgB > avgG && avgB > 100) {
        descriptions.push('青紫色调');
    } else if (avgR > 200 && avgG > 180 && avgB > 150) {
        descriptions.push('暖黄色调');
    } else if (Math.abs(avgR - avgG) < 30 && Math.abs(avgG - avgB) < 30 && avgR < 150) {
        descriptions.push('深灰色调');
    } else if (Math.abs(avgR - avgG) < 30 && Math.abs(avgG - avgB) < 30) {
        descriptions.push('灰白色调');
    }

    if (features.fusion) {
        const varRatio = features.fusion.totalExplainedVariance;
        if (varRatio > 0.8) {
            descriptions.push('特征高浓缩');
        } else if (varRatio > 0.5) {
            descriptions.push('特征中等浓缩');
        }
    }

    if (descriptions.length > 6) {
        return descriptions.slice(0, 6).join(', ');
    }

    return descriptions.join(', ');
}
