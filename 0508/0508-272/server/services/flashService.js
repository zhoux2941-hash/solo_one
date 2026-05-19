const { v4: uuidv4 } = require('uuid');
const serialService = require('./serialService');
const EventEmitter = require('events');

const flashTasks = new Map();
const flashEmitter = new EventEmitter();

const FLASH_STATES = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  RETRYING: 'retrying'
};

const DEFAULT_CONFIG = {
  maxConcurrent: 5,
  maxRetries: 3,
  retryDelay: 2000,
  chunkSize: 256,
  broadcastInterval: 100,
  serialTimeout: 30000
};

class FlashScheduler {
  constructor(db, io) {
    this.db = db;
    this.io = io;
    this.taskQueue = [];
    this.activeTasks = new Set();
    this.config = { ...DEFAULT_CONFIG };
    this.lastBroadcastTime = 0;
  }

  setConfig(config) {
    this.config = { ...this.config, ...config };
  }

  async createTask(firmwareId, ports, operatorId, config = {}) {
    const taskId = uuidv4();
    const firmware = await this.db.get('SELECT * FROM firmware WHERE id = ?', [firmwareId]);
    
    if (!firmware) {
      throw new Error('固件不存在');
    }

    const firmwareData = await this.getFirmwareData(firmware.file_path);
    
    const task = {
      taskId,
      firmwareId,
      firmware,
      firmwareData,
      ports: ports.map(port => ({
        port,
        status: FLASH_STATES.PENDING,
        progress: 0,
        retries: 0,
        errors: [],
        speed: 0,
        eta: null,
        bytesSent: 0,
        startTime: null,
        endTime: null
      })),
      operatorId,
      status: FLASH_STATES.PENDING,
      successCount: 0,
      failedCount: 0,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      config: { ...this.config, ...config }
    };

    flashTasks.set(taskId, task);

    await this.db.run(
      `INSERT INTO flash_tasks 
       (task_id, firmware_id, device_count, status, operator_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [taskId, firmwareId, ports.length, FLASH_STATES.PENDING, operatorId, task.createdAt]
    );

    for (const portInfo of task.ports) {
      await this.db.run(
        `INSERT INTO flash_records 
         (task_id, port_name, firmware_id, status, progress, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [taskId, portInfo.port, firmwareId, FLASH_STATES.PENDING, 0, task.createdAt]
      );
    }

    return task;
  }

  async getFirmwareData(filePath) {
    const path = require('path');
    const fs = require('fs');
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.bin') {
      return await this.parseBinFile(filePath);
    } else if (ext === '.hex') {
      return await this.parseHexFile(filePath);
    }

    throw new Error('不支持的文件格式');
  }

  async parseBinFile(filePath) {
    const fs = require('fs');
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) reject(err);
        else resolve({ data, size: data.length });
      });
    });
  }

  async parseHexFile(filePath) {
    const fs = require('fs');
    const IntelHex = require('intel-hex');
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        try {
          const hex = IntelHex.parse(data);
          resolve({ data: hex.data, size: hex.data.length });
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  startTask(taskId) {
    const task = flashTasks.get(taskId);
    if (!task) {
      throw new Error('任务不存在');
    }

    task.status = FLASH_STATES.RUNNING;
    task.startedAt = new Date().toISOString();

    this.db.run(
      'UPDATE flash_tasks SET status = ?, started_at = ? WHERE task_id = ?',
      [task.status, task.startedAt, taskId]
    );

    this.broadcastTaskStatus(task);

    task.ports.forEach(portInfo => {
      this.enqueuePort(task, portInfo);
    });

    return task;
  }

  enqueuePort(task, portInfo) {
    this.taskQueue.push({ task, portInfo });
    this.processQueue();
  }

  async processQueue() {
    while (this.taskQueue.length > 0 && this.activeTasks.size < this.config.maxConcurrent) {
      const item = this.taskQueue.shift();
      this.activeTasks.add(`${item.task.taskId}:${item.portInfo.port}`);
      this.flashPort(item.task, item.portInfo).finally(() => {
        this.activeTasks.delete(`${item.task.taskId}:${item.portInfo.port}`);
        this.processQueue();
      });
    }
  }

  async flashPort(task, portInfo) {
    const { port } = portInfo;
    portInfo.status = FLASH_STATES.RUNNING;
    portInfo.startTime = Date.now();
    portInfo.retries = portInfo.retries || 0;

    await this.db.run(
      'UPDATE flash_records SET status = ?, started_at = ? WHERE task_id = ? AND port_name = ?',
      [FLASH_STATES.RUNNING, new Date().toISOString(), task.taskId, port]
    );

    this.broadcastTaskStatus(task);

    try {
      await this.performFlash(task, portInfo);
      await this.handlePortSuccess(task, portInfo);
    } catch (error) {
      portInfo.errors.push({
        time: new Date().toISOString(),
        message: error.message,
        attempt: portInfo.retries + 1
      });

      if (portInfo.retries < task.config.maxRetries && task.status !== FLASH_STATES.CANCELLED) {
        await this.handlePortRetry(task, portInfo, error);
      } else {
        await this.handlePortFailure(task, portInfo, error);
      }
    }
  }

  async performFlash(task, portInfo) {
    const { port } = portInfo;
    const firmwareData = task.firmwareData.data;
    const totalSize = firmwareData.length;
    const chunkSize = this.getOptimalChunkSize(totalSize);

    let connection = serialService.getConnection(port);
    if (!connection) {
      connection = await this.tryConnect(port, 115200);
    }

    await this.delay(500);

    let bytesSent = 0;
    let lastProgressUpdate = -1;
    const startTime = Date.now();

    for (let i = 0; i < Math.ceil(totalSize / chunkSize); i++) {
      if (task.status === FLASH_STATES.CANCELLED) {
        throw new Error('烧录任务已取消');
      }

      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, totalSize);
      const chunk = firmwareData.slice(start, end);

      await this.sendWithRetry(port, chunk, 3);

      bytesSent += chunk.length;
      const progress = Math.round((bytesSent / totalSize) * 100);
      const elapsed = Date.now() - startTime;
      const speed = elapsed > 0 ? (bytesSent / (1024 * elapsed / 1000)).toFixed(2) : 0;
      const remainingBytes = totalSize - bytesSent;
      const eta = speed > 0 ? Math.round(remainingBytes / (speed * 1024)) : 0;

      if (progress !== lastProgressUpdate) {
        lastProgressUpdate = progress;
        portInfo.progress = progress;
        portInfo.speed = `${speed} KB/s`;
        portInfo.eta = this.formatTime(eta);
        portInfo.bytesSent = bytesSent;

        await this.db.run(
          'UPDATE flash_records SET progress = ? WHERE task_id = ? AND port_name = ?',
          [progress, task.taskId, port]
        );

        this.throttledBroadcast(task);
      }

      await new Promise(setImmediate);
      if (i % 10 === 0) {
        await this.delay(10);
      }
    }

    await this.delay(500);
  }

  async tryConnect(port, baudRate, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await serialService.connectPort(port, { baudRate });
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          await this.delay(1000 * (attempt + 1));
        }
      }
    }

    throw lastError;
  }

  async sendWithRetry(port, data, maxRetries = 3) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await serialService.sendData(port, data);
        return;
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          await this.delay(500 * (attempt + 1));
        }
      }
    }

    throw lastError;
  }

  async handlePortSuccess(task, portInfo) {
    portInfo.status = FLASH_STATES.SUCCESS;
    portInfo.progress = 100;
    portInfo.endTime = Date.now();
    task.successCount++;

    await this.db.run(
      'UPDATE flash_records SET status = ?, progress = 100, completed_at = ? WHERE task_id = ? AND port_name = ?',
      [FLASH_STATES.SUCCESS, new Date().toISOString(), task.taskId, portInfo.port]
    );

    this.broadcastTaskStatus(task);
    await this.checkTaskComplete(task);
  }

  async handlePortRetry(task, portInfo, error) {
    portInfo.status = FLASH_STATES.RETRYING;
    portInfo.retries++;

    await this.db.run(
      'UPDATE flash_records SET status = ?, retry_count = ? WHERE task_id = ? AND port_name = ?',
      [FLASH_STATES.RETRYING, portInfo.retries, task.taskId, portInfo.port]
    );

    this.broadcastTaskStatus(task);

    await this.delay(task.config.retryDelay);

    try {
      await serialService.disconnectPort(portInfo.port).catch(() => {});
    } catch (e) {}

    this.enqueuePort(task, portInfo);
  }

  async handlePortFailure(task, portInfo, error) {
    portInfo.status = FLASH_STATES.FAILED;
    portInfo.endTime = Date.now();
    portInfo.error = error.message;
    task.failedCount++;

    await this.db.run(
      'UPDATE flash_records SET status = ?, error_message = ?, completed_at = ? WHERE task_id = ? AND port_name = ?',
      [FLASH_STATES.FAILED, error.message, new Date().toISOString(), task.taskId, portInfo.port]
    );

    this.broadcastTaskStatus(task);
    await this.checkTaskComplete(task);
  }

  async checkTaskComplete(task) {
    const completed = task.successCount + task.failedCount;
    const total = task.ports.length;

    if (completed >= total) {
      if (task.failedCount === 0) {
        task.status = FLASH_STATES.SUCCESS;
      } else if (task.successCount > 0) {
        task.status = 'partial';
      } else {
        task.status = FLASH_STATES.FAILED;
      }

      task.completedAt = new Date().toISOString();

      await this.db.run(
        'UPDATE flash_tasks SET status = ?, success_count = ?, failed_count = ?, completed_at = ? WHERE task_id = ?',
        [task.status, task.successCount, task.failedCount, task.completedAt, task.taskId]
      );

      flashEmitter.emit('taskComplete', {
        taskId: task.taskId,
        status: task.status,
        successCount: task.successCount,
        failedCount: task.failedCount
      });

      this.broadcastTaskStatus(task);
    }
  }

  cancelTask(taskId) {
    const task = flashTasks.get(taskId);
    if (task) {
      task.status = FLASH_STATES.CANCELLED;
      this.broadcastTaskStatus(task);
      return true;
    }
    return false;
  }

  async retryFailedPorts(taskId) {
    const task = flashTasks.get(taskId);
    if (!task) {
      throw new Error('任务不存在');
    }

    const failedPorts = task.ports.filter(p => 
      p.status === FLASH_STATES.FAILED || p.status === FLASH_STATES.CANCELLED
    );

    if (failedPorts.length === 0) {
      throw new Error('没有需要重试的设备');
    }

    task.failedCount -= failedPorts.filter(p => p.status === FLASH_STATES.FAILED).length;
    task.status = FLASH_STATES.RUNNING;

    failedPorts.forEach(portInfo => {
      portInfo.status = FLASH_STATES.PENDING;
      portInfo.progress = 0;
      portInfo.retries = 0;
      portInfo.errors = [];
      this.enqueuePort(task, portInfo);
    });

    this.broadcastTaskStatus(task);

    return { retryCount: failedPorts.length };
  }

  getOptimalChunkSize(totalSize) {
    if (totalSize > 1024 * 1024) {
      return 1024;
    } else if (totalSize > 256 * 1024) {
      return 512;
    }
    return 256;
  }

  throttledBroadcast(task) {
    const now = Date.now();
    if (now - this.lastBroadcastTime >= this.config.broadcastInterval) {
      this.lastBroadcastTime = now;
      this.broadcastTaskStatus(task);
    }
  }

  broadcastTaskStatus(task) {
    this.io.emit('flashStatus', {
      taskId: task.taskId,
      status: task.status,
      successCount: task.successCount,
      failedCount: task.failedCount,
      totalCount: task.ports.length,
      devices: task.ports.map(p => ({
        port: p.port,
        status: p.status,
        progress: p.progress,
        speed: p.speed,
        eta: p.eta,
        bytesSent: p.bytesSent ? this.formatBytes(p.bytesSent) : null,
        totalBytes: this.formatBytes(task.firmwareData.size),
        retries: p.retries,
        error: p.error
      }))
    });
  }

  getTaskStatus(taskId) {
    const task = flashTasks.get(taskId);
    if (!task) {
      return null;
    }

    return {
      taskId: task.taskId,
      status: task.status,
      successCount: task.successCount,
      failedCount: task.failedCount,
      totalCount: task.ports.length,
      devices: task.ports.map(p => ({
        port: p.port,
        status: p.status,
        progress: p.progress,
        speed: p.speed,
        eta: p.eta,
        bytesSent: p.bytesSent ? this.formatBytes(p.bytesSent) : null,
        totalBytes: this.formatBytes(task.firmwareData.size),
        retries: p.retries,
        error: p.error
      }))
    };
  }

  formatTime(seconds) {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    }
  }

  formatBytes(bytes) {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

let scheduler = null;

function initScheduler(db, io) {
  if (!scheduler) {
    scheduler = new FlashScheduler(db, io);
  }
  return scheduler;
}

function getScheduler() {
  return scheduler;
}

async function createFlashTask(db, firmwareId, ports, operatorId, config = {}) {
  if (!scheduler) {
    throw new Error('调度器未初始化');
  }
  return await scheduler.createTask(firmwareId, ports, operatorId, config);
}

function startFlashTask(taskId) {
  if (!scheduler) {
    throw new Error('调度器未初始化');
  }
  return scheduler.startTask(taskId);
}

function getFlashTask(taskId) {
  return flashTasks.get(taskId);
}

function getTaskStatus(taskId) {
  if (!scheduler) {
    return null;
  }
  return scheduler.getTaskStatus(taskId);
}

function cancelFlashTask(taskId) {
  if (!scheduler) {
    return false;
  }
  return scheduler.cancelTask(taskId);
}

async function retryFailedPorts(taskId) {
  if (!scheduler) {
    throw new Error('调度器未初始化');
  }
  return await scheduler.retryFailedPorts(taskId);
}

function getEmitter() {
  return flashEmitter;
}

module.exports = {
  initScheduler,
  getScheduler,
  createFlashTask,
  startFlashTask,
  getFlashTask,
  getTaskStatus,
  cancelFlashTask,
  retryFailedPorts,
  getEmitter,
  FLASH_STATES,
  DEFAULT_CONFIG
};
