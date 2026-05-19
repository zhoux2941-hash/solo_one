package com.graphdb.stream;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EdgeId {
    private long fromVertexId;
    private long toVertexId;
    private String label;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        EdgeId edgeId = (EdgeId) o;
        return fromVertexId == edgeId.fromVertexId &&
               toVertexId == edgeId.toVertexId &&
               Objects.equals(label, edgeId.label);
    }

    @Override
    public int hashCode() {
        return Objects.hash(fromVertexId, toVertexId, label);
    }

    public static EdgeId of(long from, long to, String label) {
        return new EdgeId(from, to, label);
    }
}