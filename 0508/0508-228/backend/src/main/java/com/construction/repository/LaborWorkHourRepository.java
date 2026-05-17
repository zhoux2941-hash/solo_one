package com.construction.repository;

import com.construction.entity.LaborWorkHour;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface LaborWorkHourRepository extends JpaRepository<LaborWorkHour, Long>, JpaSpecificationExecutor<LaborWorkHour> {

    Optional<LaborWorkHour> findByWorkerIdAndStatisticsDateAndStatisticsType(Long workerId, LocalDate statisticsDate, String statisticsType);

    List<LaborWorkHour> findByWorkerIdAndStatisticsDateBetween(Long workerId, LocalDate startDate, LocalDate endDate);

    List<LaborWorkHour> findByProjectIdAndStatisticsDateBetween(Long projectId, LocalDate startDate, LocalDate endDate);
}
