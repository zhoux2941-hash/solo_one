package com.water.repository;

import com.water.entity.WaterDistrict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WaterDistrictRepository extends JpaRepository<WaterDistrict, Long> {
    Page<WaterDistrict> findByStationId(Long stationId, Pageable pageable);
    Page<WaterDistrict> findByActive(Boolean active, Pageable pageable);
    Page<WaterDistrict> findByStationIdAndActive(Long stationId, Boolean active, Pageable pageable);
}
