package com.company.watermonitor.config;

import com.company.watermonitor.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final InventoryService inventoryService;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("[数据初始化] 开始检查并初始化库存数据...");
        inventoryService.initializeDefaultInventories();
        log.info("[数据初始化] 库存数据初始化完成");
    }
}
