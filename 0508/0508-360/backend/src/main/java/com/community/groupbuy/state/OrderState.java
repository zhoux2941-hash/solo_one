package com.community.groupbuy.state;

import com.community.groupbuy.entity.Order;
import com.community.groupbuy.enums.OrderStatus;

public interface OrderState {
    OrderStatus getStatus();

    void pay(Order order);

    void sort(Order order);

    void receive(Order order);

    void cancel(Order order);

    default void assertCanPay(Order order) {
        throw new IllegalStateException("订单状态 [" + getStatus().getDescription() + "] 不支持支付操作");
    }

    default void assertCanSort(Order order) {
        throw new IllegalStateException("订单状态 [" + getStatus().getDescription() + "] 不支持分拣操作");
    }

    default void assertCanReceive(Order order) {
        throw new IllegalStateException("订单状态 [" + getStatus().getDescription() + "] 不支持收货操作");
    }

    default void assertCanCancel(Order order) {
        throw new IllegalStateException("订单状态 [" + getStatus().getDescription() + "] 不支持取消操作");
    }
}
