package com.company.grouporder.service;

import com.company.grouporder.dto.*;
import com.company.grouporder.entity.*;
import com.company.grouporder.exception.BusinessException;
import com.company.grouporder.exception.ResourceNotFoundException;
import com.company.grouporder.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroupOrderService {

    private static final String ORDER_TOTAL_CACHE_PREFIX = "group_order:total:";
    private static final long CACHE_EXPIRE_HOURS = 24;

    private final GroupOrderRepository groupOrderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ParticipantRepository participantRepository;
    private final MerchantRepository merchantRepository;
    private final MerchantItemRepository merchantItemRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    @Transactional
    public GroupOrder createOrder(CreateGroupOrderRequest request) {
        GroupOrder order = new GroupOrder();
        order.setMerchant(request.getMerchant());
        order.setMinAmount(request.getMinAmount());
        order.setDiscountAmount(request.getDiscountAmount());
        order.setTargetUrl(request.getTargetUrl());
        order.setInitiatorName(request.getInitiatorName());
        order.setInitiatorUserId(request.getInitiatorUserId());
        
        GroupOrder saved = groupOrderRepository.save(order);
        
        Participant participant = new Participant();
        participant.setGroupOrderId(saved.getId());
        participant.setUserId(request.getInitiatorUserId());
        participant.setUserName(request.getInitiatorName());
        participantRepository.save(participant);
        
        log.info("创建拼单: id={}, merchant={}, initiator={}", saved.getId(), saved.getMerchant(), saved.getInitiatorName());
        return saved;
    }

    public List<GroupOrder> getActiveOrders() {
        return groupOrderRepository.findByStatusOrderByCreatedAtDesc(GroupOrder.OrderStatus.ACTIVE);
    }

    public List<GroupOrder> getAllOrders() {
        return groupOrderRepository.findByStatusNotOrderByCreatedAtDesc(GroupOrder.OrderStatus.CANCELLED);
    }

    public GroupOrder getOrderById(Long orderId) {
        return groupOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("拼单不存在: " + orderId));
    }

    public OrderSummary getOrderSummary(Long orderId) {
        GroupOrder order = getOrderById(orderId);
        
        BigDecimal cachedTotal = getCachedTotal(orderId);
        if (cachedTotal != null) {
            order.setTotalAmount(cachedTotal);
        } else {
            BigDecimal total = calculateTotalFromDB(orderId);
            order.setTotalAmount(total);
            cacheOrderTotal(orderId, total);
        }
        
        OrderSummary summary = new OrderSummary(order);
        summary.setParticipantCount(participantRepository.findByGroupOrderIdOrderByJoinedAt(orderId).size());
        summary.setItemCount(orderItemRepository.findByGroupOrderIdOrderByCreatedAtDesc(orderId).size());
        
        return summary;
    }

    @Transactional
    public OrderItem addItem(Long orderId, AddItemRequest request) {
        GroupOrder order = getOrderById(orderId);
        
        if (order.getStatus() != GroupOrder.OrderStatus.ACTIVE) {
            throw new BusinessException("拼单已结束或已取消");
        }
        
        OrderItem item = new OrderItem();
        item.setGroupOrderId(orderId);
        item.setItemName(request.getItemName());
        item.setPrice(request.getPrice());
        item.setQuantity(request.getQuantity());
        item.setParticipantName(request.getParticipantName());
        item.setParticipantUserId(request.getParticipantUserId());
        item.setSubtotal(request.getPrice().multiply(new BigDecimal(request.getQuantity())));
        
        OrderItem saved = orderItemRepository.save(item);
        
        Optional<Participant> existingParticipant = participantRepository
                .findByGroupOrderIdAndUserId(orderId, request.getParticipantUserId());
        
        Participant participant;
        if (existingParticipant.isPresent()) {
            participant = existingParticipant.get();
        } else {
            participant = new Participant();
            participant.setGroupOrderId(orderId);
            participant.setUserId(request.getParticipantUserId());
            participant.setUserName(request.getParticipantName());
        }
        
        BigDecimal userTotal = calculateUserTotal(orderId, request.getParticipantUserId());
        participant.setTotalAmount(userTotal);
        participantRepository.save(participant);
        
        BigDecimal newTotal = incrementCachedTotal(orderId, item.getSubtotal());
        order.setTotalAmount(newTotal);
        groupOrderRepository.save(order);
        
        log.info("添加商品: orderId={}, item={}, user={}", orderId, item.getItemName(), item.getParticipantName());
        return saved;
    }

    @Transactional
    public void removeItem(Long itemId, String userId) {
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("商品不存在: " + itemId));
        
        GroupOrder order = getOrderById(item.getGroupOrderId());
        
        if (order.getStatus() != GroupOrder.OrderStatus.ACTIVE) {
            throw new BusinessException("拼单已结束或已取消");
        }
        
        if (!item.getParticipantUserId().equals(userId)) {
            throw new BusinessException("只能删除自己添加的商品");
        }
        
        BigDecimal subtotal = item.getSubtotal();
        orderItemRepository.delete(item);
        
        BigDecimal newTotal = decrementCachedTotal(order.getId(), subtotal);
        order.setTotalAmount(newTotal);
        groupOrderRepository.save(order);
        
        List<OrderItem> remainingItems = orderItemRepository
                .findByGroupOrderIdAndParticipantUserId(order.getId(), userId);
        
        if (remainingItems.isEmpty() && !userId.equals(order.getInitiatorUserId())) {
            participantRepository.findByGroupOrderIdAndUserId(order.getId(), userId)
                    .ifPresent(participantRepository::delete);
        } else {
            BigDecimal userTotal = calculateUserTotal(order.getId(), userId);
            participantRepository.findByGroupOrderIdAndUserId(order.getId(), userId)
                    .ifPresent(p -> {
                        p.setTotalAmount(userTotal);
                        participantRepository.save(p);
                    });
        }
        
        log.info("删除商品: itemId={}, orderId={}", itemId, item.getGroupOrderId());
    }

    public List<OrderItem> getOrderItems(Long orderId) {
        return orderItemRepository.findByGroupOrderIdOrderByCreatedAtDesc(orderId);
    }

    public List<Participant> getParticipants(Long orderId) {
        return participantRepository.findByGroupOrderIdOrderByJoinedAt(orderId);
    }

    public List<RecommendationItem> getRecommendations(Long orderId) {
        GroupOrder order = getOrderById(orderId);
        OrderSummary summary = getOrderSummary(orderId);
        
        if (summary.isCanApplyDiscount()) {
            return Collections.emptyList();
        }
        
        BigDecimal remaining = summary.getRemainingAmount();
        List<RecommendationItem> recommendations = new ArrayList<>();
        
        Optional<Merchant> merchantOpt = merchantRepository.findByName(order.getMerchant());
        if (merchantOpt.isPresent()) {
            List<MerchantItem> items = merchantItemRepository
                    .findByMerchantIdOrderByPriceAsc(merchantOpt.get().getId());
            
            for (MerchantItem item : items) {
                if (item.getPrice().compareTo(remaining) >= 0) {
                    String suggestion = String.format("还差 %.2f 元，建议加购 %s (%.2f 元)，即可享受满减", 
                            remaining, item.getName(), item.getPrice());
                    recommendations.add(new RecommendationItem(item.getName(), item.getPrice(), suggestion));
                }
            }
        }
        
        if (recommendations.isEmpty()) {
            String suggestion = String.format("还差 %.2f 元达到满减门槛，请添加更多商品", remaining);
            recommendations.add(new RecommendationItem("请添加商品", remaining, suggestion));
        }
        
        return recommendations.stream().limit(5).collect(Collectors.toList());
    }

    @Transactional
    public GroupOrder endOrder(Long orderId, String userId) {
        GroupOrder order = getOrderById(orderId);
        
        if (!order.getInitiatorUserId().equals(userId)) {
            throw new BusinessException("只有发起人可以结束拼单");
        }
        
        if (order.getStatus() != GroupOrder.OrderStatus.ACTIVE) {
            throw new BusinessException("拼单已结束或已取消");
        }
        
        OrderSummary summary = getOrderSummary(orderId);
        
        order.setStatus(GroupOrder.OrderStatus.ENDED);
        order.setFinalAmount(summary.getFinalAmount());
        order.setEndedAt(LocalDateTime.now());
        GroupOrder saved = groupOrderRepository.save(order);
        
        if (summary.isCanApplyDiscount()) {
            distributeDiscount(orderId, summary.getDiscountAmount());
        }
        
        clearOrderCache(orderId);
        log.info("结束拼单: orderId={}, finalAmount={}", orderId, saved.getFinalAmount());
        return saved;
    }

    @Transactional
    public GroupOrder cancelOrder(Long orderId, String userId) {
        GroupOrder order = getOrderById(orderId);
        
        if (!order.getInitiatorUserId().equals(userId)) {
            throw new BusinessException("只有发起人可以取消拼单");
        }
        
        if (order.getStatus() != GroupOrder.OrderStatus.ACTIVE) {
            throw new BusinessException("拼单已结束或已取消");
        }
        
        order.setStatus(GroupOrder.OrderStatus.CANCELLED);
        order.setEndedAt(LocalDateTime.now());
        GroupOrder saved = groupOrderRepository.save(order);
        
        clearOrderCache(orderId);
        log.info("取消拼单: orderId={}", orderId);
        return saved;
    }

    public List<ParticipantPayment> getPaymentDetails(Long orderId) {
        GroupOrder order = getOrderById(orderId);
        
        if (order.getStatus() == GroupOrder.OrderStatus.ACTIVE) {
            throw new BusinessException("请先结束拼单");
        }
        
        List<Participant> participants = participantRepository.findByGroupOrderIdOrderByJoinedAt(orderId);
        List<OrderItem> items = orderItemRepository.findByGroupOrderIdOrderByCreatedAtDesc(orderId);
        
        Map<String, List<OrderItem>> itemsByUser = items.stream()
                .collect(Collectors.groupingBy(OrderItem::getParticipantUserId));
        
        List<ParticipantPayment> payments = new ArrayList<>();
        
        for (Participant participant : participants) {
            ParticipantPayment payment = new ParticipantPayment();
            payment.setUserId(participant.getUserId());
            payment.setUserName(participant.getUserName());
            payment.setTotalAmount(participant.getTotalAmount());
            payment.setFinalAmount(participant.getFinalAmount());
            payment.setDiscountAmount(participant.getTotalAmount().subtract(participant.getFinalAmount()));
            
            List<OrderItem> userItems = itemsByUser.getOrDefault(participant.getUserId(), Collections.emptyList());
            for (OrderItem item : userItems) {
                ParticipantPayment.PaymentItem paymentItem = new ParticipantPayment.PaymentItem();
                paymentItem.setItemName(item.getItemName());
                paymentItem.setPrice(item.getPrice());
                paymentItem.setQuantity(item.getQuantity());
                paymentItem.setSubtotal(item.getSubtotal());
                paymentItem.setFinalPrice(item.getFinalPrice());
                payment.getItems().add(paymentItem);
            }
            
            payments.add(payment);
        }
        
        return payments;
    }

    private void distributeDiscount(Long orderId, BigDecimal discountAmount) {
        List<OrderItem> items = orderItemRepository.findByGroupOrderIdOrderByCreatedAtDesc(orderId);
        
        if (items.isEmpty()) {
            return;
        }
        
        BigDecimal total = items.stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        if (total.compareTo(BigDecimal.ZERO) == 0) {
            return;
        }
        
        Map<String, List<OrderItem>> itemsByUser = items.stream()
                .collect(Collectors.groupingBy(OrderItem::getParticipantUserId));
        
        Map<String, BigDecimal> userTotals = new LinkedHashMap<>();
        for (OrderItem item : items) {
            String userId = item.getParticipantUserId();
            if (!userTotals.containsKey(userId)) {
                userTotals.put(userId, BigDecimal.ZERO);
            }
            userTotals.put(userId, userTotals.get(userId).add(item.getSubtotal()));
        }
        
        Map<String, BigDecimal> userDiscounts = new LinkedHashMap<>();
        BigDecimal distributedUserDiscount = BigDecimal.ZERO;
        int userCount = userTotals.size();
        int userIndex = 0;
        
        for (Map.Entry<String, BigDecimal> entry : userTotals.entrySet()) {
            String userId = entry.getKey();
            BigDecimal userTotal = entry.getValue();
            BigDecimal userDiscount;
            
            if (userIndex == userCount - 1) {
                userDiscount = discountAmount.subtract(distributedUserDiscount);
            } else {
                userDiscount = discountAmount
                        .multiply(userTotal)
                        .divide(total, 2, RoundingMode.HALF_UP);
            }
            
            if (userDiscount.compareTo(BigDecimal.ZERO) < 0) {
                userDiscount = BigDecimal.ZERO;
            }
            if (userDiscount.compareTo(userTotal) > 0) {
                userDiscount = userTotal;
            }
            
            userDiscounts.put(userId, userDiscount);
            distributedUserDiscount = distributedUserDiscount.add(userDiscount);
            userIndex++;
        }
        
        for (Map.Entry<String, List<OrderItem>> entry : itemsByUser.entrySet()) {
            String userId = entry.getKey();
            List<OrderItem> userItems = entry.getValue();
            BigDecimal userDiscount = userDiscounts.get(userId);
            BigDecimal userTotal = userTotals.get(userId);
            
            if (userTotal.compareTo(BigDecimal.ZERO) == 0) {
                for (OrderItem item : userItems) {
                    item.setFinalPrice(item.getSubtotal());
                    orderItemRepository.save(item);
                }
                continue;
            }
            
            BigDecimal distributedItemDiscount = BigDecimal.ZERO;
            int itemCount = userItems.size();
            
            for (int i = 0; i < itemCount; i++) {
                OrderItem item = userItems.get(i);
                BigDecimal itemDiscount;
                
                if (i == itemCount - 1) {
                    itemDiscount = userDiscount.subtract(distributedItemDiscount);
                } else {
                    itemDiscount = userDiscount
                            .multiply(item.getSubtotal())
                            .divide(userTotal, 2, RoundingMode.HALF_UP);
                }
                
                if (itemDiscount.compareTo(BigDecimal.ZERO) < 0) {
                    itemDiscount = BigDecimal.ZERO;
                }
                if (itemDiscount.compareTo(item.getSubtotal()) > 0) {
                    itemDiscount = item.getSubtotal();
                }
                
                item.setFinalPrice(item.getSubtotal().subtract(itemDiscount));
                orderItemRepository.save(item);
                
                distributedItemDiscount = distributedItemDiscount.add(itemDiscount);
            }
        }
        
        List<Participant> participants = participantRepository.findByGroupOrderIdOrderByJoinedAt(orderId);
        for (Participant participant : participants) {
            participant.setTotalAmount(userTotals.getOrDefault(participant.getUserId(), BigDecimal.ZERO));
            BigDecimal userDiscount = userDiscounts.getOrDefault(participant.getUserId(), BigDecimal.ZERO);
            BigDecimal userTotal = userTotals.getOrDefault(participant.getUserId(), BigDecimal.ZERO);
            participant.setFinalAmount(userTotal.subtract(userDiscount));
            participantRepository.save(participant);
        }
    }

    private BigDecimal calculateTotalFromDB(Long orderId) {
        List<OrderItem> items = orderItemRepository.findByGroupOrderIdOrderByCreatedAtDesc(orderId);
        return items.stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateUserTotal(Long orderId, String userId) {
        List<OrderItem> items = orderItemRepository.findByGroupOrderIdAndParticipantUserId(orderId, userId);
        return items.stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void cacheOrderTotal(Long orderId, BigDecimal total) {
        String key = ORDER_TOTAL_CACHE_PREFIX + orderId;
        redisTemplate.opsForValue().set(key, total, CACHE_EXPIRE_HOURS, TimeUnit.HOURS);
    }

    private BigDecimal getCachedTotal(Long orderId) {
        String key = ORDER_TOTAL_CACHE_PREFIX + orderId;
        Object value = redisTemplate.opsForValue().get(key);
        if (value instanceof Number) {
            return new BigDecimal(value.toString());
        }
        return null;
    }

    private BigDecimal incrementCachedTotal(Long orderId, BigDecimal amount) {
        String key = ORDER_TOTAL_CACHE_PREFIX + orderId;
        BigDecimal current = getCachedTotal(orderId);
        
        if (current == null) {
            current = calculateTotalFromDB(orderId);
        }
        
        BigDecimal newTotal = current.add(amount);
        cacheOrderTotal(orderId, newTotal);
        return newTotal;
    }

    private BigDecimal decrementCachedTotal(Long orderId, BigDecimal amount) {
        String key = ORDER_TOTAL_CACHE_PREFIX + orderId;
        BigDecimal current = getCachedTotal(orderId);
        
        if (current == null) {
            current = calculateTotalFromDB(orderId);
        }
        
        BigDecimal newTotal = current.subtract(amount);
        if (newTotal.compareTo(BigDecimal.ZERO) < 0) {
            newTotal = BigDecimal.ZERO;
        }
        
        cacheOrderTotal(orderId, newTotal);
        return newTotal;
    }

    private void clearOrderCache(Long orderId) {
        String key = ORDER_TOTAL_CACHE_PREFIX + orderId;
        redisTemplate.delete(key);
    }
}
