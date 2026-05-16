package com.community.platform.repository;

import com.community.platform.entity.TaskSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskSubmissionRepository extends JpaRepository<TaskSubmission, Long> {
    List<TaskSubmission> findByTaskId(Long taskId);
    Optional<TaskSubmission> findByTaskIdAndSubmitterId(Long taskId, Long submitterId);
}
