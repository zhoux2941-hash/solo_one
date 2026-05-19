class StreamRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.isStreaming = false;
        this.stream = null;
        this.onRecordingStateChanged = null;
        this.onStreamingStateChanged = null;
    }

    startRecording(stream) {
        if (this.isRecording) return;

        this.stream = stream;
        this.recordedChunks = [];
        
        const mimeTypes = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm'
        ];
        
        let mimeType = '';
        for (const type of mimeTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
                mimeType = type;
                break;
            }
        }
        
        try {
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType || undefined,
                videoBitsPerSecond: 5000000
            });
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.downloadRecording();
            };
            
            this.mediaRecorder.start(100);
            this.isRecording = true;
            
            if (this.onRecordingStateChanged) {
                this.onRecordingStateChanged(true);
            }
        } catch (error) {
            console.error('开始录制失败:', error);
            throw error;
        }
    }

    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;

        this.mediaRecorder.stop();
        this.isRecording = false;

        if (this.onRecordingStateChanged) {
            this.onRecordingStateChanged(false);
        }
    }

    downloadRecording() {
        if (this.recordedChunks.length === 0) return;

        const blob = new Blob(this.recordedChunks, { 
            type: this.mediaRecorder.mimeType || 'video/webm' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.recordedChunks = [];
    }

    async startStreaming(stream, rtmpUrl) {
        if (this.isStreaming) return;

        try {
            if (navigator.mediaDevices.getSupportedConstraints().webRTC && window.RTCPeerConnection) {
                console.log('准备WebRTC推流到:', rtmpUrl);
                
                this.isStreaming = true;
                if (this.onStreamingStateChanged) {
                    this.onStreamingStateChanged(true);
                }
                
                this.simulateStreaming(stream, rtmpUrl);
            } else {
                throw new Error('浏览器不支持WebRTC推流');
            }
        } catch (error) {
            console.error('开始推流失败:', error);
            throw error;
        }
    }

    simulateStreaming(stream, rtmpUrl) {
        console.log('推流模拟已启动到:', rtmpUrl);
        console.log('注意：实际RTMP推流需要媒体服务器支持');
        console.log('推荐使用: Janus Gateway, MediaSoup, 或 Wowza');
        
        this.streamInterval = setInterval(() => {
            if (!this.isStreaming) {
                clearInterval(this.streamInterval);
            }
        }, 1000);
    }

    stopStreaming() {
        if (!this.isStreaming) return;

        this.isStreaming = false;
        if (this.streamInterval) {
            clearInterval(this.streamInterval);
        }

        if (this.onStreamingStateChanged) {
            this.onStreamingStateChanged(false);
        }
        
        console.log('推流已停止');
    }

    toggleRecording(stream) {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording(stream);
        }
        return this.isRecording;
    }

    toggleStreaming(stream, rtmpUrl) {
        if (this.isStreaming) {
            this.stopStreaming();
        } else {
            this.startStreaming(stream, rtmpUrl);
        }
        return this.isStreaming;
    }

    getIsRecording() {
        return this.isRecording;
    }

    getIsStreaming() {
        return this.isStreaming;
    }

    destroy() {
        if (this.isRecording) {
            this.stopRecording();
        }
        if (this.isStreaming) {
            this.stopStreaming();
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }
}

window.StreamRecorder = StreamRecorder;
