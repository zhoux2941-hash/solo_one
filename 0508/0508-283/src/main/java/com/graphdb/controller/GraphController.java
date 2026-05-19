package com.graphdb.controller;

import com.graphdb.dto.*;
import com.graphdb.model.Edge;
import com.graphdb.model.Vertex;
import com.graphdb.storage.GraphStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/graph")
public class GraphController {

    @Autowired
    private GraphStore graphStore;

    @PostMapping("/vertices")
    public ApiResponse<Long> addVertex(@RequestBody VertexDTO vertexDTO) {
        Vertex vertex = new Vertex();
        if (vertexDTO.getId() != null) {
            vertex.setId(vertexDTO.getId());
        }
        vertex.setLabel(vertexDTO.getLabel());
        if (vertexDTO.getProperties() != null) {
            vertex.setProperties(vertexDTO.getProperties());
        }
        graphStore.addVertex(vertex);
        return ApiResponse.success("Vertex added successfully", vertex.getId());
    }

    @GetMapping("/vertices/{id}")
    public ApiResponse<VertexDTO> getVertex(@PathVariable Long id) {
        Vertex vertex = graphStore.getVertex(id);
        if (vertex == null) {
            return ApiResponse.error("Vertex not found");
        }
        VertexDTO dto = new VertexDTO();
        dto.setId(vertex.getId());
        dto.setLabel(vertex.getLabel());
        dto.setProperties(vertex.getProperties());
        return ApiResponse.success(dto);
    }

    @DeleteMapping("/vertices/{id}")
    public ApiResponse<Void> removeVertex(@PathVariable Long id) {
        graphStore.removeVertex(id);
        return ApiResponse.success("Vertex removed successfully", null);
    }

    @PostMapping("/edges")
    public ApiResponse<Long> addEdge(@RequestBody EdgeDTO edgeDTO) {
        Edge edge = new Edge();
        if (edgeDTO.getId() != null) {
            edge.setId(edgeDTO.getId());
        }
        edge.setFromVertexId(edgeDTO.getFromVertexId());
        edge.setToVertexId(edgeDTO.getToVertexId());
        edge.setLabel(edgeDTO.getLabel());
        edge.setWeight(edgeDTO.getWeight() != null ? edgeDTO.getWeight() : 1.0);
        if (edgeDTO.getProperties() != null) {
            edge.setProperties(edgeDTO.getProperties());
        }
        graphStore.addEdge(edge);
        return ApiResponse.success("Edge added successfully", edge.getId());
    }

    @GetMapping("/edges/{id}")
    public ApiResponse<EdgeDTO> getEdge(@PathVariable Long id) {
        Edge edge = graphStore.getEdge(id);
        if (edge == null) {
            return ApiResponse.error("Edge not found");
        }
        EdgeDTO dto = new EdgeDTO();
        dto.setId(edge.getId());
        dto.setFromVertexId(edge.getFromVertexId());
        dto.setToVertexId(edge.getToVertexId());
        dto.setLabel(edge.getLabel());
        dto.setWeight(edge.getWeight());
        dto.setProperties(edge.getProperties());
        return ApiResponse.success(dto);
    }

    @DeleteMapping("/edges/{id}")
    public ApiResponse<Void> removeEdge(@PathVariable Long id) {
        graphStore.removeEdge(id);
        return ApiResponse.success("Edge removed successfully", null);
    }

    @GetMapping("/vertices/{id}/out-edges")
    public ApiResponse<java.util.List<EdgeDTO>> getOutEdges(@PathVariable Long id) {
        java.util.List<Edge> edges = graphStore.getOutEdges(id);
        java.util.List<EdgeDTO> dtos = new java.util.ArrayList<>();
        for (Edge edge : edges) {
            EdgeDTO dto = new EdgeDTO();
            dto.setId(edge.getId());
            dto.setFromVertexId(edge.getFromVertexId());
            dto.setToVertexId(edge.getToVertexId());
            dto.setLabel(edge.getLabel());
            dto.setWeight(edge.getWeight());
            dto.setProperties(edge.getProperties());
            dtos.add(dto);
        }
        return ApiResponse.success(dtos);
    }

    @GetMapping("/vertices/{id}/in-edges")
    public ApiResponse<java.util.List<EdgeDTO>> getInEdges(@PathVariable Long id) {
        java.util.List<Edge> edges = graphStore.getInEdges(id);
        java.util.List<EdgeDTO> dtos = new java.util.ArrayList<>();
        for (Edge edge : edges) {
            EdgeDTO dto = new EdgeDTO();
            dto.setId(edge.getId());
            dto.setFromVertexId(edge.getFromVertexId());
            dto.setToVertexId(edge.getToVertexId());
            dto.setLabel(edge.getLabel());
            dto.setWeight(edge.getWeight());
            dto.setProperties(edge.getProperties());
            dtos.add(dto);
        }
        return ApiResponse.success(dtos);
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Long>> getStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("vertexCount", graphStore.getVertexCount());
        stats.put("edgeCount", graphStore.getEdgeCount());
        return ApiResponse.success(stats);
    }
}