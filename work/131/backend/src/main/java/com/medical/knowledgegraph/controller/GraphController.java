package com.medical.knowledgegraph.controller;

import com.medical.knowledgegraph.dto.GraphResult;
import com.medical.knowledgegraph.service.GraphService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/graph")
@CrossOrigin(origins = "*")
public class GraphController {

    private final GraphService graphService;

    @Autowired
    public GraphController(GraphService graphService) {
        this.graphService = graphService;
    }

    @PostMapping("/expand")
    public ResponseEntity<GraphResult> expandNode(@RequestBody Map<String, String> request) {
        String label = request.get("label");
        String name = request.get("name");
        
        if (label == null || name == null) {
            return ResponseEntity.badRequest().build();
        }
        
        GraphResult result = graphService.expandNode(label, name);
        
        if (result.getNodes().isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/expand")
    public ResponseEntity<GraphResult> expandNodeGet(
            @RequestParam String label,
            @RequestParam String name) {
        
        GraphResult result = graphService.expandNode(label, name);
        
        if (result.getNodes().isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(result);
    }

    @PostMapping("/path")
    public ResponseEntity<GraphResult> getPath(@RequestBody Map<String, String> request) {
        String startLabel = request.get("startLabel");
        String startName = request.get("startName");
        String endLabel = request.get("endLabel");
        String endName = request.get("endName");
        
        if (startLabel == null || startName == null || endLabel == null || endName == null) {
            return ResponseEntity.badRequest().build();
        }
        
        GraphResult result = graphService.getPath(startLabel, startName, endLabel, endName);
        
        if (result.getNodes().isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/path")
    public ResponseEntity<GraphResult> getPathGet(
            @RequestParam String startLabel,
            @RequestParam String startName,
            @RequestParam String endLabel,
            @RequestParam String endName) {
        
        GraphResult result = graphService.getPath(startLabel, startName, endLabel, endName);
        
        if (result.getNodes().isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(result);
    }
}