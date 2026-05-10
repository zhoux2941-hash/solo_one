package com.graftingassistant.repository;

import com.graftingassistant.entity.GraftingRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GraftingRecordRepository extends JpaRepository<GraftingRecord, Long> {
    
    List<GraftingRecord> findByRootstockIdAndScionIdAndIsCompletedTrue(Long rootstockId, Long scionId);
    
    @Query("SELECT MONTH(g.graftingDate) as month, AVG(g.survivalRate) as avgRate " +
           "FROM GraftingRecord g " +
           "WHERE g.rootstock.id = :rootstockId AND g.scion.id = :scionId AND g.isCompleted = true " +
           "GROUP BY MONTH(g.graftingDate)")
    List<Object[]> findMonthlySurvivalRate(Long rootstockId, Long scionId);
}
