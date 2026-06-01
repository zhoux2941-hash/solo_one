const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

const dbDir = path.dirname(config.h2.dbPath);
const dataFile = config.h2.dbPath + '.json';

let dbData = {
  streams: [],
  alerts: [],
  recordings: [],
  metrics: []
};

let isInitialized = false;

async function init() {
  if (isInitialized) return;
  
  await fs.ensureDir(dbDir);
  
  try {
    if (await fs.pathExists(dataFile)) {
      const content = await fs.readFile(dataFile, 'utf8');
      dbData = JSON.parse(content);
    }
  } catch (err) {
    console.warn('Could not load database file, starting with empty DB:', err.message);
  }
  
  if (!dbData.streams) dbData.streams = [];
  if (!dbData.alerts) dbData.alerts = [];
  if (!dbData.recordings) dbData.recordings = [];
  if (!dbData.metrics) dbData.metrics = [];
  
  isInitialized = true;
  await save();
}

async function save() {
  await fs.writeFile(dataFile, JSON.stringify(dbData, null, 2), 'utf8');
}

async function close() {
  await save();
  isInitialized = false;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

const streams = {
  async getAll() {
    return [...dbData.streams];
  },
  
  async getById(id) {
    return dbData.streams.find(s => s.id === id) || null;
  },
  
  async getByAddress(address) {
    return dbData.streams.find(s => s.address === address) || null;
  },
  
  async create(stream) {
    const newStream = {
      id: generateId(),
      ...stream,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    dbData.streams.push(newStream);
    await save();
    return newStream;
  },
  
  async update(id, updates) {
    const index = dbData.streams.findIndex(s => s.id === id);
    if (index === -1) return null;
    
    dbData.streams[index] = {
      ...dbData.streams[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await save();
    return dbData.streams[index];
  },
  
  async delete(id) {
    const index = dbData.streams.findIndex(s => s.id === id);
    if (index === -1) return false;
    
    dbData.streams.splice(index, 1);
    await save();
    return true;
  }
};

const alerts = {
  async getAll(filters = {}) {
    let results = [...dbData.alerts];
    
    if (filters.streamId) {
      results = results.filter(a => a.streamId === filters.streamId);
    }
    if (filters.streamAddress) {
      results = results.filter(a => a.streamAddress === filters.streamAddress);
    }
    if (filters.startTime) {
      results = results.filter(a => new Date(a.createdAt) >= new Date(filters.startTime));
    }
    if (filters.endTime) {
      results = results.filter(a => new Date(a.createdAt) <= new Date(filters.endTime));
    }
    if (filters.type) {
      results = results.filter(a => a.type === filters.type);
    }
    
    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  
  async getById(id) {
    return dbData.alerts.find(a => a.id === id) || null;
  },
  
  async create(alert) {
    const newAlert = {
      id: generateId(),
      ...alert,
      acknowledged: false,
      createdAt: new Date().toISOString()
    };
    dbData.alerts.push(newAlert);
    await save();
    return newAlert;
  },
  
  async acknowledge(id) {
    const alert = dbData.alerts.find(a => a.id === id);
    if (!alert) return null;
    
    alert.acknowledged = true;
    alert.acknowledgedAt = new Date().toISOString();
    await save();
    return alert;
  },
  
  async delete(id) {
    const index = dbData.alerts.findIndex(a => a.id === id);
    if (index === -1) return false;
    
    dbData.alerts.splice(index, 1);
    await save();
    return true;
  }
};

const recordings = {
  async getAll(filters = {}) {
    let results = [...dbData.recordings];
    
    if (filters.streamId) {
      results = results.filter(r => r.streamId === filters.streamId);
    }
    if (filters.streamAddress) {
      results = results.filter(r => r.streamAddress === filters.streamAddress);
    }
    
    return results.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  },
  
  async getById(id) {
    return dbData.recordings.find(r => r.id === id) || null;
  },
  
  async create(recording) {
    const newRecording = {
      id: generateId(),
      ...recording,
      createdAt: new Date().toISOString()
    };
    dbData.recordings.push(newRecording);
    await save();
    return newRecording;
  },
  
  async update(id, updates) {
    const index = dbData.recordings.findIndex(r => r.id === id);
    if (index === -1) return null;
    
    dbData.recordings[index] = {
      ...dbData.recordings[index],
      ...updates
    };
    await save();
    return dbData.recordings[index];
  },
  
  async delete(id) {
    const index = dbData.recordings.findIndex(r => r.id === id);
    if (index === -1) return false;
    
    dbData.recordings.splice(index, 1);
    await save();
    return true;
  }
};

const metrics = {
  async add(metric) {
    const newMetric = {
      id: generateId(),
      ...metric,
      timestamp: new Date().toISOString()
    };
    dbData.metrics.push(newMetric);
    
    if (dbData.metrics.length > 10000) {
      dbData.metrics = dbData.metrics.slice(-5000);
    }
    
    await save();
    return newMetric;
  },
  
  async getByStreamId(streamId, limit = 100) {
    return dbData.metrics
      .filter(m => m.streamId === streamId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }
};

module.exports = {
  init,
  close,
  streams,
  alerts,
  recordings,
  metrics
};
