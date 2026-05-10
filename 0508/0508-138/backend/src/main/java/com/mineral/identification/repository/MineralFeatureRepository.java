package com.mineral.identification.repository;

import com.mineral.identification.entity.MineralFeature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface MineralFeatureRepository extends JpaRepository<MineralFeature, Long> {
    
    List<MineralFeature> findByMineralId(Long mineralId);
    
    List<MineralFeature> findByFeatureTypeAndFeatureValue(String featureType, String featureValue);
    
    @Modifying
    @Query("UPDATE MineralFeature mf SET mf.weight = mf.weight + :delta " +
           "WHERE mf.mineral.id = :mineralId " +
           "AND mf.featureType = :featureType " +
           "AND mf.featureValue = :featureValue")
    int updateFeatureWeight(@Param("mineralId") Long mineralId,
                            @Param("featureType") String featureType,
                            @Param("featureValue") String featureValue,
                            @Param("delta") BigDecimal delta);
}
