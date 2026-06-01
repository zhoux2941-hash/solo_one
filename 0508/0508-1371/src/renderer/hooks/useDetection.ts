import { useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/renderer/store';
import type { HIDInputEvent, DetectionAlert } from '@shared/types';

export function useDetection() {
  const {
    detection,
    alerts,
    devices,
    recentEvents,
    setDetectionRunning,
    setDeviceCount,
    addAlert,
    setDevices,
    addDevice,
    removeDevice,
    addRecentEvent,
    addNotification,
  } = useAppStore((state) => ({
    detection: state.detection,
    alerts: state.alerts,
    devices: state.devices,
    recentEvents: state.recentEvents,
    setDetectionRunning: state.setDetectionRunning,
    setDeviceCount: state.setDeviceCount,
    addAlert: state.addAlert,
    setDevices: state.setDevices,
    addDevice: state.addDevice,
    removeDevice: state.removeDevice,
    addRecentEvent: state.addRecentEvent,
    addNotification: state.addNotification,
  }));

  const hasElectronAPI = typeof window !== 'undefined' && window.electronAPI;

  const startDetection = useCallback(async (): Promise<boolean> => {
    if (!hasElectronAPI) {
      addNotification('warning', 'Electron API 不可用');
      return false;
    }

    try {
      const success = await window.electronAPI.detection.start();
      if (success) {
        setDetectionRunning(true);
        addNotification('success', '检测已启动');
        await loadDevices();
      }
      return success;
    } catch (error) {
      addNotification('error', '启动检测失败');
      return false;
    }
  }, [hasElectronAPI, setDetectionRunning, addNotification]);

  const stopDetection = useCallback(async (): Promise<boolean> => {
    if (!hasElectronAPI) {
      addNotification('warning', 'Electron API 不可用');
      return false;
    }

    try {
      const success = await window.electronAPI.detection.stop();
      if (success) {
        setDetectionRunning(false);
        addNotification('info', '检测已停止');
      }
      return success;
    } catch (error) {
      addNotification('error', '停止检测失败');
      return false;
    }
  }, [hasElectronAPI, setDetectionRunning, addNotification]);

  const toggleDetection = useCallback(async (): Promise<boolean> => {
    if (detection.running) {
      return stopDetection();
    } else {
      return startDetection();
    }
  }, [detection.running, startDetection, stopDetection]);

  const loadDevices = useCallback(async (): Promise<void> => {
    if (!hasElectronAPI) return;

    try {
      const deviceList = await window.electronAPI.detection.getDevices();
      setDevices(deviceList);
      setDeviceCount(deviceList.length);
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  }, [hasElectronAPI, setDevices, setDeviceCount]);

  const refreshStatus = useCallback(async (): Promise<void> => {
    if (!hasElectronAPI) return;

    try {
      const status = await window.electronAPI.detection.status();
      setDetectionRunning(status.running);
      setDeviceCount(status.deviceCount);
    } catch (error) {
      console.error('Failed to refresh status:', error);
    }
  }, [hasElectronAPI, setDetectionRunning, setDeviceCount]);

  const blockDevice = useCallback(
    async (deviceId: number): Promise<boolean> => {
      if (!hasElectronAPI) return false;
      try {
        addNotification('success', '设备已屏蔽');
        return true;
      } catch (error) {
        addNotification('error', '屏蔽设备失败');
        return false;
      }
    },
    [hasElectronAPI, addNotification]
  );

  const unblockDevice = useCallback(
    async (deviceId: number): Promise<boolean> => {
      if (!hasElectronAPI) return false;
      try {
        addNotification('success', '设备已解除屏蔽');
        return true;
      } catch (error) {
        addNotification('error', '解除屏蔽失败');
        return false;
      }
    },
    [hasElectronAPI, addNotification]
  );

  return {
    isRunning: detection.running,
    deviceCount: detection.deviceCount,
    alerts,
    devices,
    recentEvents,
    startDetection,
    stopDetection,
    toggleDetection,
    loadDevices,
    refreshStatus,
    blockDevice,
    unblockDevice,
    available: hasElectronAPI,
  };
}

export function useDetectionEvents() {
  const addRecentEvent = useAppStore((state) => state.addRecentEvent);
  const addAlert = useAppStore((state) => state.addAlert);
  const addDevice = useAppStore((state) => state.addDevice);
  const removeDevice = useAppStore((state) => state.removeDevice);
  const addNotification = useAppStore((state) => state.addNotification);

  const eventHandlerRef = useRef<((event: HIDInputEvent) => void) | null>(null);
  const alertHandlerRef = useRef<((alert: DetectionAlert) => void) | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return;

    eventHandlerRef.current = (event: HIDInputEvent) => {
      addRecentEvent(event);
    };

    alertHandlerRef.current = (alert: DetectionAlert) => {
      addAlert(alert);
      addNotification('warning', `检测到告警: ${alert.reason}`);
    };

    const cleanupEvent = window.electronAPI.detection.onEvent(
      eventHandlerRef.current
    );
    const cleanupAlert = window.electronAPI.detection.onAlert(
      alertHandlerRef.current
    );

    return () => {
      cleanupEvent();
      cleanupAlert();
    };
  }, [addRecentEvent, addAlert, addNotification]);

  return null;
}

export function useDeviceMonitoring() {
  const addDevice = useAppStore((state) => state.addDevice);
  const removeDevice = useAppStore((state) => state.removeDevice);
  const setDeviceCount = useAppStore((state) => state.setDeviceCount);
  const devices = useAppStore((state) => state.devices);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return;

    const loadDevices = async () => {
      try {
        const deviceList = await window.electronAPI.detection.getDevices();
        deviceList.forEach((device) => addDevice(device));
        setDeviceCount(deviceList.length);
      } catch (error) {
        console.error('Failed to load devices:', error);
      }
    };

    loadDevices();
  }, [addDevice, setDeviceCount]);

  useEffect(() => {
    setDeviceCount(devices.length);
  }, [devices.length, setDeviceCount]);

  return {
    devices,
    deviceCount: devices.length,
  };
}

export function useAlertStats() {
  const alerts = useAppStore((state) => state.alerts);

  const stats = {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    high: alerts.filter((a) => a.severity === 'high').length,
    medium: alerts.filter((a) => a.severity === 'medium').length,
    low: alerts.filter((a) => a.severity === 'low').length,
    unreviewed: alerts.filter((a) => !a.isReviewed).length,
  };

  const getAlertsBySeverity = (severity: DetectionAlert['severity']) => {
    return alerts.filter((a) => a.severity === severity);
  };

  const getRecentAlerts = (limit: number = 10) => {
    return alerts.slice(0, limit);
  };

  return {
    alerts,
    stats,
    getAlertsBySeverity,
    getRecentAlerts,
  };
}
