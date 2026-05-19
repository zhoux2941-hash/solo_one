package com.oms.service;

import com.oms.config.TenantContext;
import com.oms.entity.Order;
import com.oms.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;

    @Transactional
    public Order createOrder(Order order) {
        Long currentTenantId = TenantContext.getTenantId();
        if (currentTenantId == null) {
            throw new RuntimeException("未找到租户信息，请重新登录");
        }
        
        order.setTenantId(currentTenantId);
        order.setOrderNo(generateOrderNo());
        order.setStatus(Order.OrderStatus.DRAFT);
        order.setPayStatus(Order.PayStatus.UNPAID);
        order.setCreatedBy(TenantContext.getUserId());
        return orderRepository.save(order);
    }

    @Transactional
    public Order updateOrder(Long id, Order orderDetails) {
        Long currentTenantId = TenantContext.getTenantId();
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("订单不存在"));

        if (!order.getTenantId().equals(currentTenantId)) {
            throw new RuntimeException("无权限访问此订单");
        }
        
        if (order.getStatus() != Order.OrderStatus.DRAFT) {
            throw new RuntimeException("只有草稿状态的订单可以编辑");
        }
        
        order.setCustomerName(orderDetails.getCustomerName());
        order.setTotalAmount(orderDetails.getTotalAmount());
        order.setRemark(orderDetails.getRemark());
        return orderRepository.save(order);
    }

    @Transactional
    public Order submitForApproval(Long id) {
        Long currentTenantId = TenantContext.getTenantId();
        Long currentUserId = TenantContext.getUserId();
        
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("订单不存在"));

        if (!order.getTenantId().equals(currentTenantId)) {
            throw new RuntimeException("无权限访问此订单");
        }
        
        order.setStatus(Order.OrderStatus.PENDING_APPROVAL);
        order.setCreatedBy(currentUserId);
        return orderRepository.save(order);
    }

    @Transactional
    public Order approveOrder(Long id) {
        Long currentTenantId = TenantContext.getTenantId();
        Long currentUserId = TenantContext.getUserId();
        
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("订单不存在"));

        if (!order.getTenantId().equals(currentTenantId)) {
            throw new RuntimeException("无权限访问此订单");
        }
        
        order.setStatus(Order.OrderStatus.APPROVED);
        order.setApprovedBy(currentUserId);
        order.setApprovedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }

    @Transactional
    public Order cancelOrder(Long id) {
        Long currentTenantId = TenantContext.getTenantId();
        
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("订单不存在"));

        if (!order.getTenantId().equals(currentTenantId)) {
            throw new RuntimeException("无权限访问此订单");
        }
        
        order.setStatus(Order.OrderStatus.CANCELLED);
        return orderRepository.save(order);
    }

    @Transactional
    public Order refundOrder(Long id) {
        Long currentTenantId = TenantContext.getTenantId();
        
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("订单不存在"));

        if (!order.getTenantId().equals(currentTenantId)) {
            throw new RuntimeException("无权限访问此订单");
        }
        
        order.setStatus(Order.OrderStatus.REFUNDED);
        order.setPayStatus(Order.PayStatus.REFUNDED);
        return orderRepository.save(order);
    }

    public List<Order> getCurrentTenantOrders() {
        Long currentTenantId = TenantContext.getTenantId();
        if (currentTenantId == null) {
            throw new RuntimeException("未找到租户信息，请重新登录");
        }
        return orderRepository.findByTenantId(currentTenantId);
    }

    public Order getOrderById(Long id) {
        Long currentTenantId = TenantContext.getTenantId();
        
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("订单不存在"));

        if (!order.getTenantId().equals(currentTenantId)) {
            throw new RuntimeException("无权限访问此订单");
        }
        
        return order;
    }

    private String generateOrderNo() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int random = new Random().nextInt(9000) + 1000;
        return "ORD" + date + random;
    }
}
