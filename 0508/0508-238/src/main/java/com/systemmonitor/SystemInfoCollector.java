package com.systemmonitor;

import oshi.SystemInfo;
import oshi.hardware.CentralProcessor;
import oshi.hardware.GlobalMemory;
import oshi.hardware.HardwareAbstractionLayer;
import oshi.hardware.HWDiskStore;
import oshi.software.os.OSProcess;
import oshi.software.os.OperatingSystem;

import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;
import java.util.List;
import java.util.stream.Collectors;

public class SystemInfoCollector {
    private final SystemInfo systemInfo;
    private final HardwareAbstractionLayer hal;
    private final oshi.software.os.OperatingSystem os;
    private long prevIdleTicks;
    private long prevTotalTicks;
    private final OperatingSystemMXBean osMXBean;

    public SystemInfoCollector() {
        this.systemInfo = new SystemInfo();
        this.hal = systemInfo.getHardware();
        this.os = systemInfo.getOperatingSystem();
        this.osMXBean = ManagementFactory.getOperatingSystemMXBean();
        
        CentralProcessor processor = hal.getProcessor();
        long[] ticks = processor.getSystemCpuLoadTicks();
        this.prevIdleTicks = ticks[CentralProcessor.TickType.IDLE.getIndex()];
        this.prevTotalTicks = 0;
        for (long tick : ticks) {
            this.prevTotalTicks += tick;
        }
    }

    public double getCpuUsage() {
        try {
            CentralProcessor processor = hal.getProcessor();
            long[] ticks = processor.getSystemCpuLoadTicks();
            
            long idleTicks = ticks[CentralProcessor.TickType.IDLE.getIndex()];
            long totalTicks = 0;
            for (long tick : ticks) {
                totalTicks += tick;
            }
            
            long idleDelta = idleTicks - prevIdleTicks;
            long totalDelta = totalTicks - prevTotalTicks;
            
            prevIdleTicks = idleTicks;
            prevTotalTicks = totalTicks;
            
            if (totalDelta > 0) {
                double usage = (1.0 - ((double) idleDelta / totalDelta)) * 100;
                return Math.max(0, Math.min(100, usage));
            }
        } catch (Exception e) {
        }
        
        try {
            if (osMXBean instanceof com.sun.management.OperatingSystemMXBean) {
                com.sun.management.OperatingSystemMXBean sunOsMXBean = 
                    (com.sun.management.OperatingSystemMXBean) osMXBean;
                double usage = sunOsMXBean.getSystemCpuLoad() * 100;
                if (usage >= 0) {
                    return Math.max(0, Math.min(100, usage));
                }
            }
        } catch (Exception e) {
        }
        
        return 0.1;
    }

    public double getMemoryUsage() {
        try {
            GlobalMemory memory = hal.getMemory();
            long total = memory.getTotal();
            long available = memory.getAvailable();
            long used = total - available;
            return (used * 100.0) / total;
        } catch (Exception e) {
            try {
                if (osMXBean instanceof com.sun.management.OperatingSystemMXBean) {
                    com.sun.management.OperatingSystemMXBean sunOsMXBean = 
                        (com.sun.management.OperatingSystemMXBean) osMXBean;
                    long total = sunOsMXBean.getTotalPhysicalMemorySize();
                    long free = sunOsMXBean.getFreePhysicalMemorySize();
                    long used = total - free;
                    return (used * 100.0) / total;
                }
            } catch (Exception ex) {
            }
        }
        return 0.1;
    }

    public double getDiskUsage() {
        try {
            long totalSpace = 0;
            long freeSpace = 0;
            for (java.io.File file : java.io.File.listRoots()) {
                totalSpace += file.getTotalSpace();
                freeSpace += file.getFreeSpace();
            }
            if (totalSpace > 0) {
                long usedSpace = totalSpace - freeSpace;
                return (usedSpace * 100.0) / totalSpace;
            }
        } catch (Exception e) {
        }
        return 0.1;
    }

    public String getOsVersion() {
        return os.toString();
    }

    public String getCpuModel() {
        return hal.getProcessor().getProcessorIdentifier().getName();
    }

    public long getTotalMemory() {
        return hal.getMemory().getTotal();
    }

    public long getTotalDiskSpace() {
        long total = 0;
        for (HWDiskStore disk : hal.getDiskStores()) {
            total += disk.getSize();
        }
        return total;
    }

    public int getCpuCoreCount() {
        return hal.getProcessor().getLogicalProcessorCount();
    }

    public List<ProcessInfo> getAllProcesses() {
        List<OSProcess> processes = os.getProcesses();
        return processes.stream()
                .map(p -> new ProcessInfo(
                        p.getProcessID(),
                        p.getName(),
                        (p.getKernelTime() + p.getUserTime()) / 1000000.0,
                        p.getResidentSetSize(),
                        p.getStartTime()
                ))
                .collect(Collectors.toList());
    }

    public boolean killProcess(int pid) {
        try {
            String osName = System.getProperty("os.name").toLowerCase();
            ProcessBuilder pb;
            if (osName.contains("win")) {
                pb = new ProcessBuilder("taskkill", "/F", "/PID", String.valueOf(pid));
            } else {
                pb = new ProcessBuilder("kill", "-9", String.valueOf(pid));
            }
            Process process = pb.start();
            int exitCode = process.waitFor();
            return exitCode == 0;
        } catch (Exception e) {
            return false;
        }
    }

    public static class ProcessInfo {
        private final int pid;
        private final String name;
        private final double cpuUsage;
        private final long memory;
        private final long startTime;

        public ProcessInfo(int pid, String name, double cpuUsage, long memory, long startTime) {
            this.pid = pid;
            this.name = name;
            this.cpuUsage = cpuUsage;
            this.memory = memory;
            this.startTime = startTime;
        }

        public int getPid() { return pid; }
        public String getName() { return name; }
        public double getCpuUsage() { return cpuUsage; }
        public long getMemory() { return memory; }
        public long getStartTime() { return startTime; }
    }

    public static String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String pre = "KMGTPE".charAt(exp - 1) + "";
        return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
    }
}
