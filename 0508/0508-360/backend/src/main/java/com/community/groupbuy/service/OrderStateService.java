package com.community.groupbuy.service;

import com.community.groupbuy.entity.Order;
import com.community.groupbuy.enums.OrderStatus;
import com.community.groupbuy.repository.OrderRepository;
import com.community.groupbuy.state.OrderStateContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class OrderStateService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderStateContext stateContext;

    @Transactional
    public Order pay(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("订单不存在"));

        if (!stateContext.canPay(order)) {
            throw new IllegalStateException(
                "订单状态 [" + order.getStatusDescription() + "] 不支持支付操作"
            );
        }

        OrderStatus oldStatus = OrderStatus.fromCode(order.getStatus());
        stateContext.pay(order);
        Order saved = orderRepository.save(order);

        afterStateTransition(orderId, oldStatus, OrderStatus.fromCode(saved.getStatus()));
        return saved;
    }

    @Transactional
    public Order sort(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("订单不存在"));

        if (!stateContext.canSort(order)) {
            throw new IllegalStateException(
                "订单状态 [" + order.getStatusDescription() + "] 不支持分拣操作"
            );
        }

        OrderStatus oldStatus = OrderStatus.fromCode(order.getStatus());
        stateContext.sort(order);
        Order saved = orderRepository.save(order);

        afterStateTransition(orderId, oldStatus, OrderStatus.fromCode(saved.getStatus()));
        return saved;
    }

    @Transactional
    public Order receive(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("订单不存在"));

        if (!stateContext.canReceive(order)) {
            throw new IllegalStateException(
                "订单状态 [" + order.getStatusDescription() + "] 不支持收货操作"
            );
        }

        OrderStatus oldStatus = OrderStatus.fromCode(order.getStatus());
        stateContext.receive(order);
        Order saved = orderRepository.save(order);

        afterStateTransition(orderId, oldStatus, OrderStatus.fromCode(saved.getStatus()));
        return saved;
    }

    @Transactional
    public Order cancel(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("订单不存在"));

        if (!stateContext.canCancel(order)) {
            throw new IllegalStateException(
                "订单状态 [" + order.getStatusDescription() + "] 不支持取消操作"
            );
        }

        OrderStatus oldStatus = OrderStatus.fromCode(order.getStatus());
        stateContext.cancel(order);
        Order saved = orderRepository.save(order);

        afterStateTransition(orderId, oldStatus, OrderStatus.fromCode(saved.getStatus()));
        return saved;
    }

    private void afterStateTransition(Long orderId, OrderStatus oldStatus, OrderStatus newStatus) {
        System.out.printf("[订单状态变更] orderId=%d: %s → %s%n",
            orderId, oldStatus.getDescription(), newStatus.getDescription());
    }

    public Map<String, Object> getStateInfo(Order order) {
        Map<String, Object> info = new HashMap<>();
        info.put("status", order.getStatus());
        info.put("statusDescription", order.getStatusDescription());
        info.put("canPay", stateContext.canPay(order));
        info.put("canSort", stateContext.canSort(order));
        info.put("canReceive", stateContext.canReceive(order));
        info.put("canCancel", stateContext.canCancel(order));
        return info;
    }
}
