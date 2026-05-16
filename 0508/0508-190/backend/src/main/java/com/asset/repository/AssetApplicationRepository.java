package com.asset.repository;

import com.asset.model.ApplicationStatus;
import com.asset.model.AssetApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetApplicationRepository extends JpaRepository<AssetApplication, Long> {

    List<AssetApplication> findByStatus(ApplicationStatus status);

    Page<AssetApplication> findByStatus(ApplicationStatus status, Pageable pageable);

    List<AssetApplication> findByApplicantDepartmentAndStatus(String department, ApplicationStatus status);
}
