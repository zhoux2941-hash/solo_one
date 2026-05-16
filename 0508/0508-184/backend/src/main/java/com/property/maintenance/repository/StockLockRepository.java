package com.property.maintenance.repository;

import com.property.maintenance.entity.StockLock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockLockRepository extends JpaRepository<StockLock, Long> {

    List<StockLock> findByOrderId(Long orderId);

    List<StockLock> findByStatusAndExpireTimeBefore(String status, LocalDateTime expireTime);

    @Modifying
    @Query("UPDATE StockLock s SET s.status = :newStatus WHERE s.status = :oldStatus AND s.expireTime <= :expireTime")
    int updateExpiredLocks(@Param("oldStatus") String oldStatus, @Param("newStatus") String newStatus, @Param("expireTime") LocalDateTime expireTime);

    @Modifying
    @Query("UPDATE StockLock s SET s.status = :status WHERE s.orderId = :orderId")
    int updateStatusByOrderId(@Param("orderId") Long orderId, @Param("status") String status);
}
