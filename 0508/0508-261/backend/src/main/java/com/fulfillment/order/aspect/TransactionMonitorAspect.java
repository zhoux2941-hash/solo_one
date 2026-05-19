package com.fulfillment.order.aspect;

import com.fulfillment.order.entity.Order;
import com.fulfillment.order.entity.OrderItem;
import com.fulfillment.order.mapper.OrderMapper;
import com.fulfillment.order.mapper.ProductMapper;
import io.seata.core.context.RootContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class TransactionMonitorAspect {

    private final ProductMapper productMapper;
    private final OrderMapper orderMapper;
    
    private final Map<String, Map<Long, Integer>> orderStockSnapshot = new ConcurrentHashMap<>();

    @Pointcut("execution(* com.fulfillment.order.service.OrderService.createOrder(..))")
    public void createOrderPointcut() {}

    @Around("createOrderPointcut()")
    public Object aroundCreateOrder(ProceedingJoinPoint joinPoint) throws Throwable {
        String xid = RootContext.getXID();
        long startTime = System.currentTimeMillis();
        
        log.info("[事务监控] 开始执行订单创建, XID: {}, 方法: {}", xid, joinPoint.getSignature().getName());
        
        if (xid == null) {
            log.warn("[事务监控] Seata 全局事务 XID 为空，分布式事务可能未生效！");
        }
        
        try {
            Object result = joinPoint.proceed();
            
            if (result instanceof Order) {
                Order order = (Order) result;
                log.info("[事务监控] 订单创建方法执行完成, orderNo: {}, 准备提交事务", order.getOrderNo());
                
                registerTransactionSynchronization(order);
            }
            
            return result;
        } catch (Exception e) {
            log.error("[事务监控] 订单创建执行异常: {}", e.getMessage(), e);
            throw e;
        } finally {
            long costTime = System.currentTimeMillis() - startTime;
            log.info("[事务监控] 订单创建方法执行耗时: {}ms", costTime);
        }
    }

    private void registerTransactionSynchronization(Order order) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    log.info("[事务监控] 事务提交成功, orderNo: {}", order.getOrderNo());
                    verifyStockDeduction(order);
                }

                @Override
                public void afterCompletion(int status) {
                    if (status == STATUS_ROLLED_BACK) {
                        log.warn("[事务监控] 事务已回滚, orderNo: {}", order.getOrderNo());
                    }
                    orderStockSnapshot.remove(order.getOrderNo());
                }
            });
        } else {
            log.error("[事务监控] 没有活动的事务！orderNo: {}", order.getOrderNo());
        }
    }

    private void verifyStockDeduction(Order order) {
        try {
            Order fullOrder = orderMapper.selectByOrderNo(order.getOrderNo());
            if (fullOrder == null) {
                log.error("[库存校验] 订单不存在, orderNo: {}", order.getOrderNo());
                return;
            }

            List<OrderItem> items = (List<OrderItem>) order.getItems();
            if (items == null || items.isEmpty()) {
                log.warn("[库存校验] 订单商品为空, orderNo: {}", order.getOrderNo());
                return;
            }

            log.info("[库存校验] 开始校验订单库存扣减, orderNo: {}, 商品数: {}", order.getOrderNo(), items.size());

            for (OrderItem item : items) {
                Integer currentStock = productMapper.selectStockById(item.getProductId());
                log.info("[库存校验] 商品: productId={}, name={}, 购买数量={}, 当前库存={}",
                        item.getProductId(), item.getProductName(), item.getQuantity(), currentStock);
            }

            log.info("[库存校验] 订单 {} 库存校验完成", order.getOrderNo());
        } catch (Exception e) {
            log.error("[库存校验] 校验异常", e);
        }
    }
}
