package com.property.maintenance.service;

import com.property.maintenance.entity.*;
import com.property.maintenance.exception.BusinessException;
import com.property.maintenance.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

@Service
public class RepairOrderService {

    @Autowired
    private RepairOrderRepository repairOrderRepository;

    @Autowired
    private SparePartRepository sparePartRepository;

    @Autowired
    private StockLockService stockLockService;

    @Autowired
    private PurchaseRequestService purchaseRequestService;

    @Autowired
    private SparePartUsageRepository sparePartUsageRepository;

    private final ConcurrentHashMap<String, ReentrantLock> createOrderLocks = new ConcurrentHashMap<>();

    private final ConcurrentHashMap<String, LocalDateTime> recentRequests = new ConcurrentHashMap<>();

    @Transactional(rollbackFor = Exception.class)
    public RepairOrder createOrder(RepairOrder order, String requestId) {
        if (requestId != null && !requestId.isEmpty()) {
            if (isDuplicateRequest(requestId)) {
                throw new BusinessException("DUPLICATE_SUBMIT", "请求过于频繁，请稍后再试");
            }
            recentRequests.put(requestId, LocalDateTime.now());
        }

        String lockKey = generateLockKey(order);
        ReentrantLock lock = createOrderLocks.computeIfAbsent(lockKey, k -> new ReentrantLock());
        
        boolean acquired = false;
        try {
            acquired = lock.tryLock(5, TimeUnit.SECONDS);
            if (!acquired) {
                throw new BusinessException("LOCK_TIMEOUT", "系统繁忙，请稍后再试");
            }

            order.setOrderNo(generateOrderNo());
            order.setStatus("PENDING");
            order.setCreatedAt(LocalDateTime.now());
            order.setUpdatedAt(LocalDateTime.now());

            RepairOrder savedOrder = repairOrderRepository.save(order);

            if (order.getSparePartId() != null && order.getSparePartQuantity() != null && order.getSparePartQuantity() > 0) {
                boolean locked = stockLockService.lockStock(savedOrder.getId(), order.getSparePartId(), order.getSparePartQuantity());

                if (!locked) {
                    purchaseRequestService.autoCreatePurchaseRequest(order.getSparePartId(), order.getSparePartQuantity());
                }
            }

            return savedOrder;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException("SYSTEM_ERROR", "系统异常，请稍后再试");
        } finally {
            if (acquired) {
                lock.unlock();
            }
            createOrderLocks.remove(lockKey);
        }
    }

    private boolean isDuplicateRequest(String requestId) {
        LocalDateTime lastRequest = recentRequests.get(requestId);
        if (lastRequest != null) {
            long seconds = java.time.Duration.between(lastRequest, LocalDateTime.now()).getSeconds();
            if (seconds < 3) {
                return true;
            }
        }
        recentRequests.entrySet().removeIf(entry -> 
            java.time.Duration.between(entry.getValue(), LocalDateTime.now()).getSeconds() > 60
        );
        return false;
    }

    private String generateLockKey(RepairOrder order) {
        StringBuilder sb = new StringBuilder();
        sb.append(order.getOwnerId() != null ? order.getOwnerId() : "0");
        sb.append("_");
        sb.append(order.getRepairType() != null ? order.getRepairType().hashCode() : "0");
        sb.append("_");
        sb.append(order.getDescription() != null ? order.getDescription().hashCode() : "0");
        return sb.toString();
    }

    @Transactional(rollbackFor = Exception.class)
    public RepairOrder createOrder(RepairOrder order) {
        return createOrder(order, null);
    }

    @Transactional(rollbackFor = Exception.class)
    public RepairOrder assignOrder(Long orderId, Long repairmanId) {
        RepairOrder order = repairOrderRepository.findById(orderId).orElse(null);
        if (order == null) {
            return null;
        }
        order.setRepairmanId(repairmanId);
        order.setStatus("ASSIGNED");
        order.setAssignedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        return repairOrderRepository.save(order);
    }

    @Transactional(rollbackFor = Exception.class)
    public boolean pickupSparePart(Long orderId, Long repairmanId) {
        RepairOrder order = repairOrderRepository.findById(orderId).orElse(null);
        if (order == null) {
            return false;
        }
        if (!order.getRepairmanId().equals(repairmanId)) {
            return false;
        }

        if (stockLockService.hasLockedStock(orderId)) {
            throw new BusinessException("DUPLICATE_PICKUP", "备件已领取，请勿重复操作");
        }

        if (order.getSparePartId() != null && order.getSparePartQuantity() != null && order.getSparePartQuantity() > 0) {
            stockLockService.confirmUseStock(orderId);

            SparePartUsage usage = new SparePartUsage();
            usage.setOrderId(orderId);
            usage.setRepairmanId(repairmanId);
            usage.setSparePartId(order.getSparePartId());
            usage.setQuantity(order.getSparePartQuantity());
            usage.setUsedAt(LocalDateTime.now());
            sparePartUsageRepository.save(usage);
        }

        order.setStatus("IN_PROGRESS");
        order.setStartTime(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        repairOrderRepository.save(order);

        return true;
    }

    @Transactional(rollbackFor = Exception.class)
    public RepairOrder completeOrder(Long orderId) {
        RepairOrder order = repairOrderRepository.findById(orderId).orElse(null);
        if (order == null) {
            return null;
        }
        if ("COMPLETED".equals(order.getStatus())) {
            throw new BusinessException("DUPLICATE_COMPLETE", "工单已完成，请勿重复操作");
        }
        order.setStatus("COMPLETED");
        order.setCompleteTime(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        return repairOrderRepository.save(order);
    }

    @Transactional(rollbackFor = Exception.class)
    public RepairOrder cancelOrder(Long orderId) {
        RepairOrder order = repairOrderRepository.findById(orderId).orElse(null);
        if (order == null) {
            return null;
        }
        if ("CANCELLED".equals(order.getStatus())) {
            throw new BusinessException("DUPLICATE_CANCEL", "工单已取消，请勿重复操作");
        }
        order.setStatus("CANCELLED");
        order.setUpdatedAt(LocalDateTime.now());

        stockLockService.releaseStockByOrderId(orderId);

        return repairOrderRepository.save(order);
    }

    public List<RepairOrder> getAllOrders() {
        return repairOrderRepository.findAll();
    }

    public List<RepairOrder> getOrdersByStatus(String status) {
        return repairOrderRepository.findByStatus(status);
    }

    public List<RepairOrder> getOrdersByRepairman(Long repairmanId) {
        return repairOrderRepository.findByRepairmanId(repairmanId);
    }

    private String generateOrderNo() {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = repairOrderRepository.count() + 1;
        return String.format("WO%s%04d", dateStr, count);
    }
}
