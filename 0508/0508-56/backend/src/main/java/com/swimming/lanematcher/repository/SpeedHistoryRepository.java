package com.swimming.lanematcher.repository;

import com.swimming.lanematcher.entity.SpeedHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpeedHistoryRepository extends JpaRepository<SpeedHistory, Long> {
    List<SpeedHistory> findByUserIdOrderByCreatedAtDesc(String userId);
    List<SpeedHistory> findTop10ByOrderByCreatedAtDesc();
}