package com.delivery.repository;

import com.delivery.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByStatus(String status);

    List<Order> findByRiderId(String riderId);

    @Query("SELECT o FROM Order o WHERE o.riderId IS NOT NULL AND o.status = 'DELIVERING'")
    List<Order> findActiveOrders();

    @Query("SELECT o FROM Order o WHERE o.actualDeliveryTime IS NOT NULL")
    List<Order> findCompletedOrders();

    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :start AND :end")
    List<Order> findOrdersBetweenDates(LocalDateTime start, LocalDateTime end);

    @Query("SELECT o FROM Order o WHERE o.riderId = :riderId AND o.actualDeliveryTime IS NOT NULL")
    List<Order> findCompletedOrdersByRider(String riderId);
}
