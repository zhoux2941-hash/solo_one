package com.petboarding.repository;

import com.petboarding.entity.PriceAdjustmentRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PriceAdjustmentRuleRepository extends JpaRepository<PriceAdjustmentRule, Long> {
    List<PriceAdjustmentRule> findByIsActiveTrueOrderByPriorityDesc();
    
    List<PriceAdjustmentRule> findByIsActiveTrue();
}
