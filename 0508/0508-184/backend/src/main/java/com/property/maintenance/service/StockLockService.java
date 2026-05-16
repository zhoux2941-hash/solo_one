package com.property.maintenance.service;

import com.property.maintenance.entity.SparePart;
import com.property.maintenance.entity.StockLock;
import com.property.maintenance.exception.BusinessException;
import com.property.maintenance.repository.SparePartRepository;
import com.property.maintenance.repository.StockLockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

@Service
public class StockLockService {

    @Autowired
    private StockLockRepository stockLockRepository;

    @Autowired
    private SparePartRepository sparePartRepository;

    @Value("${stock.lock.minutes:30}")
    private int lockMinutes;

    private final ConcurrentHashMap<Long, ReentrantLock> sparePartLocks = new ConcurrentHashMap<>();

    @Transactional(rollbackFor = Exception.class)
    public boolean lockStock(Long orderId, Long sparePartId, Integer quantity) {
        List<StockLock> existingLocks = stockLockRepository.findByOrderId(orderId);
        if (!existingLocks.isEmpty()) {
            for (StockLock lock : existingLocks) {
                if (lock.getSparePartId().equals(sparePartId) && "LOCKED".equals(lock.getStatus())) {
                    return true;
                }
            }
        }

        ReentrantLock lock = sparePartLocks.computeIfAbsent(sparePartId, k -> new ReentrantLock());
        lock.lock();
        try {
            SparePart sparePart = sparePartRepository.findById(sparePartId).orElse(null);
            if (sparePart == null) {
                throw new BusinessException("SPARE_PART_NOT_FOUND", "备件不存在");
            }

            int availableStock = sparePart.getStockQuantity() - sparePart.getLockedQuantity();
            if (availableStock < quantity) {
                return false;
            }

            int updated = sparePartRepository.lockStock(sparePartId, quantity);
            if (updated > 0) {
                StockLock stockLock = new StockLock();
                stockLock.setOrderId(orderId);
                stockLock.setSparePartId(sparePartId);
                stockLock.setQuantity(quantity);
                stockLock.setLockTime(LocalDateTime.now());
                stockLock.setExpireTime(LocalDateTime.now().plusMinutes(lockMinutes));
                stockLock.setStatus("LOCKED");
                stockLock.setCreatedAt(LocalDateTime.now());
                stockLockRepository.save(stockLock);
                return true;
            }
            return false;
        } finally {
            lock.unlock();
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void releaseExpiredLocks() {
        LocalDateTime now = LocalDateTime.now();
        List<StockLock> expiredLocks = stockLockRepository.findByStatusAndExpireTimeBefore("LOCKED", now);

        for (StockLock lock : expiredLocks) {
            ReentrantLock spareLock = sparePartLocks.computeIfAbsent(lock.getSparePartId(), k -> new ReentrantLock());
            spareLock.lock();
            try {
                sparePartRepository.unlockStock(lock.getSparePartId(), lock.getQuantity());
                lock.setStatus("RELEASED");
                stockLockRepository.save(lock);
            } finally {
                spareLock.unlock();
            }
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public boolean confirmUseStock(Long orderId) {
        List<StockLock> locks = stockLockRepository.findByOrderId(orderId);
        for (StockLock lock : locks) {
            if ("LOCKED".equals(lock.getStatus())) {
                ReentrantLock spareLock = sparePartLocks.computeIfAbsent(lock.getSparePartId(), k -> new ReentrantLock());
                spareLock.lock();
                try {
                    sparePartRepository.deductStock(lock.getSparePartId(), lock.getQuantity());
                    lock.setStatus("USED");
                    stockLockRepository.save(lock);
                } finally {
                    spareLock.unlock();
                }
            }
        }
        return true;
    }

    @Transactional(rollbackFor = Exception.class)
    public void releaseStockByOrderId(Long orderId) {
        List<StockLock> locks = stockLockRepository.findByOrderId(orderId);
        for (StockLock lock : locks) {
            if ("LOCKED".equals(lock.getStatus())) {
                ReentrantLock spareLock = sparePartLocks.computeIfAbsent(lock.getSparePartId(), k -> new ReentrantLock());
                spareLock.lock();
                try {
                    sparePartRepository.unlockStock(lock.getSparePartId(), lock.getQuantity());
                    lock.setStatus("RELEASED");
                    stockLockRepository.save(lock);
                } finally {
                    spareLock.unlock();
                }
            }
        }
    }

    public boolean hasLockedStock(Long orderId) {
        List<StockLock> locks = stockLockRepository.findByOrderId(orderId);
        return locks.stream().anyMatch(lock -> "LOCKED".equals(lock.getStatus()));
    }
}
