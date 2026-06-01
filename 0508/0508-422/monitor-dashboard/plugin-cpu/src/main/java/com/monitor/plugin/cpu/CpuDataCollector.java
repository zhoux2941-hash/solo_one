package com.monitor.plugin.cpu;

import oshi.SystemInfo;
import oshi.hardware.CentralProcessor;
import oshi.hardware.HardwareAbstractionLayer;
import java.util.HashMap;
import java.util.Map;

public class CpuDataCollector {
    private final SystemInfo systemInfo;
    private final HardwareAbstractionLayer hal;
    private long[] prevTicks;

    public CpuDataCollector() {
        systemInfo = new SystemInfo();
        hal = systemInfo.getHardware();
        prevTicks = hal.getProcessor().getSystemCpuLoadTicks();
    }

    public Map<String, Object> collect() {
        Map<String, Object> metrics = new HashMap<>();
        CentralProcessor cpu = hal.getProcessor();
        double usage = cpu.getSystemCpuLoadBetweenTicks(prevTicks) * 100.0;
        prevTicks = cpu.getSystemCpuLoadTicks();
        metrics.put("cpu.usage_percent", Math.round(usage * 100.0) / 100.0);
        long[] currentFreq = cpu.getCurrentFreq();
        if (currentFreq != null && currentFreq.length > 0) {
            long maxFreq = 0;
            long sumFreq = 0;
            for (long f : currentFreq) {
                if (f > maxFreq) maxFreq = f;
                sumFreq += f;
            }
            metrics.put("cpu.frequency_mhz", maxFreq);
            double avgFreq = (double) sumFreq / currentFreq.length;
            metrics.put("cpu.avg_frequency_mhz", Math.round(avgFreq * 100.0) / 100.0);
        }
        metrics.put("cpu.core_count", cpu.getLogicalProcessorCount());
        metrics.put("cpu.physical_core_count", cpu.getPhysicalProcessorCount());
        try {
            double temp = hal.getSensors().getCpuTemperature();
            if (temp > 0) {
                metrics.put("cpu.temperature", Math.round(temp * 100.0) / 100.0);
            }
        } catch (Exception ignored) {}
        return metrics;
    }
}
