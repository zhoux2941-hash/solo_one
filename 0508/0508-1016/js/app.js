document.addEventListener('DOMContentLoaded', () => {
    const videoSourceManager = new VideoSourceManager();
    const outputCanvas = document.getElementById('outputCanvas');
    const videoSwitcher = new VideoSwitcher(outputCanvas);
    const autoSwitcher = new AutoSwitcher(videoSourceManager, videoSwitcher);
    const pipManager = new PipManager(
        document.getElementById('pipContainer'),
        document.getElementById('pipVideo'),
        videoSwitcher
    );
    const streamRecorder = new StreamRecorder();
    const monitorWindow = new MonitorWindow();

    const previewContainer = document.getElementById('previewContainer');
    const addCameraBtn = document.getElementById('addCameraBtn');
    const addScreenBtn = document.getElementById('addScreenBtn');
    const monitorBtn = document.getElementById('monitorBtn');
    const pipBtn = document.getElementById('pipBtn');
    const recordBtn = document.getElementById('recordBtn');
    const streamBtn = document.getElementById('streamBtn');
    const transitionEnabled = document.getElementById('transitionEnabled');
    const transitionDuration = document.getElementById('transitionDuration');
    const transitionValue = document.getElementById('transitionValue');
    const autoSwitchEnabled = document.getElementById('autoSwitchEnabled');
    const autoSwitchSensitivity = document.getElementById('autoSwitchSensitivity');
    const sensitivityValue = document.getElementById('sensitivityValue');
    const pipCloseBtn = document.getElementById('pipCloseBtn');
    const pipSwapBtn = document.getElementById('pipSwapBtn');

    const statusText = document.getElementById('statusText');
    const currentSourceText = document.getElementById('currentSource');
    const activeCountText = document.getElementById('activeCount');

    const deviceModal = document.getElementById('deviceModal');
    const cameraSelect = document.getElementById('cameraSelect');
    const cancelCameraBtn = document.getElementById('cancelCameraBtn');
    const confirmCameraBtn = document.getElementById('confirmCameraBtn');

    let selectedCameraDeviceId = null;

    function setStatus(text) {
        statusText.textContent = text;
    }

    function updateCurrentSource(source) {
        currentSourceText.textContent = source ? source.name : '无';
    }

    function updateActiveCount() {
        activeCountText.textContent = `${videoSourceManager.getActiveCount()} / 4`;
    }

    function createPreviewCard(source) {
        const card = document.createElement('div');
        card.className = 'preview-card';
        card.dataset.sourceId = source.id;

        const video = document.createElement('video');
        video.className = 'preview-video';
        video.srcObject = source.stream;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;

        const activityBar = document.createElement('div');
        activityBar.className = 'activity-bar';
        activityBar.dataset.sourceId = source.id;

        const motionIndicator = document.createElement('div');
        motionIndicator.className = 'activity-indicator motion';
        motionIndicator.title = '运动活跃度';

        const audioIndicator = document.createElement('div');
        audioIndicator.className = 'activity-indicator audio';
        audioIndicator.title = '音频活跃度';

        activityBar.appendChild(motionIndicator);
        activityBar.appendChild(audioIndicator);

        const info = document.createElement('div');
        info.className = 'preview-info';

        const name = document.createElement('span');
        name.className = 'preview-name';
        name.textContent = source.name;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'preview-remove';
        removeBtn.innerHTML = '✕';
        removeBtn.title = '移除输入源';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeSource(source.id);
        });

        info.appendChild(name);
        info.appendChild(removeBtn);
        card.appendChild(video);
        card.appendChild(activityBar);
        card.appendChild(info);

        card.addEventListener('click', () => {
            if (event.ctrlKey || event.metaKey) {
                pipManager.setSource(source);
                if (!pipManager.getIsEnabled()) {
                    pipManager.enable(source);
                }
            } else {
                videoSwitcher.setSource(source);
            }
        });

        return card;
    }

    function addSourceToPreview(source) {
        const emptySlots = previewContainer.querySelectorAll('.empty-slot');
        if (emptySlots.length > 0) {
            const card = createPreviewCard(source);
            emptySlots[0].replaceWith(card);
            updateActiveCount();
        }
    }

    function removeSourceFromPreview(sourceId) {
        const card = previewContainer.querySelector(`[data-source-id="${sourceId}"]`);
        if (card) {
            const emptySlot = document.createElement('div');
            emptySlot.className = 'empty-slot';
            emptySlot.innerHTML = `<span>空槽位</span>`;
            card.replaceWith(emptySlot);
            updateActiveCount();
        }
    }

    function removeSource(sourceId) {
        const source = videoSourceManager.getSource(sourceId);
        
        if (videoSwitcher.getCurrentSource()?.id === sourceId) {
            const otherSources = videoSourceManager.getAllSources().filter(s => s.id !== sourceId);
            if (otherSources.length > 0) {
                videoSwitcher.setSource(otherSources[0]);
            } else {
                videoSwitcher.currentSource = null;
                updateCurrentSource(null);
            }
        }

        if (pipManager.getPipSource()?.id === sourceId) {
            pipManager.disable();
        }

        videoSourceManager.removeSource(sourceId);
        removeSourceFromPreview(sourceId);
        setStatus(`已移除: ${source?.name || '未知'}`);
    }

    function updateActiveStates() {
        const currentSourceId = videoSwitcher.getCurrentSource()?.id;
        const pipSourceId = pipManager.getPipSource()?.id;

        document.querySelectorAll('.preview-card').forEach(card => {
            card.classList.remove('active', 'pip-source');
            const sourceId = card.dataset.sourceId;
            
            if (sourceId === currentSourceId) {
                card.classList.add('active');
            }
            if (sourceId === pipSourceId) {
                card.classList.add('pip-source');
            }
        });
    }

    async function openCameraModal() {
        const devices = await videoSourceManager.getCameraDevices();
        
        if (devices.length === 0) {
            alert('未检测到摄像头设备');
            return;
        }

        cameraSelect.innerHTML = '';
        devices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `摄像头 ${index + 1}`;
            cameraSelect.appendChild(option);
        });

        deviceModal.classList.remove('hidden');
    }

    async function addSelectedCamera() {
        const deviceId = cameraSelect.value;
        deviceModal.classList.add('hidden');

        try {
            setStatus('正在连接摄像头...');
            const source = await videoSourceManager.addCamera(deviceId);
            addSourceToPreview(source);
            setStatus(`已添加: ${source.name}`);

            if (videoSourceManager.getActiveCount() === 1) {
                videoSwitcher.setSource(source);
            }
        } catch (error) {
            setStatus('添加摄像头失败');
            alert('添加摄像头失败: ' + error.message);
        }
    }

    addCameraBtn.addEventListener('click', openCameraModal);
    cancelCameraBtn.addEventListener('click', () => {
        deviceModal.classList.add('hidden');
    });
    confirmCameraBtn.addEventListener('click', addSelectedCamera);

    addScreenBtn.addEventListener('click', async () => {
        try {
            setStatus('正在请求屏幕共享...');
            const source = await videoSourceManager.addScreenShare();
            addSourceToPreview(source);
            setStatus(`已添加: ${source.name}`);

            if (videoSourceManager.getActiveCount() === 1) {
                videoSwitcher.setSource(source);
            }
        } catch (error) {
            setStatus('添加屏幕共享失败');
            console.error('添加屏幕共享失败:', error);
        }
    });

    monitorBtn.addEventListener('click', () => {
        if (monitorWindow.getIsOpen()) {
            monitorWindow.close();
            monitorBtn.textContent = '👁️ 监控窗口';
        } else {
            const stream = videoSwitcher.getOutputStream();
            monitorWindow.open(stream);
            monitorBtn.textContent = '⏹️ 关闭监控';
        }
    });

    pipBtn.addEventListener('click', () => {
        const sources = videoSourceManager.getAllSources();
        const currentSource = videoSwitcher.getCurrentSource();
        
        if (pipManager.getIsEnabled()) {
            pipManager.disable();
        } else if (sources.length >= 2) {
            const otherSource = sources.find(s => s.id !== currentSource?.id);
            if (otherSource) {
                pipManager.enable(otherSource);
            }
        } else {
            setStatus('需要至少2个输入源才能使用画中画');
        }
    });

    pipCloseBtn.addEventListener('click', () => {
        pipManager.disable();
    });

    pipSwapBtn.addEventListener('click', () => {
        pipManager.swapWithMain();
    });

    recordBtn.addEventListener('click', () => {
        const stream = videoSwitcher.getOutputStream();
        
        if (streamRecorder.getIsRecording()) {
            streamRecorder.stopRecording();
            recordBtn.innerHTML = '⏺️ 开始录制';
            recordBtn.classList.remove('btn-danger');
            recordBtn.classList.add('btn-success');
            currentSourceText.classList.remove('recording');
            setStatus('录制已停止');
        } else {
            try {
                streamRecorder.startRecording(stream);
                recordBtn.innerHTML = '⏹️ 停止录制';
                recordBtn.classList.remove('btn-success');
                recordBtn.classList.add('btn-danger');
                currentSourceText.classList.add('recording');
                setStatus('正在录制...');
            } catch (error) {
                setStatus('开始录制失败');
                alert('开始录制失败: ' + error.message);
            }
        }
    });

    streamBtn.addEventListener('click', () => {
        const stream = videoSwitcher.getOutputStream();
        
        if (streamRecorder.getIsStreaming()) {
            streamRecorder.stopStreaming();
            streamBtn.innerHTML = '📡 开始推流';
            streamBtn.classList.remove('btn-danger');
            streamBtn.classList.add('btn-warning');
            currentSourceText.classList.remove('streaming');
            setStatus('推流已停止');
        } else {
            const rtmpUrl = prompt('请输入RTMP推流地址:', 'rtmp://localhost/live/stream');
            if (rtmpUrl) {
                try {
                    streamRecorder.startStreaming(stream, rtmpUrl);
                    streamBtn.innerHTML = '⏹️ 停止推流';
                    streamBtn.classList.remove('btn-warning');
                    streamBtn.classList.add('btn-danger');
                    currentSourceText.classList.add('streaming');
                    setStatus('正在推流...');
                } catch (error) {
                    setStatus('开始推流失败');
                    alert('开始推流失败: ' + error.message);
                }
            }
        }
    });

    transitionEnabled.addEventListener('change', (e) => {
        videoSwitcher.setTransitionEnabled(e.target.checked);
    });

    transitionDuration.addEventListener('input', (e) => {
        const value = e.target.value;
        transitionValue.textContent = value + 'ms';
        videoSwitcher.setTransitionDuration(parseInt(value));
    });

    autoSwitchEnabled.addEventListener('change', (e) => {
        if (e.target.checked) {
            if (videoSourceManager.getActiveCount() < 2) {
                alert('自动切换需要至少2个输入源');
                e.target.checked = false;
                return;
            }
            autoSwitcher.enable();
            setStatus('自动切换已开启');
        } else {
            autoSwitcher.disable();
            setStatus('自动切换已关闭');
        }
    });

    autoSwitchSensitivity.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        sensitivityValue.textContent = value;
        const threshold = 100 - value + 5;
        autoSwitcher.setMotionThreshold(threshold);
        autoSwitcher.setMinSwitchInterval(5000 - value * 40);
    });

    autoSwitcher.onAutoSwitch = (source) => {
        setStatus(`自动切换到: ${source.name}`);
    };

    autoSwitcher.onMetricsUpdate = (metrics) => {
        metrics.forEach(metric => {
            const activityBar = document.querySelector(`.activity-bar[data-source-id="${metric.sourceId}"]`);
            if (activityBar) {
                const motionIndicator = activityBar.querySelector('.motion');
                const audioIndicator = activityBar.querySelector('.audio');
                if (motionIndicator) {
                    motionIndicator.style.transform = `scaleX(${Math.max(0.1, metric.motionLevel / 100)})`;
                    motionIndicator.style.opacity = metric.motionLevel > 10 ? '1' : '0.3';
                }
                if (audioIndicator) {
                    audioIndicator.style.transform = `scaleX(${Math.max(0.1, metric.audioLevel / 100)})`;
                    audioIndicator.style.opacity = metric.audioLevel > 10 ? '1' : '0.3';
                }
            }
        });
    };

    videoSourceManager.onSourceAdded = (source) => {
        console.log('源已添加:', source.name);
    };

    videoSourceManager.onSourceRemoved = (sourceId) => {
        console.log('源已移除:', sourceId);
        updateActiveStates();
    };

    videoSwitcher.onSourceChanged = (source) => {
        updateCurrentSource(source);
        updateActiveStates();
        
        if (monitorWindow.getIsOpen()) {
            const stream = videoSwitcher.getOutputStream();
            monitorWindow.updateStream(stream);
        }
    };

    videoSwitcher.onTransitionStart = () => {
        setStatus('正在切换画面...');
    };

    videoSwitcher.onTransitionEnd = () => {
        setStatus('就绪');
    };

    pipManager.onPipToggled = (enabled) => {
        if (enabled) {
            pipBtn.innerHTML = '⏹️ 关闭画中画';
            pipBtn.classList.remove('btn-secondary');
            pipBtn.classList.add('btn-danger');
        } else {
            pipBtn.innerHTML = '🖼️ 画中画';
            pipBtn.classList.remove('btn-danger');
            pipBtn.classList.add('btn-secondary');
        }
        updateActiveStates();
    };

    pipManager.onPipSourceChanged = () => {
        updateActiveStates();
    };

    streamRecorder.onRecordingStateChanged = (isRecording) => {
        console.log('录制状态:', isRecording);
    };

    streamRecorder.onStreamingStateChanged = (isStreaming) => {
        console.log('推流状态:', isStreaming);
    };

    window.addEventListener('beforeunload', () => {
        autoSwitcher.destroy();
        videoSwitcher.destroy();
        videoSourceManager.destroy();
        streamRecorder.destroy();
        monitorWindow.close();
    });

    setStatus('就绪 - 点击"添加摄像头"或"屏幕共享"开始');
    updateActiveCount();
});
