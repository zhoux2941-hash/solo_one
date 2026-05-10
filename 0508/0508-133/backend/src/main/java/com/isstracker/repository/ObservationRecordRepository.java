package com.isstracker.repository;

import com.isstracker.entity.ObservationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ObservationRecordRepository extends JpaRepository<ObservationRecord, Long> {
    
    Long countByPassEventId(String passEventId);
    
    List<ObservationRecord> findByPassEventId(String passEventId);
    
    @Query("SELECT DISTINCT o.passEventId FROM ObservationRecord o")
    List<String> findDistinctPassEventIds();
}
