const { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, MediaStream } = require('wrtc');
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');
const config = require('../config');
const logger = require('../utils/logger');
const framePipeline = require('./framePipeline');

class WebRTCService extends EventEmitter {
  constructor() {
    super();
    this.peerConnections = new Map();
    this.incomingStreams = new Map();
    this.outgoingStreams = new Map();
    this.videoTrackProcessors = new Map();
    this.iceCandidates = new Map();
  }

  async createPublisher(peerId, sdp, type = 'offer') {
    if (this.incomingStreams.size >= config.media.maxStreams) {
      return { 
        success: false, 
        error: `Maximum streams reached (${config.media.maxStreams})` 
      };
    }

    const streamId = `stream_${uuidv4().slice(0, 8)}`;
    
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    });

    this.peerConnections.set(peerId, pc);
    this.iceCandidates.set(peerId, []);

    pc.ontrack = (event) => {
      logger.info('Received track from publisher', { 
        peerId, 
        streamId, 
        trackKind: event.track.kind 
      });

      if (event.track.kind === 'video') {
        this._setupVideoProcessing(streamId, event.track, event.streams[0]);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.iceCandidates.get(peerId)?.push(event.candidate);
        this.emit('ice:candidate', { 
          peerId, 
          candidate: event.candidate 
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      logger.info('ICE connection state changed', { 
        peerId, 
        state: pc.iceConnectionState 
      });
      
      if (pc.iceConnectionState === 'disconnected' || 
          pc.iceConnectionState === 'failed' ||
          pc.iceConnectionState === 'closed') {
        this._cleanupPublisher(peerId, streamId);
      }
    };

    try {
      const remoteDesc = new RTCSessionDescription({ type, sdp });
      await pc.setRemoteDescription(remoteDesc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const stream = framePipeline.registerStream(
        streamId, 
        'webrtc', 
        peerId, 
        '640x360'
      );

      this.incomingStreams.set(peerId, {
        streamId,
        peerConnection: pc,
        createdAt: Date.now()
      });

      logger.info('Publisher created', { peerId, streamId });
      
      return {
        success: true,
        streamId,
        sdp: answer.sdp,
        type: answer.type,
        iceCandidates: this.iceCandidates.get(peerId) || []
      };
    } catch (error) {
      logger.error('Failed to create publisher', { error: error.message, peerId });
      this._cleanupPublisher(peerId, streamId);
      return { success: false, error: error.message };
    }
  }

  async createViewer(peerId, streamId, sdp, type = 'offer') {
    const streams = framePipeline.getActiveStreams();
    const streamExists = streams.some(s => s.streamId === streamId);

    if (!streamExists) {
      return { success: false, error: `Stream ${streamId} not found` };
    }

    const viewerId = `viewer_${uuidv4().slice(0, 8)}`;
    
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    });

    const fullPeerId = `${peerId}_${viewerId}`;
    this.peerConnections.set(fullPeerId, pc);
    this.iceCandidates.set(fullPeerId, []);

    const videoTrack = this._createVideoTrack(streamId);
    if (videoTrack) {
      pc.addTrack(videoTrack);
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.iceCandidates.get(fullPeerId)?.push(event.candidate);
        this.emit('ice:candidate', { 
          peerId: fullPeerId, 
          candidate: event.candidate 
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || 
          pc.iceConnectionState === 'failed' ||
          pc.iceConnectionState === 'closed') {
        this._cleanupViewer(fullPeerId, streamId);
      }
    };

    try {
      const remoteDesc = new RTCSessionDescription({ type, sdp });
      await pc.setRemoteDescription(remoteDesc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.outgoingStreams.set(fullPeerId, {
        streamId,
        viewerId,
        peerConnection: pc,
        createdAt: Date.now()
      });

      framePipeline.addViewer(streamId, fullPeerId);

      logger.info('Viewer created', { peerId: fullPeerId, streamId });

      return {
        success: true,
        viewerId,
        sdp: answer.sdp,
        type: answer.type,
        iceCandidates: this.iceCandidates.get(fullPeerId) || []
      };
    } catch (error) {
      logger.error('Failed to create viewer', { error: error.message, peerId });
      this._cleanupViewer(fullPeerId, streamId);
      return { success: false, error: error.message };
    }
  }

  async addIceCandidate(peerId, candidate) {
    const pc = this.peerConnections.get(peerId);
    if (!pc) {
      return { success: false, error: 'Peer connection not found' };
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
      return { success: true };
    } catch (error) {
      logger.error('Failed to add ICE candidate', { error: error.message, peerId });
      return { success: false, error: error.message };
    }
  }

  _setupVideoProcessing(streamId, track, stream) {
    const processor = {
      streamId,
      track,
      stream,
      frameCount: 0,
      lastFrameTime: Date.now(),
      canvas: null,
      ctx: null
    };

    this.videoTrackProcessors.set(streamId, processor);

    const frameHandler = async (event) => {
      try {
        const frame = event.frame;
        if (!frame) return;

        const timestamp = Date.now();
        
        const width = frame.displayWidth;
        const height = frame.displayHeight;

        if (!processor.canvas) {
          processor.canvas = new (require('canvas')).Canvas(width, height);
          processor.ctx = processor.canvas.getContext('2d');
        }

        processor.ctx.drawImage(frame, 0, 0, width, height);
        
        const frameData = processor.canvas.toBuffer('image/jpeg', { quality: 0.85 });
        
        await framePipeline.processInputFrame(streamId, frameData, timestamp);

        processor.frameCount++;
        processor.lastFrameTime = timestamp;

        frame.close();
      } catch (error) {
        logger.error('Frame processing error', { error: error.message, streamId });
      }
    };

    try {
      track.onframe = frameHandler;
    } catch (e) {
      logger.warn('onframe not supported, using alternative method', { streamId });
    }
  }

  _createVideoTrack(streamId) {
    try {
      const canvas = new (require('canvas')).Canvas(1280, 720);
      const ctx = canvas.getContext('2d');
      
      let lastFrame = null;
      
      const onFrameAvailable = (frameData) => {
        if (frameData.streamId === streamId) {
          lastFrame = frameData.frame;
        }
      };

      framePipeline.on('frame:available', onFrameAvailable);

      const { RTCVideoSource } = require('wrtc');
      const source = new RTCVideoSource();
      const track = source.createTrack();

      const interval = setInterval(() => {
        if (lastFrame) {
          try {
            const img = new (require('canvas')).Image();
            img.onload = () => {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              source.onFrame(canvas);
            };
            img.onerror = (err) => {
              logger.error('Image load error', { error: err.message });
            };
            img.src = Buffer.from(lastFrame);
          } catch (error) {
            logger.error('Frame rendering error', { error: error.message });
          }
        }
      }, 1000 / config.media.targetFps);

      track._interval = interval;
      track._cleanup = () => {
        clearInterval(interval);
        framePipeline.removeListener('frame:available', onFrameAvailable);
      };

      return track;
    } catch (error) {
      logger.error('Failed to create video track', { error: error.message });
      return null;
    }
  }

  _cleanupPublisher(peerId, streamId) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      try {
        pc.close();
      } catch (e) {}
      this.peerConnections.delete(peerId);
    }

    this.iceCandidates.delete(peerId);
    this.incomingStreams.delete(peerId);
    this.videoTrackProcessors.delete(streamId);
    framePipeline.unregisterStream(streamId);

    logger.info('Publisher cleaned up', { peerId, streamId });
  }

  _cleanupViewer(peerId, streamId) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      try {
        pc.getSenders().forEach(sender => {
          if (sender.track && sender.track._cleanup) {
            sender.track._cleanup();
          }
        });
        pc.close();
      } catch (e) {}
      this.peerConnections.delete(peerId);
    }

    this.iceCandidates.delete(peerId);
    this.outgoingStreams.delete(peerId);
    framePipeline.removeViewer(streamId, peerId);

    logger.info('Viewer cleaned up', { peerId, streamId });
  }

  closeConnection(peerId) {
    const incoming = this.incomingStreams.get(peerId);
    if (incoming) {
      this._cleanupPublisher(peerId, incoming.streamId);
      return { success: true };
    }

    for (const [id, outgoing] of this.outgoingStreams) {
      if (id.startsWith(peerId + '_')) {
        this._cleanupViewer(id, outgoing.streamId);
      }
    }

    return { success: true };
  }

  getStats() {
    return {
      incomingStreams: this.incomingStreams.size,
      outgoingStreams: this.outgoingStreams.size,
      peerConnections: this.peerConnections.size,
      maxStreams: config.media.maxStreams
    };
  }
}

const webrtcService = new WebRTCService();
module.exports = webrtcService;
