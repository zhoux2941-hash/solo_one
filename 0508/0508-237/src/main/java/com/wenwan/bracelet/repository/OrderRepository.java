package com.wenwan.bracelet.repository;

import com.wenwan.bracelet.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByCustomerId(Long customerId);

    List<Order> findByCraftsmanId(Long craftsmanId);

    List<Order> findByStatus(Order.OrderStatus status);

    List<Order> findByCraftsmanIdAndStatus(Long craftsmanId, Order.OrderStatus status);
}