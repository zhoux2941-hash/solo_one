const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  FAILED: 'failed'
};

class WebRTCManager {
  constructor(userId, cryptoManager) {
    this.userId = userId;
    this.crypto = cryptoManager;
    this.connections = new Map();
    this.dataChannels = new Map();
    this.channelStates = new Map();
    this.messageQueue = [];
    this.signalingCallback = null;
    this.messageCallback = null;
    this.connectionStateChangeCallback = null;
    this.latencyMeasurements = [];
    this.maxQueueSize = 100;
  }

  setSignalingCallback(callback) {
    this.signalingCallback = callback;
  }

  setMessageCallback(callback) {
    this.messageCallback = callback;
  }

  setConnectionStateChangeCallback(callback) {
    this.connectionStateChangeCallback = callback;
  }

  getOverallState() {
    const states = Array.from(this.channelStates.values());
    if (states.length === 0) return ConnectionState.DISCONNECTED;
    if (states.some(s => s === ConnectionState.CONNECTED)) return ConnectionState.CONNECTED;
    if (states.some(s => s === ConnectionState.CONNECTING)) return ConnectionState.CONNECTING;
    if (states.some(s => s === ConnectionState.FAILED)) return ConnectionState.FAILED;
    return ConnectionState.DISCONNECTED;
  }

  isReadyToSend() {
    return this.getOverallState() === ConnectionState.CONNECTED;
  }

  async createOffer(targetUserId) {
    this.setChannelState(targetUserId, ConnectionState.CONNECTING);
    const pc = this.createPeerConnection(targetUserId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    this.sendSignal(targetUserId, {
      type: 'offer',
      sdp: offer
    });
  }

  async handleOffer(fromUserId, offer) {
    this.setChannelState(fromUserId, ConnectionState.CONNECTING);
    const pc = this.createPeerConnection(fromUserId);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    this.sendSignal(fromUserId, {
      type: 'answer',
      sdp: answer
    });
  }

  async handleAnswer(fromUserId, answer) {
    const pc = this.connections.get(fromUserId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  async handleCandidate(fromUserId, candidate) {
    const pc = this.connections.get(fromUserId);
    if (pc && candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  createPeerConnection(targetUserId) {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    this.connections.set(targetUserId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(targetUserId, {
          type: 'candidate',
          candidate: event.candidate
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === 'failed' || state === 'disconnected') {
        this.setChannelState(targetUserId, ConnectionState.FAILED);
      }
    };

    pc.ondatachannel = (event) => {
      this.setupDataChannel(targetUserId, event.channel);
    };

    const dc = pc.createDataChannel('whiteboard', {
      ordered: true
    });
    this.setupDataChannel(targetUserId, dc);

    return pc;
  }

  setupDataChannel(targetUserId, dc) {
    dc.onopen = () => {
      console.log(`DataChannel open with ${targetUserId}`);
      this.dataChannels.set(targetUserId, dc);
      this.setChannelState(targetUserId, ConnectionState.CONNECTED);
      this.flushMessageQueue();
    };

    dc.onclosing = () => {
      console.log(`DataChannel closing with ${targetUserId}`);
      this.setChannelState(targetUserId, ConnectionState.DISCONNECTED);
    };

    dc.onclose = () => {
      console.log(`DataChannel closed with ${targetUserId}`);
      this.dataChannels.delete(targetUserId);
      this.setChannelState(targetUserId, ConnectionState.DISCONNECTED);
    };

    dc.onerror = (error) => {
      console.error(`DataChannel error with ${targetUserId}:`, error);
      this.setChannelState(targetUserId, ConnectionState.FAILED);
    };

    dc.onmessage = async (event) => {
      try {
        const decrypted = await this.crypto.decrypt(event.data);
        this.handleMessage(decrypted);
      } catch (e) {
        console.error('Decryption error:', e);
      }
    };
  }

  setChannelState(userId, state) {
    const oldState = this.channelStates.get(userId);
    if (oldState !== state) {
      this.channelStates.set(userId, state);
      console.log(`Channel ${userId} state changed: ${oldState} -> ${state}`);
      if (this.connectionStateChangeCallback) {
        this.connectionStateChangeCallback(this.getOverallState());
      }
    }
  }

  handleMessage(message) {
    if (message.type === 'ping') {
      this.queueOrSendMessage({ type: 'pong', timestamp: message.timestamp });
    } else if (message.type === 'pong') {
      const latency = Date.now() - message.timestamp;
      this.latencyMeasurements.push(latency);
      if (this.latencyMeasurements.length > 10) {
        this.latencyMeasurements.shift();
      }
    } else if (this.messageCallback) {
      this.messageCallback(message);
    }
  }

  queueOrSendMessage(message) {
    if (this.isReadyToSend()) {
      this.sendMessageImmediately(message);
    } else {
      this.enqueueMessage(message);
    }
  }

  enqueueMessage(message) {
    if (this.messageQueue.length >= this.maxQueueSize) {
      this.messageQueue.shift();
      console.warn('Message queue overflow, dropping oldest message');
    }
    this.messageQueue.push({
      data: message,
      timestamp: Date.now()
    });
  }

  async flushMessageQueue() {
    if (!this.isReadyToSend() || this.messageQueue.length === 0) return;

    console.log(`Flushing ${this.messageQueue.length} queued messages`);
    
    while (this.messageQueue.length > 0 && this.isReadyToSend()) {
      const item = this.messageQueue.shift();
      await this.sendMessageImmediately(item.data);
    }
  }

  async sendMessageImmediately(message) {
    try {
      const encrypted = await this.crypto.encrypt(message);
      
      this.dataChannels.forEach((dc, userId) => {
        if (dc.readyState === 'open') {
          try {
            dc.send(encrypted);
          } catch (e) {
            console.error(`Failed to send to ${userId}:`, e);
            this.setChannelState(userId, ConnectionState.FAILED);
          }
        }
      });
    } catch (e) {
      console.error('Encryption or send error:', e);
    }
  }

  async sendMessage(message) {
    this.queueOrSendMessage(message);
  }

  sendSignal(to, data) {
    if (this.signalingCallback) {
      this.signalingCallback({ to, data });
    }
  }

  getAverageLatency() {
    if (this.latencyMeasurements.length === 0) return 0;
    return Math.round(this.latencyMeasurements.reduce((a, b) => a + b, 0) / this.latencyMeasurements.length);
  }

  getConnectedUserCount() {
    let count = 0;
    this.channelStates.forEach(state => {
      if (state === ConnectionState.CONNECTED) count++;
    });
    return count;
  }

  startLatencyMeasurement() {
    setInterval(() => {
      this.sendMessage({ type: 'ping', timestamp: Date.now() });
    }, 5000);
  }

  close() {
    this.messageQueue = [];
    this.dataChannels.forEach(dc => dc.close());
    this.connections.forEach(pc => pc.close());
    this.dataChannels.clear();
    this.connections.clear();
    this.channelStates.clear();
  }
}
