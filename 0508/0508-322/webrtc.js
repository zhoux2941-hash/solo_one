class WebRTCManager {
    constructor() {
        this.peerConnection = null;
        this.dataChannel = null;
        this.localStream = null;
        this.remoteStream = null;
        this.videoElement = document.getElementById('droneVideo');
        this.noVideoElement = document.getElementById('noVideo');
        this.connectionIndicator = document.getElementById('connectionIndicator');
        this.connectionText = document.getElementById('connectionText');
        this.latencyValue = document.getElementById('latencyValue');
        this.lastPingTime = 0;
        this.onDataReceived = null;
        this.onConnected = null;
        this.onDisconnected = null;

        this.iceServers = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ];
    }

    async createConnection(isOfferer = true) {
        this.peerConnection = new RTCPeerConnection({
            iceServers: this.iceServers,
            iceTransportPolicy: 'all',
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require',
            sdpSemantics: 'unified-plan'
        });

        this.setupPeerConnectionListeners();

        if (isOfferer) {
            this.setupDataChannel();
        }

        return this.peerConnection;
    }

    setupPeerConnectionListeners() {
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('ICE Candidate:', event.candidate);
            }
        };

        this.peerConnection.oniceconnectionstatechange = () => {
            console.log('ICE Connection State:', this.peerConnection.iceConnectionState);
            this.updateConnectionStatus();
        };

        this.peerConnection.onsignalingstatechange = () => {
            console.log('Signaling State:', this.peerConnection.signalingState);
        };

        this.peerConnection.ontrack = (event) => {
            console.log('Received remote track');
            this.remoteStream = event.streams[0];
            this.videoElement.srcObject = this.remoteStream;
            this.noVideoElement.style.display = 'none';
        };

        this.peerConnection.ondatachannel = (event) => {
            console.log('Received data channel');
            this.dataChannel = event.channel;
            this.setupDataChannelListeners();
        };
    }

    setupDataChannel() {
        const config = {
            ordered: false,
            maxRetransmits: 0
        };

        this.dataChannel = this.peerConnection.createDataChannel('control', config);
        this.setupDataChannelListeners();
    }

    setupDataChannelListeners() {
        this.dataChannel.onopen = () => {
            console.log('Data Channel opened');
            this.updateConnectionStatus();
            this.startLatencyMeasurement();
            if (this.onConnected) this.onConnected();
        };

        this.dataChannel.onclose = () => {
            console.log('Data Channel closed');
            this.updateConnectionStatus();
            if (this.onDisconnected) this.onDisconnected();
        };

        this.dataChannel.onerror = (error) => {
            console.error('Data Channel error:', error);
        };

        this.dataChannel.onmessage = (event) => {
            this.handleDataMessage(event.data);
        };
    }

    handleDataMessage(data) {
        try {
            const message = JSON.parse(data);
            
            if (message.type === 'pong') {
                const latency = Date.now() - this.lastPingTime;
                this.latencyValue.textContent = latency;
                return;
            }

            if (this.onDataReceived) {
                this.onDataReceived(message);
            }
        } catch (e) {
            console.error('Error parsing message:', e);
        }
    }

    startLatencyMeasurement() {
        setInterval(() => {
            if (this.dataChannel && this.dataChannel.readyState === 'open') {
                this.lastPingTime = Date.now();
                this.sendData({ type: 'ping' });
            }
        }, 1000);
    }

    async createOffer() {
        if (!this.peerConnection) {
            await this.createConnection(true);
        }

        try {
            const offer = await this.peerConnection.createOffer({
                offerToReceiveAudio: false,
                offerToReceiveVideo: true
            });
            
            await this.peerConnection.setLocalDescription(offer);
            return offer;
        } catch (error) {
            console.error('Error creating offer:', error);
            throw error;
        }
    }

    async createAnswer() {
        if (!this.peerConnection) {
            await this.createConnection(false);
        }

        try {
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            return answer;
        } catch (error) {
            console.error('Error creating answer:', error);
            throw error;
        }
    }

    async setRemoteDescription(description) {
        try {
            await this.peerConnection.setRemoteDescription(
                new RTCSessionDescription(description)
            );
        } catch (error) {
            console.error('Error setting remote description:', error);
            throw error;
        }
    }

    async addIceCandidate(candidate) {
        try {
            await this.peerConnection.addIceCandidate(
                new RTCIceCandidate(candidate)
            );
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
            throw error;
        }
    }

    sendData(data) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            const message = typeof data === 'string' ? data : JSON.stringify(data);
            this.dataChannel.send(message);
            return true;
        }
        return false;
    }

    sendControlCommand(throttle, yaw, pitch, roll) {
        const command = {
            type: 'control',
            timestamp: Date.now(),
            throttle: throttle,
            yaw: yaw,
            pitch: pitch,
            roll: roll
        };
        return this.sendData(command);
    }

    sendActionCommand(action) {
        const command = {
            type: 'action',
            action: action,
            timestamp: Date.now()
        };
        return this.sendData(command);
    }

    updateConnectionStatus() {
        const iceState = this.peerConnection ? this.peerConnection.iceConnectionState : 'disconnected';
        const dataChannelState = this.dataChannel ? this.dataChannel.readyState : 'closed';

        const isConnected = iceState === 'connected' && dataChannelState === 'open';

        if (isConnected) {
            this.connectionIndicator.className = 'status-indicator connected';
            this.connectionText.textContent = '已连接';
        } else if (iceState === 'checking' || iceState === 'new') {
            this.connectionIndicator.className = 'status-indicator disconnected';
            this.connectionText.textContent = '连接中...';
        } else {
            this.connectionIndicator.className = 'status-indicator disconnected';
            this.connectionText.textContent = '未连接';
        }
    }

    closeConnection() {
        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }

        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }

        this.noVideoElement.style.display = 'block';
        this.updateConnectionStatus();
    }
}