package com.graphdb.storage;

import java.io.Closeable;
import java.util.Map;

public interface KeyValueStore extends Closeable {

    void put(byte[] key, byte[] value);

    byte[] get(byte[] key);

    void delete(byte[] key);

    void putBatch(Map<byte[], byte[]> batch);

    Iterable<Map.Entry<byte[], byte[]>> scan(byte[] prefix);

    Iterable<Map.Entry<byte[], byte[]>> range(byte[] startKey, byte[] endKey);

    void flush();
}