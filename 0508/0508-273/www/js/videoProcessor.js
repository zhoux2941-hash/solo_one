import init, { VideoProcessor, init_thread_pool, BoundingBox } from '../../pkg/video_processor.js';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as tf from '@tensorflow/tfjs';

export class WasmVideoProcessor {
    constructor() {
        this.processor = null;
        this.width = 0;
        this.height = 0;
        this.faceDetector = null;
        this.initialized = false;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.fps = 0;
        
        this.lastCachedFaces = [];
        this.previousFaces = [];
        this.lastDetectionTime = 0;
        this.detectionSkipped = 0;
        this.consecutiveSkips = 0;
        this.maxConsecutiveSkips = 1;
        this.targetFps = 30;
        this.frameInterval = 1000 / this.targetFps;
        this.skipThreshold = this.frameInterval * 2.0;
        this.detectionInterval = 2;
        this.useQuantization = false;
        this.interpolationAlpha = 0.6;
        
        this.pixelBuffer = null;
        this.backgroundImageData = null;
        this.backgroundColor = { r: 0, g: 255, b: 136 };
    }

    async init(width, height, numThreads = 4, options = {}) {
        this.width = width;
        this.height = height;
        
        this.useQuantization = options.useQuantization === true;
        
        this.pixelBuffer = new Uint8Array(width * height * 4);
        
        if (numThreads <= 2) {
            this.detectionInterval = 3;
            this.maxConsecutiveSkips = 2;
        } else if (numThreads <= 4) {
            this.detectionInterval = 2;
            this.maxConsecutiveSkips = 1;
        } else {
            this.detectionInterval = 1;
            this.maxConsecutiveSkips = 0;
        }

        await init();
        await init_thread_pool(numThreads);
        
        this.processor = new VideoProcessor(width, height);
        
        await tf.setBackend('webgl');
        await tf.ready();
        
        if (this.useQuantization) {
            tf.env().set('WEBGL_PACK', true);
        }
        
        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        const detectorConfig = {
            runtime: 'tfjs',
            refineLandmarks: true,
            maxFaces: 2,
        };
        
        this.faceDetector = await faceLandmarksDetection.createDetector(model, detectorConfig);
        
        this.initialized = true;
        console.log(`WasmVideoProcessor initialized - Quantization: ${this.useQuantization}, Detection Interval: ${this.detectionInterval}`);
    }

    setBackgroundColor(r, g, b) {
        this.backgroundColor = { r, g, b };
        if (this.processor) {
            this.processor.set_background_color(r, g, b);
        }
        this.backgroundImageData = null;
    }

    setBackgroundImage(imageData) {
        if (this.processor && imageData) {
            this.backgroundImageData = imageData;
            this.processor.set_background_image(Array.from(imageData.data));
        }
    }

    async detectFaces(videoElement, forceDetection = false) {
        if (!this.faceDetector) return this.lastCachedFaces;

        this.previousFaces = [...this.lastCachedFaces];

        if (!forceDetection && this.shouldSkipDetection()) {
            this.detectionSkipped++;
            this.consecutiveSkips++;
            return this.smoothInterpolateFaces(this.lastCachedFaces, this.previousFaces);
        }

        const startTime = performance.now();
        
        try {
            const faces = await this.faceDetector.estimateFaces(videoElement, {
                flipHorizontal: false,
                staticImageMode: false,
            });

            const processedFaces = faces.map(face => {
                const box = face.box;
                const attributes = this.estimateFaceAttributes(face.keypoints);
                return {
                    x: box.xMin,
                    y: box.yMin,
                    width: box.width,
                    height: box.height,
                    confidence: face.faceInViewConfidence || 1.0,
                    keypoints: face.keypoints,
                    attributes: attributes,
                    timestamp: startTime,
                };
            });

            this.lastDetectionTime = performance.now() - startTime;
            this.lastCachedFaces = processedFaces;
            this.consecutiveSkips = 0;

            return processedFaces;
        } catch (e) {
            return this.lastCachedFaces;
        }
    }

    estimateFaceAttributes(keypoints) {
        if (!keypoints || keypoints.length < 468) {
            return {
                age: 25,
                gender: 'unknown',
                emotion: 'neutral',
            };
        }

        const forehead = keypoints[10];
        const chin = keypoints[152];
        const leftEye = keypoints[33];
        const rightEye = keypoints[263];
        const mouth = keypoints[13];
        const leftEyebrow = keypoints[66];
        const rightEyebrow = keypoints[296];

        const faceHeight = Math.abs(chin.y - forehead.y);
        const faceWidth = Math.abs(rightEye.x - leftEye.x);
        const aspectRatio = faceWidth / faceHeight;

        const eyeY = (leftEye.y + rightEye.y) / 2;
        const mouthToEyeDistance = mouth.y - eyeY;
        const relativeMouthPosition = mouthToEyeDistance / faceHeight;

        const age = this.estimateAge(keypoints, faceHeight, relativeMouthPosition);
        const gender = this.estimateGender(keypoints, aspectRatio);
        const emotion = this.estimateEmotion(keypoints);

        return { age, gender, emotion };
    }

    estimateAge(keypoints, faceHeight, relativeMouthPosition) {
        const wrinkleScore = this.calculateWrinkleIndicator(keypoints);
        let age = 20 + wrinkleScore * 30;
        
        if (relativeMouthPosition < 0.3) {
            age -= 5;
        } else if (relativeMouthPosition > 0.45) {
            age += 10;
        }
        
        return Math.round(Math.max(18, Math.min(80, age)));
    }

    estimateGender(keypoints, aspectRatio) {
        const jawWidth = Math.abs(keypoints[58].x - keypoints[288].x);
        const foreheadWidth = Math.abs(keypoints[107].x - keypoints[336].x);
        const jawToForeheadRatio = jawWidth / foreheadWidth;
        
        if (jawToForeheadRatio > 1.1) {
            return 'male';
        } else if (jawToForeheadRatio < 0.95) {
            return 'female';
        }
        return 'unknown';
    }

    estimateEmotion(keypoints) {
        const leftMouthCorner = keypoints[61];
        const rightMouthCorner = keypoints[291];
        const upperLip = keypoints[13];
        const lowerLip = keypoints[14];
        const leftEyebrowUpper = keypoints[66];
        const rightEyebrowUpper = keypoints[296];
        const leftEyeUpper = keypoints[159];
        const rightEyeUpper = keypoints[386];

        const mouthCornerY = (leftMouthCorner.y + rightMouthCorner.y) / 2;
        const mouthY = (upperLip.y + lowerLip.y) / 2;
        const smileScore = mouthY - mouthCornerY;

        const eyebrowHeight = (leftEyebrowUpper.y - leftEyeUpper.y + rightEyebrowUpper.y - rightEyeUpper.y) / 2;

        const mouthOpen = lowerLip.y - upperLip.y;

        if (smileScore < -5 && mouthOpen > 5) {
            return 'happy';
        } else if (eyebrowHeight > 15) {
            return 'surprised';
        } else if (mouthOpen > 20 && eyebrowHeight > 10) {
            return 'shocked';
        } else if (smileScore > 3) {
            return 'sad';
        } else if (mouthOpen > 10 && eyebrowHeight < 5) {
            return 'angry';
        }
        return 'neutral';
    }

    calculateWrinkleIndicator(keypoints) {
        const foreheadPoints = [10, 338, 297, 332, 284, 251, 389, 356, 454];
        let variance = 0;
        let meanY = 0;
        
        foreheadPoints.forEach(idx => {
            if (keypoints[idx]) meanY += keypoints[idx].y;
        });
        meanY /= foreheadPoints.length;
        
        foreheadPoints.forEach(idx => {
            if (keypoints[idx]) variance += Math.pow(keypoints[idx].y - meanY, 2);
        });
        
        return Math.min(1, variance / 1000);
    }

    shouldSkipDetection() {
        if (this.consecutiveSkips >= this.maxConsecutiveSkips) {
            return false;
        }

        if (this.lastCachedFaces.length === 0) {
            return false;
        }

        if (this.lastDetectionTime > this.skipThreshold && this.consecutiveSkips < 1) {
            return true;
        }

        if (this.frameCount % this.detectionInterval !== 0) {
            return true;
        }

        return false;
    }

    smoothInterpolateFaces(currentFaces, previousFaces) {
        if (previousFaces.length === 0 || currentFaces.length === 0) {
            return currentFaces;
        }

        return currentFaces.map((face, i) => {
            const prevFace = previousFaces[i] || face;
            return {
                ...face,
                x: this.lerp(prevFace.x, face.x, this.interpolationAlpha),
                y: this.lerp(prevFace.y, face.y, this.interpolationAlpha),
                width: this.lerp(prevFace.width, face.width, this.interpolationAlpha),
                height: this.lerp(prevFace.height, face.height, this.interpolationAlpha),
                interpolated: true,
            };
        });
    }

    lerp(a, b, alpha) {
        return a + (b - a) * alpha;
    }

    processFrameInPlace(imageData, faces, options = {}) {
        if (!this.processor) return;

        const {
            blurFaces = true,
            blurRadius = 8,
            replaceBackground = false,
        } = options;

        this.pixelBuffer.set(imageData.data);

        if (replaceBackground) {
            this.processor.replace_background_simple(this.pixelBuffer);
        }

        if (blurFaces && faces.length > 0) {
            for (const face of faces) {
                const bbox = Object.assign(new BoundingBox(), {
                    x: face.x,
                    y: face.y,
                    width: face.width,
                    height: face.height,
                });
                this.processor.blur_region(this.pixelBuffer, bbox, blurRadius);
            }
        }

        imageData.data.set(this.pixelBuffer);
    }

    updateFps() {
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastFpsUpdate >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (now - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = now;
            
            if (this.fps < 15) {
                this.detectionInterval = Math.min(this.detectionInterval + 1, 3);
                this.maxConsecutiveSkips = Math.min(this.maxConsecutiveSkips + 1, 2);
            } else if (this.fps > 28) {
                this.detectionInterval = Math.max(this.detectionInterval - 1, 1);
                this.maxConsecutiveSkips = Math.max(this.maxConsecutiveSkips - 1, 0);
            }
        }
        return this.fps;
    }

    getFps() {
        return this.fps;
    }

    getLastDetectionTime() {
        return this.lastDetectionTime;
    }

    getDetectionSkippedCount() {
        return this.detectionSkipped;
    }

    isUsingQuantization() {
        return this.useQuantization;
    }

    isInitialized() {
        return this.initialized;
    }

    destroy() {
        if (this.processor) {
            this.processor.free();
        }
        if (this.faceDetector) {
            this.faceDetector.dispose();
        }
        this.pixelBuffer = null;
        this.backgroundImageData = null;
        this.initialized = false;
    }
}

export default WasmVideoProcessor;
