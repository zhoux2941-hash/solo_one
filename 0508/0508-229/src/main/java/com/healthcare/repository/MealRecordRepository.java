package com.healthcare.repository;

import com.healthcare.entity.MealRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MealRecordRepository extends JpaRepository<MealRecord, Long>, JpaSpecificationExecutor<MealRecord> {
    boolean existsByRecordNo(String recordNo);
    boolean existsByRecordNoAndIdNot(String recordNo, Long id);
    List<MealRecord> findByElderIdOrderByMealDateDesc(Long elderId);
    List<MealRecord> findByMealDateBetween(LocalDate startDate, LocalDate endDate);
}
