package com.monitor.plugin.disk;

import oshi.SystemInfo;
import oshi.hardware.HWDiskStore;
import oshi.hardware.HardwareAbstractionLayer;
import oshi.software.os.FileSystem;
import oshi.software.os.OSFileStore;
import oshi.software.os.OperatingSystem;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DiskDataCollector {
    private final SystemInfo systemInfo;
    private final HardwareAbstractionLayer hal;
    private final OperatingSystem os;
    private Map<String, long[]> prevDiskStats = new HashMap<>();

    public DiskDataCollector() {
        systemInfo = new SystemInfo();
        hal = systemInfo.getHardware();
        os = systemInfo.getOperatingSystem();
        snapshotDiskStats();
    }

    public Map<String, Object> collect() {
        Map<String, Object> metrics = new HashMap<>();
        Map<String, Map<String, Object>> partitionMetrics = new HashMap<>();
        FileSystem fs = os.getFileSystem();
        List<OSFileStore> fileStores = fs.getFileStores();
        for (OSFileStore store : fileStores) {
            Map<String, Object> partInfo = new HashMap<>();
            long total = store.getTotalSpace();
            long usable = store.getUsableSpace();
            long used = total - usable;
            partInfo.put("name", store.getName());
            partInfo.put("mount", store.getMount());
            partInfo.put("fs_type", store.getType());
            partInfo.put("total_bytes", total);
            partInfo.put("used_bytes", used);
            partInfo.put("usable_bytes", usable);
            if (total > 0) {
                partInfo.put("usage_percent", Math.round((double) used / total * 10000.0) / 100.0);
            }
            partitionMetrics.put(store.getMount(), partInfo);
        }
        metrics.put("disk.partitions", partitionMetrics);
        Map<String, Map<String, Object>> ioMetrics = new HashMap<>();
        List<HWDiskStore> diskStores = hal.getDiskStores();
        for (HWDiskStore disk : diskStores) {
            Map<String, Object> ioInfo = new HashMap<>();
            String diskName = disk.getName();
            long[] prev = prevDiskStats.get(diskName);
            long curReads = disk.getReads();
            long curWrites = disk.getWrites();
            if (prev != null && prev.length == 4) {
                long dReads = curReads - prev[0];
                long dWrites = curWrites - prev[1];
                long dTimeSec = 5;
                ioInfo.put("read_iops", dReads / dTimeSec);
                ioInfo.put("write_iops", dWrites / dTimeSec);
            }
            ioInfo.put("current_queue_depth", disk.getCurrentQueueLength());
            ioMetrics.put(diskName, ioInfo);
        }
        metrics.put("disk.io", ioMetrics);
        snapshotDiskStats();
        return metrics;
    }

    private void snapshotDiskStats() {
        Map<String, long[]> snapshot = new HashMap<>();
        for (HWDiskStore disk : hal.getDiskStores()) {
            snapshot.put(disk.getName(), new long[]{
                disk.getReads(), disk.getWrites(),
                disk.getReadBytes(), disk.getWriteBytes()
            });
        }
        prevDiskStats = snapshot;
    }
}
