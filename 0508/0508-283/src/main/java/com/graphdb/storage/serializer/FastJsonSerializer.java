package com.graphdb.storage.serializer;

import com.alibaba.fastjson2.JSON;

public class FastJsonSerializer<T> implements Serializer<T> {

    private final Class<T> clazz;

    public FastJsonSerializer(Class<T> clazz) {
        this.clazz = clazz;
    }

    @Override
    public byte[] serialize(T obj) {
        return JSON.toJSONBytes(obj);
    }

    @Override
    public T deserialize(byte[] data) {
        return JSON.parseObject(data, clazz);
    }
}