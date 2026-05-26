package com.community.groupbuy.state;

import com.community.groupbuy.entity.Order;
import com.community.groupbuy.enums.OrderStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class OrderStateContext {

    private final Map<OrderStatus, OrderState> stateMap = new ConcurrentHashMap<>();

    @Autowired
    public OrderStateContext(PendingPaymentState pendingPayment,
                             PendingSortingState pendingSorting,
                             PendingReceiveState pendingReceive,
                             CompletedState completed,
                             CancelledState cancelled) {
        stateMap.put(OrderStatus.PENDING_PAYMENT, pendingPayment);
        stateMap.put(OrderStatus.PENDING_SORTING, pendingSorting);
        stateMap.put(OrderStatus.PENDING_RECEIVE, pendingReceive);
        stateMap.put(OrderStatus.COMPLETED, completed);
        stateMap.put(OrderStatus.CANCELLED, cancelled);
    }

    private OrderState getState(Order order) {
        OrderStatus status = OrderStatus.fromCode(order.getStatus());
        OrderState state = stateMap.get(status);
        if (state == null) {
            throw new IllegalStateException("未找到订单状态: " + status);
        }
        return state;
    }

    public OrderStatus getCurrentStatus(Order order) {
        return getState(order).getStatus();
    }

    public void pay(Order order) {
        getState(order).pay(order);
    }

    public void sort(Order order) {
        getState(order).sort(order);
    }

    public void receive(Order order) {
        getState(order).receive(order);
    }

    public void cancel(Order order) {
        getState(order).cancel(order);
    }

    public boolean canPay(Order order) {
        return getCurrentStatus(order) == OrderStatus.PENDING_PAYMENT;
    }

    public boolean canSort(Order order) {
        return getCurrentStatus(order) == OrderStatus.PENDING_SORTING;
    }

    public boolean canReceive(Order order) {
        return getCurrentStatus(order) == OrderStatus.PENDING_RECEIVE;
    }

    public boolean canCancel(Order order) {
        OrderStatus status = getCurrentStatus(order);
        return status == OrderStatus.PENDING_PAYMENT || status == OrderStatus.PENDING_SORTING;
    }
}
