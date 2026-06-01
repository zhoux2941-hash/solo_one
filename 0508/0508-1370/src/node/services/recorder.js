const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const config = require('../config');
const logger = require('../utils/logger');
const db = require('./database');

class FFmpegEncoder {
  constructor(outputPath, framerate = 15) {
    this.outputPath = outputPath;
    this.framerate = framerate;
    this.process = null;
    this.isStarted = false;
    this.isClosed = false;
    this.frameCount = 0;
    this.errorBuffer = [];
    
    this._initFFmpeg();
  }

  _initFFmpeg() {
    const args = [
      '-y',
      '-f', 'image2pipe',
      '-framerate', this.framerate.toString(),
      '-i', '-',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-tune', 'zerolatency',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      this.outputPath
    ];

    logger.debug('Starting FFmpeg encoder', { outputPath: this.outputPath, args: args.join(' ') });

    this.process = spawn('ffmpeg', args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.process.stdin.on('error', (err) => {
      logger.warn('FFmpeg stdin error', { error: err.message, outputPath: this.outputPath });
    });

    this.process.stdout.on('data', (data) => {
    });

    this.process.stderr.on('data', (data) => {
      const msg = data.toString();
      this.errorBuffer.push(msg);
      if (this.errorBuffer.length > 50) {
        this.errorBuffer.shift();
      }
    });

    this.process.on('error', (err) => {
      logger.error('FFmpeg process error', { error: err.message, outputPath: this.outputPath });
      this.isClosed = true;
    });

    this.process.on('exit', (code, signal) => {
      logger.debug('FFmpeg process exited', { 
        code, 
        signal, 
        outputPath: this.outputPath,
        frameCount: this.frameCount
      });
      this.isClosed = true;
    });

    this.isStarted = true;
  }

  writeFrame(frameData) {
    if (!this.isStarted || this.isClosed || !this.process) {
      return false;
    }

    try {
      const canWrite = this.process.stdin.write(frameData);
      this.frameCount++;
      
      if (!canWrite) {
        return new Promise((resolve) => {
          this.process.stdin.once('drain', () => {
            resolve(true);
          });
        });
      }
      
      return true;
    } catch (err) {
      logger.warn('FFmpeg writeFrame error', { 
        error: err.message, 
        outputPath: this.outputPath,
        frameCount: this.frameCount
      });
      return false;
    }
  }

  async finalize() {
    if (!this.isStarted || this.isClosed) {
      return { success: true, frameCount: this.frameCount };
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        logger.warn('FFmpeg finalize timeout, force killing', { outputPath: this.outputPath });
        if (this.process) {
          this.process.kill('SIGKILL');
        }
        resolve({ success: false, frameCount: this.frameCount, error: 'timeout' });
      }, 30000);

      this.process.once('exit', (code) => {
        clearTimeout(timeout);
        this.isClosed = true;
        
        if (code === 0 || code === 255) {
          logger.info('FFmpeg finalize successful', { 
            outputPath: this.outputPath, 
            frameCount: this.frameCount 
          });
          resolve({ success: true, frameCount: this.frameCount });
        } else {
          logger.error('FFmpeg finalize failed', { 
            code, 
            outputPath: this.outputPath,
            stderr: this.errorBuffer.slice(-5).join('\n')
          });
          resolve({ 
            success: false, 
            frameCount: this.frameCount, 
            error: `FFmpeg exited with code ${code}`,
            stderr: this.errorBuffer.slice(-5).join('\n')
          });
        }
      });

      try {
        this.process.stdin.end(() => {
          logger.debug('FFmpeg stdin closed', { outputPath: this.outputPath });
        });
      } catch (err) {
        logger.warn('FFmpeg stdin end error', { error: err.message, outputPath: this.outputPath });
        this.process.kill('SIGTERM');
      }
    });
  }

  kill() {
    if (this.process && !this.isClosed) {
      try {
        this.process.kill('SIGKILL');
      } catch (e) {}
      this.isClosed = true;
    }
  }
}

class VideoRecorder {
  constructor() {
    this.recordings = new Map();
    this._ensureDirs();
  }

  _ensureDirs() {
    if (!fs.existsSync(config.paths.recordings)) {
      fs.mkdirSync(config.paths.recordings, { recursive: true });
    }
  }

  startRecording(streamId, scale = 2, framerate = 15) {
    if (this.recordings.has(streamId)) {
      return { success: false, error: 'Recording already in progress' };
    }

    const recordingId = uuidv4();
    const timestamp = Date.now();
    
    const inputPath = path.join(config.paths.recordings, `${streamId}_${timestamp}_input.mp4`);
    const outputPath = path.join(config.paths.recordings, `${streamId}_${timestamp}_output.mp4`);

    try {
      const inputEncoder = new FFmpegEncoder(inputPath, framerate);
      const outputEncoder = new FFmpegEncoder(outputPath, framerate);

      const recording = {
        id: recordingId,
        streamId,
        inputPath,
        outputPath,
        scale,
        startTime: Date.now(),
        inputEncoder,
        outputEncoder,
        isRecording: true,
        framerate,
        inputFrameCount: 0,
        outputFrameCount: 0,
        lastFlushTime: Date.now()
      };

      this.recordings.set(streamId, recording);
      db.addRecording(streamId, recordingId, inputPath, outputPath, scale);

      logger.info('Recording started', { 
        streamId, 
        recordingId, 
        inputPath, 
        outputPath,
        framerate
      });
      
      return { success: true, recordingId, inputPath, outputPath };
    } catch (error) {
      logger.error('Failed to start recording', { error: error.message, streamId });
      return { success: false, error: error.message };
    }
  }

  addInputFrame(streamId, frameData) {
    const recording = this.recordings.get(streamId);
    if (!recording || !recording.isRecording) return false;

    try {
      const result = recording.inputEncoder.writeFrame(frameData);
      if (result !== false) {
        recording.inputFrameCount++;
        
        if (recording.inputFrameCount % 300 === 0) {
          logger.debug('Recording input frames', { 
            streamId, 
            count: recording.inputFrameCount 
          });
        }
      }
      return true;
    } catch (error) {
      logger.warn('Failed to add input frame', { error: error.message, streamId });
      return false;
    }
  }

  addOutputFrame(streamId, frameData) {
    const recording = this.recordings.get(streamId);
    if (!recording || !recording.isRecording) return false;

    try {
      const result = recording.outputEncoder.writeFrame(frameData);
      if (result !== false) {
        recording.outputFrameCount++;
        
        if (recording.outputFrameCount % 300 === 0) {
          logger.debug('Recording output frames', { 
            streamId, 
            count: recording.outputFrameCount 
          });
        }
      }
      return true;
    } catch (error) {
      logger.warn('Failed to add output frame', { error: error.message, streamId });
      return false;
    }
  }

  async stopRecording(streamId) {
    const recording = this.recordings.get(streamId);
    if (!recording) {
      return { success: false, error: 'No recording found' };
    }

    logger.info('Stopping recording', { 
      streamId, 
      inputFrames: recording.inputFrameCount,
      outputFrames: recording.outputFrameCount
    });

    recording.isRecording = false;
    const durationSec = (Date.now() - recording.startTime) / 1000;

    try {
      const [inputResult, outputResult] = await Promise.all([
        recording.inputEncoder.finalize(),
        recording.outputEncoder.finalize()
      ]);

      let success = true;
      let errors = [];

      if (!inputResult.success) {
        success = false;
        errors.push(`Input encoding failed: ${inputResult.error}`);
      }
      if (!outputResult.success) {
        success = false;
        errors.push(`Output encoding failed: ${outputResult.error}`);
      }

      if (!success) {
        logger.error('Recording compilation had errors', { 
          streamId, 
          errors: errors.join('; '),
          inputFrames: inputResult.frameCount,
          outputFrames: outputResult.frameCount
        });
      }

      db.endRecording(recording.id, durationSec);

      this.recordings.delete(streamId);

      logger.info('Recording stopped', { 
        streamId, 
        recordingId: recording.id, 
        durationSec: durationSec.toFixed(2),
        inputFrames: inputResult.frameCount,
        outputFrames: outputResult.frameCount,
        inputPath: recording.inputPath,
        outputPath: recording.outputPath
      });

      return {
        success: true,
        recordingId: recording.id,
        inputPath: recording.inputPath,
        outputPath: recording.outputPath,
        durationSec,
        inputFrames: inputResult.frameCount,
        outputFrames: outputResult.frameCount
      };
    } catch (error) {
      logger.error('Failed to stop recording', { error: error.message, streamId });
      
      try {
        recording.inputEncoder.kill();
        recording.outputEncoder.kill();
      } catch (e) {}
      
      this.recordings.delete(streamId);
      
      return { success: false, error: error.message };
    }
  }

  getRecordingInfo(recordingId) {
    return db.getRecording(recordingId);
  }

  getRecordings(streamId = null) {
    return db.getRecordings(streamId);
  }

  isRecording(streamId) {
    return this.recordings.has(streamId) && this.recordings.get(streamId).isRecording;
  }

  getRecording(streamId) {
    const recording = this.recordings.get(streamId);
    if (!recording) return null;
    
    return {
      id: recording.id,
      streamId: recording.streamId,
      inputPath: recording.inputPath,
      outputPath: recording.outputPath,
      scale: recording.scale,
      startTime: recording.startTime,
      isRecording: recording.isRecording,
      inputFrameCount: recording.inputFrameCount,
      outputFrameCount: recording.outputFrameCount
    };
  }

  getActiveRecordings() {
    const recordings = [];
    for (const [streamId, recording] of this.recordings) {
      recordings.push({
        streamId,
        recordingId: recording.id,
        inputFrameCount: recording.inputFrameCount,
        outputFrameCount: recording.outputFrameCount,
        durationSec: (Date.now() - recording.startTime) / 1000,
        isRecording: recording.isRecording
      });
    }
    return recordings;
  }

  stopAllRecordings() {
    const promises = [];
    for (const streamId of this.recordings.keys()) {
      promises.push(this.stopRecording(streamId));
    }
    return Promise.all(promises);
  }
}

const recorder = new VideoRecorder();
module.exports = recorder;
