const zmq = require('zeromq');
const EventEmitter = require('events');
const config = require('../config');
const logger = require('../utils/logger');

class ZMQClient extends EventEmitter {
  constructor() {
    super();
    this.connected = false;
    this.sendSocket = null;
    this.receiveSocket = null;
    this.controlSocket = null;
    this._receiveLoop = null;
    this._shouldRun = false;
  }

  async connect() {
    try {
      this.sendSocket = new zmq.Push();
      this.receiveSocket = new zmq.Pull();
      this.controlSocket = new zmq.Request();

      await this.sendSocket.connect(`tcp://${config.zmq.host}:${config.zmq.requestPort}`);
      await this.receiveSocket.connect(`tcp://${config.zmq.host}:${config.zmq.responsePort}`);
      await this.controlSocket.connect(`tcp://${config.zmq.host}:${config.zmq.requestPort + 2}`);

      this.connected = true;
      this._shouldRun = true;

      this._startReceiveLoop();

      logger.info('ZMQ client connected successfully', {
        requestPort: config.zmq.requestPort,
        responsePort: config.zmq.responsePort,
        controlPort: config.zmq.requestPort + 2
      });

      return true;
    } catch (error) {
      logger.error('Failed to connect to ZMQ server', { error: error.message });
      this.connected = false;
      throw error;
    }
  }

  _startReceiveLoop() {
    this._receiveLoop = (async () => {
      while (this._shouldRun && this.connected) {
        try {
          const msg = await this.receiveSocket.receive();
          if (msg && msg.length >= 8) {
            const result = {
              streamId: msg[0].toString('utf-8'),
              timestamp: parseFloat(msg[1].toString('utf-8')),
              processingTimeMs: parseFloat(msg[2].toString('utf-8')),
              scale: parseInt(msg[3].toString('utf-8')),
              fps: parseFloat(msg[4].toString('utf-8')),
              psnr: parseFloat(msg[5].toString('utf-8')),
              ssim: parseFloat(msg[6].toString('utf-8')),
              switchState: msg.length > 8 ? msg[7].toString('utf-8') : 'idle',
              targetScale: msg.length > 9 && msg[9].toString('utf-8') ? parseInt(msg[9].toString('utf-8')) : null,
              frame: msg.length > 9 ? msg[9] : msg[7]
            };
            
            if (msg.length > 8) {
              result.switchState = msg[7].toString('utf-8');
              result.targetScale = msg[8].toString('utf-8') ? parseInt(msg[8].toString('utf-8')) : null;
              result.frame = msg[9];
            }
            
            this.emit('frame:processed', result);
          }
        } catch (error) {
          if (this._shouldRun) {
            logger.error('ZMQ receive error', { error: error.message });
          }
        }
      }
    })();
  }

  async sendFrame(streamId, frameData, timestamp, scale = 2, originalFrame = null) {
    if (!this.connected) {
      return false;
    }

    try {
      const msg = [
        Buffer.from(streamId, 'utf-8'),
        Buffer.from(timestamp.toString(), 'utf-8'),
        Buffer.from(scale.toString(), 'utf-8'),
        frameData
      ];
      
      if (originalFrame) {
        msg.push(originalFrame);
      }

      await this.sendSocket.send(msg);
      return true;
    } catch (error) {
      logger.error('ZMQ send error', { error: error.message, streamId });
      return false;
    }
  }

  async sendControlCommand(cmd, streamId = null, extra = {}) {
    if (!this.connected) {
      return { success: false, error: 'Not connected' };
    }

    try {
      const request = { cmd, streamId, ...extra };
      await this.controlSocket.send(JSON.stringify(request));
      
      const [response] = await this.controlSocket.receive();
      return JSON.parse(response.toString('utf-8'));
    } catch (error) {
      logger.error('ZMQ control error', { error: error.message, cmd });
      return { success: false, error: error.message };
    }
  }

  async setScale(streamId, scale, asyncMode = false) {
    return this.sendControlCommand('set_scale', streamId, { scale, async: asyncMode });
  }

  async setScaleAsync(streamId, scale) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.removeAllListeners(`switch:complete:${streamId}`);
        this.removeAllListeners(`switch:progress:${streamId}`);
        reject(new Error('Scale switch timed out after 10s'));
      }, 10000);

      const handleComplete = (result) => {
        clearTimeout(timeout);
        this.removeAllListeners(`switch:progress:${streamId}`);
        resolve(result);
      };

      const handleProgress = (progress) => {
        this.emit('switch:progress', { streamId, ...progress });
      };

      this.once(`switch:complete:${streamId}`, handleComplete);
      this.on(`switch:progress:${streamId}`, handleProgress);

      this.sendControlCommand('set_scale', streamId, { scale, async: true })
        .then((result) => {
          if (!result.success) {
            clearTimeout(timeout);
            this.removeAllListeners(`switch:complete:${streamId}`);
            this.removeAllListeners(`switch:progress:${streamId}`);
            reject(new Error(result.error || 'Failed to initiate scale switch'));
          }
        })
        .catch((err) => {
          clearTimeout(timeout);
          this.removeAllListeners(`switch:complete:${streamId}`);
          this.removeAllListeners(`switch:progress:${streamId}`);
          reject(err);
        });
    });
  }

  _notifySwitchComplete(streamId, success, message, details) {
    this.emit(`switch:complete:${streamId}`, { streamId, success, message, details });
    this.emit('switch:complete', { streamId, success, message, details });
  }

  async getStats(streamId = null) {
    if (streamId) {
      return this.sendControlCommand('get_stats', streamId);
    }
    return this.sendControlCommand('get_all_stats');
  }

  async cleanupStream(streamId) {
    return this.sendControlCommand('cleanup_stream', streamId);
  }

  async ping() {
    return this.sendControlCommand('ping');
  }

  async disconnect() {
    this._shouldRun = false;
    
    try {
      if (this._receiveLoop) {
        await this._receiveLoop;
      }
    } catch (e) {}

    try {
      if (this.sendSocket) {
        await this.sendSocket.close();
      }
      if (this.receiveSocket) {
        await this.receiveSocket.close();
      }
      if (this.controlSocket) {
        await this.controlSocket.close();
      }
    } catch (error) {
      logger.error('ZMQ disconnect error', { error: error.message });
    }

    this.connected = false;
    logger.info('ZMQ client disconnected');
  }
}

const zmqClient = new ZMQClient();
module.exports = zmqClient;
