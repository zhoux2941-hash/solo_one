package com.exoplanet.repository;

import com.exoplanet.entity.StarTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StarTemplateRepository extends JpaRepository<StarTemplate, Long> {

    Optional<StarTemplate> findByName(String name);
}