package com.graphdb.storage.serializer;

public interface Serializer<T> {

    byte[] serialize(T obj);

    T deserialize(byte[] data);
}