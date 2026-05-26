package com.community.groupbuy.state;

import com.community.groupbuy.entity.Order;
import com.community.groupbuy.enums.OrderStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class PendingSortingState implements OrderState {

    @Override
    public OrderStatus getStatus() {
        return OrderStatus.PENDING_SORTING;
    }

    @Override
    public void pay(Order order) {
        assertCanPay(order);
    }

    @Override
    public void sort(Order order) {
        order.setStatus(OrderStatus.PENDING_RECEIVE.getCode());
        order.setSortingTime(LocalDateTime.now());
    }

    @Override
    public void receive(Order order) {
        assertCanReceive(order);
    }

    @Override
    public void cancel(Order order) {
        order.setStatus(OrderStatus.CANCELLED.getCode());
    }
}
