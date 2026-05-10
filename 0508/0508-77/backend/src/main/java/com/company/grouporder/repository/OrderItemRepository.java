package com.company.grouporder.repository;

import com.company.grouporder.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByGroupOrderIdOrderByCreatedAtDesc(Long groupOrderId);
    List<OrderItem> findByGroupOrderIdAndParticipantUserId(Long groupOrderId, String userId);
    void deleteByGroupOrderId(Long groupOrderId);
}
