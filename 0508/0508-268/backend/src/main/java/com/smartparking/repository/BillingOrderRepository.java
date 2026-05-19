package com.smartparking.repository;

import com.smartparking.entity.BillingOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import javax.persistence.LockModeType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillingOrderRepository extends JpaRepository<BillingOrder, Long> {
    
    Optional<BillingOrder> findByOrderNo(String orderNo);
    
    List<BillingOrder> findByPlateNumber(String plateNumber);
    
    List<BillingOrder> findByPlateNumberAndOrderStatus(String plateNumber, String orderStatus);
    
    List<BillingOrder> findByParkingLotIdAndCreateTimeBetween(Long parkingLotId, LocalDateTime start, LocalDateTime end);
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT bo FROM BillingOrder bo WHERE bo.id = ?1")
    Optional<BillingOrder> findByIdWithLock(Long id);
    
    @Query("SELECT COALESCE(SUM(bo.paidAmount), 0) FROM BillingOrder bo WHERE bo.parkingLotId = ?1 AND bo.payTime BETWEEN ?2 AND ?3")
    BigDecimal sumRevenueByParkingLotAndTime(Long parkingLotId, LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT COUNT(bo) FROM BillingOrder bo WHERE bo.parkingLotId = ?1 AND bo.createTime BETWEEN ?2 AND ?3")
    long countOrdersByParkingLotAndTime(Long parkingLotId, LocalDateTime start, LocalDateTime end);
}
