package com.redis.gateway.replication;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.redis.gateway.protocol.RedisCommand;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantLock;

public class WriteAheadLog {
    private static final Logger logger = LoggerFactory.getLogger(WriteAheadLog.class);
    private static final String WAL_FILE_PREFIX = "wal-";
    private static final String WAL_FILE_SUFFIX = ".log";
    private static final String INDEX_FILE = "wal-index.json";
    private static final int MAX_ENTRIES_PER_FILE = 100000;
    private static final int INDEX_FLUSH_INTERVAL_MS = 5000;

    private final Path walDir;
    private final long maxSize;
    private final ObjectMapper objectMapper;
    private final String instanceId;

    private final AtomicLong currentSequence = new AtomicLong(0);
    private final AtomicLong currentFileId = new AtomicLong(0);
    private final Map<String, Long> clusterOffsets = new ConcurrentHashMap<>();
    private final Map<String, Long> instanceSequences = new ConcurrentHashMap<>();
    private final ReentrantLock appendLock = new ReentrantLock();
    private volatile boolean indexDirty = false;
    private final ScheduledExecutorService indexFlushScheduler;

    private volatile BufferedWriter currentWriter;
    private volatile long entriesInCurrentFile = 0;
    private final Map<String, Path> walFiles = new TreeMap<>();

    public WriteAheadLog(String walPath, long maxSize, String instanceId) throws IOException {
        this.walDir = Paths.get(walPath);
        this.maxSize = maxSize;
        this.instanceId = instanceId != null ? instanceId : generateInstanceId();
        this.objectMapper = new ObjectMapper();
        this.indexFlushScheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "wal-index-flush");
            t.setDaemon(true);
            return t;
        });
        initialize();
        startIndexFlush();
    }

    private String generateInstanceId() {
        return "gw-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }

    private void initialize() throws IOException {
        Files.createDirectories(walDir);
        loadIndex();
        loadExistingWalFiles();
        openCurrentWriter();
        logger.info("WAL initialized at {}, instanceId: {}, currentSequence: {}, currentFile: {}",
                walDir, instanceId, currentSequence.get(), currentFileId.get());
    }

    private void startIndexFlush() {
        indexFlushScheduler.scheduleAtFixedRate(() -> {
            try {
                flushIndex();
            } catch (Exception e) {
                logger.error("Periodic index flush failed", e);
            }
        }, INDEX_FLUSH_INTERVAL_MS, INDEX_FLUSH_INTERVAL_MS, TimeUnit.MILLISECONDS);
    }

    @SuppressWarnings("unchecked")
    private void loadIndex() throws IOException {
        Path indexPath = walDir.resolve(INDEX_FILE);
        if (Files.exists(indexPath)) {
            try (InputStream is = Files.newInputStream(indexPath)) {
                Map<String, Object> index = objectMapper.readValue(is, Map.class);
                if (index.containsKey("currentFileId")) {
                    currentFileId.set(((Number) index.get("currentFileId")).longValue());
                }
                if (index.containsKey("instanceSequences")) {
                    Map<String, Number> seqs = (Map<String, Number>) index.get("instanceSequences");
                    for (Map.Entry<String, Number> entry : seqs.entrySet()) {
                        instanceSequences.put(entry.getKey(), entry.getValue().longValue());
                    }
                    Long mySequence = instanceSequences.get(instanceId);
                    if (mySequence != null) {
                        currentSequence.set(mySequence);
                    }
                }
                if (index.containsKey("clusterOffsets")) {
                    Map<String, Number> offsets = (Map<String, Number>) index.get("clusterOffsets");
                    for (Map.Entry<String, Number> entry : offsets.entrySet()) {
                        clusterOffsets.put(entry.getKey(), entry.getValue().longValue());
                    }
                }
            }
        }
    }

    private synchronized void saveIndex() throws IOException {
        Map<String, Object> index = new HashMap<>();
        index.put("currentFileId", currentFileId.get());
        index.put("instanceSequences", new HashMap<>(instanceSequences));
        index.put("clusterOffsets", new HashMap<>(clusterOffsets));
        Path indexPath = walDir.resolve(INDEX_FILE);
        Path tempPath = walDir.resolve(INDEX_FILE + ".tmp");
        try (OutputStream os = Files.newOutputStream(tempPath)) {
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(os, index);
        }
        Files.move(tempPath, indexPath, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        indexDirty = false;
    }

    public synchronized void flushIndex() throws IOException {
        if (indexDirty) {
            saveIndex();
        }
    }

    private void loadExistingWalFiles() {
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(walDir, WAL_FILE_PREFIX + "*" + WAL_FILE_SUFFIX)) {
            for (Path file : stream) {
                String fileName = file.getFileName().toString();
                String fileIdStr = fileName.substring(WAL_FILE_PREFIX.length(), fileName.length() - WAL_FILE_SUFFIX.length());
                walFiles.put(fileIdStr, file);
            }
        } catch (IOException e) {
            logger.error("Error loading WAL files", e);
        }
    }

    private void openCurrentWriter() throws IOException {
        String fileName = WAL_FILE_PREFIX + String.format("%010d", currentFileId.get()) + WAL_FILE_SUFFIX;
        Path filePath = walDir.resolve(fileName);
        currentWriter = Files.newBufferedWriter(filePath, StandardCharsets.UTF_8,
                StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        walFiles.put(String.valueOf(currentFileId.get()), filePath);
        entriesInCurrentFile = countEntriesInFile(filePath);
    }

    private long countEntriesInFile(Path filePath) {
        if (!Files.exists(filePath)) {
            return 0;
        }
        try (LineNumberReader reader = new LineNumberReader(Files.newBufferedReader(filePath))) {
            while (reader.readLine() != null) {}
            return reader.getLineNumber();
        } catch (IOException e) {
            logger.error("Error counting entries in file", e);
            return 0;
        }
    }

    private void rotateFile() throws IOException {
        if (currentWriter != null) {
            currentWriter.close();
        }
        currentFileId.incrementAndGet();
        entriesInCurrentFile = 0;
        openCurrentWriter();
        saveIndex();
        cleanupOldFiles();
    }

    private void cleanupOldFiles() {
        try {
            long minOffset = Long.MAX_VALUE;
            for (long offset : clusterOffsets.values()) {
                minOffset = Math.min(minOffset, offset);
            }
            if (minOffset == Long.MAX_VALUE) {
                return;
            }
            long currentTotalSize = calculateTotalSize();
            if (currentTotalSize <= maxSize) {
                return;
            }
            List<String> fileIds = new ArrayList<>(walFiles.keySet());
            Collections.sort(fileIds);
            for (String fileId : fileIds) {
                if (currentTotalSize <= maxSize) {
                    break;
                }
                Path file = walFiles.get(fileId);
                long fileSize = Files.size(file);
                Files.delete(file);
                walFiles.remove(fileId);
                currentTotalSize -= fileSize;
                logger.info("Deleted old WAL file: {}", fileId);
            }
        } catch (IOException e) {
            logger.error("Error cleaning up old WAL files", e);
        }
    }

    private long calculateTotalSize() throws IOException {
        long total = 0;
        for (Path file : walFiles.values()) {
            if (Files.exists(file)) {
                total += Files.size(file);
            }
        }
        return total;
    }

    public WalEntry append(RedisCommand command, String key, String businessGroup) throws IOException {
        appendLock.lock();
        try {
            long sequence = currentSequence.incrementAndGet();
            instanceSequences.put(instanceId, sequence);
            WalEntry entry = new WalEntry(instanceId, sequence, System.currentTimeMillis(), command, key, businessGroup);
            String line = objectMapper.writeValueAsString(entry);
            currentWriter.write(line);
            currentWriter.newLine();
            currentWriter.flush();
            entriesInCurrentFile++;
            indexDirty = true;
            if (entriesInCurrentFile >= MAX_ENTRIES_PER_FILE) {
                rotateFile();
            }
            return entry;
        } finally {
            appendLock.unlock();
        }
    }

    public void updateClusterOffset(String clusterId, long sequence) {
        updateClusterOffset(clusterId, instanceId, sequence);
    }

    public void updateClusterOffset(String clusterId, String entryInstanceId, long sequence) {
        String key = clusterId + ":" + entryInstanceId;
        Long existing = clusterOffsets.get(key);
        if (existing != null && existing >= sequence) {
            return;
        }
        clusterOffsets.put(key, sequence);
        indexDirty = true;
    }

    public long getClusterOffset(String clusterId) {
        return getClusterOffset(clusterId, instanceId);
    }

    public long getClusterOffset(String clusterId, String entryInstanceId) {
        String key = clusterId + ":" + entryInstanceId;
        return clusterOffsets.getOrDefault(key, 0L);
    }

    public List<WalEntry> getEntriesSince(String clusterId, int maxEntries) {
        List<WalEntry> entries = new ArrayList<>();
        Map<String, Path> fileSnapshot;
        synchronized (this) {
            fileSnapshot = new TreeMap<>(walFiles);
        }
        for (Path file : fileSnapshot.values()) {
            if (entries.size() >= maxEntries) {
                break;
            }
            try (BufferedReader reader = Files.newBufferedReader(file, StandardCharsets.UTF_8)) {
                String line;
                while ((line = reader.readLine()) != null && entries.size() < maxEntries) {
                    if (line.trim().isEmpty()) {
                        continue;
                    }
                    try {
                        WalEntry entry = objectMapper.readValue(line, WalEntry.class);
                        long clusterOffset = getClusterOffset(clusterId, entry.getInstanceId());
                        if (entry.getSequence() > clusterOffset) {
                            entries.add(entry);
                        }
                    } catch (Exception e) {
                        break;
                    }
                }
            } catch (IOException e) {
                logger.error("Error reading WAL file: {}", file, e);
            }
        }
        entries.sort(Comparator.comparingLong(WalEntry::getSequence));
        return entries;
    }

    public long getCurrentSequence() {
        return currentSequence.get();
    }

    public String getInstanceId() {
        return instanceId;
    }

    public void close() throws IOException {
        appendLock.lock();
        try {
            if (currentWriter != null) {
                currentWriter.close();
            }
            saveIndex();
        } finally {
            appendLock.unlock();
        }
        indexFlushScheduler.shutdownNow();
    }

    public static class WalEntry implements Serializable {
        private String instanceId;
        private long sequence;
        private long timestamp;
        private String commandName;
        private List<String> args;
        private String key;
        private String businessGroup;

        public WalEntry() {}

        public WalEntry(String instanceId, long sequence, long timestamp, RedisCommand command, String key, String businessGroup) {
            this.instanceId = instanceId;
            this.sequence = sequence;
            this.timestamp = timestamp;
            this.commandName = command.getName();
            this.args = command.getArgStrings();
            this.key = key;
            this.businessGroup = businessGroup;
        }

        public String getInstanceId() { return instanceId; }
        public void setInstanceId(String instanceId) { this.instanceId = instanceId; }
        public long getSequence() { return sequence; }
        public void setSequence(long sequence) { this.sequence = sequence; }
        public long getTimestamp() { return timestamp; }
        public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
        public String getCommandName() { return commandName; }
        public void setCommandName(String commandName) { this.commandName = commandName; }
        public List<String> getArgs() { return args; }
        public void setArgs(List<String> args) { this.args = args; }
        public String getKey() { return key; }
        public void setKey(String key) { this.key = key; }
        public String getBusinessGroup() { return businessGroup; }
        public void setBusinessGroup(String businessGroup) { this.businessGroup = businessGroup; }

        public RedisCommand toRedisCommand() {
            List<byte[]> byteArgs = new ArrayList<>();
            for (String arg : args) {
                byteArgs.add(arg.getBytes(StandardCharsets.UTF_8));
            }
            return new RedisCommand(commandName, byteArgs);
        }

        public String getUniqueId() {
            return instanceId + "-" + sequence;
        }
    }
}
