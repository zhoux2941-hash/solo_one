import React, { useMemo, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import type { UsbPacket, ScsiCommand } from "../types";
import { formatTimestamp, formatEpAddr, formatHexDump } from "../types";

interface PacketDetailProps {
  packet: UsbPacket | null;
  scsiCommand: ScsiCommand | null;
}

const PacketDetail: React.FC<PacketDetailProps> = ({ packet, scsiCommand }) => {
  const [copied, setCopied] = React.useState(false);

  const hexLines = useMemo(() => {
    if (!packet || packet.payload.length === 0) return [];
    return formatHexDump(packet.payload);
  }, [packet]);

  const copyPayload = useCallback(async () => {
    if (!packet) return;
    const hex = packet.payload
      .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
      .join(" ");
    await navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [packet]);

  if (!packet) {
    return (
      <div className="flex items-center justify-center h-full text-analyzer-text-dim text-sm">
        Select a packet to view details
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="p-3 border-b border-analyzer-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-analyzer-text">
            Packet #{packet.seqNum}
          </h3>
          <button
            className="btn-secondary flex items-center gap-1 text-xs px-2 py-1"
            onClick={copyPayload}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy Payload"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-analyzer-text-dim">Timestamp:</span>
            <span className="text-analyzer-text font-mono">
              {formatTimestamp(packet.timestamp)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-analyzer-text-dim">EP Address:</span>
            <span className="text-analyzer-text font-mono">
              {formatEpAddr(packet.epAddr)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-analyzer-text-dim">Transfer Type:</span>
            <span className="text-analyzer-text">{packet.transferType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-analyzer-text-dim">Direction:</span>
            <span className={`font-medium ${packet.direction === "IN" ? "text-analyzer-in-dir" : "text-analyzer-out-dir"}`}>
              {packet.direction}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-analyzer-text-dim">Payload Length:</span>
            <span className="text-analyzer-text font-mono">{packet.payloadLength} bytes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-analyzer-text-dim">CRC Status:</span>
            {packet.transferType === "Isochronous" ? (
              <span className="text-analyzer-text-dim">N/A (no CRC)</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className={packet.crcValid ? "text-analyzer-success" : "text-analyzer-danger"}>
                  {packet.crcValid ? "Valid" : "Invalid"}
                </span>
                <span className="text-analyzer-text-dim font-mono text-[10px]">
                  CRC-32C: {(packet.crc32c >>> 0).toString(16).toUpperCase().padStart(8, "0")}
                </span>
              </span>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-analyzer-text-dim">Device Address:</span>
            <span className="text-analyzer-text font-mono">{packet.deviceAddr}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-analyzer-text-dim">Injected:</span>
            <span className={packet.injected ? "text-analyzer-danger" : "text-analyzer-text"}>
              {packet.injected ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>

      {packet.injected && !packet.crcValid && (
        <div className="p-3 border-b border-analyzer-border bg-red-900/10">
          <h4 className="text-xs font-semibold text-analyzer-danger mb-2">CRC-32C Injection Record</h4>
          <div className="grid grid-cols-1 gap-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-analyzer-text-dim">Algorithm:</span>
              <span className="text-analyzer-warning font-mono">CRC-32C (Castagnoli)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-analyzer-text-dim">Original:</span>
              <span className="text-analyzer-success font-mono">
                {(packet.crc32c >>> 0).toString(16).toUpperCase().padStart(8, "0")}
              </span>
              <span className="text-analyzer-text-dim">(correct for original payload)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-analyzer-text-dim">Injected:</span>
              <span className="text-analyzer-danger font-mono">
                {(packet.crc32c >>> 0).toString(16).toUpperCase().padStart(8, "0")}
              </span>
              <span className="text-analyzer-text-dim">(corrupted via XOR with error pattern)</span>
            </div>
          </div>
          <p className="text-[10px] text-analyzer-text-dim mt-2">
            USB 3.0 SuperSpeed link layer uses CRC-32C (polynomial 0x1EDC6F41) to protect
            data packet payloads. The injected CRC was computed by recalculating the correct
            CRC-32C for the payload, then XORing with a single-bit error pattern.
          </p>
        </div>
      )}

      {packet.injected && packet.crcValid && (
        <div className="p-3 border-b border-analyzer-border bg-red-900/10">
          <h4 className="text-xs font-semibold text-analyzer-danger mb-1">Injection Record</h4>
          <p className="text-xs text-analyzer-text-dim">
            This packet was modified by the error injection engine. The original data has been
            replaced with injected values for testing purposes.
          </p>
        </div>
      )}

      {packet.transferType === "Isochronous" && (
        <div className="p-3 border-b border-analyzer-border bg-purple-900/10">
          <h4 className="text-xs font-semibold text-analyzer-uas mb-2">Isochronous Transfer Info</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-analyzer-text-dim">Micro Frame:</span>
              <span className="text-analyzer-text font-mono">{packet.isoMicroFrame}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-analyzer-text-dim">ISO Status:</span>
              <span className={packet.isoStatus === 0 ? "text-analyzer-success" : "text-analyzer-warning"}>
                {packet.isoStatus === 0 ? "OK" : `Error (${packet.isoStatus})`}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-analyzer-text-dim mt-2">
            Isochronous transfers have no CRC, no retransmission, and no error correction.
            Data is delivered at guaranteed bandwidth with best-effort reliability.
          </p>
        </div>
      )}

      {scsiCommand && (
        <div className="p-3 border-b border-analyzer-border">
          <h4 className="text-xs font-semibold text-analyzer-uas mb-2">SCSI Command</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-analyzer-text-dim">Command:</span>
              <span className="text-analyzer-text font-mono">{scsiCommand.command}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-analyzer-text-dim">LUN:</span>
              <span className="text-analyzer-text font-mono">{scsiCommand.lun}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-analyzer-text-dim">Block Address:</span>
              <span className="text-analyzer-text font-mono">{scsiCommand.blockAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-analyzer-text-dim">Data Length:</span>
              <span className="text-analyzer-text font-mono">{scsiCommand.dataLength}</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-analyzer-text-dim text-xs">CDB: </span>
            <span className="font-mono text-[10px] text-analyzer-text">
              {scsiCommand.cdb.map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" ")}
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 p-3">
        <h4 className="text-xs font-semibold text-analyzer-text mb-2">Hex Dump</h4>
        <div className="hex-dump-container bg-analyzer-bg rounded p-2 overflow-auto max-h-[400px]">
          {hexLines.length > 0 ? (
            hexLines.map((line, i) => {
              const parts = line.match(/^(\S+)\s{2}(.+?)\s{2}\|(.+)\|$/);
              if (!parts) {
                return (
                  <div key={i} className="whitespace-pre">
                    {line}
                  </div>
                );
              }
              return (
                <div key={i} className="whitespace-pre">
                  <span className="hex-dump-offset">{parts[1]}</span>
                  {"  "}
                  <span className="hex-dump-byte">{parts[2]}</span>
                  {"  "}
                  <span className="hex-dump-ascii">|{parts[3]}|</span>
                </div>
              );
            })
          ) : (
            <span className="text-analyzer-text-dim">No payload data</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PacketDetail;
