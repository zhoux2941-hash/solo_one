class LiveStreamer {
    constructor() {
        this.mediaStream = null;
        this.videoEncoder = null;
        this.audioEncoder = null;
        this.videoTrack = null;
        this.audioTrack = null;
        this.videoProcessor = null;
        this.audioProcessor = null;
        this.videoTrackReader = null;
        
        this.streamTargets = new Map();
        
        this.isStreaming = false;
        this.stats = {
            videoBytes: 0,
            audioBytes: 0,
            videoBitrate: 0,
            audioBitrate: 0,
            fps: 0,
            frameCount: 0,
            droppedFrames: 0,
            encodeQueueSize: 0
        };
        this.platformStats = new Map();
        this.lastStatsTime = Date.now();
        this.bitrateHistory = [];
        this.chart = null;
        this.regionSelection = {
            active: false,
            x: 0, y: 0,
            width: 0, height: 0
        };
        this.cropCanvas = document.getElementById('cropCanvas');
        this.cropCtx = this.cropCanvas.getContext('2d', { 
            willReadFrequently: false,
            alpha: false
        });
        this.lastFrameTimestamp = 0;
        this.baseTimestamp = 0;
        this.frameDuration = 0;
        this.maxQueueSize = 4;
        this.forceKeyframeInterval = 60;
        this.frameSinceKeyframe = 0;
        
        this.initElements();
        this.initEventListeners();
        this.initChart();
        this.initPlatformStats();
        this.log('info', 'WebCodecs 直播推流工具已就绪');
        this.checkWebCodecsSupport();
    }

    initPlatformStats() {
        this.platformStats.set('custom', { bytesSent: 0, bitrate: 0 });
        this.platformStats.set('bilibili', { bytesSent: 0, bitrate: 0 });
    }

    initElements() {
        this.previewVideo = document.getElementById('previewVideo');
        this.previewPlaceholder = document.getElementById('previewPlaceholder');
        this.regionSelector = document.getElementById('regionSelector');
        this.selectionBox = this.regionSelector.querySelector('.selection-box');
        
        this.selectSourceBtn = document.getElementById('selectSource');
        this.connectAllBtn = document.getElementById('connectAllBtn');
        this.disconnectAllBtn = document.getElementById('disconnectAllBtn');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.clearLogBtn = document.getElementById('clearLog');
        
        this.captureModeSelect = document.getElementById('captureMode');
        this.resolutionSelect = document.getElementById('resolution');
        this.customResolutionDiv = document.getElementById('customResolution');
        this.framerateSelect = document.getElementById('framerate');
        this.bitrateSlider = document.getElementById('bitrate');
        this.bitrateValue = document.getElementById('bitrateValue');
        this.presetSelect = document.getElementById('preset');
        this.audioBitrateSelect = document.getElementById('audioBitrate');
        this.sampleRateSelect = document.getElementById('sampleRate');
        this.customWidthInput = document.getElementById('customWidth');
        this.customHeightInput = document.getElementById('customHeight');
        
        this.enableCustom = document.getElementById('enableCustom');
        this.wsServerCustom = document.getElementById('wsServerCustom');
        this.streamKeyCustom = document.getElementById('streamKeyCustom');
        this.statusCustom = document.getElementById('statusCustom');
        
        this.enableBilibili = document.getElementById('enableBilibili');
        this.bilibiliServer = document.getElementById('bilibiliServer');
        this.bilibiliRtmpUrl = document.getElementById('bilibiliRtmpUrl');
        this.bilibiliStreamKey = document.getElementById('bilibiliStreamKey');
        this.statusBilibili = document.getElementById('statusBilibili');
        
        this.sourceInfo = document.getElementById('sourceInfo');
        this.statusDot = document.getElementById('connectionStatus');
        this.statusText = document.getElementById('statusText');
        this.logOutput = document.getElementById('logOutput');
        
        this.resolutionStat = document.getElementById('resolutionStat');
        this.fpsStat = document.getElementById('fpsStat');
        this.videoBitrateStat = document.getElementById('videoBitrateStat');
        this.audioBitrateStat = document.getElementById('audioBitrateStat');
        this.totalBitrateStat = document.getElementById('totalBitrateStat');
        this.cpuStat = document.getElementById('cpuStat');
    }

    initEventListeners() {
        this.selectSourceBtn.addEventListener('click', () => this.selectSource());
        this.connectAllBtn.addEventListener('click', () => this.connectAll());
        this.disconnectAllBtn.addEventListener('click', () => this.disconnectAll());
        this.startBtn.addEventListener('click', () => this.startStreaming());
        this.stopBtn.addEventListener('click', () => this.stopStreaming());
        this.clearLogBtn.addEventListener('click', () => this.clearLog());
        
        this.bitrateSlider.addEventListener('input', (e) => {
            this.bitrateValue.textContent = e.target.value;
        });
        
        this.resolutionSelect.addEventListener('change', (e) => {
            this.customResolutionDiv.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });
        
        this.initRegionSelector();
    }

    initRegionSelector() {
        let isDragging = false;
        let isResizing = false;
        let startX, startY;
        let startRect;
        let currentHandle = null;

        const updateSelectionBox = () => {
            this.selectionBox.style.left = this.regionSelection.x + 'px';
            this.selectionBox.style.top = this.regionSelection.y + 'px';
            this.selectionBox.style.width = this.regionSelection.width + 'px';
            this.selectionBox.style.height = this.regionSelection.height + 'px';
        };

        this.regionSelector.addEventListener('mousedown', (e) => {
            if (e.target === this.regionSelector) {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                const rect = this.regionSelector.getBoundingClientRect();
                this.regionSelection.x = startX - rect.left;
                this.regionSelection.y = startY - rect.top;
                this.regionSelection.width = 0;
                this.regionSelection.height = 0;
            }
        });

        this.regionSelector.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const rect = this.regionSelector.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            this.regionSelection.width = Math.abs(currentX - this.regionSelection.x);
            this.regionSelection.height = Math.abs(currentY - this.regionSelection.y);
            if (currentX < this.regionSelection.x) {
                const temp = this.regionSelection.x;
                this.regionSelection.x = currentX;
                this.regionSelection.width = temp - currentX;
            }
            if (currentY < this.regionSelection.y) {
                const temp = this.regionSelection.y;
                this.regionSelection.y = currentY;
                this.regionSelection.height = temp - currentY;
            }
            updateSelectionBox();
        });

        this.regionSelector.addEventListener('mouseup', () => {
            isDragging = false;
            if (this.regionSelection.width > 50 && this.regionSelection.height > 50) {
                this.log('info', `区域选择: ${Math.round(this.regionSelection.width)}x${Math.round(this.regionSelection.height)}`);
            }
        });

        document.querySelectorAll('.handle').forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                isResizing = true;
                currentHandle = e.target.className.split(' ')[1];
                startX = e.clientX;
                startY = e.clientY;
                startRect = {
                    x: this.regionSelection.x,
                    y: this.regionSelection.y,
                    width: this.regionSelection.width,
                    height: this.regionSelection.height
                };
            });
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            switch (currentHandle) {
                case 'handle-se':
                    this.regionSelection.width = Math.max(50, startRect.width + dx);
                    this.regionSelection.height = Math.max(50, startRect.height + dy);
                    break;
                case 'handle-sw':
                    this.regionSelection.x = startRect.x + dx;
                    this.regionSelection.width = Math.max(50, startRect.width - dx);
                    this.regionSelection.height = Math.max(50, startRect.height + dy);
                    break;
                case 'handle-ne':
                    this.regionSelection.y = startRect.y + dy;
                    this.regionSelection.width = Math.max(50, startRect.width + dx);
                    this.regionSelection.height = Math.max(50, startRect.height - dy);
                    break;
                case 'handle-nw':
                    this.regionSelection.x = startRect.x + dx;
                    this.regionSelection.y = startRect.y + dy;
                    this.regionSelection.width = Math.max(50, startRect.width - dx);
                    this.regionSelection.height = Math.max(50, startRect.height - dy);
                    break;
                case 'handle-n':
                    this.regionSelection.y = startRect.y + dy;
                    this.regionSelection.height = Math.max(50, startRect.height - dy);
                    break;
                case 'handle-s':
                    this.regionSelection.height = Math.max(50, startRect.height + dy);
                    break;
                case 'handle-w':
                    this.regionSelection.x = startRect.x + dx;
                    this.regionSelection.width = Math.max(50, startRect.width - dx);
                    break;
                case 'handle-e':
                    this.regionSelection.width = Math.max(50, startRect.width + dx);
                    break;
            }
            updateSelectionBox();
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            currentHandle = null;
        });
    }

    initChart() {
        const ctx = document.getElementById('bitrateChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '视频码率 (kbps)',
                    data: [],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: '总码率 (kbps)',
                    data: [],
                    borderColor: '#7b2ff7',
                    backgroundColor: 'rgba(123, 47, 247, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#a0a0a0'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#e0e0e0'
                        }
                    }
                },
                animation: false
            }
        });

        setInterval(() => this.updateStats(), 1000);
    }

    checkWebCodecsSupport() {
        if (!('VideoEncoder' in window)) {
            this.log('error', '浏览器不支持 WebCodecs VideoEncoder');
            return false;
        }
        if (!('AudioEncoder' in window)) {
            this.log('warning', '浏览器不支持 WebCodecs AudioEncoder，将使用原始音频');
        }
        this.log('success', 'WebCodecs API 已就绪');
        return true;
    }

    async selectSource() {
        try {
            const displayMediaOptions = {
                video: {
                    cursor: 'always',
                    displaySurface: 'monitor'
                },
                audio: true
            };

            this.mediaStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
            
            this.videoTrack = this.mediaStream.getVideoTracks()[0];
            this.audioTrack = this.mediaStream.getAudioTracks()[0];

            const settings = this.videoTrack.getSettings();
            this.sourceInfo.textContent = `分辨率: ${settings.width}x${settings.height}`;
            this.log('success', `采集源已选择: ${settings.width}x${settings.height} @ ${settings.frameRate}fps`);

            this.previewVideo.srcObject = this.mediaStream;
            this.previewPlaceholder.style.display = 'none';

            const captureMode = this.captureModeSelect.value;
            if (captureMode === 'region') {
                this.regionSelector.style.display = 'block';
                this.regionSelection.active = true;
                setTimeout(() => {
                    const rect = this.previewVideo.getBoundingClientRect();
                    this.regionSelection.x = rect.width * 0.1;
                    this.regionSelection.y = rect.height * 0.1;
                    this.regionSelection.width = rect.width * 0.8;
                    this.regionSelection.height = rect.height * 0.8;
                    this.selectionBox.style.left = this.regionSelection.x + 'px';
                    this.selectionBox.style.top = this.regionSelection.y + 'px';
                    this.selectionBox.style.width = this.regionSelection.width + 'px';
                    this.selectionBox.style.height = this.regionSelection.height + 'px';
                }, 100);
            } else {
                this.regionSelector.style.display = 'none';
                this.regionSelection.active = false;
            }

            this.startBtn.disabled = false;

            this.videoTrack.addEventListener('ended', () => {
                this.log('warning', '采集已停止');
                this.stopStreaming();
                this.startBtn.disabled = true;
            });

        } catch (err) {
            this.log('error', `选择采集源失败: ${err.message}`);
        }
    }

    connectAll() {
        const promises = [];

        if (this.enableCustom.checked) {
            promises.push(this.connectPlatform('custom', this.wsServerCustom.value, this.streamKeyCustom.value));
        }

        if (this.enableBilibili.checked) {
            const fullUrl = this.bilibiliServer.value;
            const rtmpUrl = this.bilibiliRtmpUrl.value;
            const streamKey = this.bilibiliStreamKey.value;
            promises.push(this.connectPlatform('bilibili', fullUrl, streamKey, { rtmpUrl }));
        }

        Promise.allSettled(promises).then(() => {
            this.updateGlobalConnectionStatus();
        });
    }

    disconnectAll() {
        this.streamTargets.forEach((ws, platform) => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        });
        this.streamTargets.clear();
        this.updatePlatformStatus('custom', 'disconnected');
        this.updatePlatformStatus('bilibili', 'disconnected');
        this.updateGlobalConnectionStatus();
        this.log('info', '已断开所有连接');
    }

    connectPlatform(platformName, serverUrl, streamKey, extraConfig = {}) {
        return new Promise((resolve, reject) => {
            if (!serverUrl) {
                this.log('error', `${platformName}: 请输入服务器地址`);
                reject(new Error('No server URL'));
                return;
            }

            this.updatePlatformStatus(platformName, 'connecting');
            this.log('info', `${platformName}: 正在连接...`);

            try {
                const ws = new WebSocket(serverUrl);
                ws.binaryType = 'arraybuffer';

                ws.onopen = () => {
                    this.streamTargets.set(platformName, ws);
                    this.updatePlatformStatus(platformName, 'connected');
                    this.log('success', `${platformName}: 已连接`);

                    if (streamKey || extraConfig) {
                        const handshake = JSON.stringify({
                            action: 'handshake',
                            streamKey: streamKey,
                            ...extraConfig
                        });
                        ws.send(handshake);
                    }

                    resolve(ws);
                };

                ws.onclose = () => {
                    this.streamTargets.delete(platformName);
                    this.updatePlatformStatus(platformName, 'disconnected');
                    this.log('info', `${platformName}: 连接已断开`);
                    this.updateGlobalConnectionStatus();
                };

                ws.onerror = (err) => {
                    this.updatePlatformStatus(platformName, 'disconnected');
                    this.log('error', `${platformName}: 连接错误`);
                    reject(err);
                };

            } catch (err) {
                this.updatePlatformStatus(platformName, 'disconnected');
                this.log('error', `${platformName}: 连接失败 - ${err.message}`);
                reject(err);
            }
        });
    }

    updatePlatformStatus(platformName, status) {
        const statusElement = platformName === 'custom' ? this.statusCustom : this.statusBilibili;
        if (!statusElement) return;

        const indicator = statusElement.querySelector('.status-indicator');
        const text = statusElement.querySelector('span:last-child');

        if (indicator) {
            indicator.className = `status-indicator ${status}`;
        }
        if (text) {
            const statusTexts = {
                'connecting': '连接中...',
                'connected': '已连接',
                'disconnected': '未连接'
            };
            text.textContent = statusTexts[status] || status;
        }

        const multiStatsSection = document.querySelector(`.platform-stat[data-platform="${platformName}"]`);
        if (multiStatsSection) {
            const multiStatIndicator = multiStatsSection.querySelector('.platform-stat-name .status-indicator');
            if (multiStatIndicator) {
                multiStatIndicator.className = `status-indicator ${status}`;
            }
        }
    }

    updateGlobalConnectionStatus() {
        const connectedCount = this.streamTargets.size;
        
        if (connectedCount > 0) {
            this.statusDot.className = 'status-dot connected';
            this.statusText.textContent = `已连接 ${connectedCount} 个平台`;
        } else {
            this.statusDot.className = 'status-dot disconnected';
            this.statusText.textContent = '未连接';
        }
    }

    getResolution() {
        const value = this.resolutionSelect.value;
        if (value === 'custom') {
            return {
                width: parseInt(this.customWidthInput.value) || 1920,
                height: parseInt(this.customHeightInput.value) || 1080
            };
        }
        const [width, height] = value.split('x').map(Number);
        return { width, height };
    }

    async startStreaming() {
        if (!this.videoTrack) {
            this.log('error', '请先选择采集源');
            return;
        }

        if (this.streamTargets.size === 0) {
            this.log('warning', '未连接任何服务器，仅本地编码测试');
        } else {
            this.log('info', `将推流到 ${this.streamTargets.size} 个平台`);
        }

        try {
            const resolution = this.getResolution();
            const framerate = parseInt(this.framerateSelect.value);
            const bitrate = parseInt(this.bitrateSlider.value) * 1000;
            const useHardware = this.presetSelect.value === 'hardware';

            this.cropCanvas.width = resolution.width;
            this.cropCanvas.height = resolution.height;

            await this.initVideoEncoder(resolution, framerate, bitrate, useHardware);
            await this.initAudioEncoder();

            this.startVideoProcessing(resolution, framerate);
            if (this.audioTrack) {
                this.startAudioProcessing();
            }

            this.isStreaming = true;
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.statusDot.className = 'status-dot streaming';
            this.statusText.textContent = '推流中';

            this.log('success', `开始推流: ${resolution.width}x${resolution.height} @ ${framerate}fps, ${bitrate/1000}kbps`);

        } catch (err) {
            this.log('error', `启动推流失败: ${err.message}`);
            console.error(err);
        }
    }

    async initVideoEncoder(resolution, framerate, bitrate, useHardware) {
        this.frameDuration = Math.round(1000000 / framerate);
        
        const config = {
            codec: 'avc1.420028',
            width: resolution.width,
            height: resolution.height,
            bitrate: bitrate,
            framerate: framerate,
            hardwareAcceleration: useHardware ? 'prefer-hardware' : 'prefer-software',
            latencyMode: 'realtime',
            contentHint: 'screen',
            avc: {
                format: 'annexb'
            }
        };

        let finalConfig = config;
        try {
            const support = await VideoEncoder.isConfigSupported(config);
            if (!support.supported) {
                this.log('warning', '当前配置不支持，尝试替代配置');
                finalConfig = {
                    ...config,
                    codec: 'avc1.4d0032'
                };
            }
        } catch (e) {
            this.log('warning', '配置检测失败，使用默认配置');
        }

        this.videoEncoder = new VideoEncoder({
            output: (chunk, metadata) => {
                this.handleVideoChunk(chunk, metadata);
            },
            error: (err) => {
                this.log('error', `视频编码错误: ${err.message}`);
            }
        });

        try {
            await this.videoEncoder.configure(finalConfig);
            this.log('info', `视频编码器已配置: ${useHardware ? '硬件' : '软件'}加速, ${resolution.width}x${resolution.height}`);
        } catch (e) {
            this.log('error', `编码器配置失败: ${e.message}`);
            throw e;
        }
    }

    async initAudioEncoder() {
        if (!('AudioEncoder' in window) || !this.audioTrack) {
            this.log('warning', '音频编码不可用');
            return;
        }

        const sampleRate = parseInt(this.sampleRateSelect.value);
        const bitrate = parseInt(this.audioBitrateSelect.value);

        const config = {
            codec: 'mp4a.40.2',
            sampleRate: sampleRate,
            numberOfChannels: 2,
            bitrate: bitrate
        };

        try {
            const support = await AudioEncoder.isConfigSupported(config);
            if (!support.supported) {
                this.log('warning', 'AAC 编码不支持');
                return;
            }

            this.audioEncoder = new AudioEncoder({
                output: (chunk, metadata) => {
                    this.handleAudioChunk(chunk, metadata);
                },
                error: (err) => {
                    this.log('error', `音频编码错误: ${err.message}`);
                }
            });

            await this.audioEncoder.configure(config);
            this.log('info', '音频编码器已配置');
        } catch (err) {
            this.log('warning', `音频编码初始化失败: ${err.message}`);
        }
    }

    startVideoProcessing(resolution, framerate) {
        if ('MediaStreamTrackProcessor' in window) {
            this.startVideoProcessingWithProcessor(resolution);
        } else {
            this.startVideoProcessingLegacy(resolution, framerate);
        }
    }

    startVideoProcessingWithProcessor(resolution) {
        try {
            const processor = new MediaStreamTrackProcessor({ track: this.videoTrack });
            const reader = processor.readable.getReader();
            
            this.videoProcessor = { cancel: () => reader.cancel() };

            const processFrame = async () => {
                try {
                    const result = await reader.read();
                    
                    if (result.done || !this.isStreaming) {
                        if (result.value) result.value.close();
                        return;
                    }

                    await this.processVideoFrameOptimized(result.value, resolution);
                    
                    if (this.isStreaming) {
                        processFrame();
                    }
                } catch (e) {
                    if (this.isStreaming) {
                        this.log('warning', `帧处理错误: ${e.message}`);
                        setTimeout(() => processFrame(), 100);
                    }
                }
            };

            processFrame();
            this.log('info', '使用 MediaStreamTrackProcessor 高效零拷贝帧处理');
        } catch (e) {
            this.log('warning', `MediaStreamTrackProcessor 失败，使用回退方案: ${e.message}`);
            this.startVideoProcessingLegacy(resolution, parseInt(this.framerateSelect.value));
        }
    }

    startVideoProcessingLegacy(resolution, framerate) {
        const interval = Math.round(1000 / framerate);
        let lastTime = performance.now();

        const processFrame = () => {
            if (!this.isStreaming) return;

            const now = performance.now();
            const elapsed = now - lastTime;
            
            if (elapsed >= interval) {
                this.processVideoFrameLegacy(resolution);
                lastTime = now - (elapsed % interval);
            }

            this.videoProcessor = requestAnimationFrame(processFrame);
        };

        this.videoProcessor = requestAnimationFrame(processFrame);
        this.log('info', '使用 requestAnimationFrame 帧处理');
    }

    async processVideoFrameOptimized(frame, resolution) {
        if (!this.videoEncoder || this.videoEncoder.state !== 'configured') {
            frame.close();
            return;
        }

        const queueSize = this.videoEncoder.encodeQueueSize;
        this.stats.encodeQueueSize = queueSize;

        if (queueSize > this.maxQueueSize) {
            this.stats.droppedFrames++;
            frame.close();
            return;
        }

        let processedFrame = frame;
        let needCloseOriginal = false;
        
        const needCrop = this.regionSelection.active && this.regionSelection.width > 50;
        const needResize = frame.displayWidth !== resolution.width || frame.displayHeight !== resolution.height;

        if (needCrop) {
            processedFrame = this.cropFrame(frame, resolution);
            needCloseOriginal = true;
        } else if (needResize) {
            processedFrame = this.resizeFrame(frame, resolution);
            needCloseOriginal = true;
        }

        this.frameSinceKeyframe++;
        const needKeyframe = this.frameSinceKeyframe >= this.forceKeyframeInterval;
        if (needKeyframe) {
            this.frameSinceKeyframe = 0;
        }

        try {
            this.videoEncoder.encode(processedFrame, { keyFrame: needKeyframe });
            this.stats.frameCount++;
        } catch (e) {
            this.log('warning', `编码失败: ${e.message}`);
        }

        if (needCloseOriginal) {
            frame.close();
        }
        processedFrame.close();
    }

    processVideoFrameLegacy(resolution) {
        if (!this.videoEncoder || this.videoEncoder.state !== 'configured') return;

        const queueSize = this.videoEncoder.encodeQueueSize;
        this.stats.encodeQueueSize = queueSize;

        if (queueSize > this.maxQueueSize) {
            this.stats.droppedFrames++;
            return;
        }

        const previewRect = this.previewVideo.getBoundingClientRect();
        
        if (this.regionSelection.active && this.regionSelection.width > 50) {
            const videoWidth = this.previewVideo.videoWidth;
            const videoHeight = this.previewVideo.videoHeight;
            const displayWidth = previewRect.width;
            const displayHeight = previewRect.height;
            
            const scaleX = videoWidth / displayWidth;
            const scaleY = videoHeight / displayHeight;
            
            const srcX = this.regionSelection.x * scaleX;
            const srcY = this.regionSelection.y * scaleY;
            const srcW = this.regionSelection.width * scaleX;
            const srcH = this.regionSelection.height * scaleY;
            
            this.cropCtx.drawImage(
                this.previewVideo,
                srcX, srcY, srcW, srcH,
                0, 0, resolution.width, resolution.height
            );
        } else {
            this.cropCtx.drawImage(
                this.previewVideo,
                0, 0, resolution.width, resolution.height
            );
        }

        const timestamp = this.lastFrameTimestamp;
        this.lastFrameTimestamp += this.frameDuration;

        const frame = new VideoFrame(this.cropCanvas, {
            timestamp: timestamp,
            duration: this.frameDuration
        });

        this.frameSinceKeyframe++;
        const needKeyframe = this.frameSinceKeyframe >= this.forceKeyframeInterval;
        if (needKeyframe) {
            this.frameSinceKeyframe = 0;
        }

        try {
            this.videoEncoder.encode(frame, { keyFrame: needKeyframe });
            this.stats.frameCount++;
        } catch (e) {
            this.log('warning', `编码失败: ${e.message}`);
        }

        frame.close();
    }

    cropFrame(frame, resolution) {
        const previewRect = this.previewVideo.getBoundingClientRect();
        const videoWidth = frame.displayWidth;
        const videoHeight = frame.displayHeight;
        const displayWidth = previewRect.width;
        const displayHeight = previewRect.height;
        
        const scaleX = videoWidth / displayWidth;
        const scaleY = videoHeight / displayHeight;
        
        const srcX = Math.round(this.regionSelection.x * scaleX);
        const srcY = Math.round(this.regionSelection.y * scaleY);
        const srcW = Math.round(this.regionSelection.width * scaleX);
        const srcH = Math.round(this.regionSelection.height * scaleY);

        this.cropCtx.drawImage(
            frame,
            srcX, srcY, srcW, srcH,
            0, 0, resolution.width, resolution.height
        );

        return new VideoFrame(this.cropCanvas, {
            timestamp: frame.timestamp,
            duration: frame.duration || this.frameDuration
        });
    }

    resizeFrame(frame, resolution) {
        this.cropCtx.drawImage(
            frame,
            0, 0, resolution.width, resolution.height
        );

        return new VideoFrame(this.cropCanvas, {
            timestamp: frame.timestamp,
            duration: frame.duration || this.frameDuration
        });
    }

    startAudioProcessing() {
        if (!this.audioTrack) return;

        if ('MediaStreamTrackProcessor' in window) {
            this.startAudioProcessingWithProcessor();
        } else {
            this.startAudioProcessingLegacy();
        }
    }

    startAudioProcessingWithProcessor() {
        try {
            const processor = new MediaStreamTrackProcessor({ track: this.audioTrack });
            const reader = processor.readable.getReader();
            
            this.audioProcessor = { cancel: () => reader.cancel() };
            let audioTimestamp = 0;

            const processAudio = async () => {
                try {
                    const result = await reader.read();
                    
                    if (result.done || !this.isStreaming) {
                        if (result.value) result.value.close();
                        return;
                    }

                    if (this.audioEncoder && this.audioEncoder.state === 'configured') {
                        if (this.audioEncoder.encodeQueueSize < 8) {
                            this.audioEncoder.encode(result.value);
                        } else {
                            result.value.close();
                        }
                    } else {
                        result.value.close();
                    }
                    
                    if (this.isStreaming) {
                        processAudio();
                    }
                } catch (e) {
                    if (this.isStreaming) {
                        this.log('warning', `音频处理错误: ${e.message}`);
                        setTimeout(() => processAudio(), 100);
                    }
                }
            };

            processAudio();
            this.log('info', '使用 MediaStreamTrackProcessor 高效音频处理');
        } catch (e) {
            this.log('warning', `音频处理器失败，使用回退方案: ${e.message}`);
            this.startAudioProcessingLegacy();
        }
    }

    startAudioProcessingLegacy() {
        const audioContext = new AudioContext({
            sampleRate: parseInt(this.sampleRateSelect.value)
        });

        const source = audioContext.createMediaStreamSource(
            new MediaStream([this.audioTrack])
        );

        const processor = audioContext.createScriptProcessor(4096, 2, 2);
        
        source.connect(processor);
        processor.connect(audioContext.destination);

        let audioTimestamp = 0;
        processor.onaudioprocess = (e) => {
            if (!this.isStreaming || !this.audioEncoder) return;
            
            const inputData = e.inputBuffer;
            const data = new Float32Array(inputData.length * 2);
            
            for (let channel = 0; channel < 2; channel++) {
                const channelData = inputData.getChannelData(channel);
                for (let i = 0; i < channelData.length; i++) {
                    data[i * 2 + channel] = channelData[i];
                }
            }

            const audioData = new AudioData({
                format: 'f32-planar',
                sampleRate: inputData.sampleRate,
                numberOfFrames: inputData.length,
                numberOfChannels: 2,
                timestamp: audioTimestamp,
                data: data
            });

            if (this.audioEncoder.encodeQueueSize < 8) {
                this.audioEncoder.encode(audioData);
            }

            audioData.close();
            audioTimestamp += (inputData.length / inputData.sampleRate) * 1000000;
        };

        this.audioProcessor = {
            disconnect: () => {
                processor.disconnect();
                source.disconnect();
                audioContext.close();
            }
        };
        this.log('info', '使用 ScriptProcessor 音频处理');
    }

    handleVideoChunk(chunk, metadata) {
        const data = new Uint8Array(chunk.byteLength);
        chunk.copyTo(data);
        
        this.stats.videoBytes += data.length;
        
        if (this.streamTargets.size > 0) {
            const header = new Uint8Array([0x00]);
            const packet = new Uint8Array(header.length + data.length);
            packet.set(header);
            packet.set(data, header.length);
            
            this.streamTargets.forEach((ws, platform) => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    try {
                        ws.send(packet);
                        const stats = this.platformStats.get(platform);
                        if (stats) {
                            stats.bytesSent += packet.length;
                        }
                    } catch (e) {
                        this.log('warning', `${platform}: 发送视频数据失败`);
                    }
                }
            });
        }
    }

    handleAudioChunk(chunk, metadata) {
        const data = new Uint8Array(chunk.byteLength);
        chunk.copyTo(data);
        
        this.stats.audioBytes += data.length;
        
        if (this.streamTargets.size > 0) {
            const header = new Uint8Array([0x01]);
            const packet = new Uint8Array(header.length + data.length);
            packet.set(header);
            packet.set(data, header.length);
            
            this.streamTargets.forEach((ws, platform) => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    try {
                        ws.send(packet);
                        const stats = this.platformStats.get(platform);
                        if (stats) {
                            stats.bytesSent += packet.length;
                        }
                    } catch (e) {
                        this.log('warning', `${platform}: 发送音频数据失败`);
                    }
                }
            });
        }
    }

    stopStreaming() {
        this.isStreaming = false;
        
        if (this.videoProcessor) {
            if (typeof this.videoProcessor === 'number') {
                cancelAnimationFrame(this.videoProcessor);
            } else if (this.videoProcessor.cancel) {
                this.videoProcessor.cancel();
            }
            this.videoProcessor = null;
        }

        if (this.videoTrackReader) {
            this.videoTrackReader.cancel();
            this.videoTrackReader = null;
        }
        
        if (this.audioProcessor) {
            if (this.audioProcessor.disconnect) {
                this.audioProcessor.disconnect();
            } else if (this.audioProcessor.cancel) {
                this.audioProcessor.cancel();
            }
            this.audioProcessor = null;
        }
        
        if (this.videoEncoder) {
            this.videoEncoder.flush().catch(() => {});
            this.videoEncoder.close();
            this.videoEncoder = null;
        }
        
        if (this.audioEncoder) {
            this.audioEncoder.flush().catch(() => {});
            this.audioEncoder.close();
            this.audioEncoder = null;
        }

        this.lastFrameTimestamp = 0;
        this.frameSinceKeyframe = 0;
        const droppedFrames = this.stats.droppedFrames;
        this.stats.droppedFrames = 0;
        this.stats.encodeQueueSize = 0;

        this.platformStats.forEach((stats, platform) => {
            stats.bytesSent = 0;
            stats.bitrate = 0;
        });

        this.startBtn.disabled = !this.videoTrack;
        this.stopBtn.disabled = true;
        
        this.updateGlobalConnectionStatus();

        this.log('info', `推流已停止，共丢弃 ${droppedFrames} 帧`);
    }

    updateStats() {
        const now = Date.now();
        const elapsed = (now - this.lastStatsTime) / 1000;
        
        if (elapsed > 0) {
            this.stats.videoBitrate = Math.round((this.stats.videoBytes * 8) / elapsed / 1000);
            this.stats.audioBitrate = Math.round((this.stats.audioBytes * 8) / elapsed / 1000);
            this.stats.fps = Math.round(this.stats.frameCount / elapsed);
            
            this.platformStats.forEach((stats, platform) => {
                stats.bitrate = Math.round((stats.bytesSent * 8) / elapsed / 1000);
                stats.bytesSent = 0;
                this.updatePlatformBitrateDisplay(platform, stats.bitrate);
            });
            
            this.stats.videoBytes = 0;
            this.stats.audioBytes = 0;
            this.stats.frameCount = 0;
        }
        
        this.lastStatsTime = now;

        const resolution = this.getResolution();
        this.resolutionStat.textContent = `${resolution.width}x${resolution.height}`;
        this.fpsStat.textContent = `${this.stats.fps} fps`;
        this.videoBitrateStat.textContent = `${this.stats.videoBitrate} kbps`;
        this.audioBitrateStat.textContent = `${this.stats.audioBitrate} kbps`;
        this.totalBitrateStat.textContent = `${this.stats.videoBitrate + this.stats.audioBitrate} kbps`;

        if (this.bitrateHistory.length > 60) {
            this.bitrateHistory.shift();
        }
        this.bitrateHistory.push({
            video: this.stats.videoBitrate,
            total: this.stats.videoBitrate + this.stats.audioBitrate
        });

        if (this.chart) {
            this.chart.data.labels = this.bitrateHistory.map((_, i) => i);
            this.chart.data.datasets[0].data = this.bitrateHistory.map(d => d.video);
            this.chart.data.datasets[1].data = this.bitrateHistory.map(d => d.total);
            this.chart.update('none');
        }

        this.updateCPUEstimate();
        
        if (this.stats.droppedFrames > 0) {
            this.log('warning', `已丢弃 ${this.stats.droppedFrames} 帧，队列大小: ${this.stats.encodeQueueSize}`);
        }
    }

    updatePlatformBitrateDisplay(platformName, bitrate) {
        const bitrateElement = document.getElementById(`bitrate${platformName.charAt(0).toUpperCase() + platformName.slice(1)}`);
        if (bitrateElement) {
            const isConnected = this.streamTargets.has(platformName);
            bitrateElement.textContent = isConnected ? `${bitrate} kbps` : '-- kbps';
        }
    }

    async updateCPUEstimate() {
        if (!this.isStreaming) {
            this.cpuStat.textContent = '--';
            return;
        }

        try {
            const settings = this.videoTrack.getSettings();
            const resolution = this.getResolution();
            const framerate = parseInt(this.framerateSelect.value);
            
            const baseLoad = 5;
            const pixelFactor = (resolution.width * resolution.height) / (1920 * 1080);
            const fpsFactor = framerate / 30;
            
            let estimatedCPU = baseLoad + (pixelFactor * fpsFactor * 10);
            
            if (this.presetSelect.value === 'hardware') {
                estimatedCPU *= 0.3;
            }
            
            estimatedCPU = Math.min(estimatedCPU, 30);
            
            this.cpuStat.textContent = estimatedCPU.toFixed(1) + '%';
        } catch (e) {
            this.cpuStat.textContent = '--';
        }
    }

    log(type, message) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${timestamp}] ${message}`;
        this.logOutput.appendChild(entry);
        this.logOutput.scrollTop = this.logOutput.scrollHeight;
    }

    clearLog() {
        this.logOutput.innerHTML = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.streamer = new LiveStreamer();
});