package com.graphdb.storage;

import com.graphdb.config.GraphDBConfig;
import lombok.extern.slf4j.Slf4j;
import org.rocksdb.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.io.File;
import java.util.*;

@Slf4j
@Component
public class RocksDBStore implements KeyValueStore {

    static {
        RocksDB.loadLibrary();
    }

    @Autowired
    private GraphDBConfig config;

    private RocksDB db;
    private Options options;
    private WriteOptions writeOptions;
    private ReadOptions readOptions;

    @PostConstruct
    public void init() throws Exception {
        String dbPath = config.getStorage().getPath();
        File dir = new File(dbPath);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        options = new Options()
                .setCreateIfMissing(true)
                .setEnableWal(config.getStorage().isEnableWal())
                .setMaxOpenFiles(-1)
                .setWriteBufferSize(64 * 1024 * 1024)
                .setMaxWriteBufferNumber(4)
                .setMinWriteBufferNumberToMerge(2)
                .setLevel0FileNumCompactionTrigger(8)
                .setLevel0SlowdownWritesTrigger(16)
                .setLevel0StopWritesTrigger(24)
                .setTargetFileSizeBase(64 * 1024 * 1024)
                .setMaxBytesForLevelBase(512 * 1024 * 1024);

        writeOptions = new WriteOptions()
                .setSync(false)
                .setDisableWAL(!config.getStorage().isEnableWal());

        readOptions = new ReadOptions()
                .setFillCache(true);

        db = RocksDB.open(options, dbPath);
        log.info("RocksDB initialized at path: {}", dbPath);
    }

    @PreDestroy
    @Override
    public void close() {
        try {
            if (db != null) {
                db.close();
            }
            if (writeOptions != null) {
                writeOptions.close();
            }
            if (readOptions != null) {
                readOptions.close();
            }
            if (options != null) {
                options.close();
            }
            log.info("RocksDB closed successfully");
        } catch (Exception e) {
            log.error("Error closing RocksDB", e);
        }
    }

    @Override
    public void put(byte[] key, byte[] value) {
        try {
            db.put(writeOptions, key, value);
        } catch (RocksDBException e) {
            throw new RuntimeException("Failed to put key-value", e);
        }
    }

    @Override
    public byte[] get(byte[] key) {
        try {
            return db.get(readOptions, key);
        } catch (RocksDBException e) {
            throw new RuntimeException("Failed to get value", e);
        }
    }

    @Override
    public void delete(byte[] key) {
        try {
            db.delete(writeOptions, key);
        } catch (RocksDBException e) {
            throw new RuntimeException("Failed to delete key", e);
        }
    }

    @Override
    public void putBatch(Map<byte[], byte[]> batch) {
        try (WriteBatch writeBatch = new WriteBatch()) {
            for (Map.Entry<byte[], byte[]> entry : batch.entrySet()) {
                writeBatch.put(entry.getKey(), entry.getValue());
            }
            db.write(writeOptions, writeBatch);
        } catch (RocksDBException e) {
            throw new RuntimeException("Failed to put batch", e);
        }
    }

    @Override
    public Iterable<Map.Entry<byte[], byte[]>> scan(byte[] prefix) {
        List<Map.Entry<byte[], byte[]>> results = new ArrayList<>();
        try (RocksIterator iterator = db.newIterator(readOptions)) {
            iterator.seek(prefix);
            while (iterator.isValid()) {
                byte[] key = iterator.key();
                if (!startsWith(key, prefix)) {
                    break;
                }
                results.add(new AbstractMap.SimpleEntry<>(key, iterator.value()));
                iterator.next();
            }
        }
        return results;
    }

    @Override
    public Iterable<Map.Entry<byte[], byte[]>> range(byte[] startKey, byte[] endKey) {
        List<Map.Entry<byte[], byte[]>> results = new ArrayList<>();
        try (RocksIterator iterator = db.newIterator(readOptions)) {
            iterator.seek(startKey);
            while (iterator.isValid()) {
                byte[] key = iterator.key();
                if (compare(key, endKey) >= 0) {
                    break;
                }
                results.add(new AbstractMap.SimpleEntry<>(key, iterator.value()));
                iterator.next();
            }
        }
        return results;
    }

    @Override
    public void flush() {
        try (FlushOptions flushOptions = new FlushOptions().setWaitForFlush(true)) {
            db.flush(flushOptions);
        } catch (RocksDBException e) {
            throw new RuntimeException("Failed to flush", e);
        }
    }

    private boolean startsWith(byte[] key, byte[] prefix) {
        if (key.length < prefix.length) {
            return false;
        }
        for (int i = 0; i < prefix.length; i++) {
            if (key[i] != prefix[i]) {
                return false;
            }
        }
        return true;
    }

    private int compare(byte[] a, byte[] b) {
        int minLen = Math.min(a.length, b.length);
        for (int i = 0; i < minLen; i++) {
            int cmp = Byte.compare(a[i], b[i]);
            if (cmp != 0) {
                return cmp;
            }
        }
        return Integer.compare(a.length, b.length);
    }
}