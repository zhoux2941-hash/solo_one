package com.medical.knowledgegraph.repository;

import com.medical.knowledgegraph.entity.Symptom;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SymptomRepository extends Neo4jRepository<Symptom, Long> {

    Optional<Symptom> findByName(String name);

    List<Symptom> findByNameContainingIgnoreCase(String name);

    @Query("MATCH (s:Symptom)-[:INDICATES]->(d:Disease) WHERE d.name = $diseaseName RETURN s")
    List<Symptom> findByDiseaseName(@Param("diseaseName") String diseaseName);

    @Query("MATCH (s:Symptom) WHERE s.name IN $symptoms " +
           "OPTIONAL MATCH (s)-[:INDICATES]->(d:Disease) " +
           "RETURN s, COLLECT(DISTINCT d) as diseases")
    List<Symptom> findSymptomsWithDiseases(@Param("symptoms") List<String> symptoms);
}