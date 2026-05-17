package com.scenic.service;

import com.scenic.entity.Employee;
import com.scenic.entity.Material;
import com.scenic.entity.MaterialRecord;
import com.scenic.repository.EmployeeRepository;
import com.scenic.repository.MaterialRecordRepository;
import com.scenic.repository.MaterialRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class MaterialRecordService {

    @Autowired
    private MaterialRecordRepository recordRepository;

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    public Optional<MaterialRecord> findById(Long id) {
        return recordRepository.findById(id);
    }

    public Optional<MaterialRecord> findByRecordCode(String recordCode) {
        return recordRepository.findByRecordCode(recordCode);
    }

    public Page<MaterialRecord> findByPage(String keyword, String recordType, Long materialId, 
            LocalDateTime startTime, LocalDateTime endTime, Pageable pageable) {
        return recordRepository.findByConditions(keyword, recordType, materialId, startTime, endTime, pageable);
    }

    public List<MaterialRecord> findByMaterialId(Long materialId) {
        return recordRepository.findByMaterialIdOrderByCreateTimeDesc(materialId);
    }

    @Transactional
    public Map<String, Object> stockIn(MaterialRecord record, Long materialId, Long operatorId) {
        Material material = materialRepository.findById(materialId).orElse(null);
        if (material == null) {
            return Map.of("success", false, "message", "物资不存在");
        }

        if (record.getQuantity() == null || record.getQuantity() <= 0) {
            return Map.of("success", false, "message", "入库数量必须大于0");
        }

        int stockBefore = material.getCurrentStock() == null ? 0 : material.getCurrentStock();
        int stockAfter = stockBefore + record.getQuantity();

        record.setRecordCode("REC" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        record.setMaterial(material);
        record.setRecordType("入库");
        record.setStockBefore(stockBefore);
        record.setStockAfter(stockAfter);

        if (record.getUnitPrice() == null && material.getUnitPrice() != null) {
            record.setUnitPrice(material.getUnitPrice());
        }
        if (record.getUnitPrice() != null) {
            record.setTotalAmount(record.getUnitPrice().multiply(BigDecimal.valueOf(record.getQuantity())));
        }

        if (operatorId != null) {
            Employee operator = employeeRepository.findById(operatorId).orElse(null);
            record.setOperator(operator);
        }

        MaterialRecord saved = recordRepository.save(record);
        material.setCurrentStock(stockAfter);
        materialRepository.save(material);

        return Map.of("success", true, "message", "入库成功", "data", saved);
    }

    @Transactional
    public Map<String, Object> stockOut(MaterialRecord record, Long materialId, Long operatorId) {
        Material material = materialRepository.findById(materialId).orElse(null);
        if (material == null) {
            return Map.of("success", false, "message", "物资不存在");
        }

        if (record.getQuantity() == null || record.getQuantity() <= 0) {
            return Map.of("success", false, "message", "出库数量必须大于0");
        }

        int stockBefore = material.getCurrentStock() == null ? 0 : material.getCurrentStock();
        int stockAfter = stockBefore - record.getQuantity();

        if (stockAfter < 0) {
            return Map.of("success", false, "message", "库存不足，当前库存：" + stockBefore);
        }

        record.setRecordCode("REC" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        record.setMaterial(material);
        record.setRecordType("出库");
        record.setStockBefore(stockBefore);
        record.setStockAfter(stockAfter);

        if (material.getUnitPrice() != null) {
            record.setUnitPrice(material.getUnitPrice());
            record.setTotalAmount(material.getUnitPrice().multiply(BigDecimal.valueOf(record.getQuantity())));
        }

        if (operatorId != null) {
            Employee operator = employeeRepository.findById(operatorId).orElse(null);
            record.setOperator(operator);
        }

        MaterialRecord saved = recordRepository.save(record);
        material.setCurrentStock(stockAfter);
        materialRepository.save(material);

        return Map.of("success", true, "message", "出库成功", "data", saved);
    }

    @Transactional
    public Map<String, Object> stockLoss(MaterialRecord record, Long materialId, Long operatorId) {
        Material material = materialRepository.findById(materialId).orElse(null);
        if (material == null) {
            return Map.of("success", false, "message", "物资不存在");
        }

        if (record.getQuantity() == null || record.getQuantity() <= 0) {
            return Map.of("success", false, "message", "损耗数量必须大于0");
        }

        int stockBefore = material.getCurrentStock() == null ? 0 : material.getCurrentStock();
        int stockAfter = stockBefore - record.getQuantity();

        if (stockAfter < 0) {
            return Map.of("success", false, "message", "库存不足，当前库存：" + stockBefore);
        }

        record.setRecordCode("REC" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        record.setMaterial(material);
        record.setRecordType("损耗");
        record.setStockBefore(stockBefore);
        record.setStockAfter(stockAfter);

        if (material.getUnitPrice() != null) {
            record.setUnitPrice(material.getUnitPrice());
            record.setTotalAmount(material.getUnitPrice().multiply(BigDecimal.valueOf(record.getQuantity())));
        }

        if (operatorId != null) {
            Employee operator = employeeRepository.findById(operatorId).orElse(null);
            record.setOperator(operator);
        }

        material.setCurrentStock(stockAfter);
        materialRepository.save(material);

        return Map.of("success", true, "message", "损耗登记成功", "data", record);
    }

    public Map<String, Object> getStatistics() {
        Map<String, Object> result = new HashMap<>();
        result.put("totalInCount", recordRepository.findByRecordType("入库").size());
        result.put("totalOutCount", recordRepository.findByRecordType("出库").size());
        result.put("totalLossCount", recordRepository.findByRecordType("损耗").size());
        return result;
    }
}
