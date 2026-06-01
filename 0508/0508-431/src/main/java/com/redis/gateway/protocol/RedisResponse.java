package com.redis.gateway.protocol;

import java.util.List;

public class RedisResponse {
    private final Type type;
    private final Object value;

    public RedisResponse(Type type, Object value) {
        this.type = type;
        this.value = value;
    }

    public Type getType() {
        return type;
    }

    public Object getValue() {
        return value;
    }

    public boolean isError() {
        return type == Type.ERROR;
    }

    public String asString() {
        if (value instanceof byte[]) {
            return new String((byte[]) value);
        }
        return String.valueOf(value);
    }

    public Long asLong() {
        if (value instanceof Long) {
            return (Long) value;
        }
        if (value instanceof String) {
            return Long.parseLong((String) value);
        }
        return null;
    }

    public byte[] asBytes() {
        if (value instanceof byte[]) {
            return (byte[]) value;
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    public List<byte[]> asList() {
        if (value instanceof List) {
            return (List<byte[]>) value;
        }
        return null;
    }

    public enum Type {
        SIMPLE_STRING,
        ERROR,
        INTEGER,
        BULK_STRING,
        ARRAY
    }

    public static RedisResponse ok() {
        return new RedisResponse(Type.SIMPLE_STRING, "OK");
    }

    public static RedisResponse error(String message) {
        return new RedisResponse(Type.ERROR, message);
    }

    public static RedisResponse integer(long value) {
        return new RedisResponse(Type.INTEGER, value);
    }

    public static RedisResponse bulkString(String value) {
        return new RedisResponse(Type.BULK_STRING, value.getBytes());
    }

    public static RedisResponse bulkString(byte[] value) {
        return new RedisResponse(Type.BULK_STRING, value);
    }

    public static RedisResponse nullBulk() {
        return new RedisResponse(Type.BULK_STRING, null);
    }

    public static RedisResponse array(List<byte[]> value) {
        return new RedisResponse(Type.ARRAY, value);
    }

    public static RedisResponse nullArray() {
        return new RedisResponse(Type.ARRAY, null);
    }
}
