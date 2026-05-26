package com.community.groupbuy.service;

import com.community.groupbuy.entity.Order;
import com.community.groupbuy.entity.User;
import com.community.groupbuy.entity.Commission;
import com.community.groupbuy.enums.OrderStatus;
import com.community.groupbuy.repository.OrderRepository;
import com.community.groupbuy.repository.UserRepository;
import com.community.groupbuy.repository.CommissionRepository;
import com.community.groupbuy.state.OrderStateContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
public class PickupCodeService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CommissionRepository commissionRepository;

    @Autowired
    private OrderStateContext orderStateContext;

    private final Random random = new Random();

    public String generatePickupCode() {
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            code.append(random.nextInt(10));
        }
        return code.toString();
    }

    @Transactional
    public void generatePickupCodeForOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("订单不存在"));

        if (order.getPickupCode() != null) {
            return;
        }

        if (!OrderStatus.PENDING_RECEIVE.getCode().equals(order.getStatus())) {
            throw new IllegalStateException("只有分拣完成的订单才能生成取货码");
        }

        String code = generateUniquePickupCode();
        order.setPickupCode(code);
        order.setPickupCodeGeneratedTime(LocalDateTime.now());
        orderRepository.save(order);
    }

    @Transactional
    public void generatePickupCodesForActivity(Long activityId, Long productId) {
        List<Order> orders = orderRepository.findByActivityIdAndStatus(
            activityId, OrderStatus.PENDING_RECEIVE.getCode());

        for (Order order : orders) {
            if (order.getProductId().equals(productId) && order.getPickupCode() == null) {
                String code = generateUniquePickupCode();
                order.setPickupCode(code);
                order.setPickupCodeGeneratedTime(LocalDateTime.now());
                orderRepository.save(order);
            }
        }
    }

    private String generateUniquePickupCode() {
        String code;
        int attempts = 0;
        do {
            code = generatePickupCode();
            attempts++;
            if (attempts > 10) {
                throw new RuntimeException("生成取货码失败，请稍后重试");
            }
        } while (orderRepository.existsByPickupCode(code));
        return code;
    }

    @Transactional
    public Map<String, Object> verifyPickupCode(String pickupCode, Long leaderId) {
        Map<String, Object> result = new HashMap<>();

        Order order = orderRepository.findByPickupCode(pickupCode)
                .orElseThrow(() -> new RuntimeException("取货码无效"));

        if (!OrderStatus.PENDING_RECEIVE.getCode().equals(order.getStatus())) {
            throw new IllegalStateException("订单状态不支持核销，当前状态: " + order.getStatusDescription());
        }

        User member = userRepository.findById(order.getMemberId()).orElse(null);
        User leader = userRepository.findById(leaderId).orElse(null);

        if (leader != null && !leader.getRole().equals("LEADER")) {
            throw new SecurityException("只有团长才能进行核销操作");
        }

        orderStateContext.receive(order);
        order.setVerifyTime(LocalDateTime.now());
        order.setReceiveTime(LocalDateTime.now());
        Order saved = orderRepository.save(order);

        settleCommission(saved);

        result.put("success", true);
        result.put("order", saved);
        result.put("member", member);
        result.put("message", "核销成功");

        return result;
    }

    public Order getOrderByPickupCode(String pickupCode) {
        return orderRepository.findByPickupCode(pickupCode).orElse(null);
    }

    public List<Order> getOrdersForVerification(Long activityId) {
        return orderRepository.findByActivityIdAndStatus(
            activityId, OrderStatus.PENDING_RECEIVE.getCode());
    }

    private void settleCommission(Order order) {
        List<Commission> commissions = commissionRepository.findByActivityIdAndOrderId(
            order.getActivityId(), order.getId());
        for (Commission commission : commissions) {
            if ("PENDING".equals(commission.getStatus())) {
                commission.setStatus("SETTLED");
                commission.setSettleTime(order.getReceiveTime());
                commissionRepository.save(commission);
            }
        }
    }
}
