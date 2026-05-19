package com.graphdb.storage;

import com.graphdb.model.Edge;
import com.graphdb.model.Vertex;
import com.graphdb.storage.serializer.BinarySerializer;
import com.graphdb.storage.serializer.FastJsonSerializer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.nio.ByteBuffer;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Component
public class RocksDBGraphStore implements GraphStore {

    private static final byte[] PREFIX_VERTEX = new byte[]{'V'};
    private static final byte[] PREFIX_EDGE = new byte[]{'E'};
    private static final byte[] PREFIX_OUT_EDGE = new byte[]{'O'};
    private static final byte[] PREFIX_IN_EDGE = new byte[]{'I'};
    private static final byte[] PREFIX_META = new byte[]{'M'};

    private static final byte[] KEY_VERTEX_ID = "VID".getBytes();
    private static final byte[] KEY_EDGE_ID = "EID".getBytes();
    private static final byte[] KEY_VERTEX_COUNT = "VC".getBytes();
    private static final byte[] KEY_EDGE_COUNT = "EC".getBytes();

    @Autowired
    private KeyValueStore kvStore;

    private final FastJsonSerializer<Vertex> vertexSerializer = new FastJsonSerializer<>(Vertex.class);
    private final FastJsonSerializer<Edge> edgeSerializer = new FastJsonSerializer<>(Edge.class);

    private final AtomicLong nextVertexId = new AtomicLong(1);
    private final AtomicLong nextEdgeId = new AtomicLong(1);

    @PostConstruct
    public void init() {
        byte[] vidBytes = kvStore.get(makeMetaKey(KEY_VERTEX_ID));
        if (vidBytes != null) {
            nextVertexId.set(BinarySerializer.deserializeLong(vidBytes));
        }
        byte[] eidBytes = kvStore.get(makeMetaKey(KEY_EDGE_ID));
        if (eidBytes != null) {
            nextEdgeId.set(BinarySerializer.deserializeLong(eidBytes));
        }
        log.info("GraphStore initialized. Next vertexId: {}, next edgeId: {}",
                nextVertexId.get(), nextEdgeId.get());
    }

    @Override
    public void addVertex(Vertex vertex) {
        if (vertex.getId() <= 0) {
            vertex.setId(nextVertexId.getAndIncrement());
            kvStore.put(makeMetaKey(KEY_VERTEX_ID), BinarySerializer.serializeLong(nextVertexId.get()));
        }
        byte[] key = makeVertexKey(vertex.getId());
        kvStore.put(key, vertexSerializer.serialize(vertex));
        incrementVertexCount(1);
    }

    @Override
    public Vertex getVertex(long vertexId) {
        byte[] key = makeVertexKey(vertexId);
        byte[] value = kvStore.get(key);
        if (value == null) {
            return null;
        }
        return vertexSerializer.deserialize(value);
    }

    @Override
    public void removeVertex(long vertexId) {
        byte[] key = makeVertexKey(vertexId);
        byte[] value = kvStore.get(key);
        if (value == null) {
            return;
        }

        List<Edge> outEdges = getOutEdges(vertexId);
        List<Edge> inEdges = getInEdges(vertexId);

        for (Edge edge : outEdges) {
            removeEdge(edge.getId());
        }
        for (Edge edge : inEdges) {
            removeEdge(edge.getId());
        }

        kvStore.delete(key);
        incrementVertexCount(-1);
    }

    @Override
    public void addEdge(Edge edge) {
        if (edge.getId() <= 0) {
            edge.setId(nextEdgeId.getAndIncrement());
            kvStore.put(makeMetaKey(KEY_EDGE_ID), BinarySerializer.serializeLong(nextEdgeId.get()));
        }

        byte[] edgeKey = makeEdgeKey(edge.getId());
        kvStore.put(edgeKey, edgeSerializer.serialize(edge));

        byte[] outEdgeKey = makeOutEdgeKey(edge.getFromVertexId(), edge.getToVertexId());
        kvStore.put(outEdgeKey, BinarySerializer.serializeLong(edge.getId()));

        byte[] inEdgeKey = makeInEdgeKey(edge.getToVertexId(), edge.getFromVertexId());
        kvStore.put(inEdgeKey, BinarySerializer.serializeLong(edge.getId()));

        incrementEdgeCount(1);
    }

    @Override
    public Edge getEdge(long edgeId) {
        byte[] key = makeEdgeKey(edgeId);
        byte[] value = kvStore.get(key);
        if (value == null) {
            return null;
        }
        return edgeSerializer.deserialize(value);
    }

    @Override
    public void removeEdge(long edgeId) {
        Edge edge = getEdge(edgeId);
        if (edge == null) {
            return;
        }

        byte[] edgeKey = makeEdgeKey(edgeId);
        kvStore.delete(edgeKey);

        byte[] outEdgeKey = makeOutEdgeKey(edge.getFromVertexId(), edge.getToVertexId());
        kvStore.delete(outEdgeKey);

        byte[] inEdgeKey = makeInEdgeKey(edge.getToVertexId(), edge.getFromVertexId());
        kvStore.delete(inEdgeKey);

        incrementEdgeCount(-1);
    }

    @Override
    public List<Edge> getOutEdges(long vertexId) {
        List<Edge> edges = new ArrayList<>();
        byte[] prefix = makeOutEdgePrefix(vertexId);
        for (Map.Entry<byte[], byte[]> entry : kvStore.scan(prefix)) {
            long edgeId = BinarySerializer.deserializeLong(entry.getValue());
            Edge edge = getEdge(edgeId);
            if (edge != null) {
                edges.add(edge);
            }
        }
        return edges;
    }

    @Override
    public List<Edge> getInEdges(long vertexId) {
        List<Edge> edges = new ArrayList<>();
        byte[] prefix = makeInEdgePrefix(vertexId);
        for (Map.Entry<byte[], byte[]> entry : kvStore.scan(prefix)) {
            long edgeId = BinarySerializer.deserializeLong(entry.getValue());
            Edge edge = getEdge(edgeId);
            if (edge != null) {
                edges.add(edge);
            }
        }
        return edges;
    }

    @Override
    public List<Long> getOutNeighbors(long vertexId) {
        List<Long> neighbors = new ArrayList<>();
        byte[] prefix = makeOutEdgePrefix(vertexId);
        for (Map.Entry<byte[], byte[]> entry : kvStore.scan(prefix)) {
            long neighborId = extractNeighborId(entry.getKey(), prefix.length);
            neighbors.add(neighborId);
        }
        return neighbors;
    }

    @Override
    public List<Long> getInNeighbors(long vertexId) {
        List<Long> neighbors = new ArrayList<>();
        byte[] prefix = makeInEdgePrefix(vertexId);
        for (Map.Entry<byte[], byte[]> entry : kvStore.scan(prefix)) {
            long neighborId = extractNeighborId(entry.getKey(), prefix.length);
            neighbors.add(neighborId);
        }
        return neighbors;
    }

    @Override
    public int getOutDegree(long vertexId) {
        return getOutNeighbors(vertexId).size();
    }

    @Override
    public int getInDegree(long vertexId) {
        return getInNeighbors(vertexId).size();
    }

    @Override
    public Set<Long> getAllVertexIds() {
        Set<Long> vertexIds = new HashSet<>();
        for (Map.Entry<byte[], byte[]> entry : kvStore.scan(PREFIX_VERTEX)) {
            long vertexId = extractVertexId(entry.getKey());
            vertexIds.add(vertexId);
        }
        return vertexIds;
    }

    @Override
    public long getVertexCount() {
        byte[] value = kvStore.get(makeMetaKey(KEY_VERTEX_COUNT));
        if (value == null) {
            return 0;
        }
        return BinarySerializer.deserializeLong(value);
    }

    @Override
    public long getEdgeCount() {
        byte[] value = kvStore.get(makeMetaKey(KEY_EDGE_COUNT));
        if (value == null) {
            return 0;
        }
        return BinarySerializer.deserializeLong(value);
    }

    @Override
    public void updateVertexProperty(long vertexId, String key, Object value) {
        Vertex vertex = getVertex(vertexId);
        if (vertex != null) {
            vertex.setProperty(key, value);
            byte[] vertexKey = makeVertexKey(vertexId);
            kvStore.put(vertexKey, vertexSerializer.serialize(vertex));
        }
    }

    @Override
    public void batchAddVertices(List<Vertex> vertices) {
        Map<byte[], byte[]> batch = new HashMap<>();
        for (Vertex vertex : vertices) {
            if (vertex.getId() <= 0) {
                vertex.setId(nextVertexId.getAndIncrement());
            }
            byte[] key = makeVertexKey(vertex.getId());
            batch.put(key, vertexSerializer.serialize(vertex));
        }
        batch.put(makeMetaKey(KEY_VERTEX_ID), BinarySerializer.serializeLong(nextVertexId.get()));
        kvStore.putBatch(batch);
        incrementVertexCount(vertices.size());
    }

    @Override
    public void batchAddEdges(List<Edge> edges) {
        Map<byte[], byte[]> batch = new HashMap<>();
        for (Edge edge : edges) {
            if (edge.getId() <= 0) {
                edge.setId(nextEdgeId.getAndIncrement());
            }
            byte[] edgeKey = makeEdgeKey(edge.getId());
            batch.put(edgeKey, edgeSerializer.serialize(edge));

            byte[] outEdgeKey = makeOutEdgeKey(edge.getFromVertexId(), edge.getToVertexId());
            batch.put(outEdgeKey, BinarySerializer.serializeLong(edge.getId()));

            byte[] inEdgeKey = makeInEdgeKey(edge.getToVertexId(), edge.getFromVertexId());
            batch.put(inEdgeKey, BinarySerializer.serializeLong(edge.getId()));
        }
        batch.put(makeMetaKey(KEY_EDGE_ID), BinarySerializer.serializeLong(nextEdgeId.get()));
        kvStore.putBatch(batch);
        incrementEdgeCount(edges.size());
    }

    private void incrementVertexCount(long delta) {
        long current = getVertexCount();
        kvStore.put(makeMetaKey(KEY_VERTEX_COUNT), BinarySerializer.serializeLong(current + delta));
    }

    private void incrementEdgeCount(long delta) {
        long current = getEdgeCount();
        kvStore.put(makeMetaKey(KEY_EDGE_COUNT), BinarySerializer.serializeLong(current + delta));
    }

    private byte[] makeVertexKey(long vertexId) {
        return ByteBuffer.allocate(PREFIX_VERTEX.length + 8)
                .put(PREFIX_VERTEX)
                .putLong(vertexId)
                .array();
    }

    private byte[] makeEdgeKey(long edgeId) {
        return ByteBuffer.allocate(PREFIX_EDGE.length + 8)
                .put(PREFIX_EDGE)
                .putLong(edgeId)
                .array();
    }

    private byte[] makeOutEdgeKey(long fromId, long toId) {
        return ByteBuffer.allocate(PREFIX_OUT_EDGE.length + 16)
                .put(PREFIX_OUT_EDGE)
                .putLong(fromId)
                .putLong(toId)
                .array();
    }

    private byte[] makeInEdgeKey(long toId, long fromId) {
        return ByteBuffer.allocate(PREFIX_IN_EDGE.length + 16)
                .put(PREFIX_IN_EDGE)
                .putLong(toId)
                .putLong(fromId)
                .array();
    }

    private byte[] makeOutEdgePrefix(long vertexId) {
        return ByteBuffer.allocate(PREFIX_OUT_EDGE.length + 8)
                .put(PREFIX_OUT_EDGE)
                .putLong(vertexId)
                .array();
    }

    private byte[] makeInEdgePrefix(long vertexId) {
        return ByteBuffer.allocate(PREFIX_IN_EDGE.length + 8)
                .put(PREFIX_IN_EDGE)
                .putLong(vertexId)
                .array();
    }

    private byte[] makeMetaKey(byte[] key) {
        return ByteBuffer.allocate(PREFIX_META.length + key.length)
                .put(PREFIX_META)
                .put(key)
                .array();
    }

    private long extractVertexId(byte[] key) {
        return ByteBuffer.wrap(key, PREFIX_VERTEX.length, 8).getLong();
    }

    private long extractNeighborId(byte[] key, int offset) {
        return ByteBuffer.wrap(key, offset, 8).getLong();
    }
}