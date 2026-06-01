import React from "react";
import {
  Usb,
  Play,
  Square,
  Download,
  Trash2,
  Settings,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { UsbDevice } from "../types";

interface ToolbarProps {
  devices: UsbDevice[];
  selectedDeviceId: string | null;
  isCapturing: boolean;
  packetCount: number;
  onSelectDevice: (deviceId: string) => void;
  onStartCapture: () => void;
  onStopCapture: () => void;
  onExportPcapng: () => void;
  onClearBuffer: () => void;
  onOpenSettings: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  devices,
  selectedDeviceId,
  isCapturing,
  packetCount,
  onSelectDevice,
  onStartCapture,
  onStopCapture,
  onExportPcapng,
  onClearBuffer,
  onOpenSettings,
}) => {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-analyzer-surface border-b border-analyzer-border">
      <div className="flex items-center gap-2">
        <Usb size={18} className="text-analyzer-accent" />
        <span className="text-sm font-semibold text-analyzer-text">USB 3.0 Analyzer</span>
      </div>

      <div className="w-px h-6 bg-analyzer-border" />

      <select
        className="select-field min-w-[200px]"
        value={selectedDeviceId || ""}
        onChange={(e) => onSelectDevice(e.target.value)}
        disabled={isCapturing}
      >
        <option value="">Select Device...</option>
        {devices.map((dev) => (
          <option key={dev.id} value={dev.id}>
            {dev.name} (Bus {dev.busNumber} Dev {dev.deviceAddress}) [{dev.speed}]
          </option>
        ))}
      </select>

      <div className="w-px h-6 bg-analyzer-border" />

      {isCapturing ? (
        <button className="btn-danger flex items-center gap-1.5" onClick={onStopCapture}>
          <Square size={14} />
          <span>Stop</span>
        </button>
      ) : (
        <button
          className="btn-primary flex items-center gap-1.5"
          onClick={onStartCapture}
          disabled={!selectedDeviceId}
        >
          <Play size={14} />
          <span>Start</span>
        </button>
      )}

      <div className="flex items-center gap-1.5 text-sm">
        {isCapturing ? (
          <Wifi size={14} className="text-analyzer-success animate-pulse" />
        ) : (
          <WifiOff size={14} className="text-analyzer-text-dim" />
        )}
        <span className="text-analyzer-text-dim">Packets:</span>
        <span className="text-analyzer-text font-mono font-medium">
          {packetCount.toLocaleString()}
        </span>
      </div>

      <div className="flex-1" />

      <button
        className="btn-secondary flex items-center gap-1.5"
        onClick={onExportPcapng}
        disabled={packetCount === 0}
      >
        <Download size={14} />
        <span>Export PCAPNG</span>
      </button>

      <button
        className="btn-secondary flex items-center gap-1.5"
        onClick={onClearBuffer}
        disabled={isCapturing || packetCount === 0}
      >
        <Trash2 size={14} />
        <span>Clear</span>
      </button>

      <button className="btn-secondary p-1.5" onClick={onOpenSettings}>
        <Settings size={14} />
      </button>
    </div>
  );
};

export default Toolbar;
