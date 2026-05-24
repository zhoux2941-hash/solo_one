import { ResolutionAdapter } from './resolution-adapter.js';

export class WebRTCManager {
  constructor(role) {
    this.role = role;
    this.peerConnection = null;
    this.dataChannel = null;
    this.signalingWs = null;
    this.roomId = null;
    this.clientId = null;
    this.localStream = null;
    this.remoteStream = null;
    
    this.onRemoteStream = null;
    this.onDataChannelMessage = null;
    this.onConnectionStateChange = null;
    this.onDataChannelOpen = null;
    
    this.statsInterval = null;
    this.lastFrameReceived = 0;
    this.frameCount = 0;
    
    this.videoSender = null;
    this.targetBitrate = 8000000;
    this.minBitrate = 4000000;
    this.maxBitrate = 15000000;
    this.currentBitrate = 8000000;
    
    this.annotationBuffer = [];
    this.annotationBufferTimer = null;
    this.bufferTimeout = 16;
    
    this.clockOffset = 0;
    this.lastSyncTime = 0;
    
    this.resolutionAdapter = null;
    this.resolutionAdaptEnabled = false;
    this.currentResolutionScale = 1.0;
    this.baseWidth = 3840;
    this.baseHeight = 2160;
    
    this.onResolutionChange = null;
    this.onMotionUpdate = null;
  }

  async connectSignaling(serverUrl) {
    return new Promise((resolve, reject) => {
      this.signalingWs = new WebSocket(serverUrl);
      
      this.signalingWs.onopen = () => {
        console.log('Signaling server connected');
        resolve();
      };
      
      this.signalingWs.onerror = (error) => {
        console.error('Signaling connection error:', error);
        reject(error);
      };
      
      this.signalingWs.onmessage = (event) => {
        this.handleSignalingMessage(JSON.parse(event.data));
      };
      
      this.signalingWs.onclose = () => {
        console.log('Signaling connection closed');
      };
    });
  }

  async createRoom() {
    this.signalingWs.send(JSON.stringify({
      type: 'create-room',
      role: this.role
    }));
  }

  async joinRoom(roomId) {
    this.signalingWs.send(JSON.stringify({
      type: 'join-room',
      roomId,
      role: this.role
    }));
  }

  async handleSignalingMessage(message) {
    switch (message.type) {
      case 'room-created':
        this.roomId = message.roomId;
        this.clientId = message.clientId;
        console.log('Room created:', this.roomId);
        break;

      case 'joined-room':
        this.roomId = message.roomId;
        this.clientId = message.clientId;
        console.log('Joined room:', this.roomId);
        if (message.peers.length > 0) {
          await this.createOffer();
        }
        break;

      case 'peer-joined':
        console.log('Peer joined:', message.peerId);
        break;

      case 'peer-disconnected':
        console.log('Peer disconnected');
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange('disconnected');
        }
        break;

      case 'offer':
        await this.handleOffer(message);
        break;

      case 'answer':
        await this.handleAnswer(message);
        break;

      case 'ice-candidate':
        await this.handleIceCandidate(message);
        break;

      case 'annotation':
        if (this.onDataChannelMessage) {
          this.onDataChannelMessage({
            type: 'annotation',
            data: message.data,
            timestamp: message.timestamp
          });
        }
        break;

      case 'clear-annotations':
        if (this.onDataChannelMessage) {
          this.onDataChannelMessage({ type: 'clear-annotations' });
        }
        break;

      case 'sync-request':
        this.sendSignalingMessage({
          type: 'sync-response',
          to: message.from,
          requestTime: message.timestamp,
          receiveTime: Date.now()
        });
        break;

      case 'sync-response':
        const now = Date.now();
        const rtt = now - message.requestTime;
        const oneWayDelay = rtt / 2;
        this.clockOffset = (message.receiveTime + oneWayDelay) - now;
        this.lastSyncTime = now;
        
        if (this.onDataChannelMessage) {
          this.onDataChannelMessage({
            type: 'sync-response',
            requestTime: message.requestTime,
            responseTime: message.receiveTime,
            rtt: rtt,
            clockOffset: this.clockOffset
          });
        }
        break;

      case 'error':
        console.error('Signaling error:', message.message);
        break;
    }
  }

  async createPeerConnection() {
    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      sdpSemantics: 'unified-plan'
    };

    this.peerConnection = new RTCPeerConnection(config);

    this.peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      if (event.track.kind === 'video') {
        this.remoteStream = event.streams[0];
        if (this.onRemoteStream) {
          this.onRemoteStream(this.remoteStream);
        }
      }
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection.connectionState);
      if (this.peerConnection.connectionState === 'connected') {
        this.setupBitrateAdaptation();
      }
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(this.peerConnection.connectionState);
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection.iceConnectionState);
    };

    if (this.role === 'surgeon') {
      this.dataChannel = this.peerConnection.createDataChannel('annotations', {
        ordered: false,
        maxRetransmits: 0,
        protocol: 'binary'
      });
      this.setupDataChannel();
    } else {
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannel();
      };
    }
  }

  setupDataChannel() {
    this.dataChannel.binaryType = 'arraybuffer';
    
    this.dataChannel.onopen = () => {
      console.log('Data channel opened - low latency mode');
      if (this.onDataChannelOpen) {
        this.onDataChannelOpen();
      }
    };

    this.dataChannel.onmessage = (event) => {
      try {
        let message;
        if (event.data instanceof ArrayBuffer) {
          message = this.decodeBinaryMessage(event.data);
        } else {
          message = JSON.parse(event.data);
        }
        
        if (message.t) {
          message.clientTime = performance.now();
          message.networkLatency = message.clientTime - message.ts;
        }
        
        if (this.onDataChannelMessage) {
          this.onDataChannelMessage(message);
        }
      } catch (e) {
        console.error('Error parsing data channel message:', e);
      }
    };

    this.dataChannel.onclose = () => {
      console.log('Data channel closed');
      this.clearAnnotationBuffer();
    };

    this.dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
    };
  }

  encodeBinaryMessage(message) {
    const jsonStr = JSON.stringify(message);
    const encoder = new TextEncoder();
    return encoder.encode(jsonStr);
  }

  decodeBinaryMessage(buffer) {
    const decoder = new TextDecoder();
    const jsonStr = decoder.decode(buffer);
    return JSON.parse(jsonStr);
  }

  async addStream(stream) {
    this.localStream = stream;
    
    stream.getTracks().forEach(track => {
      const sender = this.peerConnection.addTrack(track, stream);
      
      if (track.kind === 'video') {
        this.videoSender = sender;
        this.applyVideoBitrateLimit();
      }
    });
  }

  async applyVideoBitrateLimit() {
    if (!this.videoSender) return;
    
    try {
      const parameters = this.videoSender.getParameters();
      
      if (!parameters.encodings) {
        parameters.encodings = [{}];
      }
      
      parameters.encodings.forEach(encoding => {
        encoding.maxBitrate = this.maxBitrate;
        encoding.maxFramerate = 30;
        
        encoding.scaleResolutionDownBy = 1.0;
        
        encoding.rid = 'h';
      });
      
      await this.videoSender.setParameters(parameters);
      console.log('Video bitrate limit applied:', this.maxBitrate / 1000000, 'Mbps');
    } catch (error) {
      console.warn('Failed to set video bitrate:', error);
      this.applyBitrateViaSDP();
    }
  }

  async applyBitrateViaSDP() {
    try {
      const offer = await this.peerConnection.createOffer();
      let sdp = offer.sdp;
      
      const bitrateKbps = Math.floor(this.maxBitrate / 1000);
      
      sdp = sdp.replace(/(m=video.*\r\n)/, `$1b=AS:${bitrateKbps}\r\n`);
      
      if (!sdp.includes('b=AS:')) {
        sdp = sdp.replace(/(c=IN.*\r\n)/, `$1b=AS:${bitrateKbps}\r\n`);
      }
      
      await this.peerConnection.setLocalDescription({
        type: 'offer',
        sdp: sdp
      });
      
      console.log('Bitrate limit applied via SDP:', bitrateKbps, 'kbps');
    } catch (error) {
      console.warn('Failed to apply bitrate via SDP:', error);
    }
  }

  setTargetBitrate(bitrate) {
    this.targetBitrate = Math.max(this.minBitrate, Math.min(this.maxBitrate, bitrate));
    console.log('Target bitrate set:', this.targetBitrate / 1000000, 'Mbps');
    this.applyVideoBitrateLimit();
  }

  setupBitrateAdaptation() {
    this.bitrateInterval = setInterval(async () => {
      if (this.peerConnection.connectionState !== 'connected') return;
      
      const stats = await this.getStats();
      if (!stats) return;
      
      this.adaptBitrate(stats);
    }, 1000);
  }

  adaptBitrate(stats) {
    if (!this.adaptiveBitrateEnabled || !stats.availableOutgoingBitrate) return;
    
    const availableBitrate = stats.availableOutgoingBitrate;
    const packetLoss = stats.packetsLost || 0;
    const rtt = stats.currentRoundTripTime || 0;
    
    let newBitrate = this.currentBitrate;
    
    if (packetLoss > 0.05) {
      newBitrate *= 0.8;
    } else if (packetLoss > 0.02) {
      newBitrate *= 0.95;
    } else if (rtt < 0.05 && packetLoss < 0.01) {
      newBitrate = Math.min(newBitrate * 1.05, availableBitrate * 0.8);
    }
    
    newBitrate = Math.max(this.minBitrate, Math.min(this.maxBitrate, newBitrate));
    
    if (Math.abs(newBitrate - this.currentBitrate) / this.currentBitrate > 0.1) {
      this.currentBitrate = newBitrate;
      this.setTargetBitrate(newBitrate);
    }
  }

  enableResolutionAdaptation(videoElement) {
    if (this.role !== 'surgeon') {
      console.warn('Resolution adaptation only available for surgeon role');
      return;
    }
    
    this.resolutionAdapter = new ResolutionAdapter(videoElement);
    this.resolutionAdapter.onResolutionChange = (data) => {
      this.handleResolutionChange(data);
    };
    this.resolutionAdapter.onMotionUpdate = (data) => {
      if (this.onMotionUpdate) {
        this.onMotionUpdate(data);
      }
    };
    
    this.resolutionAdaptEnabled = true;
    this.resolutionAdapter.start();
    console.log('Resolution adaptation enabled');
  }

  disableResolutionAdaptation() {
    if (this.resolutionAdapter) {
      this.resolutionAdapter.stop();
      this.resolutionAdapter = null;
    }
    this.resolutionAdaptEnabled = false;
    console.log('Resolution adaptation disabled');
  }

  async handleResolutionChange(data) {
    const { newResolution, motionLevel } = data;
    
    this.currentResolutionScale = newResolution.width / this.baseWidth;
    console.log(`Adapting resolution: ${newResolution.name}, motion: ${(motionLevel * 100).toFixed(1)}%`);
    
    if (this.videoSender) {
      try {
        const parameters = this.videoSender.getParameters();
        
        if (parameters.encodings && parameters.encodings.length > 0) {
          parameters.encodings.forEach(encoding => {
            encoding.scaleResolutionDownBy = 1 / this.currentResolutionScale;
            encoding.maxBitrate = newResolution.maxBitrate;
          });
          
          await this.videoSender.setParameters(parameters);
          console.log(`Resolution scale updated: ${(this.currentResolutionScale * 100).toFixed(0)}%`);
        }
      } catch (error) {
        console.warn('Failed to set resolution scale:', error);
      }
    }
    
    if (this.onResolutionChange) {
      this.onResolutionChange({
        resolution: newResolution,
        motionLevel,
        scale: this.currentResolutionScale
      });
    }
  }

  setMotionThresholds(low, high) {
    if (this.resolutionAdapter) {
      this.resolutionAdapter.setMotionThresholds(low, high);
    }
  }

  async createOffer() {
    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: this.role === 'expert',
        voiceActivityDetection: true
      });
      
      await this.peerConnection.setLocalDescription(offer);
      
      this.sendSignalingMessage({
        type: 'offer',
        sdp: offer.sdp
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }

  async handleOffer(message) {
    try {
      await this.peerConnection.setRemoteDescription({
        type: 'offer',
        sdp: message.sdp
      });
      
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      
      this.sendSignalingMessage({
        type: 'answer',
        sdp: answer.sdp
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  async handleAnswer(message) {
    try {
      await this.peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: message.sdp
      });
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  async handleIceCandidate(message) {
    try {
      if (message.candidate) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  sendSignalingMessage(message) {
    if (this.signalingWs && this.signalingWs.readyState === WebSocket.OPEN) {
      this.signalingWs.send(JSON.stringify(message));
    }
  }

  sendAnnotation(data) {
    const message = {
      t: 'a',
      d: data,
      ts: performance.now()
    };
    
    this.annotationBuffer.push(message);
    
    if (!this.annotationBufferTimer) {
      this.annotationBufferTimer = setTimeout(() => {
        this.flushAnnotationBuffer();
      }, this.bufferTimeout);
    }
  }

  flushAnnotationBuffer() {
    if (this.annotationBuffer.length === 0) {
      this.annotationBufferTimer = null;
      return;
    }
    
    const batchMessage = {
      t: 'batch',
      c: this.annotationBuffer.length,
      d: this.annotationBuffer.map(m => m.d),
      ts: performance.now()
    };
    
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        const binaryData = this.encodeBinaryMessage(batchMessage);
        this.dataChannel.send(binaryData);
      } catch (e) {
        this.dataChannel.send(JSON.stringify(batchMessage));
      }
    } else {
      this.annotationBuffer.forEach(msg => {
        this.sendSignalingMessage({
          type: 'annotation',
          data: msg.d
        });
      });
    }
    
    this.annotationBuffer = [];
    this.annotationBufferTimer = null;
  }

  clearAnnotationBuffer() {
    if (this.annotationBufferTimer) {
      clearTimeout(this.annotationBufferTimer);
      this.annotationBufferTimer = null;
    }
    this.annotationBuffer = [];
  }

  clearAnnotations() {
    const message = {
      t: 'clear',
      ts: performance.now()
    };
    
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        const binaryData = this.encodeBinaryMessage(message);
        this.dataChannel.send(binaryData);
      } catch (e) {
        this.dataChannel.send(JSON.stringify(message));
      }
    } else {
      this.sendSignalingMessage({ type: 'clear-annotations' });
    }
  }

  async getStats() {
    if (!this.peerConnection) return null;
    
    const stats = await this.peerConnection.getStats();
    const result = {};
    
    stats.forEach(report => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        result.framesReceived = report.framesReceived;
        result.framesDecoded = report.framesDecoded;
        result.bytesReceived = report.bytesReceived;
        result.jitter = report.jitter;
        result.packetsLost = report.packetsLost;
        result.packetsLostRate = report.packetsLost / (report.packetsReceived || 1);
        result.frameWidth = report.frameWidth;
        result.frameHeight = report.frameHeight;
        result.framesPerSecond = report.framesPerSecond;
      }
      
      if (report.type === 'outbound-rtp' && report.kind === 'video') {
        result.framesEncoded = report.framesEncoded;
        result.framesSent = report.framesSent;
        result.bytesSent = report.bytesSent;
        result.nackCount = report.nackCount;
        result.targetBitrate = report.targetBitrate;
        result.totalPacketSendDelay = report.totalPacketSendDelay;
      }
      
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        result.currentRoundTripTime = report.currentRoundTripTime;
        result.availableOutgoingBitrate = report.availableOutgoingBitrate;
        result.availableIncomingBitrate = report.availableIncomingBitrate;
        result.nominated = report.nominated;
        result.bytesSent = report.bytesSent;
        result.bytesReceived = report.bytesReceived;
      }
      
      if (report.type === 'remote-inbound-rtp' && report.kind === 'video') {
        result.remotePacketsLost = report.packetsLost;
        result.remoteJitter = report.jitter;
        result.remoteTimestamp = report.timestamp;
      }
    });
    
    return result;
  }

  startStatsMonitoring(callback, interval = 500) {
    this.statsInterval = setInterval(async () => {
      const stats = await this.getStats();
      if (stats && callback) {
        callback(stats);
      }
    }, interval);
  }

  stopStatsMonitoring() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
    if (this.bitrateInterval) {
      clearInterval(this.bitrateInterval);
      this.bitrateInterval = null;
    }
  }

  close() {
    this.stopStatsMonitoring();
    this.clearAnnotationBuffer();
    this.disableResolutionAdaptation();
    
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    
    if (this.signalingWs) {
      this.signalingWs.close();
    }
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
  }
}
