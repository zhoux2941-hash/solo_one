package com.petclean.repository;

import com.petclean.entity.RescueRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RescueRecordRepository extends JpaRepository<RescueRecord, Long> {

    List<RescueRecord> findByRescuePointIdOrderByCreatedAtDesc(Long rescuePointId);

    List<RescueRecord> findByUserIdOrderByCreatedAtDesc(Long userId);

    Long countByActionType(String actionType);
}
