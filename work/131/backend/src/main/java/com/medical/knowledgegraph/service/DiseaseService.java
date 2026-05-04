package com.medical.knowledgegraph.service;

import com.medical.knowledgegraph.dto.EdgeData;
import com.medical.knowledgegraph.dto.GraphResult;
import com.medical.knowledgegraph.dto.NodeData;
import com.medical.knowledgegraph.entity.Disease;
import com.medical.knowledgegraph.entity.Drug;
import com.medical.knowledgegraph.entity.Symptom;
import com.medical.knowledgegraph.repository.DiseaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class DiseaseService {

    private final DiseaseRepository diseaseRepository;

    @Autowired
    public DiseaseService(DiseaseRepository diseaseRepository) {
        this.diseaseRepository = diseaseRepository;
    }

    public GraphResult findDiseasesBySymptoms(List<String> symptoms) {
        List<DiseaseRepository.DiseaseMatchResult> results = diseaseRepository.findDiseasesBySymptoms(symptoms);
        GraphResult graphResult = new GraphResult();
        
        Set<String> addedNodeIds = new HashSet<>();
        Set<String> addedEdgeIds = new HashSet<>();
        
        for (String symptom : symptoms) {
            String symptomId = "symptom_" + symptom.hashCode();
            if (!addedNodeIds.contains(symptomId)) {
                NodeData symptomNode = new NodeData(
                    symptomId,
                    symptom,
                    "Symptom",
                    "症状: " + symptom,
                    null
                );
                graphResult.addNode(symptomNode);
                addedNodeIds.add(symptomId);
            }
        }
        
        for (DiseaseRepository.DiseaseMatchResult result : results) {
            Disease disease = result.getDisease();
            String diseaseId = "disease_" + disease.getId();
            
            if (!addedNodeIds.contains(diseaseId)) {
                Map<String, Object> diseaseData = new HashMap<>();
                diseaseData.put("matchCount", result.getMatchCount());
                diseaseData.put("matchedSymptoms", result.getMatchedSymptoms());
                diseaseData.put("category", disease.getCategory());
                
                NodeData diseaseNode = new NodeData(
                    diseaseId,
                    disease.getName(),
                    "Disease",
                    disease.getDescription(),
                    diseaseData
                );
                graphResult.addNode(diseaseNode);
                addedNodeIds.add(diseaseId);
            }
            
            for (String matchedSymptom : result.getMatchedSymptoms()) {
                String symptomId = "symptom_" + matchedSymptom.hashCode();
                String edgeId = symptomId + "_indicates_" + diseaseId;
                
                if (!addedEdgeIds.contains(edgeId)) {
                    EdgeData edge = new EdgeData(
                        edgeId,
                        symptomId,
                        diseaseId,
                        "暗示",
                        "INDICATES"
                    );
                    graphResult.addEdge(edge);
                    addedEdgeIds.add(edgeId);
                }
            }
        }
        
        return graphResult;
    }

    public GraphResult getDiseaseDetails(String diseaseName) {
        Optional<Disease> diseaseOpt = diseaseRepository.findDiseaseWithDetails(diseaseName);
        GraphResult graphResult = new GraphResult();
        
        if (diseaseOpt.isEmpty()) {
            return graphResult;
        }
        
        Disease disease = diseaseOpt.get();
        String diseaseId = "disease_" + disease.getId();
        
        Map<String, Object> diseaseData = new HashMap<>();
        diseaseData.put("category", disease.getCategory());
        
        NodeData diseaseNode = new NodeData(
            diseaseId,
            disease.getName(),
            "Disease",
            disease.getDescription(),
            diseaseData
        );
        graphResult.addNode(diseaseNode);
        
        for (Symptom symptom : disease.getSymptoms()) {
            String symptomId = "symptom_" + symptom.getId();
            
            NodeData symptomNode = new NodeData(
                symptomId,
                symptom.getName(),
                "Symptom",
                symptom.getDescription(),
                Map.of("severity", symptom.getSeverity())
            );
            graphResult.addNode(symptomNode);
            
            String edgeId = diseaseId + "_has_" + symptomId;
            EdgeData edge = new EdgeData(
                edgeId,
                diseaseId,
                symptomId,
                "有症状",
                "HAS_SYMPTOM"
            );
            graphResult.addEdge(edge);
        }
        
        for (Drug drug : disease.getDrugs()) {
            String drugId = "drug_" + drug.getId();
            
            Map<String, Object> drugData = new HashMap<>();
            drugData.put("category", drug.getCategory());
            drugData.put("sideEffects", drug.getSideEffects());
            
            NodeData drugNode = new NodeData(
                drugId,
                drug.getName(),
                "Drug",
                drug.getDescription(),
                drugData
            );
            graphResult.addNode(drugNode);
            
            String edgeId = diseaseId + "_treated_by_" + drugId;
            EdgeData edge = new EdgeData(
                edgeId,
                diseaseId,
                drugId,
                "可治疗",
                "TREATED_BY"
            );
            graphResult.addEdge(edge);
        }
        
        return graphResult;
    }

    public List<Disease> getAllDiseases() {
        return diseaseRepository.findAll();
    }

    public Optional<Disease> getDiseaseById(Long id) {
        return diseaseRepository.findById(id);
    }

    public Optional<Disease> getDiseaseByName(String name) {
        return diseaseRepository.findByName(name);
    }

    public Disease saveDisease(Disease disease) {
        return diseaseRepository.save(disease);
    }
}