package com.construction.progress.repository;

import com.construction.progress.entity.ProjectStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectStageRepository extends JpaRepository<ProjectStage, Long> {
    List<ProjectStage> findByProjectIdOrderByStageIndex(Long projectId);
    Optional<ProjectStage> findByProjectIdAndStageIndex(Long projectId, Integer stageIndex);
}
