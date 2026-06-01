import React, { useState, useEffect, useRef } from 'react';
import { WebSocketManager } from '../services/WebSocketManager';
import { CorrelationPair, formatCanId } from '../types';

interface RecordingPanelProps {
  ws: WebSocketManager;
}

export const RecordingPanel: React.FC<RecordingPanelProps> = ({ ws }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordFormat, setRecordFormat] = useState('blf');
  const [recordPath, setRecordPath] = useState('recording.blf');
  const [playbackPath, setPlaybackPath] = useState('recording.blf');
  const [playbackFormat, setPlaybackFormat] = useState('blf');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [frameCount, setFrameCount] = useState(0);

  const handleStartRecording = () => {
    ws.send({
      type: 'start_recording',
      path: recordPath,
      format: recordFormat,
    });
    setIsRecording(true);
    setFrameCount(0);
  };

  const handleStopRecording = () => {
    ws.send({ type: 'stop_recording' });
    setIsRecording(false);
  };

  const handleStartPlayback = () => {
    ws.send({
      type: 'start_playback',
      path: playbackPath,
      format: playbackFormat,
      speed: playbackSpeed,
    });
    setIsPlaying(true);
  };

  const handleStopPlayback = () => {
    ws.send({ type: 'stop_playback' });
    setIsPlaying(false);
  };

  return (
    <div className="panel-section">
      <div className="panel-title">
        <span>Recording</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <select
            value={recordFormat}
            onChange={(e) => {
              setRecordFormat(e.target.value);
              setRecordPath(e.target.value === 'blf' ? 'recording.blf' : 'recording.asc');
            }}
            style={{ width: 60, fontSize: 11 }}
          >
            <option value="blf">BLF</option>
            <option value="asc">ASC</option>
          </select>
          <input
            type="text"
            value={recordPath}
            onChange={(e) => setRecordPath(e.target.value)}
            style={{ flex: 1, fontSize: 11 }}
          />
        </div>

        {!isRecording ? (
          <button className="btn btn-primary btn-sm" onClick={handleStartRecording} style={{ width: '100%' }}>
            ⏺ Start Recording
          </button>
        ) : (
          <button className="btn btn-danger btn-sm" onClick={handleStopRecording} style={{ width: '100%' }}>
            ⏹ Stop Recording
          </button>
        )}

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4 }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Playback</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <select
              value={playbackFormat}
              onChange={(e) => {
                setPlaybackFormat(e.target.value);
                setPlaybackPath(e.target.value === 'blf' ? 'recording.blf' : 'recording.asc');
              }}
              style={{ width: 60, fontSize: 11 }}
            >
              <option value="blf">BLF</option>
              <option value="asc">ASC</option>
            </select>
            <input
              type="text"
              value={playbackPath}
              onChange={(e) => setPlaybackPath(e.target.value)}
              style={{ flex: 1, fontSize: 11 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Speed:</span>
            <select value={playbackSpeed} onChange={(e) => setPlaybackSpeed(Number(e.target.value))} style={{ fontSize: 11 }}>
              <option value={0.25}>0.25x</option>
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={5}>5x</option>
            </select>
          </div>
          {!isPlaying ? (
            <button className="btn btn-sm" onClick={handleStartPlayback} style={{ width: '100%', marginTop: 4 }}>
              ▶ Play
            </button>
          ) : (
            <button className="btn btn-danger btn-sm" onClick={handleStopPlayback} style={{ width: '100%', marginTop: 4 }}>
              ⏹ Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
