package com.graphdb.controller;

import com.graphdb.algorithm.*;
import com.graphdb.dto.AlgorithmRequest;
import com.graphdb.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/algorithms")
public class AlgorithmController {

    @Autowired
    private PageRank pageRank;

    @Autowired
    private IncrementalPageRank incrementalPageRank;

    @Autowired
    private LouvainCommunity louvainCommunity;

    @Autowired
    private BFSShortestPath bfsShortestPath;

    @Autowired
    private KCoreDecomposition kCoreDecomposition;

    @PostMapping("/pagerank")
    public ApiResponse<Map<Long, Double>> computePageRank(@RequestBody(required = false) AlgorithmRequest request) {
        Map<Long, Double> result;
        if (request != null) {
            result = pageRank.compute(
                    request.getDampingFactor() != null ? request.getDampingFactor() : 0.85,
                    request.getConvergenceThreshold() != null ? request.getConvergenceThreshold() : 1e-6,
                    request.getMaxIterations() != null ? request.getMaxIterations() : 100
            );
        } else {
            result = pageRank.compute();
        }
        return ApiResponse.success("PageRank computation completed", result);
    }

    @PostMapping("/pagerank/store")
    public ApiResponse<Map<Long, Double>> computeAndStorePageRank() {
        Map<Long, Double> result = pageRank.computeAndStore();
        return ApiResponse.success("PageRank computed and stored successfully", result);
    }

    @PostMapping("/pagerank/incremental")
    public ApiResponse<Map<Long, Double>> computeIncrementalPageRank(@RequestBody(required = false) AlgorithmRequest request) {
        Map<Long, Double> result;
        if (request != null) {
            result = incrementalPageRank.update(
                    request.getDampingFactor() != null ? request.getDampingFactor() : 0.85,
                    request.getConvergenceThreshold() != null ? request.getConvergenceThreshold() : 1e-6,
                    request.getMaxIterations() != null ? request.getMaxIterations() : 100
            );
        } else {
            result = incrementalPageRank.update();
        }
        return ApiResponse.success("Incremental PageRank computation completed", result);
    }

    @GetMapping("/pagerank/{vertexId}")
    public ApiResponse<Double> getVertexPageRank(@PathVariable Long vertexId) {
        double pageRank = incrementalPageRank.getVertexPageRank(vertexId);
        return ApiResponse.success(pageRank);
    }

    @PostMapping("/communities")
    public ApiResponse<Map<String, Object>> detectCommunities(@RequestBody(required = false) AlgorithmRequest request) {
        LouvainCommunity.CommunityResult result;
        if (request != null) {
            result = louvainCommunity.compute(
                    request.getResolution() != null ? request.getResolution() : 1.0,
                    request.getMaxIterations() != null ? request.getMaxIterations() : 10
            );
        } else {
            result = louvainCommunity.compute();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("vertexToCommunity", result.getVertexToCommunity());
        response.put("numCommunities", result.getNumCommunities());
        response.put("modularity", result.getModularity());

        return ApiResponse.success("Community detection completed", response);
    }

    @PostMapping("/communities/store")
    public ApiResponse<Map<String, Object>> detectAndStoreCommunities() {
        LouvainCommunity.CommunityResult result = louvainCommunity.computeAndStore();

        Map<String, Object> response = new HashMap<>();
        response.put("vertexToCommunity", result.getVertexToCommunity());
        response.put("numCommunities", result.getNumCommunities());
        response.put("modularity", result.getModularity());

        return ApiResponse.success("Communities detected and stored successfully", response);
    }

    @PostMapping("/shortest-path")
    public ApiResponse<Map<Long, Integer>> computeShortestPath(@RequestBody AlgorithmRequest request) {
        if (request.getSourceVertexId() == null) {
            return ApiResponse.error("Source vertex ID is required");
        }
        Map<Long, Integer> result = bfsShortestPath.compute(request.getSourceVertexId());
        return ApiResponse.success("Shortest path computation completed", result);
    }

    @PostMapping("/shortest-path/weighted")
    public ApiResponse<Map<Long, Integer>> computeWeightedShortestPath(@RequestBody AlgorithmRequest request) {
        if (request.getSourceVertexId() == null) {
            return ApiResponse.error("Source vertex ID is required");
        }
        Map<Long, Integer> result = bfsShortestPath.weightedCompute(request.getSourceVertexId());
        return ApiResponse.success("Weighted shortest path computation completed", result);
    }

    @PostMapping("/kcore")
    public ApiResponse<Map<Long, Integer>> computeKCore(@RequestBody(required = false) AlgorithmRequest request) {
        Map<Long, Integer> result;
        if (request != null && request.getK() != null) {
            result = kCoreDecomposition.getKCore(request.getK());
        } else {
            result = kCoreDecomposition.compute();
        }
        return ApiResponse.success("K-core decomposition completed", result);
    }

    @PostMapping("/kcore/store")
    public ApiResponse<Map<Long, Integer>> computeAndStoreKCore() {
        Map<Long, Integer> result = kCoreDecomposition.computeAndStore();
        return ApiResponse.success("K-core decomposition computed and stored successfully", result);
    }

    @GetMapping("/kcore/max")
    public ApiResponse<Integer> getMaxCoreNumber() {
        int maxCore = kCoreDecomposition.getMaxCoreNumber();
        return ApiResponse.success(maxCore);
    }

    @GetMapping("/kcore/distribution")
    public ApiResponse<Map<Integer, Integer>> getCoreDistribution() {
        Map<Integer, Integer> distribution = kCoreDecomposition.getCoreDistribution();
        return ApiResponse.success(distribution);
    }
}