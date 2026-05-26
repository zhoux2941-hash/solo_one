package com.community.groupbuy.state;

import com.community.groupbuy.entity.Order;
import com.community.groupbuy.enums.OrderStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class PendingPaymentState implements OrderState {

    @Override
    public OrderStatus getStatus() {
        return OrderStatus.PENDING_PAYMENT;
    }

    @Override
    public void pay(Order order) {
        order.setStatus(OrderStatus.PENDING_SORTING.getCode());
        order.setPayTime(LocalDateTime.now());
    }

    @Override
    public void sort(Order order) {
        assertCanSort(order);
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
