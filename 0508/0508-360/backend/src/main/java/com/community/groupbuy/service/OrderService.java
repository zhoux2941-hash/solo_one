package com.community.groupbuy.service;

import com.community.groupbuy.entity.*;
import com.community.groupbuy.enums.OrderStatus;
import com.community.groupbuy.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private GroupActivityRepository activityRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CommissionRepository commissionRepository;

    @Autowired
    private SortingItemRepository sortingItemRepository;

    @Autowired
    private OrderStateService orderStateService;

    @Autowired
    private SortingService sortingService;

    @Transactional
    public Order createOrder(Long memberId, Long activityId, Integer quantity, String remark) {
        GroupActivity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("团购活动不存在"));

        Product product = productRepository.findById(activity.getProductId())
                .orElseThrow(() -> new RuntimeException("商品不存在"));

        if (!"ACTIVE".equals(activity.getStatus())) {
            throw new RuntimeException("团购活动已结束");
        }

        BigDecimal totalAmount = activity.getGroupPrice().multiply(BigDecimal.valueOf(quantity));

        Order order = new Order();
        order.setOrderNo("GB" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        order.setMemberId(memberId);
        order.setActivityId(activityId);
        order.setProductId(product.getId());
        order.setQuantity(quantity);
        order.setUnitPrice(activity.getGroupPrice());
        order.setTotalAmount(totalAmount);
        order.setStatus(OrderStatus.PENDING_PAYMENT.getCode());
        order.setRemark(remark);

        return orderRepository.save(order);
    }

    @Transactional
    public Order pay(Long orderId) {
        Order order = orderStateService.pay(orderId);

        GroupActivity activity = activityRepository.findById(order.getActivityId()).orElse(null);
        if (activity != null && activity.getCommissionRate() != null) {
            Commission commission = new Commission();
            commission.setLeaderId(activity.getLeaderId());
            commission.setActivityId(activity.getId());
            commission.setOrderId(order.getId());
            commission.setOrderAmount(order.getTotalAmount());
            commission.setCommissionRate(activity.getCommissionRate());
            commission.setAmount(order.getTotalAmount().multiply(activity.getCommissionRate()));
            commission.setStatus("PENDING");
            commissionRepository.save(commission);
        }

        sortingService.updateSortingItem(order.getActivityId(), order.getProductId());

        return order;
    }

    @Transactional
    public Order confirmReceive(Long orderId) {
        Order order = orderStateService.receive(orderId);

        List<Commission> commissions = commissionRepository.findByActivityIdAndOrderId(order.getActivityId(), orderId);
        for (Commission commission : commissions) {
            commission.setStatus("SETTLED");
            commission.setSettleTime(order.getReceiveTime());
            commissionRepository.save(commission);
        }

        return order;
    }

    @Transactional
    public Order sort(Long orderId) {
        return orderStateService.sort(orderId);
    }

    @Transactional
    public Order cancel(Long orderId) {
        return orderStateService.cancel(orderId);
    }

    public List<Order> getByMemberId(Long memberId) {
        return orderRepository.findByMemberId(memberId);
    }

    public List<Order> getByActivityId(Long activityId) {
        return orderRepository.findByActivityId(activityId);
    }

    public Order getById(Long id) {
        return orderRepository.findById(id).orElse(null);
    }
}
