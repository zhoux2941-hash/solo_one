package com.community.groupbuy.repository;

import com.community.groupbuy.entity.Order;
import com.community.groupbuy.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByMemberId(Long memberId);
    List<Order> findByActivityId(Long activityId);
    List<Order> findByActivityIdAndStatus(Long activityId, String status);

    Optional<Order> findByPickupCode(String pickupCode);

    boolean existsByPickupCode(String pickupCode);

    @Query("SELECT o.productId, SUM(o.quantity) FROM Order o " +
           "WHERE o.activityId = :activityId " +
           "AND o.status IN ('PENDING_SORTING', 'PENDING_RECEIVE', 'COMPLETED') " +
           "GROUP BY o.productId")
    List<Object[]> sumQuantityByProductIdForActivity(@Param("activityId") Long activityId);

    @Query("SELECT o.productId, SUM(o.quantity) FROM Order o " +
           "WHERE o.activityId = :activityId " +
           "AND o.status = :status " +
           "GROUP BY o.productId")
    List<Object[]> sumQuantityByProductIdAndStatus(@Param("activityId") Long activityId,
                                                   @Param("status") String status);
}
