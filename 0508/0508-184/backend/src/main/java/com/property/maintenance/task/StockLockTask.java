package com.property.maintenance.task;

import com.property.maintenance.service.StockLockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class StockLockTask {

    @Autowired
    private StockLockService stockLockService;

    @Scheduled(fixedRate = 60000)
    public void releaseExpiredLocks() {
        stockLockService.releaseExpiredLocks();
    }
}
