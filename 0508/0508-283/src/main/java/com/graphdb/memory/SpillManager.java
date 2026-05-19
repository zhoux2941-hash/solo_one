package com.graphdb.memory;

import com.graphdb.config.GraphDBConfig;
import com.graphdb.storage.serializer.BinarySerializer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.*;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class SpillManager {

    @Autowired
    private GraphDBConfig config;

    @Autowired
    private MemoryManager memoryManager;

    private Path spillDir;
    private final Map<String, Path> spillFiles = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() throws IOException {
        spillDir = Paths.get(config.getMemory().getSpillPath());
        if (!Files.exists(spillDir)) {
            Files.createDirectories(spillDir);
        }
        log.info("SpillManager initialized. Spill directory: {}", spillDir);
    }

    public String createSpillFile() throws IOException {
        String fileId = UUID.randomUUID().toString();
        Path filePath = spillDir.resolve(fileId + ".spill");
        spillFiles.put(fileId, filePath);
        return fileId;
    }

    public void writeSpillData(String fileId, long key, double value) throws IOException {
        Path filePath = spillFiles.get(fileId);
        if (filePath == null) {
            throw new FileNotFoundException("Spill file not found: " + fileId);
        }

        try (RandomAccessFile raf = new RandomAccessFile(filePath.toFile(), "rw")) {
            raf.seek(raf.length());
            byte[] keyBytes = BinarySerializer.serializeLong(key);
            byte[] valueBytes = BinarySerializer.serializeDouble(value);
            raf.write(keyBytes);
            raf.write(valueBytes);
        }
    }

    public void writeSpillBatch(String fileId, Map<Long, Double> data) throws IOException {
        Path filePath = spillFiles.get(fileId);
        if (filePath == null) {
            throw new FileNotFoundException("Spill file not found: " + fileId);
        }

        try (BufferedOutputStream bos = new BufferedOutputStream(
                new FileOutputStream(filePath.toFile(), true))) {
            for (Map.Entry<Long, Double> entry : data.entrySet()) {
                byte[] keyBytes = BinarySerializer.serializeLong(entry.getKey());
                byte[] valueBytes = BinarySerializer.serializeDouble(entry.getValue());
                bos.write(keyBytes);
                bos.write(valueBytes);
            }
        }
    }

    public Map<Long, Double> readSpillData(String fileId) throws IOException {
        Path filePath = spillFiles.get(fileId);
        if (filePath == null) {
            throw new FileNotFoundException("Spill file not found: " + fileId);
        }

        Map<Long, Double> data = new HashMap<>();
        try (BufferedInputStream bis = new BufferedInputStream(
                new FileInputStream(filePath.toFile()))) {
            byte[] buffer = new byte[16];
            int bytesRead;
            while ((bytesRead = bis.read(buffer)) == 16) {
                long key = ByteBuffer.wrap(buffer, 0, 8).getLong();
                double value = ByteBuffer.wrap(buffer, 8, 8).getDouble();
                data.put(key, value);
            }
        }
        return data;
    }

    public Map<Long, Double> readSpillBatch(String fileId, int offset, int count) throws IOException {
        Path filePath = spillFiles.get(fileId);
        if (filePath == null) {
            throw new FileNotFoundException("Spill file not found: " + fileId);
        }

        Map<Long, Double> data = new HashMap<>();
        try (RandomAccessFile raf = new RandomAccessFile(filePath.toFile(), "r")) {
            raf.seek(offset * 16L);
            byte[] buffer = new byte[16];
            for (int i = 0; i < count; i++) {
                int bytesRead = raf.read(buffer);
                if (bytesRead != 16) {
                    break;
                }
                long key = ByteBuffer.wrap(buffer, 0, 8).getLong();
                double value = ByteBuffer.wrap(buffer, 8, 8).getDouble();
                data.put(key, value);
            }
        }
        return data;
    }

    public void deleteSpillFile(String fileId) throws IOException {
        Path filePath = spillFiles.remove(fileId);
        if (filePath != null && Files.exists(filePath)) {
            Files.delete(filePath);
            log.debug("Deleted spill file: {}", fileId);
        }
    }

    public long getSpillFileSize(String fileId) throws IOException {
        Path filePath = spillFiles.get(fileId);
        if (filePath == null) {
            return 0;
        }
        return Files.size(filePath) / 16;
    }

    public void cleanup() throws IOException {
        for (String fileId : spillFiles.keySet()) {
            deleteSpillFile(fileId);
        }
        log.info("Cleaned up all spill files");
    }

    public boolean shouldSpill() {
        return memoryManager.shouldSpill();
    }
}