import React, { useEffect, useRef, useState } from 'react';
import { AttackEvent, AttackRecord, formatCanId, formatTimestamp } from '../types';
import { WebSocketManager } from '../services/WebSocketManager';

interface IntrusionPanelProps {
  attacks: AttackEvent[];
  ws: WebSocketManager;
  detectionEnabled: boolean;
}

export const IntrusionPanel: React.FC<IntrusionPanelProps> = ({ attacks, ws, detectionEnabled }) => {
  const [attackHistory, setAttackHistory] = useState<AttackRecord[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const alertAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      alertAudioRef.current = new Audio();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      alertAudioRef.current = null;

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 880;
      oscillator.type = 'square';
      gainNode.gain.value = 0.1;
      oscillator.start();

      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 200);
    } catch (e) {
      // Audio not available
    }
  }, [attacks.length]);

  useEffect(() => {
    ws.send({ type: 'get_attacks', limit: 100, offset: 0 });
  }, []);

  const recentAttacks = attacks.slice(-50).reverse();
  const filteredAttacks = filterType === 'all'
    ? recentAttacks
    : recentAttacks.filter(a => a.attack_type.toLowerCase() === filterType);

  const stats = {
    injection: attacks.filter(a => a.attack_type === 'Injection').length,
    replay: attacks.filter(a => a.attack_type === 'Replay').length,
    spoofing: attacks.filter(a => a.attack_type === 'Spoofing').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 12, padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div style={{ flex: 1, padding: '8px 12px', background: 'rgba(248,81,73,0.1)', borderRadius: 6, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-red)' }}>{stats.injection}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>INJECTION</div>
        </div>
        <div style={{ flex: 1, padding: '8px 12px', background: 'rgba(210,153,34,0.1)', borderRadius: 6, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-yellow)' }}>{stats.replay}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>REPLAY</div>
        </div>
        <div style={{ flex: 1, padding: '8px 12px', background: 'rgba(219,109,40,0.1)', borderRadius: 6, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-orange)' }}>{stats.spoofing}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>SPOOFING</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '6px 12px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>Filter:</span>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ fontSize: 11 }}>
          <option value="all">All Types</option>
          <option value="injection">Injection</option>
          <option value="replay">Replay</option>
          <option value="spoofing">Spoofing</option>
        </select>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredAttacks.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            {detectionEnabled ? 'No attacks detected. Monitoring...' : 'Intrusion detection is disabled.'}
          </div>
        ) : (
          filteredAttacks.map((attack, idx) => (
            <div
              key={`${attack.timestamp_us}-${idx}`}
              className={`attack-item ${attack.attack_type.toLowerCase()}`}
              onClick={() => setHighlightedId(attack.can_id)}
              style={{
                background: highlightedId === attack.can_id
                  ? 'rgba(248,81,73,0.08)'
                  : undefined,
              }}
            >
              <span className={`attack-type ${attack.attack_type.toLowerCase()}`}>
                {attack.attack_type}
              </span>
              <div className="attack-details">
                <div>
                  <span className="attack-can-id">{formatCanId(attack.can_id)}</span>
                  <span className="attack-confidence" style={{ marginLeft: 8 }}>
                    {(attack.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="attack-time">{formatTimestamp(attack.timestamp_us)}</div>
                <div className="attack-desc">{attack.details}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  Data: {attack.raw_data.slice(0, attack.dlc).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
