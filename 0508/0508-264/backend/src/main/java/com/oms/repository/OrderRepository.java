package com.oms.repository;

import com.oms.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNo(String orderNo);
    List<Order> findByTenantId(Long tenantId);
    List<Order> findByTenantIdAndStatus(Long tenantId, Order.OrderStatus status);
    List<Order> findByTenantIdAndCreatedAtBetween(Long tenantId, LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT COUNT(o) FROM Order o WHERE o.tenantId = :tenantId AND o.status = :status")
    Long countByTenantIdAndStatus(Long tenantId, Order.OrderStatus status);
    
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.tenantId = :tenantId AND o.createdAt BETWEEN :start AND :end")
    java.math.BigDecimal sumTotalAmountByTenantIdAndDateRange(Long tenantId, LocalDateTime start, LocalDateTime end);
}
