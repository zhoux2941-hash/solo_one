class MusicController {
    constructor(rgbController) {
        this.rgbController = rgbController;
        this.isListening = false;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.spectrumData = null;
        this.smoothedData = null;
        this.animationId = null;
        this.sendInterval = null;
        this.sensitivity = 0.7;
        this.smoothing = 0.5;
        this.colorMode = 'rainbow';
        this.bassLevel = 0;
        this.midLevel = 0;
        this.highLevel = 0;
        this.framerate = 30;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupCanvas();
    }

    setupCanvas() {
        this.canvas = document.getElementById('spectrumCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width - 20;
        this.canvas.height = 100;
    }

    bindEvents() {
        document.getElementById('startMusicBtn').addEventListener('click', () => {
            this.startListening();
        });

        document.getElementById('stopMusicBtn').addEventListener('click', () => {
            this.stopListening();
        });

        document.getElementById('sensitivitySlider').addEventListener('input', (e) => {
            this.sensitivity = e.target.value / 100;
            document.getElementById('sensitivityValue').textContent = e.target.value;
        });

        document.getElementById('smoothingSlider').addEventListener('input', (e) => {
            this.smoothing = e.target.value / 100;
            document.getElementById('smoothingValue').textContent = e.target.value;
            if (this.analyser) {
                this.analyser.smoothingTimeConstant = this.smoothing;
            }
        });

        document.getElementById('colorModeSelect').addEventListener('change', (e) => {
            this.colorMode = e.target.value;
        });
    }

    async startListening() {
        try {
            usbManager.log('info', '正在请求麦克风权限...');
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = this.smoothing;
            
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);

            const bufferLength = this.analyser.frequencyBinCount;
            this.spectrumData = new Uint8Array(bufferLength);
            this.smoothedData = new Array(bufferLength).fill(0);

            this.isListening = true;
            this.updateUIState(true);
            
            this.animate();
            this.startSendingToKeyboard();
            
            usbManager.log('success', '麦克风采集已启动');
        } catch (error) {
            usbManager.log('error', `无法访问麦克风: ${error.message}`);
            this.updateStatus('error', '无法访问麦克风: ' + error.message);
        }
    }

    stopListening() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.sendInterval) {
            clearInterval(this.sendInterval);
            this.sendInterval = null;
        }

        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone.mediaStream.getTracks().forEach(track => track.stop());
            this.microphone = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.analyser = null;
        this.isListening = false;
        this.updateUIState(false);
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        usbManager.log('info', '麦克风采集已停止');
    }

    updateUIState(listening) {
        document.getElementById('startMusicBtn').style.display = listening ? 'none' : 'block';
        document.getElementById('stopMusicBtn').style.display = listening ? 'block' : 'none';
        
        const indicator = document.querySelector('#musicStatus .status-indicator');
        indicator.className = 'status-indicator ' + (listening ? 'listening' : 'offline');
        
        const text = document.querySelector('#musicStatus span:last-child');
        text.textContent = listening ? '正在采集音频...' : '等待开始采集...';
    }

    updateStatus(status, message) {
        const indicator = document.querySelector('#musicStatus .status-indicator');
        indicator.className = 'status-indicator ' + status;
        
        const text = document.querySelector('#musicStatus span:last-child');
        text.textContent = message;
    }

    animate() {
        if (!this.isListening) return;

        this.analyser.getByteFrequencyData(this.spectrumData);
        
        this.calculateFrequencyBands();
        this.drawSpectrum();
        this.applySensitivity();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    calculateFrequencyBands() {
        const bufferLength = this.spectrumData.length;
        
        let bassSum = 0, midSum = 0, highSum = 0;
        const bassCount = Math.floor(bufferLength * 0.1);
        const midCount = Math.floor(bufferLength * 0.3);
        
        for (let i = 0; i < bassCount; i++) {
            bassSum += this.spectrumData[i];
        }
        for (let i = bassCount; i < bassCount + midCount; i++) {
            midSum += this.spectrumData[i];
        }
        for (let i = bassCount + midCount; i < bufferLength; i++) {
            highSum += this.spectrumData[i];
        }
        
        this.bassLevel = (bassSum / bassCount / 255) * this.sensitivity * 1.5;
        this.midLevel = (midSum / midCount / 255) * this.sensitivity;
        this.highLevel = (highSum / (bufferLength - bassCount - midCount) / 255) * this.sensitivity;
        
        this.bassLevel = Math.min(this.bassLevel, 1);
        this.midLevel = Math.min(this.midLevel, 1);
        this.highLevel = Math.min(this.highLevel, 1);
    }

    applySensitivity() {
        for (let i = 0; i < this.spectrumData.length; i++) {
            this.smoothedData[i] = this.smoothedData[i] * 0.8 + 
                                    (this.spectrumData[i] * this.sensitivity) * 0.2;
        }
    }

    drawSpectrum() {
        const { width, height } = this.canvas;
        const bufferLength = this.spectrumData.length;
        const barWidth = width / bufferLength;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, width, height);
        
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (this.smoothedData[i] / 255) * height;
            const x = i * barWidth;
            const y = height - barHeight;
            
            const color = this.getBarColor(i, bufferLength);
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, barWidth - 1, barHeight);
        }
        
        this.drawLevelIndicators();
    }

    getBarColor(index, total) {
        const ratio = index / total;
        
        switch (this.colorMode) {
            case 'rainbow':
                return `hsl(${ratio * 360}, 100%, 50%)`;
            case 'pulse':
                const hue = this.rgbController.config.hue / 255 * 360;
                const sat = this.rgbController.config.sat / 255 * 100;
                return `hsl(${hue}, ${sat}%, ${50 + this.bassLevel * 30}%)`;
            case 'gradient':
                return `hsl(${200 + this.highLevel * 160}, 100%, 50%)`;
            case 'bass':
                if (ratio < 0.1) {
                    return `hsl(${280}, 100%, ${40 + this.bassLevel * 40}%)`;
                } else if (ratio < 0.4) {
                    return `hsl(${200}, 100%, ${40 + this.midLevel * 40}%)`;
                } else {
                    return `hsl(${60}, 100%, ${40 + this.highLevel * 40}%)`;
                }
            default:
                return `hsl(${ratio * 360}, 100%, 50%)`;
        }
    }

    drawLevelIndicators() {
        const { width, height } = this.canvas;
        const indicatorHeight = 4;
        
        this.ctx.fillStyle = '#8b5cf6';
        this.ctx.fillRect(0, height - indicatorHeight, width * this.bassLevel, indicatorHeight);
        
        this.ctx.fillStyle = '#3b82f6';
        this.ctx.fillRect(0, height - indicatorHeight * 2.5, width * this.midLevel, indicatorHeight);
        
        this.ctx.fillStyle = '#10b981';
        this.ctx.fillRect(0, height - indicatorHeight * 4, width * this.highLevel, indicatorHeight);
    }

    startSendingToKeyboard() {
        this.sendInterval = setInterval(() => {
            if (this.isListening && usbManager.isConnected) {
                this.sendSpectrumData();
            }
        }, 1000 / this.framerate);
    }

    async sendSpectrumData() {
        try {
            const command = 0x0B;
            
            const data = [
                Math.floor(this.bassLevel * 255),
                Math.floor(this.midLevel * 255),
                Math.floor(this.highLevel * 255),
                this.getColorModeByte(),
                this.rgbController.config.brightness
            ];
            
            const samples = 8;
            const step = Math.floor(this.smoothedData.length / samples);
            for (let i = 0; i < samples; i++) {
                data.push(Math.floor(this.smoothedData[i * step]));
            }
            
            await usbManager.sendCommand(command, data);
        } catch (error) {
            if (!error.message.includes('未连接')) {
                usbManager.log('debug', `发送频谱数据失败: ${error.message}`);
            }
        }
    }

    getColorModeByte() {
        const modes = {
            'rainbow': 0,
            'pulse': 1,
            'gradient': 2,
            'bass': 3
        };
        return modes[this.colorMode] || 0;
    }

    showMusicControls(show) {
        const group = document.getElementById('musicControlGroup');
        group.style.display = show ? 'block' : 'none';
        
        if (show) {
            this.resizeCanvas();
        }
    }

    destroy() {
        this.stopListening();
    }
}