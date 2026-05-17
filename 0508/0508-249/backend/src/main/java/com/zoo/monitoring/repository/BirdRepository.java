package com.zoo.monitoring.repository;

import com.zoo.monitoring.entity.Bird;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BirdRepository extends JpaRepository<Bird, Long> {
    Optional<Bird> findByBirdNo(String birdNo);

    List<Bird> findBySpecies(String species);

    List<Bird> findByCageNo(String cageNo);

    List<Bird> findByIsQuarantinedTrue();

    @Query("SELECT DISTINCT b.species FROM Bird b")
    List<String> findAllDistinctSpecies();

    @Query("SELECT COUNT(b) FROM Bird b WHERE b.species = ?1")
    Long countBySpecies(String species);

    @Query("SELECT COUNT(b) FROM Bird b WHERE b.species = ?1 AND b.vaccineDate IS NOT NULL")
    Long countVaccinatedBySpecies(String species);
}
