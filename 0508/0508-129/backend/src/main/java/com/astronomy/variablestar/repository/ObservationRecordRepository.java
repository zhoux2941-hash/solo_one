package com.astronomy.variablestar.repository;

import com.astronomy.variablestar.entity.ObservationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ObservationRecordRepository extends JpaRepository<ObservationRecord, Long> {

    List<ObservationRecord> findByVariableStarIdOrderByObservationTimeAsc(Long variableStarId);

    @Query("SELECT o FROM ObservationRecord o WHERE o.variableStarId = :starId ORDER BY o.phase")
    List<ObservationRecord> findByVariableStarIdForPhasePlot(Long starId);
}
