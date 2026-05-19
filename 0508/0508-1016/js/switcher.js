class VideoSwitcher {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.currentSource = null;
        this.nextSource = null;
        this.isTransitioning = false;
        this.transitionEnabled = true;
        this.transitionDuration = 500;
        this.transitionStartTime = 0;
        this.animationId = null;
        this.outputWidth = 1280;
        this.outputHeight = 720;
        this.lastDrawnFrame = null;
        
        this.onSourceChanged = null;
        this.onTransitionStart = null;
        this.onTransitionEnd = null;
        
        this.initCanvas();
    }

    initCanvas() {
        this.canvas.width = this.outputWidth;
        this.canvas.height = this.outputHeight;
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.outputWidth, this.outputHeight);
        this.startRenderLoop();
    }

    setOutputSize(width, height) {
        this.outputWidth = width;
        this.outputHeight = height;
        this.canvas.width = width;
        this.canvas.height = height;
    }

    setSource(source) {
        if (!source || !source.stream) return;

        this.prepareSourceVideo(source);

        if (this.isTransitioning && this.transitionEnabled) {
            this.nextSource = source;
            return;
        }

        if (this.transitionEnabled && this.currentSource && this.currentSource.id !== source.id) {
            this.startTransition(source);
        } else {
            this.currentSource = source;
            if (this.onSourceChanged) {
                this.onSourceChanged(source);
            }
        }
    }

    startTransition(newSource) {
        if (this.isTransitioning) return;

        this.prepareSourceVideo(newSource);
        
        this.isTransitioning = true;
        this.nextSource = newSource;
        this.transitionStartTime = performance.now();

        if (this.onTransitionStart) {
            this.onTransitionStart();
        }
    }

    updateTransition(timestamp) {
        if (!this.isTransitioning || !this.nextSource) return;

        const elapsed = timestamp - this.transitionStartTime;
        const progress = Math.min(elapsed / this.transitionDuration, 1);
        const easedProgress = this.easeInOutCubic(progress);

        const nextReady = this.nextSource.videoElement && 
                          this.nextSource.videoElement.readyState >= 2;

        if (nextReady || progress > 0.3) {
            this.ctx.globalAlpha = 1;
            this.drawSource(this.nextSource);
            
            if (progress < 1) {
                this.ctx.globalAlpha = 1 - easedProgress;
                this.drawSource(this.currentSource);
            }
        } else {
            this.ctx.globalAlpha = 1;
            this.drawSource(this.currentSource);
        }
        
        this.ctx.globalAlpha = 1;

        if (progress >= 1) {
            this.currentSource = this.nextSource;
            this.nextSource = null;
            this.isTransitioning = false;
            
            if (this.onSourceChanged) {
                this.onSourceChanged(this.currentSource);
            }
            if (this.onTransitionEnd) {
                this.onTransitionEnd();
            }
        }
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    prepareSourceVideo(source) {
        if (!source || !source.stream) return;
        
        if (!source.videoElement) {
            source.videoElement = document.createElement('video');
            source.videoElement.srcObject = source.stream;
            source.videoElement.autoplay = true;
            source.videoElement.muted = true;
            source.videoElement.playsInline = true;
            source.videoElement.style.display = 'none';
            document.body.appendChild(source.videoElement);
        }
        
        if (source.videoElement.paused) {
            source.videoElement.play().catch(() => {});
        }
    }

    drawSource(source) {
        if (!source || !source.stream) return false;

        const videoTrack = source.stream.getVideoTracks()[0];
        if (!videoTrack) return false;

        this.prepareSourceVideo(source);

        if (source.videoElement.readyState >= 2) {
            const videoWidth = source.videoElement.videoWidth;
            const videoHeight = source.videoElement.videoHeight;
            
            if (videoWidth > 0 && videoHeight > 0) {
                const scale = Math.max(
                    this.outputWidth / videoWidth,
                    this.outputHeight / videoHeight
                );
                const drawWidth = videoWidth * scale;
                const drawHeight = videoHeight * scale;
                const x = (this.outputWidth - drawWidth) / 2;
                const y = (this.outputHeight - drawHeight) / 2;
                
                this.ctx.drawImage(
                    source.videoElement,
                    x, y, drawWidth, drawHeight
                );
                return true;
            }
        }
        return false;
    }

    startRenderLoop() {
        const render = (timestamp) => {
            if (this.isTransitioning) {
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(0, 0, this.outputWidth, this.outputHeight);
                this.updateTransition(timestamp);
            } else if (this.currentSource) {
                this.ctx.globalAlpha = 1;
                const drawn = this.drawSource(this.currentSource);
                if (!drawn && this.lastDrawnFrame) {
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillRect(0, 0, this.outputWidth, this.outputHeight);
                    this.ctx.putImageData(this.lastDrawnFrame, 0, 0);
                } else if (drawn) {
                    try {
                        this.lastDrawnFrame = this.ctx.getImageData(0, 0, this.outputWidth, this.outputHeight);
                    } catch (e) {}
                }
            } else {
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(0, 0, this.outputWidth, this.outputHeight);
            }
            
            this.animationId = requestAnimationFrame(render);
        };
        
        this.animationId = requestAnimationFrame(render);
    }

    getOutputStream() {
        const canvasStream = this.canvas.captureStream(30);
        
        if (this.currentSource && this.currentSource.stream) {
            const audioTracks = this.currentSource.stream.getAudioTracks();
            if (audioTracks.length > 0) {
                canvasStream.addTrack(audioTracks[0]);
            }
        }
        
        return canvasStream;
    }

    getCurrentSource() {
        return this.currentSource;
    }

    setTransitionEnabled(enabled) {
        this.transitionEnabled = enabled;
    }

    setTransitionDuration(duration) {
        this.transitionDuration = duration;
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

window.VideoSwitcher = VideoSwitcher;
