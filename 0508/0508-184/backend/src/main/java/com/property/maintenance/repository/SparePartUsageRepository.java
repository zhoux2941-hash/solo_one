package com.property.maintenance.repository;

import com.property.maintenance.entity.SparePartUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SparePartUsageRepository extends JpaRepository<SparePartUsage, Long> {

    List<SparePartUsage> findByRepairmanId(Long repairmanId);

    @Query("SELECT s.repairmanId, SUM(s.quantity) as total FROM SparePartUsage s GROUP BY s.repairmanId ORDER BY total DESC")
    List<Object[]> findTotalQuantityByRepairman();
}
