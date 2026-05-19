export class VideoEncoderWrapper {
  constructor(width, height, options = {}) {
    this.width = width;
    this.height = height;
    this.fps = options.fps || 30;
    this.bitrate = options.bitrate || 5_000_000;
    this.codec = options.codec || 'vp8';
    
    this.encoder = null;
    this.stream = null;
    this.mediaRecorder = null;
    this.chunks = [];
    this.isEncoding = false;
    
    this.onChunk = null;
    this.onStop = null;
  }
  
  async init() {
    if ('VideoEncoder' in window) {
      return await this._initWebCodecs();
    } else {
      return await this._initMediaRecorder();
    }
  }
  
  async _initWebCodecs() {
    try {
      const encoderConfig = {
        codec: this.codec === 'vp8' ? 'vp8' : 'avc1.42001E',
        width: this.width,
        height: this.height,
        bitrate: this.bitrate,
        framerate: this.fps
      };
      
      const supported = await VideoEncoder.isConfigSupported(encoderConfig);
      if (!supported.supported) {
        console.warn('VideoEncoder config not supported, falling back to MediaRecorder');
        return await this._initMediaRecorder();
      }
      
      this.encoder = new VideoEncoder({
        output: (chunk, metadata) => {
          this.chunks.push(chunk);
          if (this.onChunk) {
            this.onChunk(chunk, metadata);
          }
        },
        error: (error) => {
          console.error('VideoEncoder error:', error);
        }
      });
      
      await this.encoder.configure(encoderConfig);
      this.isEncoding = true;
      
      console.log('WebCodecs VideoEncoder initialized');
      return true;
    } catch (error) {
      console.warn('WebCodecs VideoEncoder not available:', error);
      return await this._initMediaRecorder();
    }
  }
  
  async _initMediaRecorder() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      this.canvasCtx = canvas.getContext('2d');
      
      this.stream = canvas.captureStream(this.fps);
      
      const mimeTypes = [
        'video/webm;codecs=vp8',
        'video/webm;codecs=vp9',
        'video/webm'
      ];
      
      let selectedMimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }
      
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: selectedMimeType || undefined,
        videoBitsPerSecond: this.bitrate
      });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
          if (this.onChunk) {
            this.onChunk(event.data);
          }
        }
      };
      
      this.mediaRecorder.onstop = () => {
        if (this.onStop) {
          this.onStop(this.chunks);
        }
      };
      
      this.isEncoding = true;
      console.log('MediaRecorder initialized with:', selectedMimeType);
      return true;
    } catch (error) {
      console.error('Failed to initialize video encoder:', error);
      return false;
    }
  }
  
  async encodeFrame(imageData, timestamp) {
    if (!this.isEncoding) return;
    
    if (this.encoder) {
      const videoFrame = new VideoFrame(imageData, {
        timestamp: timestamp * 1000,
        duration: (1 / this.fps) * 1000
      });
      
      this.encoder.encode(videoFrame, { keyFrame: false });
      videoFrame.close();
    } else if (this.mediaRecorder && this.canvasCtx) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.width;
      tempCanvas.height = this.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      const imgData = tempCtx.createImageData(this.width, this.height);
      imgData.data.set(imageData);
      tempCtx.putImageData(imgData, 0, 0);
      
      this.canvasCtx.drawImage(tempCanvas, 0, 0);
    }
  }
  
  start() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
      this.mediaRecorder.start(100);
    }
  }
  
  async stop() {
    this.isEncoding = false;
    
    if (this.encoder) {
      await this.encoder.flush();
      this.encoder.close();
      this.encoder = null;
    }
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    if (this.onStop) {
      this.onStop(this.chunks);
    }
    
    return this.chunks;
  }
  
  getChunks() {
    return this.chunks;
  }
  
  clearChunks() {
    this.chunks = [];
  }
  
  async saveToFile(filename = 'output.webm') {
    const blob = new Blob(this.chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
    
    return blob;
  }
  
  getStream() {
    return this.stream;
  }
  
  isAvailable() {
    return this.isEncoding;
  }
}
