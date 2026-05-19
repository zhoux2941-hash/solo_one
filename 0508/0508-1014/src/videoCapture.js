export class VideoCapture {
  constructor(videoElement) {
    this.videoElement = videoElement;
    this.stream = null;
    this.mediaRecorder = null;
    this.isCapturing = false;
  }
  
  async start(sourceType) {
    if (sourceType === 'camera') {
      return await this.startCamera();
    } else if (sourceType === 'file') {
      return await this.startFile();
    }
  }
  
  async startCamera() {
    const constraints = {
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 }
      },
      audio: false
    };
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.stream;
      
      await new Promise((resolve) => {
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play();
          resolve();
        };
      });
      
      this.isCapturing = true;
      return this.stream;
    } catch (error) {
      console.error('Camera access failed:', error);
      throw new Error(`无法访问摄像头: ${error.message}`);
    }
  }
  
  async startFile() {
    if (!this.videoElement.src) {
      throw new Error('请先选择视频文件');
    }
    
    await new Promise((resolve, reject) => {
      this.videoElement.onloadedmetadata = () => {
        this.videoElement.play();
        resolve();
      };
      this.videoElement.onerror = reject;
      
      if (this.videoElement.readyState >= 2) {
        this.videoElement.play();
        resolve();
      }
    });
    
    const videoTrack = this.videoElement.captureStream().getVideoTracks()[0];
    this.stream = new MediaStream([videoTrack]);
    this.isCapturing = true;
    
    return this.stream;
  }
  
  async stop() {
    this.isCapturing = false;
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
    }
  }
  
  getVideoTrack() {
    if (!this.stream) return null;
    return this.stream.getVideoTracks()[0];
  }
  
  getSettings() {
    const track = this.getVideoTrack();
    return track ? track.getSettings() : null;
  }
}
