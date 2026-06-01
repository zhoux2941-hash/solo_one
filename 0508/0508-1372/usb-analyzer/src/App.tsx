import React, { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Toolbar from "./components/Toolbar";
import PacketList from "./components/PacketList";
import PacketDetail from "./components/PacketDetail";
import FilterPanel from "./components/FilterPanel";
import InjectionPanel from "./components/InjectionPanel";
import LinkStatus from "./components/LinkStatus";
import ScsiParser from "./components/ScsiParser";
import ScriptEditor from "./components/ScriptEditor";
import HistoryPanel from "./components/HistoryPanel";
import { useCapture } from "./hooks/useCapture";
import { useInjection } from "./hooks/useInjection";
import { useStorage } from "./hooks/useStorage";
import type {
  UsbDevice,
  UsbPacket,
  FilterConfig,
  ScsiCommand,
  LinkStateInfo,
} from "./types";
import { DEFAULT_FILTER } from "./types";

type RightTab = "detail" | "link" | "scsi";
type BottomTab = "script" | "injection" | "history";

const App: React.FC = () => {
  const [devices, setDevices] = useState<UsbDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedPacket, setSelectedPacket] = useState<UsbPacket | null>(null);
  const [filter, setFilter] = useState<FilterConfig>(DEFAULT_FILTER);
  const [rightTab, setRightTab] = useState<RightTab>("detail");
  const [bottomTab, setBottomTab] = useState<BottomTab>("script");
  const [scsiCommands, setScsiCommands] = useState<ScsiCommand[]>([]);
  const [linkState, setLinkState] = useState<LinkStateInfo | null>(null);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(300);

  const {
    isCapturing,
    packets,
    packetCount,
    startCapture,
    stopCapture,
    clearPackets,
  } = useCapture();

  const {
    isInjectionActive,
    injectionConfig,
    injectionCount,
    injectionRecords,
    seenPackets,
    startInjection,
    stopInjection,
    updateConfig,
    resetConfig,
  } = useInjection();

  const {
    packetResults,
    injectionResults,
    sessions,
    isLoading: isStorageLoading,
    error: storageError,
    queryPackets,
    queryInjectionRecords,
    getSessions,
    exportPcapng,
    replaySession,
  } = useStorage();

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devList = await invoke<UsbDevice[]>("enumerate_devices");
        setDevices(devList);
      } catch {
        setDevices([]);
      }
    };
    loadDevices();
    const interval = setInterval(loadDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isCapturing) return;
    const pollLink = async () => {
      try {
        const state = await invoke<LinkStateInfo>("get_link_state");
        setLinkState(state);
      } catch {
        setLinkState(null);
      }
    };
    pollLink();
    const interval = setInterval(pollLink, 1000);
    return () => clearInterval(interval);
  }, [isCapturing]);

  useEffect(() => {
    if (selectedPacket && selectedPacket.transferType === "UAS") {
      invoke<ScsiCommand>("parse_scsi_command", { payload: selectedPacket.payload })
        .then((cmd) => setScsiCommands((prev) => [...prev, cmd]))
        .catch(() => {});
    }
  }, [selectedPacket]);

  const handleStartCapture = useCallback(async () => {
    if (!selectedDeviceId) return;
    try {
      await startCapture(selectedDeviceId);
    } catch {
      console.error("Failed to start capture");
    }
  }, [selectedDeviceId, startCapture]);

  const handleStopCapture = useCallback(async () => {
    try {
      await stopCapture();
    } catch {
      console.error("Failed to stop capture");
    }
  }, [stopCapture]);

  const handleExportPcapng = useCallback(async () => {
    try {
      await invoke("export_pcapng", { sessionIds: [], outputPath: "" });
    } catch {
      console.error("Export failed");
    }
  }, []);

  const handleSelectPacket = useCallback((packet: UsbPacket) => {
    setSelectedPacket(packet);
    setRightTab("detail");
  }, []);

  const handleApplyFilter = useCallback(() => {
    setFilter((prev) => ({ ...prev }));
  }, []);

  const handleResetFilter = useCallback(() => {
    setFilter(DEFAULT_FILTER);
  }, []);

  const handleStartInjection = useCallback(async () => {
    try {
      await startInjection(injectionConfig);
    } catch {
      console.error("Failed to start injection");
    }
  }, [injectionConfig, startInjection]);

  const handleStopInjection = useCallback(async () => {
    try {
      await stopInjection();
    } catch {
      console.error("Failed to stop injection");
    }
  }, [stopInjection]);

  const handleOpenSettings = useCallback(() => {
    console.log("Settings opened");
  }, []);

  const handleResizeBottom = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startY = e.clientY;
      const startH = bottomPanelHeight;
      const onMove = (ev: MouseEvent) => {
        const delta = startY - ev.clientY;
        setBottomPanelHeight(Math.max(150, Math.min(600, startH + delta)));
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [bottomPanelHeight]
  );

  const currentScsiCommand =
    selectedPacket && selectedPacket.transferType === "UAS"
      ? scsiCommands.find(() => true) || null
      : null;

  return (
    <div className="flex flex-col h-screen bg-analyzer-bg text-analyzer-text">
      <Toolbar
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        isCapturing={isCapturing}
        packetCount={packetCount}
        onSelectDevice={setSelectedDeviceId}
        onStartCapture={handleStartCapture}
        onStopCapture={handleStopCapture}
        onExportPcapng={handleExportPcapng}
        onClearBuffer={clearPackets}
        onOpenSettings={handleOpenSettings}
      />

      <div className="flex flex-1 min-h-0">
        <div className="w-56 bg-analyzer-surface border-r border-analyzer-border flex flex-col overflow-auto">
          <FilterPanel
            filter={filter}
            onFilterChange={setFilter}
            onApply={handleApplyFilter}
            onReset={handleResetFilter}
          />
        </div>

        <div className="flex flex-1 min-w-0 flex-col">
          <div className="flex flex-1 min-h-0">
            <div className="flex-1 min-w-0 border-r border-analyzer-border">
              <PacketList
                packets={packets}
                selectedSeq={selectedPacket?.seqNum ?? null}
                onSelectPacket={handleSelectPacket}
                filter={filter}
              />
            </div>

            <div className="w-80 bg-analyzer-surface flex flex-col">
              <div className="flex border-b border-analyzer-border">
                {(["detail", "link", "scsi"] as RightTab[]).map((tab) => (
                  <button
                    key={tab}
                    className={`text-xs px-3 py-2 capitalize ${
                      rightTab === tab ? "tab-active" : "tab-inactive"
                    }`}
                    onClick={() => setRightTab(tab)}
                  >
                    {tab === "detail"
                      ? "Packet Detail"
                      : tab === "link"
                      ? "Link Status"
                      : "SCSI Parse"}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-auto">
                {rightTab === "detail" && (
                  <PacketDetail packet={selectedPacket} scsiCommand={currentScsiCommand} />
                )}
                {rightTab === "link" && <LinkStatus linkState={linkState} />}
                {rightTab === "scsi" && <ScsiParser commands={scsiCommands} />}
              </div>
            </div>
          </div>

          <div
            className="h-1 bg-analyzer-border cursor-row-resize hover:bg-analyzer-accent transition-colors"
            onMouseDown={handleResizeBottom}
          />

          <div style={{ height: bottomPanelHeight }} className="flex flex-col min-h-0">
            <div className="flex border-b border-analyzer-border bg-analyzer-surface">
              {(["script", "injection", "history"] as BottomTab[]).map((tab) => (
                <button
                  key={tab}
                  className={`text-xs px-3 py-2 capitalize ${
                    bottomTab === tab ? "tab-active" : "tab-inactive"
                  }`}
                  onClick={() => setBottomTab(tab)}
                >
                  {tab === "script"
                    ? "Lua Script"
                    : tab === "injection"
                    ? "Injection"
                    : "History"}
                </button>
              ))}
            </div>
            <div className="flex-1 min-h-0 overflow-auto">
              {bottomTab === "script" && <ScriptEditor />}
              {bottomTab === "injection" && (
                <InjectionPanel
                  config={injectionConfig}
                  isActive={isInjectionActive}
                  injectionCount={injectionCount}
                  records={injectionRecords}
                  seenPackets={seenPackets}
                  onConfigChange={updateConfig}
                  onStart={handleStartInjection}
                  onStop={handleStopInjection}
                  onReset={resetConfig}
                />
              )}
              {bottomTab === "history" && (
                <HistoryPanel
                  sessions={sessions}
                  packetResults={packetResults}
                  injectionResults={injectionResults}
                  isLoading={isStorageLoading}
                  error={storageError}
                  onQueryPackets={queryPackets}
                  onQueryInjections={queryInjectionRecords}
                  onGetSessions={getSessions}
                  onExport={exportPcapng}
                  onReplay={replaySession}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
