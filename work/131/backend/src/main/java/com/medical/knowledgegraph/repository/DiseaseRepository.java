package com.medical.knowledgegraph.repository;

import com.medical.knowledgegraph.entity.Disease;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DiseaseRepository extends Neo4jRepository<Disease, Long> {

    Optional<Disease> findByName(String name);

    @Query("MATCH (d:Disease)-[:HAS_SYMPTOM]->(s:Symptom) WHERE s.name CONTAINS $symptomName RETURN d, COLLECT(s) as symptoms")
    List<Disease> findBySymptomNameContaining(@Param("symptomName") String symptomName);

    @Query("MATCH (s:Symptom) WHERE s.name IN $symptoms " +
           "MATCH (s)-[:INDICATES]->(d:Disease) " +
           "WITH d, COUNT(DISTINCT s) as matchCount, COLLECT(DISTINCT s.name) as matchedSymptoms " +
           "ORDER BY matchCount DESC " +
           "RETURN d, matchCount, matchedSymptoms")
    List<DiseaseMatchResult> findDiseasesBySymptoms(@Param("symptoms") List<String> symptoms);

    @Query("MATCH (d:Disease) WHERE d.name = $diseaseName " +
           "MATCH (d)-[:HAS_SYMPTOM]->(s:Symptom) " +
           "MATCH (d)-[:TREATED_BY]->(dr:Drug) " +
           "RETURN d, COLLECT(DISTINCT s) as symptoms, COLLECT(DISTINCT dr) as drugs")
    Optional<Disease> findDiseaseWithDetails(@Param("diseaseName") String diseaseName);

    interface DiseaseMatchResult {
        Disease getDisease();
        Integer getMatchCount();
        List<String> getMatchedSymptoms();
    }
}