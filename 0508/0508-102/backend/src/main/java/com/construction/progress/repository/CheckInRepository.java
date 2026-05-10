package com.construction.progress.repository;

import com.construction.progress.entity.CheckIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CheckInRepository extends JpaRepository<CheckIn, Long> {
    List<CheckIn> findByProjectIdOrderByCreateTimeDesc(Long projectId);
    List<CheckIn> findByWorkerIdOrderByCreateTimeDesc(Long workerId);
    List<CheckIn> findByProjectIdAndStageIndexOrderByCreateTimeDesc(Long projectId, Integer stageIndex);
}
