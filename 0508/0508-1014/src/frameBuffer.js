export class FrameBuffer {
  constructor(maxSize = 5) {
    this.maxSize = maxSize;
    this.buffer = [];
    this.processingFrames = new Map();
    this.droppedFrames = 0;
    this.totalFrames = 0;
  }
  
  add(frame) {
    this.totalFrames++;
    
    if (this.buffer.length >= this.maxSize) {
      const oldFrame = this.buffer.shift();
      if (oldFrame.close) oldFrame.close();
      this.droppedFrames++;
      return false;
    }
    
    this.buffer.push({
      frame,
      timestamp: performance.now(),
      id: this.totalFrames
    });
    
    return true;
  }
  
  get() {
    if (this.buffer.length === 0) return null;
    return this.buffer.shift();
  }
  
  peek() {
    if (this.buffer.length === 0) return null;
    return this.buffer[0];
  }
  
  markProcessing(frameId) {
    this.processingFrames.set(frameId, performance.now());
  }
  
  markProcessed(frameId) {
    this.processingFrames.delete(frameId);
  }
  
  getSize() {
    return this.buffer.length;
  }
  
  getMaxSize() {
    return this.maxSize;
  }
  
  getProcessingCount() {
    return this.processingFrames.size;
  }
  
  getStats() {
    return {
      size: this.buffer.length,
      maxSize: this.maxSize,
      processing: this.processingFrames.size,
      dropped: this.droppedFrames,
      total: this.totalFrames,
      utilization: ((this.buffer.length / this.maxSize) * 100).toFixed(1) + '%'
    };
  }
  
  getStatusString() {
    const stats = this.getStats();
    return `${stats.size}/${stats.maxSize} (${stats.processing}处理中)`;
  }
  
  clear() {
    this.buffer.forEach(item => {
      if (item.frame && item.frame.close) {
        item.frame.close();
      }
    });
    this.buffer = [];
    this.processingFrames.clear();
  }
  
  isFull() {
    return this.buffer.length >= this.maxSize;
  }
  
  isEmpty() {
    return this.buffer.length === 0;
  }
  
  setMaxSize(size) {
    this.maxSize = size;
    while (this.buffer.length > this.maxSize) {
      const oldFrame = this.buffer.shift();
      if (oldFrame.close) oldFrame.close();
      this.droppedFrames++;
    }
  }
}
