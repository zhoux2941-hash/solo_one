package com.fulfillment.order.service;

import com.fulfillment.order.entity.Product;
import com.fulfillment.order.mapper.FulfillmentLogMapper;
import com.fulfillment.order.mapper.ProductMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final ProductMapper productMapper;
    private final FulfillmentLogMapper fulfillmentLogMapper;

    @Transactional(propagation = Propagation.MANDATORY, rollbackFor = Exception.class)
    public boolean deductStock(Long productId, Integer quantity) {
        Product product = productMapper.selectById(productId);
        if (product == null) {
            throw new RuntimeException("商品不存在: " + productId);
        }
        
        log.info("准备扣减库存, productId: {}, productName: {}, 当前库存: {}, 扣减数量: {}", 
                productId, product.getProductName(), product.getStock(), quantity);
        
        int rows = productMapper.deductStockAtomic(productId, quantity);
        if (rows == 0) {
            Integer currentStock = productMapper.selectStockById(productId);
            log.error("扣减库存失败, productId: {}, 当前库存: {}, 扣减数量: {}", productId, currentStock, quantity);
            throw new RuntimeException("扣减库存失败，库存不足或商品不存在, 当前库存: " + currentStock + ", 扣减数量: " + quantity);
        }
        
        Integer afterStock = productMapper.selectStockById(productId);
        log.info("扣减库存成功, productId: {}, quantity: {}, 扣减后库存: {}", productId, quantity, afterStock);
        return true;
    }

    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
    public boolean rollbackStock(Long productId, Integer quantity) {
        log.info("准备回滚库存, productId: {}, quantity: {}", productId, quantity);
        int rows = productMapper.rollbackStock(productId, quantity);
        Integer afterStock = productMapper.selectStockById(productId);
        log.info("回滚库存完成, productId: {}, quantity: {}, rows: {}, 回滚后库存: {}", 
                productId, quantity, rows, afterStock);
        return rows > 0;
    }

    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
    public boolean rollbackStockWithCheck(Long productId, Integer quantity, String orderNo) {
        log.info("带检查的库存回滚, productId: {}, quantity: {}, orderNo: {}", productId, quantity, orderNo);

        boolean hasRollback = checkStockRollbackRecord(productId, orderNo);
        if (hasRollback) {
            log.warn("该订单商品已回滚过库存，跳过重复回滚, productId: {}, orderNo: {}", productId, orderNo);
            return false;
        }

        int rows = productMapper.rollbackStock(productId, quantity);
        if (rows > 0) {
            Integer afterStock = productMapper.selectStockById(productId);
            log.info("库存回滚成功, productId: {}, quantity: {}, 回滚后库存: {}", productId, quantity, afterStock);
            return true;
        } else {
            log.warn("库存回滚未执行，可能已被其他节点处理, productId: {}, orderNo: {}", productId, orderNo);
            return false;
        }
    }

    private boolean checkStockRollbackRecord(Long productId, String orderNo) {
        try {
            var logs = fulfillmentLogMapper.selectByOrderNo(orderNo);
            if (logs != null && !logs.isEmpty()) {
                for (var logEntry : logs) {
                    if ("COMPENSATE".equals(logEntry.getOperationType()) || "CANCEL".equals(logEntry.getOperationType())) {
                        log.info("发现该订单已有补偿或取消记录, orderNo: {}, 跳过重复库存回滚", orderNo);
                        return true;
                    }
                }
            }
            return false;
        } catch (Exception e) {
            log.error("检查库存回滚记录异常", e);
            return false;
        }
    }

    public Product getProduct(Long productId) {
        return productMapper.selectById(productId);
    }

    public Integer getStock(Long productId) {
        return productMapper.selectStockById(productId);
    }
}