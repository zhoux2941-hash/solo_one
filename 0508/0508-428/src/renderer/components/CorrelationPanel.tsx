import React, { useState, useEffect } from 'react';
import { WebSocketManager } from '../services/WebSocketManager';
import { CorrelationPair, CanIdProfile, formatCanId } from '../types';

interface CorrelationPanelProps {
  ws: WebSocketManager;
  profiles: CanIdProfile[];
}

export const CorrelationPanel: React.FC<CorrelationPanelProps> = ({ ws, profiles }) => {
  const [correlations, setCorrelations] = useState<CorrelationPair[]>([]);
  const [threshold, setThreshold] = useState(0.5);
  const [selectedId1, setSelectedId1] = useState<number | null>(null);
  const [selectedId2, setSelectedId2] = useState<number | null>(null);
  const [pairCorrelation, setPairCorrelation] = useState<number | null>(null);

  const loadCorrelations = () => {
    ws.send({ type: 'get_correlations' });
  };

  useEffect(() => {
    const handler = (msg: any) => {
      if (msg.type === 'correlations') {
        setCorrelations(msg.pairs);
      } else if (msg.type === 'correlation') {
        setPairCorrelation(msg.value);
      }
    };

    ws.onMessage(handler);
  }, [ws]);

  const checkPairCorrelation = () => {
    if (selectedId1 !== null && selectedId2 !== null) {
      ws.send({ type: 'get_correlation', id1: selectedId1, id2: selectedId2 });
    }
  };

  const filteredCorrelations = correlations
    .filter(c => Math.abs(c.correlation) >= threshold)
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  const getCorrelationClass = (value: number): string => {
    const abs = Math.abs(value);
    if (abs >= 0.8) return 'strong';
    if (abs >= 0.5) return 'moderate';
    return 'weak';
  };

  const getCorrelationColor = (value: number): string => {
    const abs = Math.abs(value);
    if (abs >= 0.8) return 'var(--accent-green)';
    if (abs >= 0.5) return 'var(--accent-yellow)';
    return 'var(--text-muted)';
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, color: 'var(--text-primary)' }}>Pearson Correlation Analysis</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Threshold:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              style={{ width: 100 }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{threshold.toFixed(2)}</span>
            <button className="btn btn-primary btn-sm" onClick={loadCorrelations}>Analyze</button>
          </div>
        </div>

        <div className="correlation-grid">
          {filteredCorrelations.map((pair, idx) => (
            <div key={`${pair.id1}-${pair.id2}-${idx}`} className="correlation-card">
              <div className="correlation-header">
                <span className="correlation-ids">
                  {formatCanId(pair.id1)} ↔ {formatCanId(pair.id2)}
                </span>
                <span className={`correlation-value ${getCorrelationClass(pair.correlation)}`}>
                  {pair.correlation >= 0 ? '+' : ''}{pair.correlation.toFixed(3)}
                </span>
              </div>
              <div className="correlation-bar">
                <div
                  className="correlation-bar-fill"
                  style={{
                    width: `${Math.abs(pair.correlation) * 100}%`,
                    background: getCorrelationColor(pair.correlation),
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                {Math.abs(pair.correlation) >= 0.8 ? 'Strong correlation - likely same subsystem' :
                 Math.abs(pair.correlation) >= 0.5 ? 'Moderate correlation - possibly related' :
                 'Weak correlation'}
              </div>
            </div>
          ))}
          {filteredCorrelations.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
              Click "Analyze" to compute correlations between CAN IDs
            </div>
          )}
        </div>
      </div>

      <div style={{ width: 300, borderLeft: '1px solid var(--border)', padding: 12, background: 'var(--bg-secondary)' }}>
        <h4 style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Pair Correlation Check</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>CAN ID 1:</label>
            <select
              value={selectedId1 || ''}
              onChange={(e) => setSelectedId1(Number(e.target.value) || null)}
              style={{ width: '100%', marginTop: 2 }}
            >
              <option value="">Select...</option>
              {profiles.map(p => (
                <option key={p.can_id} value={p.can_id}>{formatCanId(p.can_id)}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>CAN ID 2:</label>
            <select
              value={selectedId2 || ''}
              onChange={(e) => setSelectedId2(Number(e.target.value) || null)}
              style={{ width: '100%', marginTop: 2 }}
            >
              <option value="">Select...</option>
              {profiles.map(p => (
                <option key={p.can_id} value={p.can_id}>{formatCanId(p.can_id)}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-sm" onClick={checkPairCorrelation}>Check Correlation</button>
          {pairCorrelation !== null && (
            <div style={{
              padding: 10,
              background: 'var(--bg-tertiary)',
              borderRadius: 6,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: getCorrelationColor(pairCorrelation) }}>
                {pairCorrelation >= 0 ? '+' : ''}{pairCorrelation.toFixed(4)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Pearson Correlation Coefficient
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
