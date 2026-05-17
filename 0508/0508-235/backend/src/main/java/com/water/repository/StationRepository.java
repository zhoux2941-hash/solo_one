package com.water.repository;

import com.water.entity.Station;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StationRepository extends JpaRepository<Station, Long> {
    Page<Station> findByRegion(String region, Pageable pageable);
    Page<Station> findByActive(Boolean active, Pageable pageable);
    Page<Station> findByRegionAndActive(String region, Boolean active, Pageable pageable);
}
