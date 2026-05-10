package com.company.grouporder.repository;

import com.company.grouporder.entity.GroupOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GroupOrderRepository extends JpaRepository<GroupOrder, Long> {
    List<GroupOrder> findByStatusOrderByCreatedAtDesc(GroupOrder.OrderStatus status);
    List<GroupOrder> findByInitiatorUserIdOrderByCreatedAtDesc(String userId);
    List<GroupOrder> findByStatusNotOrderByCreatedAtDesc(GroupOrder.OrderStatus status);
}
