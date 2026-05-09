package com.farm.silo.repository;

import com.farm.silo.model.AlarmHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlarmHistoryRepository extends JpaRepository<AlarmHistory, Long> {

    List<AlarmHistory> findBySiloNameOrderByAlarmTimeDesc(String siloName);

    Page<AlarmHistory> findBySiloNameOrderByAlarmTimeDesc(String siloName, Pageable pageable);

    Page<AlarmHistory> findAllByOrderByAlarmTimeDesc(Pageable pageable);

    List<AlarmHistory> findByAlarmTimeBetweenOrderByAlarmTimeDesc(LocalDateTime start, LocalDateTime end);

    @Query("SELECT a FROM AlarmHistory a WHERE " +
           "(:siloName IS NULL OR a.siloName = :siloName) " +
           "ORDER BY a.alarmTime DESC")
    Page<AlarmHistory> findBySiloNameOptional(@Param("siloName") String siloName, Pageable pageable);

    @Query("SELECT DISTINCT a.siloName FROM AlarmHistory a ORDER BY a.siloName")
    List<String> findDistinctSiloNames();

    @Query("SELECT COUNT(a) FROM AlarmHistory a WHERE a.siloName = :siloName AND a.acknowledged = false")
    Long countUnacknowledgedBySiloName(@Param("siloName") String siloName);

    @Query("SELECT a FROM AlarmHistory a WHERE a.acknowledged = false ORDER BY a.alarmTime DESC")
    List<AlarmHistory> findUnacknowledgedAlarms();
}
