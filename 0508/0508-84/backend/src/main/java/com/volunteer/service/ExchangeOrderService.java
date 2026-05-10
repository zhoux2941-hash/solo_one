package com.volunteer.service;

import com.volunteer.entity.ExchangeOrder;
import java.util.List;

public interface ExchangeOrderService {
    ExchangeOrder create(Long userId, Long goodsId, Integer quantity);
    List<ExchangeOrder> findByUserId(Long userId);
    List<ExchangeOrder> findByStatus(String status);
    List<ExchangeOrder> findPending();
    ExchangeOrder deliver(Long orderId, Long adminId);
    ExchangeOrder complete(Long orderId, Long adminId);
    ExchangeOrder cancel(Long orderId);
}
