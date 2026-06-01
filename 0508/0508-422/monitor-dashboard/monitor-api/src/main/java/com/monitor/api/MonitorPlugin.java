package com.monitor.api;

public interface MonitorPlugin {
    String getName();
    String getType();
    void start();
    void stop();
    boolean isRunning();
}
