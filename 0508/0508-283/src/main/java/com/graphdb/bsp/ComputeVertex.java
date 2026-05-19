package com.graphdb.bsp;

import com.graphdb.model.Vertex;

import java.util.ArrayList;
import java.util.List;

public abstract class ComputeVertex<V, E, M> {

    protected long vertexId;
    protected V vertexValue;
    protected List<E> edges;
    protected List<M> incomingMessages;
    protected boolean active;
    protected BSPContext<V, E, M> context;

    public ComputeVertex(long vertexId) {
        this.vertexId = vertexId;
        this.incomingMessages = new ArrayList<>();
        this.active = true;
    }

    public void init(Vertex vertex, List<E> edges, BSPContext<V, E, M> context) {
        this.edges = edges;
        this.context = context;
    }

    public abstract void compute();

    public void sendMessage(long targetVertexId, M message) {
        context.sendMessage(targetVertexId, message);
    }

    public void voteToHalt() {
        this.active = false;
    }

    public void wakeUp() {
        this.active = true;
    }

    public boolean isActive() {
        return active;
    }

    public void setVertexValue(V value) {
        this.vertexValue = value;
    }

    public V getVertexValue() {
        return vertexValue;
    }

    public List<M> getIncomingMessages() {
        return incomingMessages;
    }

    public void clearMessages() {
        incomingMessages.clear();
    }

    public void addMessage(M message) {
        incomingMessages.add(message);
    }

    public long getVertexId() {
        return vertexId;
    }

    public List<E> getEdges() {
        return edges;
    }

    public int getSuperstep() {
        return context.getSuperstep();
    }

    public long getTotalVertices() {
        return context.getTotalVertices();
    }
}