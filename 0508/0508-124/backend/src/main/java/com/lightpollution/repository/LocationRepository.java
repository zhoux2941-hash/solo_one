package com.lightpollution.repository;

import com.lightpollution.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {
    
    Optional<Location> findByCoordHash(String coordHash);
    
    Optional<Location> findByUserIdAndCoordHash(Long userId, String coordHash);
    
    @Query("SELECT l FROM Location l WHERE l.latitude BETWEEN :minLat AND :maxLat AND l.longitude BETWEEN :minLng AND :maxLng")
    List<Location> findByBoundingBox(
        @Param("minLat") BigDecimal minLat,
        @Param("maxLat") BigDecimal maxLat,
        @Param("minLng") BigDecimal minLng,
        @Param("maxLng") BigDecimal maxLng
    );
    
    List<Location> findByUserId(Long userId);
}
