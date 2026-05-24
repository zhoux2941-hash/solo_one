export class VideoEncoderManager {
  constructor(videoElement) {
    this.videoElement = videoElement;
    this.encoder = null;
    this.decoder = null;
    this.canvas = null;
    this.ctx = null;
    this.isEncoding = false;
    this.frameCallback = null;
    
    this.targetWidth = 3840;
    this.targetHeight = 2160;
    this.targetFps = 30;
    this.targetBitrate = 20000000;
  }

  async initEncoder() {
    if (!('VideoEncoder' in window)) {
      throw new Error('WebCodecs VideoEncoder not supported');
    }

    const supported = await VideoEncoder.isConfigSupported({
      codec: 'hvc1.1.6.L120.B0',
      width: this.targetWidth,
      height: this.targetHeight,
      bitrate: this.targetBitrate,
      framerate: this.targetFps
    });

    if (!supported.supported) {
      console.warn('H.265 not fully supported, trying alternative');
    }

    this.encoder = new VideoEncoder({
      output: (chunk, metadata) => {
        if (this.frameCallback) {
          this.frameCallback(chunk, metadata);
        }
      },
      error: (error) => {
        console.error('Video encoder error:', error);
      }
    });

    await this.encoder.configure({
      codec: 'hvc1.1.6.L120.B0',
      width: this.targetWidth,
      height: this.targetHeight,
      bitrate: this.targetBitrate,
      framerate: this.targetFps,
      latencyMode: 'realtime',
      hardwareAcceleration: 'prefer-hardware'
    });

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.targetWidth;
    this.canvas.height = this.targetHeight;
    this.ctx = this.canvas.getContext('2d');
  }

  startEncoding() {
    if (this.isEncoding) return;
    this.isEncoding = true;
    this.encodeFrame();
  }

  stopEncoding() {
    this.isEncoding = false;
  }

  encodeFrame() {
    if (!this.isEncoding || !this.encoder || this.encoder.state !== 'configured') {
      if (this.isEncoding) {
        requestAnimationFrame(() => this.encodeFrame());
      }
      return;
    }

    const timestamp = performance.now() * 1000;

    this.ctx.drawImage(
      this.videoElement,
      0, 0,
      this.targetWidth,
      this.targetHeight
    );

    const frame = new VideoFrame(this.canvas, {
      timestamp,
      duration: 1000000 / this.targetFps
    });

    this.encoder.encode(frame);
    frame.close();

    setTimeout(() => this.encodeFrame(), 1000 / this.targetFps);
  }

  async initDecoder() {
    if (!('VideoDecoder' in window)) {
      throw new Error('WebCodecs VideoDecoder not supported');
    }

    this.decoder = new VideoDecoder({
      output: (frame) => {
        this.renderDecodedFrame(frame);
      },
      error: (error) => {
        console.error('Video decoder error:', error);
      }
    });

    await this.decoder.configure({
      codec: 'hvc1.1.6.L120.B0',
      hardwareAcceleration: 'prefer-hardware'
    });

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.targetWidth;
    this.canvas.height = this.targetHeight;
    this.ctx = this.canvas.getContext('2d');
  }

  decodeChunk(chunk) {
    if (this.decoder && this.decoder.state === 'configured') {
      this.decoder.decode(chunk);
    }
  }

  renderDecodedFrame(frame) {
    this.ctx.drawImage(frame, 0, 0);
    frame.close();
  }

  getCanvas() {
    return this.canvas;
  }

  setResolution(width, height) {
    this.targetWidth = width;
    this.targetHeight = height;
  }

  setFps(fps) {
    this.targetFps = fps;
  }

  setBitrate(bitrate) {
    this.targetBitrate = bitrate;
  }

  close() {
    this.stopEncoding();
    
    if (this.encoder) {
      this.encoder.close();
    }
    
    if (this.decoder) {
      this.decoder.close();
    }
  }
}
