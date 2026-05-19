package com.graphdb.bsp;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MessageBuffer<M> {

    private final Map<Long, List<M>> messages;
    private int messageCount;

    public MessageBuffer() {
        this.messages = new HashMap<>();
        this.messageCount = 0;
    }

    public void addMessage(long targetVertexId, M message) {
        messages.computeIfAbsent(targetVertexId, k -> new ArrayList<>())
                .add(message);
        messageCount++;
    }

    public void addMessages(long targetVertexId, List<M> newMessages) {
        if (newMessages.isEmpty()) {
            return;
        }
        List<M> existing = messages.get(targetVertexId);
        if (existing == null) {
            messages.put(targetVertexId, new ArrayList<>(newMessages));
        } else {
            existing.addAll(newMessages);
        }
        messageCount += newMessages.size();
    }

    public Map<Long, List<M>> getMessages() {
        return messages;
    }

    public int getMessageCount() {
        return messageCount;
    }

    public void clear() {
        messages.clear();
        messageCount = 0;
    }

    public boolean isEmpty() {
        return messageCount == 0;
    }

    public void merge(MessageBuffer<M> other) {
        for (Map.Entry<Long, List<M>> entry : other.messages.entrySet()) {
            addMessages(entry.getKey(), entry.getValue());
        }
    }
}