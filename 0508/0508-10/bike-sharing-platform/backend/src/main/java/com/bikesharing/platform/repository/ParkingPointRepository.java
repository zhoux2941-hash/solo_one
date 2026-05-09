package com.bikesharing.platform.repository;

import com.bikesharing.platform.entity.ParkingPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParkingPointRepository extends JpaRepository<ParkingPoint, Long> {
    
    @Query("SELECT p FROM ParkingPoint p ORDER BY p.pointId")
    List<ParkingPoint> findAllOrdered();
}
