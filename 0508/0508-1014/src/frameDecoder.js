export class FrameDecoder {
  constructor(stream, width, height) {
    this.stream = stream;
    this.width = width;
    this.height = height;
    this.decoder = null;
    this.videoTrack = null;
    this.videoProcessor = null;
    this.onFrameCallback = null;
    this.isRunning = false;
    this.frameCount = 0;
  }
  
  async init() {
    this.videoTrack = this.stream.getVideoTracks()[0];
    
    if ('VideoFrame' in window && 'VideoDecoder' in window) {
      return await this.initWebCodecs();
    } else {
      return await this.initCanvasFallback();
    }
  }
  
  async initWebCodecs() {
    this.videoProcessor = new MediaStreamTrackProcessor({
      track: this.videoTrack
    });
    
    const reader = this.videoProcessor.readable.getReader();
    
    const processFrames = async () => {
      while (this.isRunning) {
        try {
          const { value, done } = await reader.read();
          if (done) break;
          
          if (value && this.onFrameCallback) {
            this.frameCount++;
            this.onFrameCallback(value);
          }
        } catch (error) {
          console.error('Frame reading error:', error);
          break;
        }
      }
    };
    
    processFrames();
    return true;
  }
  
  async initCanvasFallback() {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    const video = document.createElement('video');
    video.srcObject = this.stream;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    
    await video.play();
    
    const captureFrame = () => {
      if (!this.isRunning) return;
      
      ctx.drawImage(video, 0, 0, this.width, this.height);
      
      const imageData = ctx.getImageData(0, 0, this.width, this.height);
      
      if (this.onFrameCallback) {
        this.frameCount++;
        this.onFrameCallback({
          format: 'RGBA',
          width: this.width,
          height: this.height,
          data: imageData.data,
          timestamp: performance.now(),
          duration: 33
        });
      }
      
      requestAnimationFrame(captureFrame);
    };
    
    captureFrame();
    return true;
  }
  
  onFrame(callback) {
    this.onFrameCallback = callback;
  }
  
  start() {
    this.isRunning = true;
    return this.init();
  }
  
  stop() {
    this.isRunning = false;
  }
  
  destroy() {
    this.stop();
    
    if (this.videoProcessor) {
      this.videoProcessor = null;
    }
    
    if (this.videoTrack) {
      this.videoTrack = null;
    }
    
    this.onFrameCallback = null;
  }
  
  getStats() {
    return {
      frameCount: this.frameCount,
      width: this.width,
      height: this.height
    };
  }
}
