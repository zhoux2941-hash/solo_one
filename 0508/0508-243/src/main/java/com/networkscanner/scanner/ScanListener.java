package com.networkscanner.scanner;

import com.networkscanner.model.DeviceInfo;

public interface ScanListener {
    void onScanStart(int totalDevices);
    void onDeviceFound(DeviceInfo deviceInfo);
    void onDeviceUpdate(DeviceInfo deviceInfo);
    void onScanProgress(int current, int total);
    void onScanComplete(java.util.List<DeviceInfo> devices);
    void onScanStopped(java.util.List<DeviceInfo> devicesFound);
    void onScanError(String error);
}
