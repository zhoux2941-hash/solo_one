import React, { useState, useRef, useMemo } from 'react';
import { CanFrame, CanIdProfile, LabelRecord, formatCanId, formatTimestamp } from '../types';
import { WebSocketManager } from '../services/WebSocketManager';

interface LabelingToolProps {
  frames: CanFrame[];
  profiles: CanIdProfile[];
  onAddLabel: (canId: number, startTimeUs: number, endTimeUs: number, isNormal: boolean, labelText: string) => void;
  onRetrain: () => void;
  ws: WebSocketManager;
}

export const LabelingTool: React.FC<LabelingToolProps> = ({
  frames,
  profiles,
  onAddLabel,
  onRetrain,
  ws,
}) => {
  const [selectedCanId, setSelectedCanId] = useState<number>(0);
  const [labelText, setLabelText] = useState('');
  const [isNormal, setIsNormal] = useState(true);
  const [labels, setLabels] = useState<LabelRecord[]>([]);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const canIdFrames = useMemo(() => {
    if (selectedCanId === 0) return [];
    return frames.filter(f => f.can_id === selectedCanId).slice(-500);
  }, [frames, selectedCanId]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || canIdFrames.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const minTime = canIdFrames[0]?.timestamp_us || 0;
    const maxTime = canIdFrames[canIdFrames.length - 1]?.timestamp_us || 1;
    const timeRange = maxTime - minTime;
    const clickedTime = minTime + (x / rect.width) * timeRange;

    setSelectionStart(clickedTime);
    setSelectionEnd(null);
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || canIdFrames.length === 0 || selectionStart === null) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const minTime = canIdFrames[0]?.timestamp_us || 0;
    const maxTime = canIdFrames[canIdFrames.length - 1]?.timestamp_us || 1;
    const timeRange = maxTime - minTime;
    const clickedTime = minTime + (x / rect.width) * timeRange;

    setSelectionEnd(clickedTime);
  };

  const handleSubmitLabel = () => {
    if (selectionStart !== null && selectionEnd !== null && selectedCanId > 0) {
      const start = Math.min(selectionStart, selectionEnd);
      const end = Math.max(selectionStart, selectionEnd);
      onAddLabel(selectedCanId, start, end, isNormal, labelText);
      setSelectionStart(null);
      setSelectionEnd(null);
      setLabelText('');
    }
  };

  const handleLoadLabels = () => {
    ws.send({ type: 'get_labels', can_id: selectedCanId > 0 ? selectedCanId : null });
  };

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || canIdFrames.length === 0) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = 200 * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = 200;
    const padding = { top: 10, right: 10, bottom: 20, left: 50 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    const values = canIdFrames.map(f => ((f.data[1] || 0) << 8) | f.data[0]);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const valRange = maxVal - minVal || 1;

    const minTime = canIdFrames[0].timestamp_us;
    const maxTime = canIdFrames[canIdFrames.length - 1].timestamp_us;
    const timeRange = maxTime - minTime || 1;

    if (selectionStart !== null) {
      const selStartX = padding.left + ((selectionStart - minTime) / timeRange) * chartW;
      const selEndX = selectionEnd !== null
        ? padding.left + ((selectionEnd - minTime) / timeRange) * chartW
        : selStartX;

      const x1 = Math.min(selStartX, selEndX);
      const x2 = Math.max(selStartX, selEndX);

      ctx.fillStyle = isNormal ? 'rgba(63, 185, 80, 0.1)' : 'rgba(248, 81, 73, 0.1)';
      ctx.fillRect(x1, padding.top, x2 - x1, chartH);

      ctx.strokeStyle = isNormal ? '#3fb950' : '#f85149';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x1, padding.top);
      ctx.lineTo(x1, padding.top + chartH);
      ctx.moveTo(x2, padding.top);
      ctx.lineTo(x2, padding.top + chartH);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    canIdFrames.forEach((frame, i) => {
      const x = padding.left + ((frame.timestamp_us - minTime) / timeRange) * chartW;
      const y = padding.top + chartH - ((values[i] - minVal) / valRange) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 12 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>CAN ID:</span>
          <select value={selectedCanId} onChange={(e) => setSelectedCanId(Number(e.target.value))} style={{ fontSize: 12 }}>
            <option value={0}>Select CAN ID...</option>
            {profiles.map(p => (
              <option key={p.can_id} value={p.can_id}>{formatCanId(p.can_id)}</option>
            ))}
          </select>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {canIdFrames.length} frames loaded
          </span>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
          Click and drag on the chart to select a time region for labeling
        </div>

        <div ref={containerRef} style={{ flex: '0 0 200px', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '200px', cursor: 'crosshair' }}
            onMouseDown={handleCanvasMouseDown}
            onMouseUp={handleCanvasMouseUp}
          />
        </div>

        {selectionStart !== null && selectionEnd !== null && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', padding: 8, background: 'var(--bg-tertiary)', borderRadius: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Selected: {formatTimestamp(Math.min(selectionStart, selectionEnd))} → {formatTimestamp(Math.max(selectionStart, selectionEnd))}
            </span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
              <input type="radio" checked={isNormal} onChange={() => setIsNormal(true)} />
              <span style={{ color: 'var(--accent-green)' }}>Normal</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
              <input type="radio" checked={!isNormal} onChange={() => setIsNormal(false)} />
              <span style={{ color: 'var(--accent-red)' }}>Anomaly</span>
            </label>
            <input
              type="text"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              placeholder="Label description..."
              style={{ flex: 1, fontSize: 11 }}
            />
            <button className="btn btn-primary btn-sm" onClick={handleSubmitLabel}>Save Label</button>
          </div>
        )}

        <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-sm" onClick={handleLoadLabels}>Load Labels</button>
          <button className="btn btn-success btn-sm" onClick={onRetrain}>Retrain Model</button>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {labels.length} labels loaded
          </span>
        </div>
      </div>

      <div style={{ width: 350, borderLeft: '1px solid var(--border)', overflow: 'auto', background: 'var(--bg-secondary)' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Labels</span>
        </div>
        {labels.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            No labels yet. Select a region on the chart and mark it.
          </div>
        ) : (
          labels.map((label, idx) => (
            <div key={idx} className="label-row">
              <span className={`can-id-hex ${label.is_normal ? 'label-normal' : 'label-anomaly'}`}>
                {label.is_normal ? '✓' : '✗'}
              </span>
              <span className="can-id-hex">{formatCanId(label.can_id)}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {formatTimestamp(label.start_time_us)}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {label.label_text}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
