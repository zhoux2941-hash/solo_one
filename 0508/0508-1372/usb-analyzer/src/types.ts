export interface UsbPacket {
  seqNum: number;
  timestamp: number;
  epAddr: number;
  transferType: TransferType;
  direction: Direction;
  payloadLength: number;
  crcValid: boolean;
  crc32c: number;
  payload: number[];
  injected: boolean;
  deviceAddr: number;
  isoMicroFrame: number;
  isoStatus: number;
}

export type TransferType = "Bulk" | "Isochronous" | "Interrupt" | "UAS";
export type Direction = "IN" | "OUT";

export interface ScsiCommand {
  command: string;
  lun: number;
  blockAddress: number;
  dataLength: number;
  cdb: number[];
  commandType: "Read" | "Write" | "Other";
}

export interface UsbDevice {
  id: string;
  name: string;
  vendorId: number;
  productId: number;
  busNumber: number;
  deviceAddress: number;
  speed: string;
}

export interface InjectionConfig {
  injectionType: InjectionType;
  targetEpAddr: number;
  targetPacketType: TransferType | "All";
  startAfterPacket: number;
  durationMode: "packets" | "injections";
  durationCount: number;
  corruptionRatio: number;
}

export type InjectionType =
  | "CRCError"
  | "DuplicateSeq"
  | "OutOfOrderSeq"
  | "Timeout"
  | "PayloadCorruption";

export interface InjectionRecord {
  id: number;
  timestamp: number;
  injectionType: InjectionType;
  targetEpAddr: number;
  packetSeqNum: number;
  originalValue: string;
  injectedValue: string;
  originalCrc32c: number | null;
  injectedCrc32c: number | null;
}

export interface LinkStateInfo {
  linkState: "U0" | "U1" | "U2" | "U3";
  powerState: string;
  trainingStatus: string;
  trainingProgress: number;
  eyeHeight: number;
  eyeWidth: number;
  ber: number;
  snr: number;
}

export interface FilterConfig {
  transferTypes: TransferType[];
  epAddr: string;
  deviceAddr: string;
  payloadLengthMin: string;
  payloadLengthMax: string;
  crcStatus: "all" | "valid" | "invalid";
}

export interface PacketQueryFilter {
  startTime: number | null;
  endTime: number | null;
  epAddr: number | null;
  injectionType: string | null;
}

export interface InjectionQueryFilter {
  startTime: number | null;
  endTime: number | null;
  injectionType: string | null;
}

export interface SessionInfo {
  id: string;
  startTime: number;
  endTime: number;
  packetCount: number;
  injectionCount: number;
  deviceName: string;
}

export interface CaptureState {
  isCapturing: boolean;
  packets: UsbPacket[];
  packetCount: number;
  captureSessionId: string | null;
}

export const DEFAULT_FILTER: FilterConfig = {
  transferTypes: ["Bulk", "Isochronous", "Interrupt", "UAS"],
  epAddr: "",
  deviceAddr: "",
  payloadLengthMin: "",
  payloadLengthMax: "",
  crcStatus: "all",
};

export const DEFAULT_INJECTION_CONFIG: InjectionConfig = {
  injectionType: "CRCError",
  targetEpAddr: 0,
  targetPacketType: "All",
  startAfterPacket: 0,
  durationMode: "packets",
  durationCount: 1,
  corruptionRatio: 0.5,
};

export const EXAMPLE_LUA_SCRIPT = `-- USB 3.0 Analyzer Lua Script
-- Capture 1000 packets then inject 5 CRC errors

local count = 0
local max_capture = 1000
local inject_count = 0
local max_inject = 5

function on_packet(pkt)
  count = count + 1

  if count >= max_capture and inject_count < max_inject then
    inject_crc_error(pkt.ep_addr)
    inject_count = inject_count + 1
    log("Injected CRC error #" .. inject_count ..
        " on EP 0x" .. string.format("%02X", pkt.ep_addr))
  end

  if inject_count >= max_inject then
    log("Injection complete")
    stop_capture()
  end
end

function on_start()
  log("Starting capture + injection script")
  log("Will capture " .. max_capture .. " packets")
  log("Then inject " .. max_inject .. " CRC errors")
end

function on_stop()
  log("Script stopped. Captured: " .. count ..
      " Injected: " .. inject_count)
end`;

export const LUA_API_REFERENCE = [
  {
    category: "Packet Callbacks",
    functions: [
      { name: "on_packet(pkt)", desc: "Called for each captured packet" },
      { name: "on_start()", desc: "Called when script starts" },
      { name: "on_stop()", desc: "Called when script stops" },
    ],
  },
  {
    category: "Injection Functions",
    functions: [
      { name: "inject_crc_error(ep_addr)", desc: "Inject CRC error on endpoint" },
      { name: "inject_duplicate(seq_num)", desc: "Duplicate a packet by seq number" },
      { name: "inject_reorder(seq_a, seq_b)", desc: "Reorder two packets" },
      { name: "inject_timeout(ep_addr, ms)", desc: "Inject timeout on endpoint" },
      { name: "inject_corruption(ep_addr, ratio)", desc: "Corrupt payload on endpoint" },
    ],
  },
  {
    category: "Capture Control",
    functions: [
      { name: "start_capture(device_id)", desc: "Start capturing from device" },
      { name: "stop_capture()", desc: "Stop current capture" },
      { name: "is_capturing()", desc: "Check if capture is active" },
    ],
  },
  {
    category: "Utilities",
    functions: [
      { name: "log(msg)", desc: "Output message to console" },
      { name: "sleep(ms)", desc: "Sleep for milliseconds" },
      { name: "get_packet(seq)", desc: "Get packet by sequence number" },
      { name: "filter_packets(criteria)", desc: "Filter captured packets" },
    ],
  },
];

export function formatTimestamp(ts: number): string {
  const seconds = Math.floor(ts / 1000000);
  const microseconds = ts % 1000000;
  const date = new Date(seconds * 1000);
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  const ss = date.getSeconds().toString().padStart(2, "0");
  const us = microseconds.toString().padStart(6, "0");
  return `${hh}:${mm}:${ss}.${us}`;
}

export function formatEpAddr(addr: number): string {
  return `0x${addr.toString(16).toUpperCase().padStart(2, "0")}`;
}

export function formatHexDump(data: number[], bytesPerLine: number = 16): string[] {
  const lines: string[] = [];
  for (let i = 0; i < data.length; i += bytesPerLine) {
    const slice = data.slice(i, Math.min(i + bytesPerLine, data.length));
    const hex = slice.map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
    const ascii = slice.map((b) => (b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : ".")).join("");
    const offset = i.toString(16).toUpperCase().padStart(8, "0");
    const padding = " ".repeat(Math.max(0, (bytesPerLine - slice.length) * 3));
    lines.push(`${offset}  ${hex}${padding}  |${ascii}|`);
  }
  return lines;
}

export function formatPayloadPreview(data: number[], maxBytes: number = 64): string {
  const slice = data.slice(0, maxBytes);
  return slice.map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
}

export function getTransferTypeBadgeClass(type: TransferType): string {
  switch (type) {
    case "Bulk":
      return "badge-bulk";
    case "Isochronous":
      return "badge-iso";
    case "Interrupt":
      return "badge-interrupt";
    case "UAS":
      return "badge-uas";
  }
}

export function getPacketRowClass(packet: UsbPacket): string {
  if (packet.injected) return "packet-row-injected";
  switch (packet.transferType) {
    case "Bulk":
      return "packet-row-bulk";
    case "Isochronous":
      return "packet-row-iso";
    case "Interrupt":
      return "packet-row-interrupt";
    case "UAS":
      return "packet-row-uas";
  }
}

export function formatBer(ber: number): string {
  if (ber === 0) return "0";
  const exp = Math.floor(Math.log10(ber));
  const mantissa = ber / Math.pow(10, exp);
  return `${mantissa.toFixed(2)}e${exp}`;
}

export function applyFilter(packets: UsbPacket[], filter: FilterConfig): UsbPacket[] {
  return packets.filter((pkt) => {
    if (!filter.transferTypes.includes(pkt.transferType)) return false;
    if (filter.epAddr) {
      const addr = parseInt(filter.epAddr, 16);
      if (!isNaN(addr) && pkt.epAddr !== addr) return false;
    }
    if (filter.deviceAddr) {
      const devAddr = parseInt(filter.deviceAddr, 10);
      if (!isNaN(devAddr) && pkt.deviceAddr !== devAddr) return false;
    }
    if (filter.payloadLengthMin) {
      const min = parseInt(filter.payloadLengthMin, 10);
      if (!isNaN(min) && pkt.payloadLength < min) return false;
    }
    if (filter.payloadLengthMax) {
      const max = parseInt(filter.payloadLengthMax, 10);
      if (!isNaN(max) && pkt.payloadLength > max) return false;
    }
    if (filter.crcStatus === "valid" && !pkt.crcValid) return false;
    if (filter.crcStatus === "invalid" && pkt.crcValid) return false;
    return true;
  });
}
