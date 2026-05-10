package com.exoplanet.repository;

import com.exoplanet.entity.FitResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FitResultRepository extends JpaRepository<FitResult, Long> {

    Optional<FitResult> findByShareToken(String shareToken);

    boolean existsByShareToken(String shareToken);
}