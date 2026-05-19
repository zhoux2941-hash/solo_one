package com.autorepair.repository;

import com.autorepair.entity.WorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {
    List<WorkOrder> findByStatus(String status);
    List<WorkOrder> findByCustomerId(Long customerId);
    List<WorkOrder> findByPlateNumberContainingOrOrderNoContaining(String plateNumber, String orderNo);
    
    @Query("SELECT SUM(w.totalAmount) FROM WorkOrder w WHERE w.createTime BETWEEN ?1 AND ?2 AND w.status = 'COMPLETED'")
    BigDecimal sumTotalAmountByDateRange(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT COUNT(w) FROM WorkOrder w WHERE w.createTime BETWEEN ?1 AND ?2")
    Long countByDateRange(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT COUNT(w) FROM WorkOrder w WHERE w.vehicleId = ?1 AND w.status IN ('CREATED', 'ASSIGNED', 'WORKING')")
    Long countActiveWorkOrdersByVehicleId(Long vehicleId);
}