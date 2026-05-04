package com.medical.knowledgegraph.service;

import com.medical.knowledgegraph.dto.EdgeData;
import com.medical.knowledgegraph.dto.GraphResult;
import com.medical.knowledgegraph.dto.NodeData;
import com.medical.knowledgegraph.entity.Disease;
import com.medical.knowledgegraph.entity.Drug;
import com.medical.knowledgegraph.repository.DrugRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class DrugService {

    private final DrugRepository drugRepository;

    @Autowired
    public DrugService(DrugRepository drugRepository) {
        this.drugRepository = drugRepository;
    }

    public GraphResult searchDrugs(String drugName) {
        List<Drug> drugs = drugRepository.searchDrugsWithDetails(drugName);
        GraphResult graphResult = new GraphResult();
        
        Set<String> addedNodeIds = new HashSet<>();
        Set<String> addedEdgeIds = new HashSet<>();
        
        for (Drug drug : drugs) {
            String drugId = "drug_" + drug.getId();
            
            if (!addedNodeIds.contains(drugId)) {
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
                addedNodeIds.add(drugId);
            }
            
            for (Disease disease : drug.getDiseases()) {
                String diseaseId = "disease_" + disease.getId();
                
                if (!addedNodeIds.contains(diseaseId)) {
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
                    addedNodeIds.add(diseaseId);
                }
                
                String edgeId = drugId + "_treats_" + diseaseId;
                if (!addedEdgeIds.contains(edgeId)) {
                    EdgeData edge = new EdgeData(
                        edgeId,
                        drugId,
                        diseaseId,
                        "治疗",
                        "TREATS"
                    );
                    graphResult.addEdge(edge);
                    addedEdgeIds.add(edgeId);
                }
            }
        }
        
        return graphResult;
    }

    public GraphResult getDrugSideEffects(String drugName) {
        Optional<Drug> drugOpt = drugRepository.findDrugWithDetails(drugName);
        GraphResult graphResult = new GraphResult();
        
        if (drugOpt.isEmpty()) {
            return graphResult;
        }
        
        Drug drug = drugOpt.get();
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
        
        Set<String> sideEffects = drug.getSideEffects();
        if (sideEffects != null && !sideEffects.isEmpty()) {
            for (String sideEffect : sideEffects) {
                String sideEffectId = "side_effect_" + sideEffect.hashCode();
                
                Map<String, Object> sideEffectData = new HashMap<>();
                sideEffectData.put("effectType", "副作用");
                
                NodeData sideEffectNode = new NodeData(
                    sideEffectId,
                    sideEffect,
                    "SideEffect",
                    "药物 " + drug.getName() + " 的副作用",
                    sideEffectData
                );
                graphResult.addNode(sideEffectNode);
                
                String edgeId = drugId + "_has_side_effect_" + sideEffectId;
                EdgeData edge = new EdgeData(
                    edgeId,
                    drugId,
                    sideEffectId,
                    "有副作用",
                    "HAS_SIDE_EFFECT"
                );
                graphResult.addEdge(edge);
            }
        }
        
        for (Disease disease : drug.getDiseases()) {
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
            
            String edgeId = drugId + "_treats_" + diseaseId;
            EdgeData edge = new EdgeData(
                edgeId,
                drugId,
                diseaseId,
                "治疗",
                "TREATS"
            );
            graphResult.addEdge(edge);
        }
        
        return graphResult;
    }

    public GraphResult getDrugDetails(String drugName) {
        return getDrugSideEffects(drugName);
    }

    public List<Drug> getAllDrugs() {
        return drugRepository.findAll();
    }

    public Optional<Drug> getDrugById(Long id) {
        return drugRepository.findById(id);
    }

    public Optional<Drug> getDrugByName(String name) {
        return drugRepository.findByName(name);
    }

    public Drug saveDrug(Drug drug) {
        return drugRepository.save(drug);
    }
}