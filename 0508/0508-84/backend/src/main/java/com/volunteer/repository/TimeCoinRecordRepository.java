package com.volunteer.repository;

import com.volunteer.entity.TimeCoinRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TimeCoinRecordRepository extends JpaRepository<TimeCoinRecord, Long> {
    List<TimeCoinRecord> findByUserIdOrderByCreateTimeDesc(Long userId);
}
