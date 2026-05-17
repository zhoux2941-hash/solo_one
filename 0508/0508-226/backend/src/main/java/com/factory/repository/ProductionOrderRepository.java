package com.factory.repository;

import com.factory.entity.ProductionOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductionOrderRepository extends JpaRepository<ProductionOrder, Long> {
    Optional<ProductionOrder> findByOrderCode(String orderCode);
    boolean existsByOrderCode(String orderCode);
    Page<ProductionOrder> findByOrderNameContaining(String orderName, Pageable pageable);
    Page<ProductionOrder> findByStatus(String status, Pageable pageable);
}