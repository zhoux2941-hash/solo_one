package com.community.platform.repository;

import com.community.platform.entity.TaskApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskApplicationRepository extends JpaRepository<TaskApplication, Long> {
    List<TaskApplication> findByTaskId(Long taskId);
    List<TaskApplication> findByApplicantId(Long applicantId);
    List<TaskApplication> findByTaskIdAndStatus(Long taskId, String status);
}
