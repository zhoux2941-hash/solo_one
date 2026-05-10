package com.volunteer.repository;

import com.volunteer.entity.ExchangeOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExchangeOrderRepository extends JpaRepository<ExchangeOrder, Long> {
    List<ExchangeOrder> findByUserIdOrderByCreateTimeDesc(Long userId);
    List<ExchangeOrder> findByStatusOrderByCreateTimeDesc(String status);
    List<ExchangeOrder> findByUserIdAndStatusOrderByCreateTimeDesc(Long userId, String status);
}
