package com.graphdb.stream;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Consumer;

@Slf4j
public class SlidingWindow<E> {

    private final long windowSizeMs;
    private final long slideIntervalMs;
    private final Deque<WindowEntry<E>> windowEntries;
    private final Map<E, Long> elementTimestamps;
    private final AtomicLong totalElements;
    private final List<Consumer<Collection<E>>> evictionListeners;

    public SlidingWindow(long windowSizeMs, long slideIntervalMs) {
        this.windowSizeMs = windowSizeMs;
        this.slideIntervalMs = slideIntervalMs;
        this.windowEntries = new ConcurrentLinkedDeque<>();
        this.elementTimestamps = new ConcurrentHashMap<>();
        this.totalElements = new AtomicLong(0);
        this.evictionListeners = new ArrayList<>();
    }

    public void add(E element) {
        long currentTime = System.currentTimeMillis();
        WindowEntry<E> entry = new WindowEntry<>(element, currentTime);
        windowEntries.addLast(entry);
        elementTimestamps.put(element, currentTime);
        totalElements.incrementAndGet();
        evictExpired(currentTime);
    }

    public void addAll(Collection<E> elements) {
        long currentTime = System.currentTimeMillis();
        for (E element : elements) {
            WindowEntry<E> entry = new WindowEntry<>(element, currentTime);
            windowEntries.addLast(entry);
            elementTimestamps.put(element, currentTime);
            totalElements.incrementAndGet();
        }
        evictExpired(currentTime);
    }

    public void evictExpired() {
        evictExpired(System.currentTimeMillis());
    }

    private void evictExpired(long currentTime) {
        long cutoffTime = currentTime - windowSizeMs;
        List<E> evictedElements = new ArrayList<>();

        while (!windowEntries.isEmpty()) {
            WindowEntry<E> entry = windowEntries.peekFirst();
            if (entry.getTimestamp() <= cutoffTime) {
                windowEntries.pollFirst();
                E element = entry.getElement();
                elementTimestamps.remove(element);
                evictedElements.add(element);
                totalElements.decrementAndGet();
            } else {
                break;
            }
        }

        if (!evictedElements.isEmpty()) {
            notifyEvictionListeners(evictedElements);
            log.debug("Evicted {} elements from sliding window", evictedElements.size());
        }
    }

    public boolean contains(E element) {
        return elementTimestamps.containsKey(element);
    }

    public Collection<E> getElements() {
        evictExpired();
        return new ArrayList<>(elementTimestamps.keySet());
    }

    public Collection<E> getElementsInRange(long startTimeMs, long endTimeMs) {
        List<E> result = new ArrayList<>();
        for (Map.Entry<E, Long> entry : elementTimestamps.entrySet()) {
            long timestamp = entry.getValue();
            if (timestamp >= startTimeMs && timestamp <= endTimeMs) {
                result.add(entry.getKey());
            }
        }
        return result;
    }

    public long size() {
        evictExpired();
        return totalElements.get();
    }

    public boolean isEmpty() {
        evictExpired();
        return totalElements.get() == 0;
    }

    public void clear() {
        List<E> allElements = new ArrayList<>(elementTimestamps.keySet());
        windowEntries.clear();
        elementTimestamps.clear();
        totalElements.set(0);
        notifyEvictionListeners(allElements);
    }

    public void addEvictionListener(Consumer<Collection<E>> listener) {
        evictionListeners.add(listener);
    }

    private void notifyEvictionListeners(Collection<E> evictedElements) {
        for (Consumer<Collection<E>> listener : evictionListeners) {
            try {
                listener.accept(evictedElements);
            } catch (Exception e) {
                log.error("Error in eviction listener", e);
            }
        }
    }

    public long getWindowSizeMs() {
        return windowSizeMs;
    }

    public long getSlideIntervalMs() {
        return slideIntervalMs;
    }

    @Data
    public static class WindowEntry<E> {
        private final E element;
        private final long timestamp;

        public WindowEntry(E element, long timestamp) {
            this.element = element;
            this.timestamp = timestamp;
        }
    }
}