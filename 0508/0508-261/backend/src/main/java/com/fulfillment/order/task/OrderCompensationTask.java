package com.fulfillment.order.task;

import com.fulfillment.order.entity.Order;
import com.fulfillment.order.entity.OrderItem;
import com.fulfillment.order.enums.OrderStatus;
import com.fulfillment.order.mapper.OrderItemMapper;
import com.fulfillment.order.mapper.OrderMapper;
import com.fulfillment.order.service.DistributedLockService;
import com.fulfillment.order.service.FulfillmentLogService;
import com.fulfillment.order.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderCompensationTask {

    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final InventoryService inventoryService;
    private final FulfillmentLogService fulfillmentLogService;
    private final DistributedLockService distributedLockService;

    private static final int TIMEOUT_MINUTES = 30;
    private static final String LOCK_KEY = "ORDER_COMPENSATION_TASK";
    private static final int LOCK_EXPIRE_SECONDS = 180;

    @Scheduled(fixedDelay = 60000)
    public void compensateTimeoutOrders() {
        log.info("开始尝试执行超时订单补偿任务...");

        distributedLockService.executeWithLock(LOCK_KEY, LOCK_EXPIRE_SECONDS, new DistributedLockService.LockCallback() {
            @Override
            public void execute() throws Exception {
                try {
                    doCompensate();
                } catch (Exception e) {
                    log.error("超时订单补偿任务执行失败", e);
                    throw e;
                }
            }
        });
    }

    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
    public void doCompensate() {
        long startTime = System.currentTimeMillis();
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);
        AtomicInteger skipCount = new AtomicInteger(0);

        try {
            log.info("获取到分布式锁，开始执行超时订单补偿任务");

            List<Order> timeoutOrders = orderMapper.selectTimeoutOrders(TIMEOUT_MINUTES);
            log.info("发现{}个超时订单待处理", timeoutOrders.size());

            for (Order order : timeoutOrders) {
                try {
                    boolean compensated = compensateOrder(order);
                    if (compensated) {
                        successCount.incrementAndGet();
                    } else {
                        skipCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    failCount.incrementAndGet();
                    log.error("补偿订单失败, orderNo: {}", order.getOrderNo(), e);
                }
            }

            long costTime = System.currentTimeMillis() - startTime;
            log.info("超时订单补偿任务执行完成, 成功: {}, 失败: {}, 跳过: {}, 耗时: {}ms",
                    successCount.get(), failCount.get(), skipCount.get(), costTime);

        } finally {
            distributedLockService.cleanExpiredLocks();
        }
    }

    private boolean compensateOrder(Order order) {
        String orderNo = order.getOrderNo();
        log.info("开始补偿超时订单: {}", orderNo);

        Order currentOrder = orderMapper.selectByOrderNo(orderNo);
        if (currentOrder == null) {
            log.warn("订单不存在, orderNo: {}", orderNo);
            return false;
        }

        if (!OrderStatus.CREATED.getCode().equals(currentOrder.getStatus())) {
            log.warn("订单状态不是待支付，跳过补偿, orderNo: {}, status: {}", orderNo, currentOrder.getStatus());
            return false;
        }

        int rows = orderMapper.updateCancelStatusWithCondition(
                order.getId(),
                OrderStatus.CANCELLED.getCode(),
                OrderStatus.CREATED.getCode(),
                LocalDateTime.now(),
                "超时未支付自动取消"
        );

        if (rows == 0) {
            log.warn("订单状态已被其他节点修改，跳过补偿, orderNo: {}", orderNo);
            return false;
        }

        log.info("订单状态已更新为取消, orderNo: {}", orderNo);

        List<OrderItem> items = orderItemMapper.selectByOrderId(order.getId());
        for (OrderItem item : items) {
            boolean rollbackSuccess = inventoryService.rollbackStockWithCheck(
                    item.getProductId(),
                    item.getQuantity(),
                    orderNo
            );
            if (rollbackSuccess) {
                log.info("库存回滚成功, orderNo: {}, productId: {}, quantity: {}",
                        orderNo, item.getProductId(), item.getQuantity());
            } else {
                log.warn("库存回滚跳过（可能已回滚过）, orderNo: {}, productId: {}",
                        orderNo, item.getProductId());
            }
        }

        fulfillmentLogService.saveLog(
                orderNo,
                order.getUserId(),
                "COMPENSATE",
                "超时未支付自动取消，库存已回滚",
                "SYSTEM",
                OrderStatus.CREATED.getCode(),
                OrderStatus.CANCELLED.getCode()
        );

        log.info("超时订单补偿成功: {}", orderNo);
        return true;
    }
}