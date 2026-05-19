package com.graphdb.memory;

import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
public class HybridBSPContext {

    private final SpillManager spillManager;
    private final Map<Long, Double> inMemoryData;
    private String spillFileId;
    private boolean spillingEnabled;
    private static final int MEMORY_THRESHOLD = 1000000;

    public HybridBSPContext(SpillManager spillManager) {
        this.spillManager = spillManager;
        this.inMemoryData = new HashMap<>();
        this.spillingEnabled = false;
    }

    public void put(long vertexId, double value) throws IOException {
        if (spillingEnabled || inMemoryData.size() >= MEMORY_THRESHOLD || spillManager.shouldSpill()) {
            if (!spillingEnabled) {
                enableSpilling();
            }
            spillManager.writeSpillData(spillFileId, vertexId, value);
        } else {
            inMemoryData.put(vertexId, value);
        }
    }

    public void putBatch(Map<Long, Double> batch) throws IOException {
        if (spillingEnabled || inMemoryData.size() + batch.size() >= MEMORY_THRESHOLD || spillManager.shouldSpill()) {
            if (!spillingEnabled) {
                enableSpilling();
            }
            spillManager.writeSpillBatch(spillFileId, batch);
        } else {
            inMemoryData.putAll(batch);
        }
    }

    public Map<Long, Double> getAll() throws IOException {
        Map<Long, Double> result = new HashMap<>(inMemoryData);
        if (spillingEnabled) {
            result.putAll(spillManager.readSpillData(spillFileId));
        }
        return result;
    }

    public void clear() throws IOException {
        inMemoryData.clear();
        if (spillingEnabled) {
            spillManager.deleteSpillFile(spillFileId);
            spillFileId = null;
            spillingEnabled = false;
        }
    }

    private void enableSpilling() throws IOException {
        spillFileId = spillManager.createSpillFile();
        spillManager.writeSpillBatch(spillFileId, inMemoryData);
        inMemoryData.clear();
        spillingEnabled = true;
        log.info("Enabled spilling to disk. Spill file ID: {}", spillFileId);
    }

    public boolean isSpillingEnabled() {
        return spillingEnabled;
    }

    public int getInMemorySize() {
        return inMemoryData.size();
    }

    public long getTotalSize() throws IOException {
        long size = inMemoryData.size();
        if (spillingEnabled) {
            size += spillManager.getSpillFileSize(spillFileId);
        }
        return size;
    }
}