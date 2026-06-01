import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Lock, Unlock } from "lucide-react";
import type { UsbPacket, FilterConfig } from "../types";
import {
  formatTimestamp,
  formatEpAddr,
  formatPayloadPreview,
  getTransferTypeBadgeClass,
  getPacketRowClass,
} from "../types";
import { applyFilter } from "../types";

interface PacketListProps {
  packets: UsbPacket[];
  selectedSeq: number | null;
  onSelectPacket: (packet: UsbPacket) => void;
  filter: FilterConfig;
}

const ROW_HEIGHT = 28;
const OVERSCAN = 10;

const PacketList: React.FC<PacketListProps> = ({
  packets,
  selectedSeq,
  onSelectPacket,
  filter,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const [autoScroll, setAutoScroll] = useState(true);

  const filteredPackets = useMemo(() => applyFilter(packets, filter), [packets, filter]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [filteredPackets.length, autoScroll]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    setScrollTop(el.scrollTop);
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < ROW_HEIGHT * 2;
    if (atBottom !== autoScroll) {
      setAutoScroll(atBottom);
    }
  }, [autoScroll]);

  const totalHeight = filteredPackets.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    filteredPackets.length,
    Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN
  );
  const visiblePackets = filteredPackets.slice(startIndex, endIndex);
  const offsetY = startIndex * ROW_HEIGHT;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 bg-analyzer-surface border-b border-analyzer-border">
        <span className="text-xs text-analyzer-text-dim">
          Showing {filteredPackets.length.toLocaleString()} of {packets.length.toLocaleString()} packets
        </span>
        <div className="flex items-center gap-2">
          <button
            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
              autoScroll
                ? "bg-analyzer-accent/20 text-analyzer-accent"
                : "text-analyzer-text-dim hover:text-analyzer-text"
            }`}
            onClick={() => {
              setAutoScroll(!autoScroll);
              if (!autoScroll && containerRef.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
              }
            }}
          >
            {autoScroll ? <Lock size={12} /> : <Unlock size={12} />}
            {autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
          </button>
        </div>
      </div>

      <div className="flex bg-analyzer-bg border-b border-analyzer-border text-hex-header font-mono">
        <div className="w-16 px-2 text-analyzer-text-dim">Seq#</div>
        <div className="w-32 px-2 text-analyzer-text-dim">Timestamp</div>
        <div className="w-16 px-2 text-analyzer-text-dim">EP Addr</div>
        <div className="w-24 px-2 text-analyzer-text-dim">Type</div>
        <div className="w-14 px-2 text-analyzer-text-dim">Dir</div>
        <div className="w-16 px-2 text-analyzer-text-dim">Length</div>
        <div className="w-14 px-2 text-analyzer-text-dim">CRC</div>
        <div className="flex-1 px-2 text-analyzer-text-dim truncate">Payload Preview</div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: "relative" }}>
          <div style={{ position: "absolute", top: offsetY, left: 0, right: 0 }}>
            {visiblePackets.map((pkt) => {
              const isSelected = selectedSeq === pkt.seqNum;
              const rowClass = getPacketRowClass(pkt);
              return (
                <div
                  key={pkt.seqNum}
                  className={`flex items-center font-mono text-hex cursor-pointer border-b border-analyzer-border/30 hover:bg-analyzer-border/20 ${
                    isSelected ? "bg-analyzer-accent/10" : ""
                  } ${rowClass}`}
                  style={{ height: ROW_HEIGHT }}
                  onClick={() => onSelectPacket(pkt)}
                >
                  <div className="w-16 px-2 text-analyzer-text-dim truncate">
                    {pkt.seqNum}
                  </div>
                  <div className="w-32 px-2 text-analyzer-text truncate">
                    {formatTimestamp(pkt.timestamp)}
                  </div>
                  <div className="w-16 px-2 text-analyzer-text font-medium">
                    {formatEpAddr(pkt.epAddr)}
                  </div>
                  <div className="w-24 px-2">
                    <span
                      className={`inline-block text-[10px] px-1.5 py-0.5 rounded ${getTransferTypeBadgeClass(
                        pkt.transferType
                      )}`}
                    >
                      {pkt.transferType === "Isochronous" ? "ISO" : pkt.transferType}
                    </span>
                  </div>
                  <div className="w-14 px-2">
                    {pkt.direction === "IN" ? (
                      <span className="text-analyzer-in-dir text-xs font-medium">
                        {"<"} IN
                      </span>
                    ) : (
                      <span className="text-analyzer-out-dir text-xs font-medium">
                        OUT {">"}
                      </span>
                    )}
                  </div>
                  <div className="w-16 px-2 text-analyzer-text">
                    {pkt.payloadLength}
                  </div>
                  <div className="w-14 px-2">
                    {pkt.transferType === "Isochronous" ? (
                      <span className="text-analyzer-text-dim text-xs">N/A</span>
                    ) : pkt.crcValid ? (
                      <span className="text-analyzer-success text-xs font-bold">OK</span>
                    ) : (
                      <span className="text-analyzer-danger text-xs font-bold">ERR</span>
                    )}
                  </div>
                  <div className="flex-1 px-2 text-analyzer-text-dim truncate text-[10px]">
                    {pkt.payload.length > 0
                      ? formatPayloadPreview(pkt.payload, 32)
                      : "--"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PacketList;
