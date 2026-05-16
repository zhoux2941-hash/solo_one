package com.property.maintenance.repository;

import com.property.maintenance.entity.RepairOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepairOrderRepository extends JpaRepository<RepairOrder, Long> {

    List<RepairOrder> findByStatus(String status);

    List<RepairOrder> findByRepairmanId(Long repairmanId);

    @Query("SELECT r FROM RepairOrder r WHERE r.repairmanId = :repairmanId AND r.status = 'COMPLETED'")
    List<RepairOrder> findCompletedOrdersByRepairmanId(Long repairmanId);
}
