package com.healthcare.repository;

import com.healthcare.entity.MealPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MealPlanRepository extends JpaRepository<MealPlan, Long>, JpaSpecificationExecutor<MealPlan> {
    boolean existsByPlanNo(String planNo);
    boolean existsByPlanNoAndIdNot(String planNo, Long id);
    List<MealPlan> findByElderIdAndPlanDate(Long elderId, LocalDate planDate);
    List<MealPlan> findByPlanDateBetween(LocalDate startDate, LocalDate endDate);
}
