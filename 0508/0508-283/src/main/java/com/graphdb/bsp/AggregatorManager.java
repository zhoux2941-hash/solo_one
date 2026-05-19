package com.graphdb.bsp;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.DoubleAdder;

public class AggregatorManager {

    private final Map<String, DoubleAdder> sumAggregators;
    private final Map<String, AtomicLong> countAggregators;
    private final Map<String, double[]> minMaxAggregators;

    public AggregatorManager() {
        this.sumAggregators = new ConcurrentHashMap<>();
        this.countAggregators = new ConcurrentHashMap<>();
        this.minMaxAggregators = new ConcurrentHashMap<>();
    }

    public void aggregate(String name, double value) {
        if (name.startsWith("sum_")) {
            sumAggregators.computeIfAbsent(name, k -> new DoubleAdder()).add(value);
        } else if (name.startsWith("count_")) {
            countAggregators.computeIfAbsent(name, k -> new AtomicLong()).incrementAndGet();
        } else if (name.startsWith("min_")) {
            minMaxAggregators.compute(name, (k, v) -> {
                if (v == null) {
                    return new double[]{value, Double.NEGATIVE_INFINITY};
                }
                v[0] = Math.min(v[0], value);
                return v;
            });
        } else if (name.startsWith("max_")) {
            minMaxAggregators.compute(name, (k, v) -> {
                if (v == null) {
                    return new double[]{Double.POSITIVE_INFINITY, value};
                }
                v[1] = Math.max(v[1], value);
                return v;
            });
        }
    }

    public double getAggregatedValue(String name) {
        if (name.startsWith("sum_")) {
            DoubleAdder adder = sumAggregators.get(name);
            return adder != null ? adder.sum() : 0.0;
        } else if (name.startsWith("count_")) {
            AtomicLong counter = countAggregators.get(name);
            return counter != null ? counter.get() : 0.0;
        } else if (name.startsWith("min_")) {
            double[] minMax = minMaxAggregators.get(name);
            return minMax != null ? minMax[0] : Double.POSITIVE_INFINITY;
        } else if (name.startsWith("max_")) {
            double[] minMax = minMaxAggregators.get(name);
            return minMax != null ? minMax[1] : Double.NEGATIVE_INFINITY;
        }
        return 0.0;
    }

    public void nextSuperstep() {
        sumAggregators.clear();
        countAggregators.clear();
        minMaxAggregators.clear();
    }
}