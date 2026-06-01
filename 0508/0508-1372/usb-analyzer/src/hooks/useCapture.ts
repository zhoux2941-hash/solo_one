import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import type { UsbPacket } from "../types";

interface UseCaptureReturn {
  isCapturing: boolean;
  packets: UsbPacket[];
  packetCount: number;
  captureSessionId: string | null;
  startCapture: (deviceId: string) => Promise<void>;
  stopCapture: () => Promise<void>;
  clearPackets: () => void;
}

export function useCapture(): UseCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [packets, setPackets] = useState<UsbPacket[]>([]);
  const [packetCount, setPacketCount] = useState(0);
  const [captureSessionId, setCaptureSessionId] = useState<string | null>(null);
  const unlistenRef = useRef<UnlistenFn | null>(null);
  const packetListenerRef = useRef<UnlistenFn | null>(null);

  const startCapture = useCallback(async (deviceId: string) => {
    try {
      const sessionId = await invoke<string>("start_capture", { deviceId });
      setCaptureSessionId(sessionId);
      setIsCapturing(true);
      setPackets([]);
      setPacketCount(0);

      const unlisten = await listen<UsbPacket>("usb-packet", (event) => {
        setPackets((prev) => {
          const next = [...prev, event.payload];
          if (next.length > 100000) {
            return next.slice(next.length - 100000);
          }
          return next;
        });
        setPacketCount((prev) => prev + 1);
      });
      packetListenerRef.current = unlisten;
    } catch (error) {
      console.error("Failed to start capture:", error);
      setIsCapturing(false);
      throw error;
    }
  }, []);

  const stopCapture = useCallback(async () => {
    try {
      await invoke("stop_capture");
      setIsCapturing(false);
      if (packetListenerRef.current) {
        packetListenerRef.current();
        packetListenerRef.current = null;
      }
    } catch (error) {
      console.error("Failed to stop capture:", error);
      throw error;
    }
  }, []);

  const clearPackets = useCallback(() => {
    setPackets([]);
    setPacketCount(0);
  }, []);

  useEffect(() => {
    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
      }
      if (packetListenerRef.current) {
        packetListenerRef.current();
      }
    };
  }, []);

  return {
    isCapturing,
    packets,
    packetCount,
    captureSessionId,
    startCapture,
    stopCapture,
    clearPackets,
  };
}
