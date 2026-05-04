package com.medical.knowledgegraph.controller;

import com.medical.knowledgegraph.dto.GraphResult;
import com.medical.knowledgegraph.entity.Drug;
import com.medical.knowledgegraph.service.DrugService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drugs")
@CrossOrigin(origins = "*")
public class DrugController {

    private final DrugService drugService;

    @Autowired
    public DrugController(DrugService drugService) {
        this.drugService = drugService;
    }

    @GetMapping
    public ResponseEntity<List<Drug>> getAllDrugs() {
        return ResponseEntity.ok(drugService.getAllDrugs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Drug> getDrugById(@PathVariable Long id) {
        return drugService.getDrugById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/name/{name}")
    public ResponseEntity<Drug> getDrugByName(@PathVariable String name) {
        return drugService.getDrugByName(name)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<GraphResult> searchDrugs(@RequestParam String name) {
        GraphResult result = drugService.searchDrugs(name);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/side-effects/{drugName}")
    public ResponseEntity<GraphResult> getDrugSideEffects(@PathVariable String drugName) {
        GraphResult result = drugService.getDrugSideEffects(drugName);
        if (result.getNodes().isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/details/{drugName}")
    public ResponseEntity<GraphResult> getDrugDetails(@PathVariable String drugName) {
        GraphResult result = drugService.getDrugDetails(drugName);
        if (result.getNodes().isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<Drug> createDrug(@RequestBody Drug drug) {
        Drug saved = drugService.saveDrug(drug);
        return ResponseEntity.ok(saved);
    }
}