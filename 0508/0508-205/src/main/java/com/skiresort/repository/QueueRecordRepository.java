package com.skiresort.repository;

import com.skiresort.model.QueueRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface QueueRecordRepository extends JpaRepository<QueueRecord, Long> {
    List<QueueRecord> findByLiftIdOrderByRecordTimeDesc(Long liftId);
    
    @Query("SELECT q FROM QueueRecord q WHERE q.recordTime BETWEEN :start AND :end ORDER BY q.recordTime")
    List<QueueRecord> findByRecordTimeBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT q FROM QueueRecord q WHERE q.lift.id = :liftId AND q.recordTime BETWEEN :start AND :end ORDER BY q.recordTime")
    List<QueueRecord> findByLiftIdAndRecordTimeBetween(@Param("liftId") Long liftId, 
                                                        @Param("start") LocalDateTime start, 
                                                        @Param("end") LocalDateTime end);
}
