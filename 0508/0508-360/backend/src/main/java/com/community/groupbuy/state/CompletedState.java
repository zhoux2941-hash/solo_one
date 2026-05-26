package com.community.groupbuy.state;

import com.community.groupbuy.entity.Order;
import com.community.groupbuy.enums.OrderStatus;
import org.springframework.stereotype.Component;

@Component
public class CompletedState implements OrderState {

    @Override
    public OrderStatus getStatus() {
        return OrderStatus.COMPLETED;
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
        assertCanReceive(order);
    }

    @Override
    public void cancel(Order order) {
        assertCanCancel(order);
    }
}
