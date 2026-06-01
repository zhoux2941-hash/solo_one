import React, { useState, useEffect } from "react";
import { Activity, Wifi, WifiOff, Signal } from "lucide-react";
import type { LinkStateInfo } from "../types";
import { formatBer } from "../types";

interface LinkStatusProps {
  linkState: LinkStateInfo | null;
}

const LINK_STATE_COLORS: Record<string, string> = {
  U0: "text-analyzer-success",
  U1: "text-analyzer-warning",
  U2: "text-orange-400",
  U3: "text-analyzer-danger",
};

const LINK_STATE_BG: Record<string, string> = {
  U0: "bg-green-900/30 border-green-700/50",
  U1: "bg-yellow-900/30 border-yellow-700/50",
  U2: "bg-orange-900/30 border-orange-700/50",
  U3: "bg-red-900/30 border-red-700/50",
};

const LINK_STATE_DESCRIPTIONS: Record<string, string> = {
  U0: "Active - Full functionality",
  U1: "Fast Exit - Partial power down",
  U2: "Deeper Sleep - Lower power",
  U3: "Suspended - Lowest power",
};

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full h-1.5 bg-analyzer-bg rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const LinkStatus: React.FC<LinkStatusProps> = ({ linkState }) => {
  const [localState, setLocalState] = useState<LinkStateInfo | null>(linkState);

  useEffect(() => {
    setLocalState(linkState);
  }, [linkState]);

  if (!localState) {
    return (
      <div className="flex flex-col gap-3 p-3">
        <div className="flex items-center gap-1.5">
          <Activity size={14} className="text-analyzer-text-dim" />
          <span className="text-xs font-semibold text-analyzer-text">Link Status</span>
        </div>
        <div className="text-xs text-analyzer-text-dim text-center py-4">
          No device connected
        </div>
      </div>
    );
  }

  const stateColor = LINK_STATE_COLORS[localState.linkState] || "text-analyzer-text-dim";
  const stateBg = LINK_STATE_BG[localState.linkState] || "bg-analyzer-bg";

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-1.5">
        <Activity size={14} className="text-analyzer-accent" />
        <span className="text-xs font-semibold text-analyzer-text">Link Status</span>
      </div>

      <div className={`flex items-center gap-2 px-3 py-2 rounded border ${stateBg}`}>
        {localState.linkState === "U0" ? (
          <Wifi size={16} className={stateColor} />
        ) : (
          <WifiOff size={16} className={stateColor} />
        )}
        <div>
          <div className={`text-sm font-bold ${stateColor}`}>{localState.linkState}</div>
          <div className="text-[10px] text-analyzer-text-dim">
            {LINK_STATE_DESCRIPTIONS[localState.linkState]}
          </div>
        </div>
      </div>

      <div>
        <span className="label-text">Power Management</span>
        <div className="text-xs text-analyzer-text mt-1">{localState.powerState}</div>
      </div>

      <div>
        <span className="label-text">Training Status</span>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-analyzer-text flex-1">{localState.trainingStatus}</span>
          <span className="text-[10px] text-analyzer-text-dim">
            {localState.trainingProgress}%
          </span>
        </div>
        <ProgressBar
          value={localState.trainingProgress}
          max={100}
          color="bg-analyzer-accent"
        />
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Signal size={12} className="text-analyzer-accent" />
          <span className="label-text">Signal Integrity</span>
        </div>

        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between text-[10px] mb-0.5">
              <span className="text-analyzer-text-dim">Eye Height</span>
              <span className="text-analyzer-text">{localState.eyeHeight.toFixed(1)} mV</span>
            </div>
            <ProgressBar value={localState.eyeHeight} max={1000} color="bg-analyzer-success" />
          </div>

          <div>
            <div className="flex items-center justify-between text-[10px] mb-0.5">
              <span className="text-analyzer-text-dim">Eye Width</span>
              <span className="text-analyzer-text">{localState.eyeWidth.toFixed(1)} ps</span>
            </div>
            <ProgressBar value={localState.eyeWidth} max={100} color="bg-analyzer-success" />
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <span className="text-analyzer-text-dim">BER</span>
            <span className="text-analyzer-text font-mono">{formatBer(localState.ber)}</span>
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <span className="text-analyzer-text-dim">SNR</span>
            <span className="text-analyzer-text font-mono">{localState.snr.toFixed(1)} dB</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkStatus;
