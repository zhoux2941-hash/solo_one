package com.graphdb.storage.serializer;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class BinarySerializer {

    public static byte[] serializeLong(long value) {
        return ByteBuffer.allocate(8).putLong(value).array();
    }

    public static long deserializeLong(byte[] data) {
        return ByteBuffer.wrap(data).getLong();
    }

    public static byte[] serializeInt(int value) {
        return ByteBuffer.allocate(4).putInt(value).array();
    }

    public static int deserializeInt(byte[] data) {
        return ByteBuffer.wrap(data).getInt();
    }

    public static byte[] serializeDouble(double value) {
        return ByteBuffer.allocate(8).putDouble(value).array();
    }

    public static double deserializeDouble(byte[] data) {
        return ByteBuffer.wrap(data).getDouble();
    }

    public static byte[] serializeString(String value) {
        if (value == null) {
            return serializeInt(0);
        }
        byte[] strBytes = value.getBytes(StandardCharsets.UTF_8);
        ByteBuffer buffer = ByteBuffer.allocate(4 + strBytes.length);
        buffer.putInt(strBytes.length);
        buffer.put(strBytes);
        return buffer.array();
    }

    public static String deserializeString(byte[] data) {
        ByteBuffer buffer = ByteBuffer.wrap(data);
        int length = buffer.getInt();
        if (length == 0) {
            return null;
        }
        byte[] strBytes = new byte[length];
        buffer.get(strBytes);
        return new String(strBytes, StandardCharsets.UTF_8);
    }

    public static byte[] serializeMap(Map<String, Object> map) {
        if (map == null || map.isEmpty()) {
            return serializeInt(0);
        }
        byte[][] entries = new byte[map.size() * 2][];
        int totalSize = 4;
        int idx = 0;
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            byte[] keyBytes = serializeString(entry.getKey());
            byte[] valueBytes = serializeObject(entry.getValue());
            entries[idx++] = keyBytes;
            entries[idx++] = valueBytes;
            totalSize += keyBytes.length + valueBytes.length;
        }
        ByteBuffer buffer = ByteBuffer.allocate(totalSize);
        buffer.putInt(map.size());
        for (byte[] entry : entries) {
            buffer.put(entry);
        }
        return buffer.array();
    }

    public static Map<String, Object> deserializeMap(byte[] data) {
        ByteBuffer buffer = ByteBuffer.wrap(data);
        int size = buffer.getInt();
        Map<String, Object> map = new HashMap<>(size);
        for (int i = 0; i < size; i++) {
            String key = deserializeStringFromBuffer(buffer);
            Object value = deserializeObjectFromBuffer(buffer);
            map.put(key, value);
        }
        return map;
    }

    private static String deserializeStringFromBuffer(ByteBuffer buffer) {
        int length = buffer.getInt();
        if (length == 0) {
            return null;
        }
        byte[] strBytes = new byte[length];
        buffer.get(strBytes);
        return new String(strBytes, StandardCharsets.UTF_8);
    }

    private static byte[] serializeObject(Object value) {
        if (value == null) {
            return new byte[]{0};
        }
        if (value instanceof String) {
            byte[] strBytes = ((String) value).getBytes(StandardCharsets.UTF_8);
            ByteBuffer buffer = ByteBuffer.allocate(1 + 4 + strBytes.length);
            buffer.put((byte) 1);
            buffer.putInt(strBytes.length);
            buffer.put(strBytes);
            return buffer.array();
        }
        if (value instanceof Long) {
            return ByteBuffer.allocate(9).put((byte) 2).putLong((Long) value).array();
        }
        if (value instanceof Integer) {
            return ByteBuffer.allocate(5).put((byte) 3).putInt((Integer) value).array();
        }
        if (value instanceof Double) {
            return ByteBuffer.allocate(9).put((byte) 4).putDouble((Double) value).array();
        }
        if (value instanceof Boolean) {
            return new byte[]{5, (byte) ((Boolean) value ? 1 : 0)};
        }
        return new byte[]{0};
    }

    private static Object deserializeObjectFromBuffer(ByteBuffer buffer) {
        byte type = buffer.get();
        switch (type) {
            case 0:
                return null;
            case 1:
                int strLen = buffer.getInt();
                byte[] strBytes = new byte[strLen];
                buffer.get(strBytes);
                return new String(strBytes, StandardCharsets.UTF_8);
            case 2:
                return buffer.getLong();
            case 3:
                return buffer.getInt();
            case 4:
                return buffer.getDouble();
            case 5:
                return buffer.get() == 1;
            default:
                return null;
        }
    }
}