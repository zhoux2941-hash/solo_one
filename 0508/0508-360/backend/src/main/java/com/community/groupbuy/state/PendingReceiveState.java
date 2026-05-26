package com.community.groupbuy.state;

import com.community.groupbuy.entity.Order;
import com.community.groupbuy.enums.OrderStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class PendingReceiveState implements OrderState {

    @Override
    public OrderStatus getStatus() {
        return OrderStatus.PENDING_RECEIVE;
    }

    @Override
    public void pay(Order order) {
        assertCanPay(order);
    }

    @Override
    public void sort(Order order) {
        assertCanSort(order);
    }

    @Override
    public void receive(Order order) {
        order.setStatus(OrderStatus.COMPLETED.getCode());
        order.setReceiveTime(LocalDateTime.now());
    }

    @Override
    public void cancel(Order order) {
        assertCanCancel(order);
    }
}
