package com.campsite.repository;

import com.campsite.entity.CampArea;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CampAreaRepository extends JpaRepository<CampArea, Long> {

    List<CampArea> findByAreaType(String areaType);

    List<CampArea> findByStatus(String status);

    List<CampArea> findByAreaTypeAndStatus(String areaType, String status);

    Page<CampArea> findAll(Pageable pageable);

    Page<CampArea> findByAreaType(String areaType, Pageable pageable);

    Page<CampArea> findByStatus(String status, Pageable pageable);
}
