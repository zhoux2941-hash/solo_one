package com.monitor.plugin.memory;

import oshi.SystemInfo;
import oshi.hardware.GlobalMemory;
import oshi.hardware.HardwareAbstractionLayer;
import oshi.software.os.OperatingSystem;
import java.util.HashMap;
import java.util.Map;

public class MemoryDataCollector {
    private final SystemInfo systemInfo;
    private final HardwareAbstractionLayer hal;
    private final OperatingSystem os;

    public MemoryDataCollector() {
        systemInfo = new SystemInfo();
        hal = systemInfo.getHardware();
        os = systemInfo.getOperatingSystem();
    }

    public Map<String, Object> collect() {
        Map<String, Object> metrics = new HashMap<>();
        GlobalMemory memory = hal.getMemory();
        long total = memory.getTotal();
        long available = memory.getAvailable();
        long used = total - available;
        metrics.put("memory.total_bytes", total);
        metrics.put("memory.used_bytes", used);
        metrics.put("memory.available_bytes", available);
        metrics.put("memory.usage_percent", Math.round((double) used / total * 10000.0) / 100.0);
        long swapTotal = memory.getVirtualMemory().getSwapTotal();
        long swapUsed = memory.getVirtualMemory().getSwapUsed();
        metrics.put("swap.total_bytes", swapTotal);
        metrics.put("swap.used_bytes", swapUsed);
        if (swapTotal > 0) {
            metrics.put("swap.usage_percent", Math.round((double) swapUsed / swapTotal * 10000.0) / 100.0);
        }
        long pageSize = memory.getPageSize();
        metrics.put("memory.page_size_bytes", pageSize);
        metrics.put("memory.total_pages", total / pageSize);
        metrics.put("memory.used_pages", used / pageSize);
        metrics.put("memory.available_pages", available / pageSize);
        return metrics;
    }
}
