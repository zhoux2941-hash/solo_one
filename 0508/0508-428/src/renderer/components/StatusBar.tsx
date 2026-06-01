import React from 'react';
import { WebSocketManager } from '../services/WebSocketManager';

interface StatusBarProps {
  connected: boolean;
  detectionEnabled: boolean;
  onConnect: (adapter: string, channel: number, bitrate: number) => void;
  onDisconnect: () => void;
  onToggleDetection: (enabled: boolean) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  connected,
  detectionEnabled,
  onConnect,
  onDisconnect,
  onToggleDetection,
}) => {
  return (
    <div className="status-bar">
      <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
      <span className="status-text">{connected ? 'Connected' : 'Disconnected'}</span>

      {!connected ? (
        <button className="btn btn-primary btn-sm" onClick={() => onConnect('simulator', 0, 500000)}>
          Connect Simulator
        </button>
      ) : (
        <button className="btn btn-danger btn-sm" onClick={onDisconnect}>
          Disconnect
        </button>
      )}

      <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={detectionEnabled}
          onChange={(e) => onToggleDetection(e.target.checked)}
        />
        <span className="status-text">Intrusion Detection</span>
      </label>
    </div>
  );
};
