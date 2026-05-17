package com.campsite.repository;

import com.campsite.entity.Facility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacilityRepository extends JpaRepository<Facility, Long> {

    List<Facility> findByFacilityType(String facilityType);

    List<Facility> findByStatus(String status);

    List<Facility> findByConditionLevel(String conditionLevel);

    Page<Facility> findAll(Pageable pageable);

    Page<Facility> findByFacilityType(String facilityType, Pageable pageable);

    Page<Facility> findByStatus(String status, Pageable pageable);
}
