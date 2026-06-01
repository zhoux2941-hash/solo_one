const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');
const config = require('../config');
const db = require('../database');

let io = null;
const recordings = new Map();

function setSocketIO(socketIO) {
  io = socketIO;
}

function generateFileName(streamAddress) {
  const cleanAddress = streamAddress.replace(/[\/:]/g, '_');
  const date = moment().format('YYYYMMDD');
  const time = moment().format('HHmmss');
  return `${cleanAddress}_${date}_${time}_%04d.ts`;
}

async function startRecording(streamId, options = {}) {
  const stream = await db.streams.getById(streamId);
  if (!stream) {
    throw new Error('Stream not found');
  }

  if (recordings.has(streamId)) {
    throw new Error('Recording already in progress');
  }

  const segmentDuration = options.segmentDuration || config.recording.defaultSegmentDuration;
  const outputDir = path.join(config.recordingsDir, streamId);
  await fs.ensureDir(outputDir);

  const fileName = generateFileName(stream.address);
  const outputPath = path.join(outputDir, fileName);

  const args = [
    '-y',
    '-timeout', '10000000',
    '-rw_timeout', '15000000',
    '-f', 'mpegts',
    '-i', stream.address,
    '-c', 'copy',
    '-map', '0',
    '-f', 'segment',
    '-segment_time', (segmentDuration * 60).toString(),
    '-segment_format', 'mpegts',
    '-segment_atclocktime', '1',
    '-reset_timestamps', '1',
    '-strftime_mkdir', '0',
    outputPath
  ];

  console.log('FFmpeg args:', args.join(' '));

  const ffmpeg = spawn(config.ffmpegPath, args);
  ffmpeg.stderr.setEncoding('utf8');
  ffmpeg.stdout.setEncoding('utf8');

  const recordingData = {
    streamId,
    streamAddress: stream.address,
    streamName: stream.name,
    startTime: new Date().toISOString(),
    outputDir,
    segmentDuration,
    files: [],
    isActive: true
  };

  const dbRecord = await db.recordings.create({
    ...recordingData,
    endTime: null,
    totalDuration: 0,
    totalSize: 0,
    filePath: outputDir
  });

  recordings.set(streamId, {
    ffmpeg,
    recordingId: dbRecord.id,
    data: recordingData,
    startSize: 0,
    lastFileCheck: Date.now()
  });

  let stderrBuffer = '';
  ffmpeg.stderr.on('data', (data) => {
    stderrBuffer += data;
    checkForNewSegment(streamId, stderrBuffer, outputDir);
    if (stderrBuffer.length > 10000) {
      stderrBuffer = stderrBuffer.slice(-5000);
    }
  });

  ffmpeg.stdout.on('data', (data) => {
  });

  ffmpeg.on('close', async (code, signal) => {
    console.log(`FFmpeg closed with code ${code}, signal ${signal}`);
    const recording = recordings.get(streamId);
    if (recording && recording.data.isActive) {
      await stopRecording(streamId);
    }
  });

  ffmpeg.on('error', (err) => {
    console.error(`Recording FFmpeg error for ${stream.address}:`, err.message);
  });

  if (io) {
    io.emit('recordingStarted', {
      streamId,
      recordingId: dbRecord.id,
      ...recordingData
    });
  }

  console.log(`Started recording: ${stream.address} -> ${outputPath}`);
  return { recordingId: dbRecord.id, ...recordingData };
}

function checkForNewSegment(streamId, output, outputDir) {
  const recording = recordings.get(streamId);
  if (!recording) return;

  const segmentPattern = /Opening '([^']+\.ts)' for writing/g;
  let match;
  
  while ((match = segmentPattern.exec(output)) !== null) {
    const filePath = match[1];
    if (!recording.data.files.includes(filePath)) {
      recording.data.files.push(filePath);
      
      if (io) {
        io.emit('recordingSegment', {
          streamId,
          recordingId: recording.recordingId,
          filePath
        });
      }
    }
  }
}

async function stopRecording(streamId) {
  const recording = recordings.get(streamId);
  if (!recording) {
    throw new Error('No recording in progress');
  }

  recording.data.isActive = false;

  try {
    if (recording.ffmpeg) {
      recording.ffmpeg.stdin.write('q');
      
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 5000);
        recording.ffmpeg.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
      
      recording.ffmpeg.kill('SIGTERM');
    }
  } catch (err) {
    console.log('Error stopping FFmpeg:', err.message);
  }

  const endTime = new Date().toISOString();
  let totalSize = 0;
  
  for (const file of recording.data.files) {
    try {
      if (await fs.pathExists(file)) {
        const stats = await fs.stat(file);
        totalSize += stats.size;
      }
    } catch (err) {
      console.warn(`Could not stat file ${file}:`, err.message);
    }
  }

  if (totalSize === 0 && recording.data.files.length > 0) {
    try {
      const files = await fs.readdir(recording.data.outputDir);
      for (const file of files) {
        if (file.endsWith('.ts')) {
          const filePath = path.join(recording.data.outputDir, file);
          try {
            const stats = await fs.stat(filePath);
            totalSize += stats.size;
            if (!recording.data.files.includes(filePath)) {
              recording.data.files.push(filePath);
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('Could not scan output directory:', err.message);
    }
  }

  await db.recordings.update(recording.recordingId, {
    endTime,
    totalDuration: new Date(endTime) - new Date(recording.data.startTime),
    totalSize,
    files: recording.data.files,
    isActive: false
  });

  recordings.delete(streamId);

  if (io) {
    io.emit('recordingStopped', {
      streamId,
      recordingId: recording.recordingId,
      endTime,
      totalSize,
      files: recording.data.files,
      fileCount: recording.data.files.length
    });
  }

  console.log(`Stopped recording: ${recording.data.streamAddress}, files: ${recording.data.files.length}, size: ${totalSize} bytes`);
  return { 
    recordingId: recording.recordingId, 
    endTime, 
    totalSize, 
    files: recording.data.files,
    fileCount: recording.data.files.length
  };
}

async function stopAllRecordings() {
  for (const streamId of Array.from(recordings.keys())) {
    try {
      await stopRecording(streamId);
    } catch (err) {
      console.error(`Error stopping recording for stream ${streamId}:`, err.message);
    }
  }
}

function isRecording(streamId) {
  const recording = recordings.get(streamId);
  return recording && recording.data.isActive;
}

function getRecordingStatus(streamId) {
  const recording = recordings.get(streamId);
  if (!recording) return null;
  return {
    recordingId: recording.recordingId,
    ...recording.data
  };
}

function getAllRecordingStatus() {
  const result = [];
  for (const streamId of recordings.keys()) {
    const status = getRecordingStatus(streamId);
    if (status && status.isActive) result.push(status);
  }
  return result;
}

async function getRecordings(filters = {}) {
  return await db.recordings.getAll(filters);
}

async function getRecording(recordingId) {
  return await db.recordings.getById(recordingId);
}

async function deleteRecording(recordingId) {
  const recording = await db.recordings.getById(recordingId);
  if (!recording) {
    throw new Error('Recording not found');
  }

  if (recording.files) {
    for (const file of recording.files) {
      try {
        if (await fs.pathExists(file)) {
          await fs.remove(file);
        }
      } catch (err) {
        console.warn(`Could not delete file ${file}:`, err.message);
      }
    }
  }

  try {
    if (await fs.pathExists(recording.filePath)) {
      await fs.remove(recording.filePath);
    }
  } catch (err) {
    console.warn(`Could not delete directory ${recording.filePath}:`, err.message);
  }

  await db.recordings.delete(recordingId);
  return true;
}

module.exports = {
  setSocketIO,
  startRecording,
  stopRecording,
  stopAllRecordings,
  isRecording,
  getRecordingStatus,
  getAllRecordingStatus,
  getRecording,
  getRecordings,
  deleteRecording
};
