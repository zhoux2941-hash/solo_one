package com.restaurant.queue.repository;

import com.restaurant.queue.entity.OrderRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRecordRepository extends JpaRepository<OrderRecord, Long> {

    List<OrderRecord> findByQueueId(Long queueId);

    List<OrderRecord> findByRestaurantId(Long restaurantId);

    @Query("SELECT o FROM OrderRecord o WHERE o.restaurantId = :restaurantId " +
           "AND o.waitMinutes IS NOT NULL ORDER BY o.orderTime DESC")
    List<OrderRecord> findWithWaitTimeByRestaurant(@Param("restaurantId") Long restaurantId);

    @Query("SELECT o.waitMinutes, o.totalAmount, o.itemCount FROM OrderRecord o " +
           "WHERE o.restaurantId = :restaurantId AND o.waitMinutes IS NOT NULL " +
           "AND o.orderTime >= :startTime ORDER BY o.orderTime")
    List<Object[]> findScatterDataByRestaurant(@Param("restaurantId") Long restaurantId,
                                                @Param("startTime") LocalDateTime startTime);

    @Query("SELECT " +
           "CASE WHEN o.waitMinutes < 15 THEN '0-15分钟' " +
           "WHEN o.waitMinutes < 30 THEN '15-30分钟' " +
           "WHEN o.waitMinutes < 60 THEN '30-60分钟' " +
           "ELSE '60分钟以上' END as waitGroup, " +
           "COUNT(o) as orderCount, " +
           "AVG(o.totalAmount) as avgAmount, " +
           "AVG(o.itemCount) as avgItemCount " +
           "FROM OrderRecord o " +
           "WHERE o.restaurantId = :restaurantId AND o.waitMinutes IS NOT NULL " +
           "AND o.orderTime >= :startTime " +
           "GROUP BY waitGroup " +
           "ORDER BY MIN(o.waitMinutes)")
    List<Object[]> findWaitTimeGroupStats(@Param("restaurantId") Long restaurantId,
                                           @Param("startTime") LocalDateTime startTime);

    @Query("SELECT " +
           "SUM(CASE WHEN oi.isHighPrice = true THEN 1 ELSE 0 END) as highPriceCount, " +
           "SUM(CASE WHEN oi.isHighPrice = false THEN 1 ELSE 0 END) as normalPriceCount, " +
           "CASE WHEN o.waitMinutes >= :threshold THEN '等待时间长' ELSE '等待时间短' END as waitType " +
           "FROM OrderRecord o JOIN o.items oi " +
           "WHERE o.restaurantId = :restaurantId AND o.waitMinutes IS NOT NULL " +
           "AND o.orderTime >= :startTime " +
           "GROUP BY waitType")
    List<Object[]> findHighPriceComparison(@Param("restaurantId") Long restaurantId,
                                            @Param("threshold") Integer threshold,
                                            @Param("startTime") LocalDateTime startTime);

    @Query("SELECT COUNT(o) FROM OrderRecord o WHERE o.restaurantId = :restaurantId")
    Long countByRestaurantId(@Param("restaurantId") Long restaurantId);

    @Query("SELECT AVG(o.totalAmount) FROM OrderRecord o WHERE o.restaurantId = :restaurantId")
    Double findAverageOrderAmount(@Param("restaurantId") Long restaurantId);

    @Query("SELECT o.category, COUNT(oi), SUM(oi.quantity), SUM(oi.subtotal) " +
           "FROM OrderRecord o JOIN o.items oi " +
           "WHERE o.restaurantId = :restaurantId " +
           "AND o.orderTime >= :startTime " +
           "GROUP BY o.category")
    List<Object[]> findCategorySales(@Param("restaurantId") Long restaurantId,
                                      @Param("startTime") LocalDateTime startTime);
}
