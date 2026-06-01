import React, { useMemo } from 'react';
import { CanIdProfile, SignalIdentification, SIGNAL_TYPE_LABELS, SIGNAL_TYPE_CLASS, formatCanId } from '../types';

interface CanIdListProps {
  profiles: CanIdProfile[];
  identifications: SignalIdentification[];
  selectedCanIds: number[];
  onToggleCanId: (canId: number) => void;
  onIdentify: () => void;
  onRefresh: () => void;
}

export const CanIdList: React.FC<CanIdListProps> = ({
  profiles,
  identifications,
  selectedCanIds,
  onToggleCanId,
  onIdentify,
  onRefresh,
}) => {
  const idMap = useMemo(() => {
    const map = new Map<number, SignalIdentification>();
    identifications.forEach(id => map.set(id.can_id, id));
    return map;
  }, [identifications]);

  const sortedProfiles = useMemo(() => {
    return [...profiles].sort((a, b) => a.can_id - b.can_id);
  }, [profiles]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="panel-section">
        <div className="panel-title">
          <span>CAN IDs ({profiles.length})</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-sm" onClick={onRefresh}>Refresh</button>
            <button className="btn btn-primary btn-sm" onClick={onIdentify}>Identify</button>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
          Select up to 8 IDs for chart display
        </div>
      </div>
      <div className="can-id-list">
        {sortedProfiles.map(profile => {
          const identification = idMap.get(profile.can_id);
          const isSelected = selectedCanIds.includes(profile.can_id);
          const signalType = identification?.signal_type || profile.signal_type;
          const label = SIGNAL_TYPE_LABELS[signalType] || signalType;
          const typeClass = SIGNAL_TYPE_CLASS[signalType] || '';
          const confidence = identification?.confidence ?? profile.confidence;

          return (
            <div
              key={profile.can_id}
              className={`can-id-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggleCanId(profile.can_id)}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleCanId(profile.can_id)}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="can-id-hex">{formatCanId(profile.can_id)}</span>
              <span className={`can-id-type ${typeClass}`}>{label}</span>
              {confidence > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>
                  {(confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
          );
        })}
        {profiles.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
            No CAN IDs detected yet.<br />
            Connect to start receiving frames.
          </div>
        )}
      </div>
    </div>
  );
};
