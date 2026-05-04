package com.medical.knowledgegraph.controller;

import com.medical.knowledgegraph.dto.GraphResult;
import com.medical.knowledgegraph.entity.Disease;
import com.medical.knowledgegraph.service.DiseaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/diseases")
@CrossOrigin(origins = "*")
public class DiseaseController {

    private final DiseaseService diseaseService;

    @Autowired
    public DiseaseController(DiseaseService diseaseService) {
        this.diseaseService = diseaseService;
    }

    @GetMapping
    public ResponseEntity<List<Disease>> getAllDiseases() {
        return ResponseEntity.ok(diseaseService.getAllDiseases());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Disease> getDiseaseById(@PathVariable Long id) {
        return diseaseService.getDiseaseById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/name/{name}")
    public ResponseEntity<Disease> getDiseaseByName(@PathVariable String name) {
        return diseaseService.getDiseaseByName(name)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/by-symptoms")
    public ResponseEntity<GraphResult> findDiseasesBySymptoms(@RequestBody Map<String, List<String>> request) {
        List<String> symptoms = request.get("symptoms");
        if (symptoms == null || symptoms.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        GraphResult result = diseaseService.findDiseasesBySymptoms(symptoms);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/details/{diseaseName}")
    public ResponseEntity<GraphResult> getDiseaseDetails(@PathVariable String diseaseName) {
        GraphResult result = diseaseService.getDiseaseDetails(diseaseName);
        if (result.getNodes().isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<Disease> createDisease(@RequestBody Disease disease) {
        Disease saved = diseaseService.saveDisease(disease);
        return ResponseEntity.ok(saved);
    }
}