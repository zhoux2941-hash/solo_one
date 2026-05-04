package com.medical.knowledgegraph.repository;

import com.medical.knowledgegraph.entity.Drug;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DrugRepository extends Neo4jRepository<Drug, Long> {

    Optional<Drug> findByName(String name);

    List<Drug> findByNameContainingIgnoreCase(String name);

    @Query("MATCH (dr:Drug)-[:TREATS]->(d:Disease) WHERE d.name = $diseaseName RETURN dr")
    List<Drug> findByDiseaseName(@Param("diseaseName") String diseaseName);

    @Query("MATCH (dr:Drug) WHERE dr.name = $drugName " +
           "OPTIONAL MATCH (dr)-[:TREATS]->(d:Disease) " +
           "RETURN dr, COLLECT(DISTINCT d) as diseases")
    Optional<Drug> findDrugWithDetails(@Param("drugName") String drugName);

    @Query("MATCH (dr:Drug) WHERE dr.name CONTAINS $drugName " +
           "OPTIONAL MATCH (dr)-[:TREATS]->(d:Disease) " +
           "RETURN dr, COLLECT(DISTINCT d) as diseases")
    List<Drug> searchDrugsWithDetails(@Param("drugName") String drugName);
}