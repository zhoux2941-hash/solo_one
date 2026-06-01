import React, { useCallback } from "react";
import {
  Play,
  Square,
  AlertTriangle,
  Zap,
  Copy,
  Shuffle,
  Timer,
  Bug,
} from "lucide-react";
import type {
  InjectionConfig,
  InjectionType,
  InjectionRecord,
  TransferType,
} from "../types";

interface InjectionPanelProps {
  config: InjectionConfig;
  isActive: boolean;
  injectionCount: number;
  records: InjectionRecord[];
  seenPackets: number;
  onConfigChange: (config: Partial<InjectionConfig>) => void;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

const INJECTION_TYPES: { value: InjectionType; label: string; icon: React.ReactNode }[] = [
  { value: "CRCError", label: "CRC Error", icon: <AlertTriangle size={12} /> },
  { value: "DuplicateSeq", label: "Duplicate Seq#", icon: <Copy size={12} /> },
  { value: "OutOfOrderSeq", label: "Out-of-Order Seq#", icon: <Shuffle size={12} /> },
  { value: "Timeout", label: "Timeout", icon: <Timer size={12} /> },
  { value: "PayloadCorruption", label: "Payload Corruption", icon: <Bug size={12} /> },
];

const PACKET_TYPES: (TransferType | "All")[] = ["All", "Bulk", "Isochronous", "Interrupt", "UAS"];

const InjectionPanel: React.FC<InjectionPanelProps> = ({
  config,
  isActive,
  injectionCount,
  records,
  seenPackets,
  onConfigChange,
  onStart,
  onStop,
  onReset,
}) => {
  const handleEpAddrChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/[^0-9a-fA-F]/g, "");
      const parsed = val ? parseInt(val, 16) : 0;
      onConfigChange({ targetEpAddr: parsed });
    },
    [onConfigChange]
  );

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-1.5">
        <Zap size={14} className={isActive ? "text-analyzer-danger" : "text-analyzer-warning"} />
        <span className="text-xs font-semibold text-analyzer-text">Error Injection</span>
        {isActive && (
          <span className="flex items-center gap-1 text-[10px] text-analyzer-danger bg-red-900/30 px-1.5 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-analyzer-danger animate-pulse" />
            Active ({injectionCount})
          </span>
        )}
      </div>

      <div>
        <label className="label-text">Injection Type</label>
        <select
          className="select-field w-full mt-1"
          value={config.injectionType}
          onChange={(e) => onConfigChange({ injectionType: e.target.value as InjectionType })}
          disabled={isActive}
        >
          {INJECTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label-text">Target EP Address (hex)</label>
        <input
          type="text"
          className="input-field w-full mt-1"
          placeholder="e.g. 81"
          value={config.targetEpAddr === 0 ? "" : config.targetEpAddr.toString(16).toUpperCase()}
          onChange={handleEpAddrChange}
          disabled={isActive}
        />
      </div>

      <div>
        <label className="label-text">Target Packet Type</label>
        <select
          className="select-field w-full mt-1"
          value={config.targetPacketType}
          onChange={(e) =>
            onConfigChange({ targetPacketType: e.target.value as TransferType | "All" })
          }
          disabled={isActive}
        >
          {PACKET_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="label-text">Start After Packet #</label>
          {isActive && (
            <span className="text-[10px] text-analyzer-accent">
              {seenPackets}/{config.startAfterPacket}
              {seenPackets > config.startAfterPacket && config.startAfterPacket > 0 ? " ✓" : ""}
            </span>
          )}
        </div>
        <input
          type="number"
          className="input-field w-full mt-1"
          min={0}
          value={config.startAfterPacket}
          onChange={(e) => onConfigChange({ startAfterPacket: parseInt(e.target.value, 10) || 0 })}
          disabled={isActive}
        />
        <p className="text-[10px] text-analyzer-text-dim mt-1">
          Number of matching packets to skip before starting injection. Set to 0 to start immediately.
        </p>
      </div>

      <div>
        <label className="label-text">Duration Mode</label>
        <div className="flex gap-2 mt-1">
          <label
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded cursor-pointer border ${
              config.durationMode === "packets"
                ? "bg-analyzer-accent/20 border-analyzer-accent/50 text-analyzer-accent"
                : "bg-analyzer-bg border-analyzer-border text-analyzer-text-dim"
            }`}
          >
            <input
              type="radio"
              name="durationMode"
              className="hidden"
              checked={config.durationMode === "packets"}
              onChange={() => onConfigChange({ durationMode: "packets" })}
              disabled={isActive}
            />
            N packets
          </label>
          <label
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded cursor-pointer border ${
              config.durationMode === "injections"
                ? "bg-analyzer-accent/20 border-analyzer-accent/50 text-analyzer-accent"
                : "bg-analyzer-bg border-analyzer-border text-analyzer-text-dim"
            }`}
          >
            <input
              type="radio"
              name="durationMode"
              className="hidden"
              checked={config.durationMode === "injections"}
              onChange={() => onConfigChange({ durationMode: "injections" })}
              disabled={isActive}
            />
            K injections
          </label>
        </div>
        <input
          type="number"
          className="input-field w-full mt-1.5"
          min={1}
          value={config.durationCount}
          onChange={(e) =>
            onConfigChange({ durationCount: parseInt(e.target.value, 10) || 1 })
          }
          disabled={isActive}
        />
      </div>

      {config.injectionType === "PayloadCorruption" && (
        <div>
          <label className="label-text">
            Corruption Ratio: {(config.corruptionRatio * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            className="w-full mt-1 accent-analyzer-accent"
            min={0}
            max={100}
            value={config.corruptionRatio * 100}
            onChange={(e) =>
              onConfigChange({ corruptionRatio: parseInt(e.target.value, 10) / 100 })
            }
            disabled={isActive}
          />
        </div>
      )}

      <div className="flex gap-2">
        {isActive ? (
          <button className="btn-danger flex-1 flex items-center justify-center gap-1.5" onClick={onStop}>
            <Square size={12} />
            Stop Injection
          </button>
        ) : (
          <button
            className="btn-primary flex-1 flex items-center justify-center gap-1.5"
            onClick={onStart}
          >
            <Play size={12} />
            Start Injection
          </button>
        )}
        <button className="btn-secondary text-xs" onClick={onReset} disabled={isActive}>
          Reset
        </button>
      </div>

      {records.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="label-text">Injection History</span>
            <span className="text-[10px] text-analyzer-text-dim">{records.length} records</span>
          </div>
          <div className="max-h-32 overflow-auto bg-analyzer-bg rounded border border-analyzer-border">
            {records.slice(-20).reverse().map((rec) => (
              <div
                key={rec.id}
                className="flex items-center gap-2 px-2 py-1 text-[10px] font-mono border-b border-analyzer-border/30 last:border-b-0"
              >
                <span className="text-analyzer-text-dim">#{rec.id}</span>
                <span className="text-analyzer-warning">{rec.injectionType}</span>
                <span className="text-analyzer-text-dim">EP:{rec.targetEpAddr.toString(16).toUpperCase().padStart(2, "0")}</span>
                <span className="text-analyzer-text">Pkt:{rec.packetSeqNum}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InjectionPanel;
