import React, { useState, useCallback } from "react";
import {
  Search,
  Download,
  Calendar,
  Database,
} from "lucide-react";
import type { SessionInfo, UsbPacket, InjectionRecord, PacketQueryFilter, InjectionQueryFilter } from "../types";

interface HistoryPanelProps {
  sessions: SessionInfo[];
  packetResults: UsbPacket[];
  injectionResults: InjectionRecord[];
  isLoading: boolean;
  error: string | null;
  onQueryPackets: (filter: PacketQueryFilter) => Promise<UsbPacket[]>;
  onQueryInjections: (filter: InjectionQueryFilter) => Promise<InjectionRecord[]>;
  onGetSessions: () => Promise<SessionInfo[]>;
  onExport: (sessionIds: string[], outputPath: string) => Promise<void>;
  onReplay: (sessionId: string) => Promise<UsbPacket[]>;
}

const INJECTION_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "CRCError", label: "CRC Error" },
  { value: "DuplicateSeq", label: "Duplicate Seq#" },
  { value: "OutOfOrderSeq", label: "Out-of-Order Seq#" },
  { value: "Timeout", label: "Timeout" },
  { value: "PayloadCorruption", label: "Payload Corruption" },
];

function formatDateTime(ts: number): string {
  return new Date(ts).toISOString().replace("T", " ").slice(0, 19);
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  sessions,
  packetResults,
  injectionResults,
  isLoading,
  error,
  onQueryPackets,
  onQueryInjections,
  onGetSessions,
  onExport,
  onReplay,
}) => {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [epAddrFilter, setEpAddrFilter] = useState("");
  const [injectionTypeFilter, setInjectionTypeFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"sessions" | "packets" | "injections">("sessions");
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set());

  const parseTime = (val: string): number | null => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.getTime();
  };

  const handleQuery = useCallback(async () => {
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    const epAddr = epAddrFilter ? parseInt(epAddrFilter, 16) : null;

    if (activeTab === "packets") {
      await onQueryPackets({ startTime: start, endTime: end, epAddr, injectionType: injectionTypeFilter || null });
    } else if (activeTab === "injections") {
      await onQueryInjections({ startTime: start, endTime: end, injectionType: injectionTypeFilter || null });
    }
  }, [startTime, endTime, epAddrFilter, injectionTypeFilter, activeTab, onQueryPackets, onQueryInjections]);

  const handleLoadSessions = useCallback(async () => {
    await onGetSessions();
  }, [onGetSessions]);

  const toggleSession = useCallback((id: string) => {
    setSelectedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleExport = useCallback(async () => {
    if (selectedSessionIds.size === 0) return;
    await onExport(Array.from(selectedSessionIds), "");
  }, [selectedSessionIds, onExport]);

  const handleReplay = useCallback(async (sessionId: string) => {
    await onReplay(sessionId);
  }, [onReplay]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-analyzer-border bg-analyzer-surface">
        <Database size={14} className="text-analyzer-accent" />
        <span className="text-xs font-semibold text-analyzer-text">History Query</span>
      </div>

      <div className="flex gap-1 px-3 pt-2 border-b border-analyzer-border">
        {(["sessions", "packets", "injections"] as const).map((tab) => (
          <button
            key={tab}
            className={`text-xs px-3 py-1.5 capitalize ${
              activeTab === tab ? "tab-active" : "tab-inactive"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-2 px-3 py-2 border-b border-analyzer-border bg-analyzer-bg/50">
        <div className="flex-1">
          <label className="label-text flex items-center gap-1">
            <Calendar size={8} />
            Start Time
          </label>
          <input
            type="datetime-local"
            className="input-field w-full mt-0.5 text-[11px]"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="label-text">End Time</label>
          <input
            type="datetime-local"
            className="input-field w-full mt-0.5 text-[11px]"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
        <div className="w-20">
          <label className="label-text">EP Addr</label>
          <input
            type="text"
            className="input-field w-full mt-0.5 text-[11px]"
            placeholder="hex"
            value={epAddrFilter}
            onChange={(e) => setEpAddrFilter(e.target.value.replace(/[^0-9a-fA-F]/g, ""))}
          />
        </div>
        <div className="w-32">
          <label className="label-text">Injection Type</label>
          <select
            className="select-field w-full mt-0.5 text-[11px]"
            value={injectionTypeFilter}
            onChange={(e) => setInjectionTypeFilter(e.target.value)}
          >
            {INJECTION_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button
          className="btn-primary text-xs flex items-center gap-1 px-2 py-1"
          onClick={activeTab === "sessions" ? handleLoadSessions : handleQuery}
          disabled={isLoading}
        >
          <Search size={10} />
          {isLoading ? "Loading..." : "Query"}
        </button>
      </div>

      {error && (
        <div className="px-3 py-1 bg-red-900/20 text-analyzer-danger text-xs">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {activeTab === "sessions" && (
          <div>
            {sessions.length === 0 ? (
              <div className="text-xs text-analyzer-text-dim text-center py-8">
                Click "Query" to load sessions
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-analyzer-surface text-analyzer-text-dim">
                  <tr>
                    <th className="px-2 py-1.5 text-left w-6">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedSessionIds.size === sessions.length && sessions.length > 0}
                        onChange={() => {
                          if (selectedSessionIds.size === sessions.length) {
                            setSelectedSessionIds(new Set());
                          } else {
                            setSelectedSessionIds(new Set(sessions.map((s) => s.id)));
                          }
                        }}
                      />
                    </th>
                    <th className="px-2 py-1.5 text-left">Device</th>
                    <th className="px-2 py-1.5 text-left">Start</th>
                    <th className="px-2 py-1.5 text-right">Packets</th>
                    <th className="px-2 py-1.5 text-right">Injections</th>
                    <th className="px-2 py-1.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr
                      key={s.id}
                      className={`border-b border-analyzer-border/30 hover:bg-analyzer-border/10 ${
                        selectedSessionIds.has(s.id) ? "bg-analyzer-accent/5" : ""
                      }`}
                    >
                      <td className="px-2 py-1">
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedSessionIds.has(s.id)}
                          onChange={() => toggleSession(s.id)}
                        />
                      </td>
                      <td className="px-2 py-1 text-analyzer-text">{s.deviceName}</td>
                      <td className="px-2 py-1 text-analyzer-text-dim font-mono">
                        {formatDateTime(s.startTime)}
                      </td>
                      <td className="px-2 py-1 text-analyzer-text text-right font-mono">
                        {s.packetCount.toLocaleString()}
                      </td>
                      <td className="px-2 py-1 text-analyzer-warning text-right font-mono">
                        {s.injectionCount}
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button
                          className="text-analyzer-accent hover:text-analyzer-accent-hover text-[10px] underline"
                          onClick={() => handleReplay(s.id)}
                        >
                          Replay
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "packets" && (
          <div>
            {packetResults.length === 0 ? (
              <div className="text-xs text-analyzer-text-dim text-center py-8">
                Set filters and click "Query" to search packets
              </div>
            ) : (
              <table className="w-full text-xs font-mono">
                <thead className="bg-analyzer-surface text-analyzer-text-dim">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Seq#</th>
                    <th className="px-2 py-1.5 text-left">Timestamp</th>
                    <th className="px-2 py-1.5 text-left">EP</th>
                    <th className="px-2 py-1.5 text-left">Type</th>
                    <th className="px-2 py-1.5 text-left">Dir</th>
                    <th className="px-2 py-1.5 text-right">Len</th>
                  </tr>
                </thead>
                <tbody>
                  {packetResults.map((pkt) => (
                    <tr
                      key={pkt.seqNum}
                      className="border-b border-analyzer-border/30 hover:bg-analyzer-border/10"
                    >
                      <td className="px-2 py-1 text-analyzer-text-dim">{pkt.seqNum}</td>
                      <td className="px-2 py-1 text-analyzer-text">
                        {new Date(pkt.timestamp / 1000).toLocaleTimeString()}
                      </td>
                      <td className="px-2 py-1 text-analyzer-text">
                        0x{pkt.epAddr.toString(16).toUpperCase().padStart(2, "0")}
                      </td>
                      <td className="px-2 py-1 text-analyzer-text">{pkt.transferType}</td>
                      <td className="px-2 py-1 text-analyzer-text">{pkt.direction}</td>
                      <td className="px-2 py-1 text-analyzer-text text-right">{pkt.payloadLength}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "injections" && (
          <div>
            {injectionResults.length === 0 ? (
              <div className="text-xs text-analyzer-text-dim text-center py-8">
                Set filters and click "Query" to search injection records
              </div>
            ) : (
              <table className="w-full text-xs font-mono">
                <thead className="bg-analyzer-surface text-analyzer-text-dim">
                  <tr>
                    <th className="px-2 py-1.5 text-left">ID</th>
                    <th className="px-2 py-1.5 text-left">Time</th>
                    <th className="px-2 py-1.5 text-left">Type</th>
                    <th className="px-2 py-1.5 text-left">EP</th>
                    <th className="px-2 py-1.5 text-left">Packet Seq</th>
                  </tr>
                </thead>
                <tbody>
                  {injectionResults.map((rec) => (
                    <tr
                      key={rec.id}
                      className="border-b border-analyzer-border/30 hover:bg-analyzer-border/10"
                    >
                      <td className="px-2 py-1 text-analyzer-text-dim">{rec.id}</td>
                      <td className="px-2 py-1 text-analyzer-text">
                        {new Date(rec.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-2 py-1 text-analyzer-warning">{rec.injectionType}</td>
                      <td className="px-2 py-1 text-analyzer-text">
                        0x{rec.targetEpAddr.toString(16).toUpperCase().padStart(2, "0")}
                      </td>
                      <td className="px-2 py-1 text-analyzer-text">{rec.packetSeqNum}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {activeTab === "sessions" && selectedSessionIds.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-analyzer-border bg-analyzer-surface">
          <span className="text-xs text-analyzer-text-dim">
            {selectedSessionIds.size} selected
          </span>
          <div className="flex-1" />
          <button
            className="btn-secondary text-xs flex items-center gap-1"
            onClick={handleExport}
          >
            <Download size={10} />
            Export Selected
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
