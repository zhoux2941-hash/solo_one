package com.balistics.repository;

import com.balistics.entity.BallisticsResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BallisticsResultRepository extends JpaRepository<BallisticsResult, Long> {
    List<BallisticsResult> findByClimateType(String climateType);
}
