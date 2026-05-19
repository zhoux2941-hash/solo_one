package com.graphdb.bsp;

@FunctionalInterface
public interface VertexComputeFunction<V, E, M> {

    void compute(ComputeVertex<V, E, M> vertex, BSPContext<V, E, M> context);
}