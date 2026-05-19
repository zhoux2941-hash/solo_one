class AutoSwitcher {
    constructor(videoSourceManager, videoSwitcher) {
        this.videoSourceManager = videoSourceManager;
        this.videoSwitcher = videoSwitcher;
        this.enabled = false;
        this.analysisInterval = null;
        this.analysisFrequency = 1000;
        this.motionThreshold = 15;
        this.audioThreshold = 30;
        this.motionWeight = 0.6;
        this.audioWeight = 0.4;
        this.minSwitchInterval = 3000;
        this.lastSwitchTime = 0;
        this.sourceMetrics = new Map();
        this.analysisCanvas = null;
        this.analysisCtx = null;
        
        this.onAutoSwitch = null;
        this.onMetricsUpdate = null;
    }

    enable() {
        if (this.enabled) return;
        this.enabled = true;
        this.startAnalysis();
    }

    disable() {
        this.enabled = false;
        this.stopAnalysis();
    }

    toggle() {
        if (this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
        return this.enabled;
    }

    startAnalysis() {
        this.analysisCanvas = document.createElement('canvas');
        this.analysisCanvas.width = 160;
        this.analysisCanvas.height = 90;
        this.analysisCtx = this.analysisCanvas.getContext('2d', { willReadFrequently: true });

        this.analysisInterval = setInterval(() => {
            this.analyzeSources();
        }, this.analysisFrequency);
    }

    stopAnalysis() {
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
        }
        this.analysisCanvas = null;
        this.analysisCtx = null;
    }

    async analyzeSources() {
        if (!this.enabled) return;

        const sources = this.videoSourceManager.getAllSources();
        if (sources.length < 2) return;

        const metrics = [];

        for (const source of sources) {
            const motionLevel = await this.analyzeMotion(source);
            const audioLevel = this.analyzeAudio(source);
            
            const score = motionLevel * this.motionWeight + audioLevel * this.audioWeight;
            
            metrics.push({
                sourceId: source.id,
                source: source,
                motionLevel,
                audioLevel,
                score
            });

            this.sourceMetrics.set(source.id, { motionLevel, audioLevel, score });
        }

        if (this.onMetricsUpdate) {
            this.onMetricsUpdate(metrics);
        }

        metrics.sort((a, b) => b.score - a.score);

        const currentSource = this.videoSwitcher.getCurrentSource();
        const topSource = metrics[0];

        if (topSource && topSource.sourceId !== currentSource?.id) {
            const now = Date.now();
            const currentScore = currentSource ? 
                (this.sourceMetrics.get(currentSource.id)?.score || 0) : 0;
            const scoreDiff = topSource.score - currentScore;

            if (now - this.lastSwitchTime >= this.minSwitchInterval && 
                scoreDiff > 10 && 
                topSource.score > this.motionThreshold) {
                this.switchToSource(topSource.source);
            }
        }
    }

    async analyzeMotion(source) {
        if (!source || !source.videoElement || !this.analysisCtx) {
            return 0;
        }

        const video = source.videoElement;
        if (video.readyState < 2) return 0;

        try {
            this.analysisCtx.drawImage(video, 0, 0, 160, 90);
            const imageData = this.analysisCtx.getImageData(0, 0, 160, 90);
            const pixels = imageData.data;

            if (!source.lastFrameData) {
                source.lastFrameData = new Uint8ClampedArray(pixels);
                return 0;
            }

            let motion = 0;
            const step = 4;
            
            for (let i = 0; i < pixels.length; i += step * 4) {
                const r1 = pixels[i];
                const g1 = pixels[i + 1];
                const b1 = pixels[i + 2];
                const r2 = source.lastFrameData[i];
                const g2 = source.lastFrameData[i + 1];
                const b2 = source.lastFrameData[i + 2];

                const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
                motion += diff;
            }

            source.lastFrameData = new Uint8ClampedArray(pixels);
            
            const normalizedMotion = (motion / (160 * 90 / step)) * 10;
            return Math.min(normalizedMotion, 100);
        } catch (e) {
            return 0;
        }
    }

    analyzeAudio(source) {
        if (!source || !source.stream) return 0;

        const audioTracks = source.stream.getAudioTracks();
        if (audioTracks.length === 0) return 0;

        if (!source.audioAnalyzer) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const analyser = audioContext.createAnalyser();
                const sourceNode = audioContext.createMediaStreamSource(source.stream);
                sourceNode.connect(analyser);
                analyser.fftSize = 256;
                
                source.audioAnalyzer = {
                    analyser,
                    audioContext,
                    dataArray: new Uint8Array(analyser.frequencyBinCount)
                };
            } catch (e) {
                return 0;
            }
        }

        try {
            const { analyser, dataArray } = source.audioAnalyzer;
            analyser.getByteFrequencyData(dataArray);
            
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            
            const average = sum / dataArray.length;
            return Math.min((average / 255) * 100, 100);
        } catch (e) {
            return 0;
        }
    }

    switchToSource(source) {
        this.videoSwitcher.setSource(source);
        this.lastSwitchTime = Date.now();
        
        if (this.onAutoSwitch) {
            this.onAutoSwitch(source);
        }
    }

    setMotionThreshold(value) {
        this.motionThreshold = value;
    }

    setAudioThreshold(value) {
        this.audioThreshold = value;
    }

    setMotionWeight(value) {
        this.motionWeight = value;
        this.audioWeight = 1 - value;
    }

    setMinSwitchInterval(ms) {
        this.minSwitchInterval = ms;
    }

    getSourceMetrics(sourceId) {
        return this.sourceMetrics.get(sourceId) || { motionLevel: 0, audioLevel: 0, score: 0 };
    }

    isEnabled() {
        return this.enabled;
    }

    destroy() {
        this.disable();
        this.sourceMetrics.clear();
    }
}

window.AutoSwitcher = AutoSwitcher;
