package com.graphdb.controller;

import com.graphdb.dto.ApiResponse;
import com.graphdb.model.Edge;
import com.graphdb.stream.GraphStreamProcessor;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stream")
public class StreamController {

    @Autowired
    private GraphStreamProcessor streamProcessor;

    @PostMapping("/edges")
    public ApiResponse<Long> processEdge(@RequestBody EdgeDTO edgeDTO) {
        Edge edge = new Edge();
        edge.setFromVertexId(edgeDTO.getFromVertexId());
        edge.setToVertexId(edgeDTO.getToVertexId());
        edge.setLabel(edgeDTO.getLabel() != null ? edgeDTO.getLabel() : "LINK");
        edge.setWeight(edgeDTO.getWeight() != null ? edgeDTO.getWeight() : 1.0);

        streamProcessor.processEdge(edge);
        return ApiResponse.success("Edge processed successfully", streamProcessor.getEdgesProcessed());
    }

    @PostMapping("/edges/batch")
    public ApiResponse<Long> processEdges(@RequestBody List<EdgeDTO> edgeDTOs) {
        for (EdgeDTO edgeDTO : edgeDTOs) {
            Edge edge = new Edge();
            edge.setFromVertexId(edgeDTO.getFromVertexId());
            edge.setToVertexId(edgeDTO.getToVertexId());
            edge.setLabel(edgeDTO.getLabel() != null ? edgeDTO.getLabel() : "LINK");
            edge.setWeight(edgeDTO.getWeight() != null ? edgeDTO.getWeight() : 1.0);
            streamProcessor.processEdge(edge);
        }
        return ApiResponse.success("Batch processed successfully", streamProcessor.getEdgesProcessed());
    }

    @PostMapping("/update")
    public ApiResponse<GraphStreamProcessor.StreamProcessingResult> performUpdate() {
        GraphStreamProcessor.StreamProcessingResult result = streamProcessor.performUpdate();
        return ApiResponse.success("Update completed successfully", result);
    }

    @GetMapping("/pagerank")
    public ApiResponse<Map<Long, Double>> getCurrentPageRanks() {
        return ApiResponse.success(streamProcessor.getCurrentPageRanks());
    }

    @GetMapping("/pagerank/{vertexId}")
    public ApiResponse<Double> getVertexPageRank(@PathVariable Long vertexId) {
        double rank = streamProcessor.getVertexPageRank(vertexId);
        return ApiResponse.success(rank);
    }

    @GetMapping("/communities")
    public ApiResponse<Map<Long, Long>> getCurrentCommunities() {
        return ApiResponse.success(streamProcessor.getCurrentCommunities());
    }

    @GetMapping("/communities/{vertexId}")
    public ApiResponse<Long> getVertexCommunity(@PathVariable Long vertexId) {
        long community = streamProcessor.getVertexCommunity(vertexId);
        return ApiResponse.success(community);
    }

    @GetMapping("/statistics")
    public ApiResponse<GraphStreamProcessor.StreamStatistics> getStatistics() {
        return ApiResponse.success(streamProcessor.getStatistics());
    }

    @PostMapping("/initialize")
    public ApiResponse<String> initialize() {
        streamProcessor.initializeFromGraph();
        return ApiResponse.success("Stream processor initialized from graph", "OK");
    }

    @PostMapping("/reset")
    public ApiResponse<String> reset() {
        streamProcessor.reset();
        return ApiResponse.success("Stream processor reset successfully", "OK");
    }

    @PostMapping("/config")
    public ApiResponse<String> updateConfig(@RequestBody StreamConfig config) {
        if (config.getWindowSizeMs() != null) {
            streamProcessor.setWindowSizeMs(config.getWindowSizeMs());
        }
        if (config.getSlideIntervalMs() != null) {
            streamProcessor.setSlideIntervalMs(config.getSlideIntervalMs());
        }
        if (config.getAutoUpdateEnabled() != null) {
            streamProcessor.setAutoUpdateEnabled(config.getAutoUpdateEnabled());
        }
        return ApiResponse.success("Configuration updated successfully", "OK");
    }

    @GetMapping("/config")
    public ApiResponse<StreamConfig> getConfig() {
        StreamConfig config = new StreamConfig();
        config.setAutoUpdateEnabled(streamProcessor.isAutoUpdateEnabled());
        return ApiResponse.success(config);
    }

    @Data
    public static class EdgeDTO {
        private Long fromVertexId;
        private Long toVertexId;
        private String label;
        private Double weight;
    }

    @Data
    public static class StreamConfig {
        private Long windowSizeMs;
        private Long slideIntervalMs;
        private Boolean autoUpdateEnabled;
    }
}