package com.health.repository;

import com.health.entity.HealthPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HealthPackageRepository extends JpaRepository<HealthPackage, Long> {
    List<HealthPackage> findByType(String type);
}
