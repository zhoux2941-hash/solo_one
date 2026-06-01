const EventEmitter = require('events');
const config = require('../config');
const logger = require('../utils/logger');
const zmqClient = require('./zmqClient');
const db = require('./database');
const recorder = require('./recorder');

class FramePipeline extends EventEmitter {
  constructor() {
    super();
    this.streams = new Map();
    this.statsHistory = new Map();
    this.metricsInterval = null;
    this.switchOperations = new Map();
    
    zmqClient.on('frame:processed', this._handleProcessedFrame.bind(this));
    zmqClient.on('switch:complete', this._handleSwitchComplete.bind(this));
    zmqClient.on('switch:progress', this._handleSwitchProgress.bind(this));
  }

  start() {
    this.metricsInterval = setInterval(() => {
      this._collectAndStoreMetrics();
    }, config.metrics.intervalSec * 1000);
    
    logger.info('Frame pipeline started');
  }

  stop() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    logger.info('Frame pipeline stopped');
  }

  registerStream(streamId, sourceType = 'webrtc', sourceId = null, resolution = '640x360') {
    if (this.streams.has(streamId)) {
      return this.streams.get(streamId);
    }

    const [width, height] = resolution.split('x').map(Number);
    const frameBufferSize = width * height * 3 * 2;

    const streamState = {
      id: streamId,
      sourceType,
      sourceId,
      resolution,
      width,
      height,
      scale: config.superres.defaultScale,
      viewers: new Set(),
      inputFps: 0,
      outputFps: 0,
      lastInputTime: 0,
      lastOutputTime: 0,
      frameCount: 0,
      processedFrameCount: 0,
      inputFrameTimes: [],
      outputFrameTimes: [],
      createdAt: Date.now(),
      isActive: true,
      totalDelayMs: 0,
      avgDelayMs: 0,
      currentPsnr: 0,
      currentSsim: 0,
      switchState: 'idle',
      targetScale: null,
      switchStartTime: null,
      switchEndTime: null,
      switchStats: {
        totalSwitches: 0,
        successfulSwitches: 0,
        failedSwitches: 0,
        lastSwitchTimeMs: 0,
        lastSwitchOldScale: 0,
        lastSwitchNewScale: 0,
        lastSwitchBufferedFrames: 0
      },
      metrics: {
        lastSampledTime: Date.now(),
        sampleIntervalMs: config.metrics.intervalSec * 1000,
        framesSinceLastSample: 0,
        nextSampleFrame: null,
        pendingSampleFrame: null
      },
      frameBuffer: {
        size: frameBufferSize,
        buffer: Buffer.alloc(frameBufferSize),
        used: 0
      }
    };

    this.streams.set(streamId, streamState);
    this.statsHistory.set(streamId, {
      fps: [],
      delay: [],
      psnr: [],
      ssim: [],
      timestamps: []
    });

    db.addStream(streamId, sourceType, sourceId, resolution, streamState.scale);

    logger.info('Stream registered', { streamId, sourceType, resolution });
    return streamState;
  }

  unregisterStream(streamId) {
    const stream = this.streams.get(streamId);
    if (!stream) return;

    if (recorder.isRecording(streamId)) {
      recorder.stopRecording(streamId);
    }

    stream.isActive = false;
    stream.endedAt = Date.now();

    db.endStream(streamId, `${stream.scale * parseInt(stream.resolution.split('x')[0]}x${stream.scale * parseInt(stream.resolution.split('x')[1]}`);

    zmqClient.cleanupStream(streamId);

    this.streams.delete(streamId);
    this.statsHistory.delete(streamId);

    logger.info('Stream unregistered', { streamId });
  }

  _shouldSampleFrame(stream) {
    const now = Date.now();
    const timeSinceLastSample = now - stream.metrics.lastSampledTime;
    
    if (timeSinceLastSample >= stream.metrics.sampleIntervalMs) {
      if (stream.metrics.nextSampleFrame === null) {
        const expectedFrames = Math.floor(stream.metrics.sampleIntervalMs / (1000 / Math.max(stream.inputFps, 1)));
        stream.metrics.nextSampleFrame = stream.frameCount + Math.floor(Math.random() * Math.max(1, expectedFrames));
      }
      
      if (stream.frameCount >= stream.metrics.nextSampleFrame) {
        stream.metrics.lastSampledTime = now;
        stream.metrics.nextSampleFrame = null;
        stream.metrics.framesSinceLastSample = 0;
        return true;
      }
    }
    
    stream.metrics.framesSinceLastSample++;
    return false;
  }

  async processInputFrame(streamId, frameData, timestamp = Date.now()) {
    const stream = this.streams.get(streamId);
    if (!stream || !stream.isActive) {
      return false;
    }

    stream.frameCount++;
    stream.lastInputTime = Date.now();
    stream.inputFrameTimes.push(timestamp);
    
    if (stream.inputFrameTimes.length > 30) {
      stream.inputFrameTimes.shift();
    }

    if (stream.inputFrameTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < stream.inputFrameTimes.length; i++) {
        intervals.push(stream.inputFrameTimes[i] - stream.inputFrameTimes[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      stream.inputFps = 1000 / avgInterval;
    }

    if (recorder.isRecording(streamId)) {
      recorder.addInputFrame(streamId, frameData);
    }

    const shouldSample = this._shouldSampleFrame(stream);
    const originalForMetrics = shouldSample ? frameData : null;

    return zmqClient.sendFrame(
      streamId, 
      frameData, 
      timestamp, 
      stream.scale,
      originalForMetrics
    );
  }

  _handleProcessedFrame(result) {
    const { streamId, frame, timestamp, processingTimeMs, scale, fps, psnr, ssim, switchState, targetScale } = result;
    
    const stream = this.streams.get(streamId);
    if (!stream || !stream.isActive) {
      return;
    }

    if (switchState && stream.switchState !== switchState) {
      stream.switchState = switchState;
      if (switchState !== 'idle' && switchState !== 'draining') {
        logger.debug('Scale switch state changed', { streamId, switchState, targetScale });
        this.emit('switch:state', { streamId, switchState, targetScale });
      }
    }
    if (targetScale !== undefined) {
      stream.targetScale = targetScale;
    }

    stream.processedFrameCount++;
    stream.lastOutputTime = Date.now();
    stream.outputFrameTimes.push(Date.now());
    
    if (stream.outputFrameTimes.length > 30) {
      stream.outputFrameTimes.shift();
    }

    if (stream.outputFrameTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < stream.outputFrameTimes.length; i++) {
        intervals.push(stream.outputFrameTimes[i] - stream.outputFrameTimes[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      stream.outputFps = 1000 / avgInterval;
    }

    const endToEndDelay = Date.now() - timestamp;
    stream.totalDelayMs += endToEndDelay;
    stream.avgDelayMs = stream.totalDelayMs / stream.processedFrameCount;

    stream.currentPsnr = psnr;
    stream.currentSsim = ssim;

    const history = this.statsHistory.get(streamId);
    if (history) {
      const now = Date.now();
      history.fps.push(stream.outputFps);
      history.delay.push(endToEndDelay);
      history.psnr.push(psnr);
      history.ssim.push(ssim);
      history.timestamps.push(now);

      const maxPoints = 300;
      if (history.fps.length > maxPoints) {
        history.fps.shift();
        history.delay.shift();
        history.psnr.shift();
        history.ssim.shift();
        history.timestamps.shift();
      }
    }

    if (recorder.isRecording(streamId)) {
      recorder.addOutputFrame(streamId, frame);
    }

    this.emit('frame:available', {
      streamId,
      frame,
      timestamp,
      processingTimeMs,
      endToEndDelay,
      scale,
      fps,
      psnr,
      ssim,
      switchState,
      targetScale
    });
  }

  async setStreamScale(streamId, scale, asyncMode = true) {
    const stream = this.streams.get(streamId);
    if (!stream) {
      return { success: false, error: 'Stream not found' };
    }

    if (!config.superres.allowedScales.includes(scale)) {
      return { 
        success: false, 
        error: `Invalid scale. Allowed: ${config.superres.allowedScales.join(', ')}` 
      };
    }

    if (stream.switchState !== 'idle') {
      return {
        success: false,
        error: `Scale switch already in progress: ${stream.switchState}`
      };
    }

    const oldScale = stream.scale;
    stream.switchStartTime = Date.now();
    stream.switchStats.totalSwitches++;

    logger.info('Initiating scale switch', { streamId, oldScale, newScale: scale, asyncMode });

    if (asyncMode) {
      try {
        const result = await zmqClient.setScaleAsync(streamId, scale);
        if (result.success) {
          stream.scale = scale;
          stream.switchStats.successfulSwitches++;
          logger.info('Scale switch completed successfully', { 
            streamId, 
            oldScale, 
            newScale: scale,
            switchTimeMs: result.details?.switch_time_ms || 0,
            bufferedFrames: result.details?.buffered_frames || 0
          });
          return { 
            success: true, 
            scale, 
            oldScale,
            switchTimeMs: result.details?.switch_time_ms,
            bufferedFrames: result.details?.buffered_frames,
            warmupFrames: result.details?.warmup_frames
          };
        } else {
          stream.switchStats.failedSwitches++;
          logger.error('Scale switch failed', { streamId, oldScale, newScale: scale, error: result.message });
          return { success: false, error: result.message };
        }
      } catch (error) {
        stream.switchStats.failedSwitches++;
        stream.switchState = 'idle';
        stream.targetScale = null;
        logger.error('Scale switch exception', { streamId, error: error.message });
        return { success: false, error: error.message };
      }
    } else {
      stream.scale = scale;
      const result = await zmqClient.setScale(streamId, scale, false);
      if (result.success) {
        stream.switchStats.successfulSwitches++;
        logger.info('Stream scale updated (sync)', { streamId, scale });
        return { success: true, scale, oldScale };
      } else {
        stream.switchStats.failedSwitches++;
        return { success: false, error: result.error || 'Failed to set scale' };
      }
    }
  }

  _handleSwitchComplete(result) {
    const { streamId, success, message, details } = result;
    const stream = this.streams.get(streamId);
    
    if (stream) {
      stream.switchEndTime = Date.now();
      stream.switchState = 'idle';
      stream.targetScale = null;
      
      if (details) {
        stream.switchStats.lastSwitchTimeMs = details.switch_time_ms || 0;
        stream.switchStats.lastSwitchOldScale = details.old_scale || stream.switchStats.lastSwitchOldScale;
        stream.switchStats.lastSwitchNewScale = details.new_scale || stream.scale;
        stream.switchStats.lastSwitchBufferedFrames = details.buffered_frames || 0;
      }

      logger.info('Scale switch completed', { streamId, success, message, details });
      this.emit('switch:complete', { streamId, success, message, details });
    }
  }

  _handleSwitchProgress(progress) {
    const { streamId } = progress;
    const stream = this.streams.get(streamId);
    
    if (stream) {
      logger.debug('Scale switch progress', { streamId, ...progress });
      this.emit('switch:progress', { streamId, ...progress });
    }
  }

  getStreamStats(streamId = null) {
    if (streamId) {
      const stream = this.streams.get(streamId);
      if (!stream) return null;
      return this._formatStreamStats(stream);
    }

    const stats = {};
    for (const [id, stream] of this.streams) {
      stats[id] = this._formatStreamStats(stream);
    }
    return stats;
  }

  _formatStreamStats(stream) {
    const history = this.statsHistory.get(stream.id);
    return {
      streamId: stream.id,
      sourceType: stream.sourceType,
      resolution: stream.resolution,
      outputResolution: `${stream.scale * parseInt(stream.resolution.split('x')[0])}x${stream.scale * parseInt(stream.resolution.split('x')[1])}`,
      scale: stream.scale,
      viewerCount: stream.viewers.size,
      inputFps: stream.inputFps.toFixed(1),
      outputFps: stream.outputFps.toFixed(1),
      avgDelayMs: stream.avgDelayMs.toFixed(1),
      psnr: stream.currentPsnr.toFixed(2),
      ssim: stream.currentSsim.toFixed(4),
      frameCount: stream.frameCount,
      processedFrameCount: stream.processedFrameCount,
      isActive: stream.isActive,
      createdAt: stream.createdAt,
      switchState: stream.switchState,
      targetScale: stream.targetScale,
      switchStartTime: stream.switchStartTime,
      switchEndTime: stream.switchEndTime,
      switchStats: { ...stream.switchStats },
      history: history ? {
        fps: history.fps.slice(-60),
        delay: history.delay.slice(-60),
        psnr: history.psnr.slice(-60),
        ssim: history.ssim.slice(-60),
        timestamps: history.timestamps.slice(-60)
      } : null
    };
  }

  async _collectAndStoreMetrics() {
    const result = await zmqClient.getStats();
    
    if (result && result.success && result.server_stats) {
      const serverStats = result.server_stats;
      db.addSystemMetrics({
        gpuUtilization: serverStats.gpu_utilization || 0,
        gpuMemoryGb: serverStats.gpu_memory?.allocated_gb || 0,
        cpuUsage: serverStats.cpu_usage || 0,
        memoryUsagePercent: serverStats.system_memory?.percent_used || 0,
        activeStreams: serverStats.active_streams || this.streams.size
      });
    }

    for (const [streamId, stream] of this.streams) {
      if (stream.currentPsnr > 0) {
        db.addQualityMetrics(streamId, {
          psnr: stream.currentPsnr,
          ssim: stream.currentSsim,
          scale: stream.scale,
          fps: stream.outputFps,
          processingTimeMs: stream.avgDelayMs,
          endToEndDelayMs: stream.avgDelayMs
        });
      }
    }

    this.emit('stats:update', this.getStreamStats());
  }

  addViewer(streamId, viewerId) {
    const stream = this.streams.get(streamId);
    if (stream) {
      stream.viewers.add(viewerId);
      return true;
    }
    return false;
  }

  removeViewer(streamId, viewerId) {
    const stream = this.streams.get(streamId);
    if (stream) {
      stream.viewers.delete(viewerId);
      return true;
    }
    return false;
  }

  getActiveStreams() {
    return Array.from(this.streams.values()).map(s => this._formatStreamStats(s));
  }
}

const framePipeline = new FramePipeline();
module.exports = framePipeline;
