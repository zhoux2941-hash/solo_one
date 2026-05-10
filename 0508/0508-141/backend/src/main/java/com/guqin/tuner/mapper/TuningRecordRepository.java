package com.guqin.tuner.mapper;

import com.guqin.tuner.entity.TuningRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TuningRecordRepository extends JpaRepository<TuningRecord, Long> {
    List<TuningRecord> findByGuqinIdOrderByRecordTimeDesc(Long guqinId);
}
