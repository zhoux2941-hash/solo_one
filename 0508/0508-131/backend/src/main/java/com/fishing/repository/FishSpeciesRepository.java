package com.fishing.repository;

import com.fishing.entity.FishSpecies;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FishSpeciesRepository extends JpaRepository<FishSpecies, Long> {
    Optional<FishSpecies> findByName(String name);
}
