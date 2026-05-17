package com.networkscanner.model;

import java.util.ArrayList;
import java.util.List;

public class DeviceInfo {
    private String ipAddress;
    private String macAddress;
    private String deviceName;
    private boolean isOnline;
    private List<Integer> openPorts;
    private long responseTime;

    public DeviceInfo() {
        this.openPorts = new ArrayList<>();
    }

    public DeviceInfo(String ipAddress) {
        this.ipAddress = ipAddress;
        this.openPorts = new ArrayList<>();
        this.isOnline = false;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getMacAddress() {
        return macAddress;
    }

    public void setMacAddress(String macAddress) {
        this.macAddress = macAddress;
    }

    public String getDeviceName() {
        return deviceName;
    }

    public void setDeviceName(String deviceName) {
        this.deviceName = deviceName;
    }

    public boolean isOnline() {
        return isOnline;
    }

    public void setOnline(boolean online) {
        isOnline = online;
    }

    public List<Integer> getOpenPorts() {
        return openPorts;
    }

    public void setOpenPorts(List<Integer> openPorts) {
        this.openPorts = openPorts;
    }

    public void addOpenPort(int port) {
        if (!this.openPorts.contains(port)) {
            this.openPorts.add(port);
        }
    }

    public long getResponseTime() {
        return responseTime;
    }

    public void setResponseTime(long responseTime) {
        this.responseTime = responseTime;
    }

    @Override
    public String toString() {
        return "DeviceInfo{" +
                "ipAddress='" + ipAddress + '\'' +
                ", macAddress='" + macAddress + '\'' +
                ", deviceName='" + deviceName + '\'' +
                ", isOnline=" + isOnline +
                ", openPorts=" + openPorts +
                ", responseTime=" + responseTime + "ms" +
                '}';
    }
}
