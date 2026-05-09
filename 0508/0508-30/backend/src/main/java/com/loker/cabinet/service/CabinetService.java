package com.loker.cabinet.service;

import com.loker.cabinet.entity.CabinetCell;
import com.loker.cabinet.repository.CabinetRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CabinetService {
    
    private static final Logger logger = LoggerFactory.getLogger(CabinetService.class);
    
    @Autowired
    private CabinetRepository cabinetRepository;
    
    @Cacheable(value = "cabinetFatigue", key = "'allCells'", cacheManager = "cacheManager")
    public List<CabinetCell> getAllCellFatigue() {
        try {
            return cabinetRepository.findAllCells();
        } catch (Exception e) {
            logger.error("缓存操作失败，直接从数据源加载数据: {}", e.getMessage(), e);
            return cabinetRepository.findAllCells();
        }
    }
    
    public List<CabinetCell> getCellFatigueWithFallback() {
        try {
            return getAllCellFatigue();
        } catch (Exception e) {
            logger.warn("Redis 缓存不可用，使用回退策略直接从 mock 数据源加载: {}", e.getMessage());
            return cabinetRepository.findAllCells();
        }
    }
}
