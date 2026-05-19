package com.graphdb.memory;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

@Slf4j
@Component
public class MemoryManager {

    private Runtime runtime;
    private long maxMemory;
    private long spillThreshold;

    @PostConstruct
    public void init() {
        runtime = Runtime.getRuntime();
        maxMemory = runtime.maxMemory();
        spillThreshold = (long) (maxMemory * 0.7);
        log.info("MemoryManager initialized. Max memory: {} MB, Spill threshold: {} MB",
                maxMemory / (1024 * 1024), spillThreshold / (1024 * 1024));
    }

    public boolean shouldSpill() {
        long usedMemory = runtime.totalMemory() - runtime.freeMemory();
        return usedMemory > spillThreshold;
    }

    public long getUsedMemory() {
        return runtime.totalMemory() - runtime.freeMemory();
    }

    public long getFreeMemory() {
        return runtime.freeMemory();
    }

    public long getMaxMemory() {
        return maxMemory;
    }

    public double getMemoryUsagePercent() {
        long used = runtime.totalMemory() - runtime.freeMemory();
        return (double) used / maxMemory * 100;
    }

    public void gc() {
        log.debug("Triggering garbage collection. Memory usage: {}%", getMemoryUsagePercent());
        System.gc();
        log.debug("After GC. Memory usage: {}%", getMemoryUsagePercent());
    }
}