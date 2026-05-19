class VideoSourceManager {
    constructor() {
        this.sources = new Map();
        this.maxSources = 4;
        this.onSourceAdded = null;
        this.onSourceRemoved = null;
    }

    async getCameraDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('获取摄像头设备失败:', error);
            return [];
        }
    }

    async addCamera(deviceId = null) {
        if (this.sources.size >= this.maxSources) {
            throw new Error('已达到最大输入源数量');
        }

        const constraints = {
            video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 30 }
            },
            audio: true
        };

        if (deviceId) {
            constraints.video.deviceId = { exact: deviceId };
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            const sourceId = this.generateSourceId();
            const source = {
                id: sourceId,
                type: 'camera',
                stream: stream,
                name: `摄像头 ${this.sources.size + 1}`,
                deviceId: deviceId
            };
            this.sources.set(sourceId, source);
            if (this.onSourceAdded) this.onSourceAdded(source);
            return source;
        } catch (error) {
            console.error('添加摄像头失败:', error);
            throw error;
        }
    }

    async addScreenShare() {
        if (this.sources.size >= this.maxSources) {
            throw new Error('已达到最大输入源数量');
        }

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 }
                },
                audio: true
            });

            const sourceId = this.generateSourceId();
            const source = {
                id: sourceId,
                type: 'screen',
                stream: stream,
                name: `屏幕共享 ${this.sources.size + 1}`
            };

            stream.getVideoTracks()[0].onended = () => {
                this.removeSource(sourceId);
            };

            this.sources.set(sourceId, source);
            if (this.onSourceAdded) this.onSourceAdded(source);
            return source;
        } catch (error) {
            console.error('添加屏幕共享失败:', error);
            throw error;
        }
    }

    removeSource(sourceId) {
        const source = this.sources.get(sourceId);
        if (source) {
            source.stream.getTracks().forEach(track => track.stop());
            this.sources.delete(sourceId);
            if (this.onSourceRemoved) this.onSourceRemoved(sourceId);
            return true;
        }
        return false;
    }

    getSource(sourceId) {
        return this.sources.get(sourceId);
    }

    getAllSources() {
        return Array.from(this.sources.values());
    }

    getActiveCount() {
        return this.sources.size;
    }

    generateSourceId() {
        return 'source_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    destroy() {
        this.sources.forEach(source => {
            source.stream.getTracks().forEach(track => track.stop());
        });
        this.sources.clear();
    }
}

window.VideoSourceManager = VideoSourceManager;
