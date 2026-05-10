package com.company.watermonitor.repository;

import com.company.watermonitor.entity.DeliveryOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryOrderRepository extends JpaRepository<DeliveryOrder, Long> {
    
    List<DeliveryOrder> findByStatusOrderByOrderTimeDesc(String status);
    
    Optional<DeliveryOrder> findFirstByMachineIdAndStatusOrderByOrderTimeDesc(Long machineId, String status);
    
    List<DeliveryOrder> findByOrderTimeBetweenAndStatusOrderByOrderTime(LocalDateTime startTime, LocalDateTime endTime, String status);
    
    @Query("SELECT d FROM DeliveryOrder d WHERE d.status = 'COMPLETED' AND d.deliveredTime IS NOT NULL")
    List<DeliveryOrder> findAllCompletedOrders();
    
    List<DeliveryOrder> findAllByOrderByOrderTimeDesc();
    
    Optional<DeliveryOrder> findFirstByFloorAndStatusOrderByOrderTimeDesc(Integer floor, String status);
}
