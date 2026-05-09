package com.park.benchstats.repository;

import com.park.benchstats.entity.BenchDailyStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BenchDailyStatsRepository extends JpaRepository<BenchDailyStats, Long> {
    List<BenchDailyStats> findByStatDate(LocalDate statDate);
    Optional<BenchDailyStats> findByBenchIdAndStatDate(Long benchId, LocalDate statDate);
    List<BenchDailyStats> findByBenchIdAndStatDateBetween(Long benchId, LocalDate startDate, LocalDate endDate);
}
