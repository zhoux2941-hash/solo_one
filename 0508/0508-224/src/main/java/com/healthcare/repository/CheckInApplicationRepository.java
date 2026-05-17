package com.healthcare.repository;

import com.healthcare.entity.CheckInApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CheckInApplicationRepository extends JpaRepository<CheckInApplication, Long>, JpaSpecificationExecutor<CheckInApplication> {
    boolean existsByApplicationNo(String applicationNo);
    boolean existsByApplicationNoAndIdNot(String applicationNo, Long id);
}
