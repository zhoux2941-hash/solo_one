package com.community.buying.repository;

import com.community.buying.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdOrderByCreateTimeDesc(Long userId);
    List<Order> findByStoreIdOrderByCreateTimeDesc(Long storeId);
    Order findByOrderNo(String orderNo);
    
    @Query("SELECT COUNT(o) FROM Order o WHERE o.createTime >= ?1 AND o.createTime <= ?2")
    Long countByDateRange(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT SUM(o.payAmount) FROM Order o WHERE o.payStatus = 1 AND o.createTime >= ?1 AND o.createTime <= ?2")
    BigDecimal sumAmountByDateRange(LocalDateTime start, LocalDateTime end);
    
    @Query(value = "SELECT CAST(o.create_time AS DATE) as date, COUNT(o.id) as count, COALESCE(SUM(o.pay_amount), 0) as amount " +
            "FROM orders o WHERE o.create_time >= ?1 AND o.create_time <= ?2 " +
            "GROUP BY CAST(o.create_time AS DATE) ORDER BY date", nativeQuery = true)
    List<Object[]> findDailyStatistics(LocalDateTime start, LocalDateTime end);
    
    @Query(value = "SELECT YEAR(o.create_time) as year, MONTH(o.create_time) as month, " +
            "COUNT(o.id) as count, COALESCE(SUM(o.pay_amount), 0) as amount " +
            "FROM orders o WHERE o.create_time >= ?1 AND o.create_time <= ?2 " +
            "GROUP BY YEAR(o.create_time), MONTH(o.create_time) ORDER BY year, month", nativeQuery = true)
    List<Object[]> findMonthlyStatistics(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT FUNCTION('DATE', o.createTime) as date, COUNT(o.id) as count, " +
            "COALESCE(SUM(CASE WHEN o.payStatus = 1 THEN o.payAmount ELSE 0 END), 0) as amount " +
            "FROM Order o WHERE o.createTime >= ?1 AND o.createTime <= ?2 " +
            "GROUP BY FUNCTION('DATE', o.createTime) ORDER BY date")
    List<Object[]> findDailyStatisticsJPQL(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT FUNCTION('YEAR', o.createTime) as year, FUNCTION('MONTH', o.createTime) as month, " +
            "COUNT(o.id) as count, COALESCE(SUM(CASE WHEN o.payStatus = 1 THEN o.payAmount ELSE 0 END), 0) as amount " +
            "FROM Order o WHERE o.createTime >= ?1 AND o.createTime <= ?2 " +
            "GROUP BY FUNCTION('YEAR', o.createTime), FUNCTION('MONTH', o.createTime) ORDER BY year, month")
    List<Object[]> findMonthlyStatisticsJPQL(LocalDateTime start, LocalDateTime end);
    
    List<Order> findByDeliveryRouteId(Long deliveryRouteId);
    
    List<Order> findByDeliveryPersonIdOrderByCreateTimeDesc(Long deliveryPersonId);
    
    List<Order> findByDeliveryStatusAndSortStatusOrderByCreateTimeDesc(Integer deliveryStatus, Integer sortStatus);
}