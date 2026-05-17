package com.factory.repository;

import com.factory.entity.ProductionSchedule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductionScheduleRepository extends JpaRepository<ProductionSchedule, Long> {
    Optional<ProductionSchedule> findByScheduleCode(String scheduleCode);
    boolean existsByScheduleCode(String scheduleCode);
    List<ProductionSchedule> findByOrderId(Long orderId);
    Page<ProductionSchedule> findByPlanDateBetween(LocalDate startDate, LocalDate endDate, Pageable pageable);
    Page<ProductionSchedule> findByTeamId(Long teamId, Pageable pageable);
    Page<ProductionSchedule> findByStatus(String status, Pageable pageable);
    void deleteByOrderId(Long orderId);
}