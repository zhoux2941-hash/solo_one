import { WasmVideoProcessor } from './videoProcessor.js';

class VideoApp {
    constructor() {
        this.videoProcessor = null;
        this.videoElement = document.getElementById('source-video');
        this.canvas = document.getElementById('output-canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.isRunning = false;
        this.animationId = null;
        
        this.options = {
            blurFaces: true,
            blurRadius: 8,
            replaceBackground: false,
            useQuantization: false,
            showAttributes: true,
        };
        
        this.faces = [];
        this.frameCount = 0;
        this.currentImageData = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.startCamera();
        await this.initVideoProcessor();
        this.hideLoading();
        this.startProcessing();
    }

    setupEventListeners() {
        document.getElementById('blur-toggle').addEventListener('change', (e) => {
            this.options.blurFaces = e.target.checked;
        });

        document.getElementById('blur-radius').addEventListener('input', (e) => {
            this.options.blurRadius = parseInt(e.target.value);
            document.getElementById('blur-value').textContent = e.target.value;
        });

        document.getElementById('bg-toggle').addEventListener('change', (e) => {
            this.options.replaceBackground = e.target.checked;
        });

        document.getElementById('bg-color').addEventListener('input', (e) => {
            const color = this.hexToRgb(e.target.value);
            if (this.videoProcessor) {
                this.videoProcessor.setBackgroundColor(color.r, color.g, color.b);
            }
        });

        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const hexColor = btn.dataset.color;
                document.getElementById('bg-color').value = hexColor;
                const color = this.hexToRgb(hexColor);
                if (this.videoProcessor) {
                    this.videoProcessor.setBackgroundColor(color.r, color.g, color.b);
                }
            });
        });

        document.getElementById('bg-image').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && this.videoProcessor) {
                this.loadBackgroundImage(file);
            }
        });

        document.getElementById('resolution-select').addEventListener('change', (e) => {
            const [width, height] = e.target.value.split('x').map(Number);
            this.changeResolution(width, height);
        });

        document.getElementById('quantization-toggle').addEventListener('change', (e) => {
            this.options.useQuantization = e.target.checked;
            console.log(`WebGL优化模式: ${this.options.useQuantization ? '开启' : '关闭'}`);
            if (this.videoProcessor) {
                alert('更改此设置需要刷新页面生效');
            }
        });

        document.getElementById('attributes-toggle').addEventListener('change', (e) => {
            this.options.showAttributes = e.target.checked;
        });
    }

    async startCamera() {
        const resolution = document.getElementById('resolution-select').value;
        const [width, height] = resolution.split('x').map(Number);

        try {
            const constraints = {
                video: {
                    width: { ideal: width },
                    height: { ideal: height },
                    facingMode: 'user',
                },
                audio: false,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = stream;

            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play();
                    resolve();
                };
            });

            const actualWidth = this.videoElement.videoWidth;
            const actualHeight = this.videoElement.videoHeight;
            
            this.canvas.width = actualWidth;
            this.canvas.height = actualHeight;
            
            this.currentImageData = this.ctx.createImageData(actualWidth, actualHeight);

            document.getElementById('status-resolution').textContent = `${actualWidth}×${actualHeight}`;
            
            console.log(`摄像头已启动: ${actualWidth}×${actualHeight}`);
        } catch (error) {
            console.error('无法访问摄像头:', error);
            alert('无法访问摄像头，请确保已授予权限。');
            throw error;
        }
    }

    async changeResolution(width, height) {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        const stream = this.videoElement.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        try {
            const constraints = {
                video: {
                    width: { ideal: width },
                    height: { ideal: height },
                    facingMode: 'user',
                },
                audio: false,
            };

            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = newStream;

            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play();
                    resolve();
                };
            });

            const actualWidth = this.videoElement.videoWidth;
            const actualHeight = this.videoElement.videoHeight;
            
            this.canvas.width = actualWidth;
            this.canvas.height = actualHeight;
            this.currentImageData = this.ctx.createImageData(actualWidth, actualHeight);

            document.getElementById('status-resolution').textContent = `${actualWidth}×${actualHeight}`;

            if (this.videoProcessor) {
                this.videoProcessor.destroy();
            }
            
            const numThreads = navigator.hardwareConcurrency || 4;
            this.videoProcessor = new WasmVideoProcessor();
            await this.videoProcessor.init(actualWidth, actualHeight, numThreads, {
                useQuantization: this.options.useQuantization,
            });

            const bgColor = this.hexToRgb(document.getElementById('bg-color').value);
            this.videoProcessor.setBackgroundColor(bgColor.r, bgColor.g, bgColor.b);

            this.updatePerformanceStatus();
            this.startProcessing();
        } catch (error) {
            console.error('分辨率更改失败:', error);
        }
    }

    async initVideoProcessor() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const numThreads = navigator.hardwareConcurrency || 4;

        this.videoProcessor = new WasmVideoProcessor();
        await this.videoProcessor.init(width, height, numThreads, {
            useQuantization: this.options.useQuantization,
        });

        const bgColor = this.hexToRgb(document.getElementById('bg-color').value);
        this.videoProcessor.setBackgroundColor(bgColor.r, bgColor.g, bgColor.b);

        document.getElementById('status-threads').textContent = numThreads;
        document.getElementById('status-model').textContent = '已就绪';

        this.updatePerformanceStatus();
    }

    updatePerformanceStatus() {
        if (!this.videoProcessor) return;

        const usingQuant = this.videoProcessor.isUsingQuantization();
        document.getElementById('status-quantization').textContent = usingQuant ? '已开启' : '已关闭';
    }

    async loadBackgroundImage(file) {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        
        this.videoProcessor.setBackgroundImage(imageData);
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    async startProcessing() {
        this.isRunning = true;
        this.processLoop();
    }

    async processLoop() {
        if (!this.isRunning) return;

        this.ctx.drawImage(this.videoElement, 0, 0);
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        if (this.videoProcessor && this.videoProcessor.isInitialized()) {
            if (this.options.blurFaces) {
                this.faces = await this.videoProcessor.detectFaces(this.videoElement);
                document.getElementById('status-faces').textContent = this.faces.length;
            } else {
                this.faces = [];
            }

            this.videoProcessor.processFrameInPlace(imageData, this.faces, this.options);
            
            this.ctx.putImageData(imageData, 0, 0);

            if (this.options.showAttributes && this.faces.length > 0) {
                this.drawFaceAttributes(this.faces);
            }

            const fps = this.videoProcessor.updateFps();
            document.getElementById('fps-counter').textContent = `FPS: ${fps}`;

            if (this.frameCount % 30 === 0) {
                this.updatePerformanceStats();
            }
        }

        this.frameCount++;

        this.animationId = requestAnimationFrame(() => this.processLoop());
    }

    drawFaceAttributes(faces) {
        this.ctx.save();
        this.ctx.font = '14px Arial';
        this.ctx.textBaseline = 'top';

        for (const face of faces) {
            const x = face.x;
            const y = face.y;
            const width = face.width;
            const height = face.height;

            this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, width, height);

            if (face.attributes) {
                const attr = face.attributes;
                const labelY = y - 50;
                
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(x - 2, labelY - 2, 110, 48);
                
                this.ctx.fillStyle = '#00ff88';
                this.ctx.fillText(`年龄: ${attr.age}岁`, x, labelY);
                
                const genderText = attr.gender === 'male' ? '性别: 男' : 
                                   attr.gender === 'female' ? '性别: 女' : '性别: 未知';
                this.ctx.fillText(genderText, x, labelY + 16);
                
                const emotionEmoji = this.getEmotionEmoji(attr.emotion);
                const emotionText = this.getEmotionText(attr.emotion);
                this.ctx.fillText(`情绪: ${emotionText} ${emotionEmoji}`, x, labelY + 32);
            }
        }
        
        this.ctx.restore();
    }

    getEmotionEmoji(emotion) {
        const emojis = {
            'happy': '😊',
            'sad': '😢',
            'angry': '😠',
            'surprised': '😲',
            'shocked': '😱',
            'neutral': '😐',
        };
        return emojis[emotion] || '😐';
    }

    getEmotionText(emotion) {
        const texts = {
            'happy': '开心',
            'sad': '难过',
            'angry': '生气',
            'surprised': '惊讶',
            'shocked': '震惊',
            'neutral': '中性',
        };
        return texts[emotion] || '中性';
    }

    updatePerformanceStats() {
        if (!this.videoProcessor) return;

        const detectionTime = this.videoProcessor.getLastDetectionTime();
        const skippedCount = this.videoProcessor.getDetectionSkippedCount();

        document.getElementById('status-detection-time').textContent = detectionTime.toFixed(1) + 'ms';
        document.getElementById('status-skipped').textContent = skippedCount;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        } : { r: 0, g: 255, b: 136 };
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.videoProcessor) {
            this.videoProcessor.destroy();
        }
        this.currentImageData = null;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new VideoApp();
});

window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.stop();
    }
});
