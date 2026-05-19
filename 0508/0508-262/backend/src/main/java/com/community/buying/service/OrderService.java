package com.community.buying.service;

import com.community.buying.entity.*;
import com.community.buying.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private GroupRecordRepository groupRecordRepository;

    @Autowired
    private GroupActivityRepository groupActivityRepository;

    @Autowired
    private UserRepository userRepository;

    private String generateOrderNo() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String timestamp = LocalDateTime.now().format(formatter);
        Random random = new Random();
        int randomNum = random.nextInt(10000);
        return "ORD" + timestamp + String.format("%04d", randomNum);
    }

    @Transactional
    @CacheEvict(value = {"dashboardStats", "orderTrend", "monthlyStats"}, allEntries = true)
    public Order createOrder(Order order, List<OrderItem> items, Long groupActivityId) {
        order.setOrderNo(generateOrderNo());
        order.setPickupCode(String.valueOf(100000 + new Random().nextInt(900000)));
        order.setOrderStatus(0);
        order.setPayStatus(0);
        order.setSortStatus(0);
        order.setDeliveryStatus(0);

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (OrderItem item : items) {
            totalAmount = totalAmount.add(item.getTotalAmount());
        }
        order.setTotalAmount(totalAmount);
        order.setPayAmount(totalAmount);

        Order savedOrder = orderRepository.save(order);

        for (OrderItem item : items) {
            item.setOrder(savedOrder);
            orderItemRepository.save(item);

            Product product = productRepository.findById(item.getProduct().getId()).orElse(null);
            if (product != null) {
                product.setStock(product.getStock() - item.getQuantity());
                product.setSales(product.getSales() + item.getQuantity());
                productRepository.save(product);
            }
        }

        if (groupActivityId != null) {
            GroupActivity activity = groupActivityRepository.findById(groupActivityId).orElse(null);
            if (activity != null) {
                GroupRecord record = new GroupRecord();
                record.setGroupActivity(activity);
                record.setOrder(savedOrder);
                record.setUser(order.getUser());
                record.setStatus(0);

                List<GroupRecord> records = groupRecordRepository.findByGroupActivityId(groupActivityId);
                if (records.isEmpty()) {
                    record.setIsLeader(1);
                }

                groupRecordRepository.save(record);

                activity.setCurrentGroupCount(activity.getCurrentGroupCount() + 1);
                groupActivityRepository.save(activity);

                checkAndCompleteGroup(activity);
            }
        }

        return savedOrder;
    }

    @Transactional
    public void checkAndCompleteGroup(GroupActivity activity) {
        if (activity.getStatus() != 1) {
            return;
        }

        List<GroupRecord> records = groupRecordRepository.findByGroupActivityId(activity.getId());
        long paidCount = records.stream()
                .filter(r -> r.getOrder() != null && r.getOrder().getPayStatus() == 1)
                .count();

        if (paidCount >= activity.getMinGroupSize()) {
            activity.setStatus(2);
            groupActivityRepository.save(activity);

            for (GroupRecord record : records) {
                record.setStatus(1);
                groupRecordRepository.save(record);

                if (record.getOrder() != null) {
                    Order order = record.getOrder();
                    order.setOrderStatus(1);
                    orderRepository.save(order);
                }
            }
        }
    }

    @Transactional
    @CacheEvict(value = {"dashboardStats", "orderTrend", "monthlyStats"}, allEntries = true)
    public Order simulatePayment(Long orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null) {
            order.setPayStatus(1);
            order.setPayTime(LocalDateTime.now());
            order.setOrderStatus(1);
            Order savedOrder = orderRepository.save(order);

            GroupRecord record = groupRecordRepository.findByOrderId(orderId).orElse(null);
            if (record != null && record.getGroupActivity() != null) {
                checkAndCompleteGroup(record.getGroupActivity());
            }

            return savedOrder;
        }
        return null;
    }

    public Order findById(Long id) {
        return orderRepository.findById(id).orElse(null);
    }

    public Order findByOrderNo(String orderNo) {
        return orderRepository.findByOrderNo(orderNo);
    }

    public List<Order> findByUserId(Long userId) {
        return orderRepository.findByUserIdOrderByCreateTimeDesc(userId);
    }

    public List<Order> findByStoreId(Long storeId) {
        return orderRepository.findByStoreIdOrderByCreateTimeDesc(storeId);
    }

    public List<Order> findAll() {
        return orderRepository.findAll();
    }

    @Transactional
    public Order updateSortStatus(Long orderId, Integer status) {
        Order order = findById(orderId);
        if (order != null) {
            order.setSortStatus(status);
            if (status == 1) {
                order.setOrderStatus(2);
            }
            return orderRepository.save(order);
        }
        return null;
    }

    @Transactional
    public Order updateDeliveryStatus(Long orderId, Integer status) {
        Order order = findById(orderId);
        if (order != null) {
            order.setDeliveryStatus(status);
            if (status == 1) {
                order.setOrderStatus(3);
            } else if (status == 2) {
                order.setOrderStatus(4);
            }
            return orderRepository.save(order);
        }
        return null;
    }

    @Transactional
    public Order assignDeliveryRoute(Long orderId, Long routeId) {
        Order order = findById(orderId);
        if (order != null) {
            DeliveryRoute route = new DeliveryRoute();
            route.setId(routeId);
            order.setDeliveryRoute(route);
            return orderRepository.save(order);
        }
        return null;
    }

    public List<OrderItem> findOrderItems(Long orderId) {
        return orderItemRepository.findByOrderId(orderId);
    }

    @Transactional
    public Order acceptOrder(Long orderId, Long deliveryPersonId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }

        if (order.getDeliveryStatus() != 0) {
            throw new RuntimeException("订单已被领取，无法重复接单");
        }

        if (order.getSortStatus() != 1) {
            throw new RuntimeException("订单尚未分拣完成，无法接单");
        }

        if (order.getDeliveryPerson() != null && order.getDeliveryPerson().getId() != null) {
            throw new RuntimeException("订单已被其他配送员领取");
        }

        User deliveryPerson = userRepository.findById(deliveryPersonId).orElse(null);
        if (deliveryPerson == null) {
            throw new RuntimeException("配送员不存在");
        }

        order.setDeliveryPerson(deliveryPerson);
        order.setDeliveryStatus(1);
        order.setOrderStatus(3);
        order.setReceiveTime(LocalDateTime.now());

        try {
            return orderRepository.save(order);
        } catch (ObjectOptimisticLockingFailureException e) {
            throw new RuntimeException("订单已被其他配送员领取，请刷新后重试");
        }
    }

    @Transactional
    public Map<String, Object> batchAcceptOrders(List<Long> orderIds, Long deliveryPersonId) {
        List<Order> successOrders = new ArrayList<>();
        List<String> failedReasons = new ArrayList<>();

        User deliveryPerson = userRepository.findById(deliveryPersonId).orElse(null);
        if (deliveryPerson == null) {
            throw new RuntimeException("配送员不存在");
        }

        for (Long orderId : orderIds) {
            try {
                Order order = orderRepository.findById(orderId).orElse(null);
                if (order == null) {
                    failedReasons.add("订单[" + orderId + "]：不存在");
                    continue;
                }

                if (order.getDeliveryStatus() != 0) {
                    failedReasons.add("订单[" + order.getOrderNo() + "]：已被领取");
                    continue;
                }

                if (order.getSortStatus() != 1) {
                    failedReasons.add("订单[" + order.getOrderNo() + "]：尚未分拣完成");
                    continue;
                }

                if (order.getDeliveryPerson() != null && order.getDeliveryPerson().getId() != null) {
                    failedReasons.add("订单[" + order.getOrderNo() + "]：已被其他配送员领取");
                    continue;
                }

                order.setDeliveryPerson(deliveryPerson);
                order.setDeliveryStatus(1);
                order.setOrderStatus(3);
                order.setReceiveTime(LocalDateTime.now());

                Order savedOrder = orderRepository.save(order);
                successOrders.add(savedOrder);
            } catch (ObjectOptimisticLockingFailureException e) {
                failedReasons.add("订单[" + orderId + "]：已被其他配送员领取");
            } catch (Exception e) {
                failedReasons.add("订单[" + orderId + "]：" + e.getMessage());
            }
        }

        return Map.of(
            "successCount", successOrders.size(),
            "failedCount", failedReasons.size(),
            "successOrders", successOrders,
            "failedReasons", failedReasons
        );
    }

    public List<Order> findByDeliveryPersonId(Long deliveryPersonId) {
        return orderRepository.findByDeliveryPersonIdOrderByCreateTimeDesc(deliveryPersonId);
    }

    public List<Order> findAvailableOrdersForDelivery() {
        return orderRepository.findByDeliveryStatusAndSortStatusOrderByCreateTimeDesc(0, 1);
    }
}