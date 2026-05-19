package com.graphdb.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "graphdb")
public class GraphDBConfig {

    private StorageConfig storage = new StorageConfig();
    private BSPConfig bsp = new BSPConfig();
    private StreamConfig stream = new StreamConfig();
    private MemoryConfig memory = new MemoryConfig();
    private AlgorithmConfig algorithm = new AlgorithmConfig();

    @Data
    public static class StorageConfig {
        private String path = "./data/rocksdb";
        private boolean enableWal = true;
    }

    @Data
    public static class BSPConfig {
        private int maxSupersteps = 100;
        private long messageTimeout = 300000;
        private long barrierTimeout = 600000;
        private boolean useOptimizedEngine = true;
        private int numPartitions = -1;
        private int messageBatchSize = 1000;
        private boolean enableLocalMessageOptimization = true;
        private boolean enableMessageAggregation = true;
    }

    @Data
    public static class MemoryConfig {
        private int maxHeapPercent = 70;
        private int spillThresholdPercent = 80;
        private String spillPath = "./data/spill";
    }

    @Data
    public static class AlgorithmConfig {
        private PageRankConfig pagerank = new PageRankConfig();
        private LouvainConfig louvain = new LouvainConfig();
        private KCoreConfig kcore = new KCoreConfig();
    }

    @Data
    public static class PageRankConfig {
        private double dampingFactor = 0.85;
        private double convergenceThreshold = 1e-6;
        private int maxIterations = 100;
    }

    @Data
    public static class LouvainConfig {
        private double resolution = 1.0;
        private int maxIterations = 10;
    }

    @Data
    public static class KCoreConfig {
        private int minK = 1;
    }

    @Data
    public static class StreamConfig {
        private long windowSizeMs = 60000;
        private long slideIntervalMs = 10000;
        private long autoUpdateIntervalMs = 5000;
        private boolean autoUpdateEnabled = true;
        private double dampingFactor = 0.85;
        private double convergenceThreshold = 1e-4;
        private int maxIterations = 20;
        private double resolution = 1.0;
        private int maxLocalMoveIterations = 5;
    }
}