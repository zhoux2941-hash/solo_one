package com.fulfillment.order.service;

import com.fulfillment.order.common.PageResult;
import com.fulfillment.order.dto.CreateOrderDTO;
import com.fulfillment.order.dto.OrderItemDTO;
import com.fulfillment.order.dto.OrderQueryDTO;
import com.fulfillment.order.entity.Order;
import com.fulfillment.order.entity.OrderItem;
import com.fulfillment.order.entity.Product;
import com.fulfillment.order.enums.OrderStatus;
import com.fulfillment.order.mapper.OrderItemMapper;
import com.fulfillment.order.mapper.OrderMapper;
import io.seata.core.context.RootContext;
import io.seata.spring.annotation.GlobalTransactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final InventoryService inventoryService;
    private final FulfillmentLogService fulfillmentLogService;

    private final Map<String, Integer> stockBeforeDeduction = new ConcurrentHashMap<>();

    @GlobalTransactional(rollbackFor = Exception.class, timeoutMills = 300000)
    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
    public Order createOrder(CreateOrderDTO dto) {
        String xid = RootContext.getXID();
        String orderNo = generateOrderNo();
        
        log.info("开始创建订单, XID: {}, orderNo: {}, userId: {}", xid, orderNo, dto.getUserId());
        
        if (xid == null) {
            log.warn("Seata 全局事务未生效！");
        }

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderItemDTO itemDTO : dto.getItems()) {
            Product product = inventoryService.getProduct(itemDTO.getProductId());
            if (product == null) {
                log.error("商品不存在, productId: {}", itemDTO.getProductId());
                throw new RuntimeException("商品不存在: " + itemDTO.getProductId());
            }

            stockBeforeDeduction.put(orderNo + "_" + product.getId(), product.getStock());

            log.info("处理商品: productId={}, name={}, 库存={}, 单价={}", 
                    product.getId(), product.getProductName(), product.getStock(), product.getPrice());

            inventoryService.deductStock(itemDTO.getProductId(), itemDTO.getQuantity());

            BigDecimal itemTotal = product.getPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);

            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(itemDTO.getProductId());
            orderItem.setProductName(product.getProductName());
            orderItem.setPrice(product.getPrice());
            orderItem.setQuantity(itemDTO.getQuantity());
            orderItem.setTotalPrice(itemTotal);
            orderItems.add(orderItem);
        }

        Order order = new Order();
        order.setOrderNo(orderNo);
        order.setUserId(dto.getUserId());
        order.setTotalAmount(totalAmount);
        order.setStatus(OrderStatus.CREATED.getCode());
        order.setReceiverName(dto.getReceiverName());
        order.setReceiverPhone(dto.getReceiverPhone());
        order.setReceiverAddress(dto.getReceiverAddress());
        
        log.info("准备插入订单, orderNo: {}, 总金额: {}", orderNo, totalAmount);
        orderMapper.insert(order);
        log.info("订单插入成功, orderId: {}", order.getId());

        for (OrderItem orderItem : orderItems) {
            orderItem.setOrderId(order.getId());
            orderItem.setOrderNo(orderNo);
        }
        orderItemMapper.batchInsert(orderItems);
        log.info("订单明细插入成功, 数量: {}", orderItems.size());

        fulfillmentLogService.saveLog(
                orderNo,
                dto.getUserId(),
                "CREATE",
                "订单创建成功, XID: " + xid,
                "SYSTEM",
                null,
                OrderStatus.CREATED.getCode()
        );

        log.info("订单创建完成, XID: {}, orderNo: {}, 总金额: {}, 商品数量: {}", 
                xid, orderNo, totalAmount, orderItems.size());
        
        stockBeforeDeduction.remove(orderNo);
        order.setItems(orderItems);
        return order;
    }

    public Order getOrderByOrderNo(String orderNo) {
        Order order = orderMapper.selectByOrderNo(orderNo);
        if (order != null) {
            order.setItems(orderItemMapper.selectByOrderId(order.getId()));
        }
        return order;
    }

    public PageResult<Order> queryOrders(OrderQueryDTO query) {
        List<Order> orders = orderMapper.selectList(query);
        
        // 按 orderNo 去重，防止数据重复
        List<Order> uniqueOrders = orders.stream()
                .collect(java.util.stream.Collectors.toMap(
                        Order::getOrderNo,
                        order -> order,
                        (existing, replacement) -> existing
                ))
                .values()
                .stream()
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .collect(java.util.stream.Collectors.toList());
        
        Long total = orderMapper.selectCount(query);
        log.info("分页查询完成, 原始数量: {}, 去重后数量: {}, 总数: {}", 
                orders.size(), uniqueOrders.size(), total);
        
        return new PageResult<>(uniqueOrders, total, query.getPageNum(), query.getPageSize());
    }

    public List<Order> queryOrdersByCursor(String orderNo, Long userId, String status, Long lastId, Integer pageSize) {
        List<Order> orders = orderMapper.selectListByCursor(orderNo, userId, status, lastId, pageSize);
        
        // 按 orderNo 去重
        List<Order> uniqueOrders = orders.stream()
                .collect(java.util.stream.Collectors.toMap(
                        Order::getOrderNo,
                        order -> order,
                        (existing, replacement) -> existing
                ))
                .values()
                .stream()
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .collect(java.util.stream.Collectors.toList());
        
        log.info("游标分页查询完成, lastId: {}, 原始数量: {}, 去重后数量: {}", 
                lastId, orders.size(), uniqueOrders.size());
        
        return uniqueOrders;
    }

    @Transactional(rollbackFor = Exception.class)
    public boolean payOrder(String orderNo) {
        Order order = orderMapper.selectByOrderNo(orderNo);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        if (!OrderStatus.CREATED.getCode().equals(order.getStatus())) {
            throw new RuntimeException("订单状态不正确");
        }

        orderMapper.updatePaymentStatus(order.getId(), OrderStatus.PAID.getCode(), LocalDateTime.now());

        fulfillmentLogService.saveLog(
                orderNo,
                order.getUserId(),
                "PAY",
                "订单支付成功",
                "USER",
                OrderStatus.CREATED.getCode(),
                OrderStatus.PAID.getCode()
        );

        log.info("订单支付成功, orderNo: {}", orderNo);
        return true;
    }

    @Transactional(rollbackFor = Exception.class)
    public boolean shipOrder(String orderNo) {
        Order order = orderMapper.selectByOrderNo(orderNo);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        if (!OrderStatus.PAID.getCode().equals(order.getStatus())) {
            throw new RuntimeException("订单状态不正确，需先支付");
        }

        orderMapper.updateShipStatus(order.getId(), OrderStatus.SHIPPED.getCode(), LocalDateTime.now());

        fulfillmentLogService.saveLog(
                orderNo,
                order.getUserId(),
                "SHIP",
                "订单已发货",
                "ADMIN",
                OrderStatus.PAID.getCode(),
                OrderStatus.SHIPPED.getCode()
        );

        log.info("订单发货成功, orderNo: {}", orderNo);
        return true;
    }

    @Transactional(rollbackFor = Exception.class)
    public boolean deliverOrder(String orderNo) {
        Order order = orderMapper.selectByOrderNo(orderNo);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        if (!OrderStatus.SHIPPED.getCode().equals(order.getStatus())) {
            throw new RuntimeException("订单状态不正确，需先发货");
        }

        orderMapper.updateDeliveryStatus(order.getId(), OrderStatus.DELIVERED.getCode(), LocalDateTime.now());

        fulfillmentLogService.saveLog(
                orderNo,
                order.getUserId(),
                "DELIVERY",
                "订单已签收",
                "USER",
                OrderStatus.SHIPPED.getCode(),
                OrderStatus.DELIVERED.getCode()
        );

        log.info("订单签收成功, orderNo: {}", orderNo);
        return true;
    }

    @Transactional(rollbackFor = Exception.class)
    public boolean cancelOrder(String orderNo, String reason) {
        Order order = orderMapper.selectByOrderNo(orderNo);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        if (!OrderStatus.CREATED.getCode().equals(order.getStatus())) {
            throw new RuntimeException("订单状态不正确，只能取消待支付订单");
        }

        orderMapper.updateCancelStatus(order.getId(), OrderStatus.CANCELLED.getCode(), LocalDateTime.now(), reason);

        List<OrderItem> items = orderItemMapper.selectByOrderId(order.getId());
        for (OrderItem item : items) {
            inventoryService.rollbackStock(item.getProductId(), item.getQuantity());
        }

        fulfillmentLogService.saveLog(
                orderNo,
                order.getUserId(),
                "CANCEL",
                "订单取消成功，原因: " + reason,
                "USER",
                OrderStatus.CREATED.getCode(),
                OrderStatus.CANCELLED.getCode()
        );

        log.info("订单取消成功, orderNo: {}", orderNo);
        return true;
    }

    private String generateOrderNo() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "ORD" + date + uuid;
    }
}