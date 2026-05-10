package com.guqin.tuner.mapper;

import com.guqin.tuner.entity.HuiPositionDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HuiPositionDetailRepository extends JpaRepository<HuiPositionDetail, Long> {
    List<HuiPositionDetail> findByTuningRecordIdOrderByHuiNumber(Long tuningRecordId);
    List<HuiPositionDetail> findByTuningRecordIdIn(List<Long> tuningRecordIds);
}
