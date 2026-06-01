import React, { useState } from "react";
import { ChevronDown, ChevronRight, HardDrive } from "lucide-react";
import type { ScsiCommand } from "../types";

interface ScsiParserProps {
  commands: ScsiCommand[];
}

const COMMAND_TYPE_COLORS: Record<string, string> = {
  Read: "text-blue-400",
  Write: "text-red-400",
  Other: "text-gray-400",
};

const COMMAND_TYPE_BG: Record<string, string> = {
  Read: "badge-bulk",
  Write: "badge-interrupt",
  Other: "bg-gray-800/40 text-gray-400 border border-gray-700/50",
};

const ScsiParser: React.FC<ScsiParserProps> = ({ commands }) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (commands.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-3">
        <div className="flex items-center gap-1.5">
          <HardDrive size={14} className="text-analyzer-uas" />
          <span className="text-xs font-semibold text-analyzer-text">SCSI Parser</span>
        </div>
        <div className="text-xs text-analyzer-text-dim text-center py-4">
          No SCSI commands in current capture
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-analyzer-border">
        <HardDrive size={14} className="text-analyzer-uas" />
        <span className="text-xs font-semibold text-analyzer-text">SCSI Parser</span>
        <span className="text-[10px] text-analyzer-text-dim ml-auto">
          {commands.length} commands
        </span>
      </div>

      <div className="flex bg-analyzer-bg border-b border-analyzer-border text-hex-header font-mono">
        <div className="w-6 px-1" />
        <div className="w-24 px-2 text-analyzer-text-dim">Command</div>
        <div className="w-12 px-2 text-analyzer-text-dim">LUN</div>
        <div className="w-20 px-2 text-analyzer-text-dim">Block Addr</div>
        <div className="w-16 px-2 text-analyzer-text-dim">Data Len</div>
        <div className="w-16 px-2 text-analyzer-text-dim">Type</div>
      </div>

      <div className="flex-1 overflow-auto">
        {commands.map((cmd, i) => {
          const isExpanded = expandedRows.has(i);
          return (
            <div key={i} className="border-b border-analyzer-border/30">
              <div
                className="flex items-center font-mono text-hex cursor-pointer hover:bg-analyzer-border/10"
                onClick={() => toggleRow(i)}
              >
                <div className="w-6 px-1 flex items-center justify-center">
                  {isExpanded ? (
                    <ChevronDown size={10} className="text-analyzer-text-dim" />
                  ) : (
                    <ChevronRight size={10} className="text-analyzer-text-dim" />
                  )}
                </div>
                <div className={`w-24 px-2 ${COMMAND_TYPE_COLORS[cmd.commandType]}`}>
                  {cmd.command}
                </div>
                <div className="w-12 px-2 text-analyzer-text">{cmd.lun}</div>
                <div className="w-20 px-2 text-analyzer-text font-mono">
                  0x{cmd.blockAddress.toString(16).toUpperCase()}
                </div>
                <div className="w-16 px-2 text-analyzer-text font-mono">{cmd.dataLength}</div>
                <div className="w-16 px-2">
                  <span
                    className={`inline-block text-[10px] px-1.5 py-0.5 rounded ${COMMAND_TYPE_BG[cmd.commandType]}`}
                  >
                    {cmd.commandType}
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className="px-8 py-2 bg-analyzer-bg/50">
                  <div className="text-[10px] text-analyzer-text-dim mb-1">CDB (Command Descriptor Block):</div>
                  <div className="font-mono text-[10px] text-analyzer-text">
                    {cmd.cdb.map((b, idx) => (
                      <span key={idx} className={idx === 0 ? `${COMMAND_TYPE_COLORS[cmd.commandType]} font-bold` : ""}>
                        {b.toString(16).toUpperCase().padStart(2, "0")}
                        {idx < cmd.cdb.length - 1 ? " " : ""}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 text-[10px] text-analyzer-text-dim">
                    Total CDB length: {cmd.cdb.length} bytes
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScsiParser;
