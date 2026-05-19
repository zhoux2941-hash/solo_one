package com.graphdb.bsp;

import java.util.ArrayList;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;

public class MessagePool<M> {

    private final Queue<List<M>> listPool;
    private final int poolSize;

    public MessagePool(int poolSize) {
        this.poolSize = poolSize;
        this.listPool = new ConcurrentLinkedQueue<>();
    }

    public List<M> acquireList() {
        List<M> list = listPool.poll();
        if (list == null) {
            return new ArrayList<>();
        }
        return list;
    }

    public void releaseList(List<M> list) {
        if (listPool.size() < poolSize) {
            list.clear();
            listPool.offer(list);
        }
    }

    public void clear() {
        listPool.clear();
    }

    public int size() {
        return listPool.size();
    }
}