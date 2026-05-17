package com.scenic.service;

import com.scenic.entity.Employee;
import com.scenic.entity.Material;
import com.scenic.entity.MaterialCategory;
import com.scenic.repository.EmployeeRepository;
import com.scenic.repository.MaterialCategoryRepository;
import com.scenic.repository.MaterialRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class MaterialService {

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private MaterialCategoryRepository categoryRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    public Optional<Material> findById(Long id) {
        return materialRepository.findById(id);
    }

    public Optional<Material> findByMaterialCode(String materialCode) {
        return materialRepository.findByMaterialCode(materialCode);
    }

    public Page<Material> findByPage(String keyword, String status, Long categoryId, Pageable pageable) {
        return materialRepository.findByConditions(keyword, status, categoryId, pageable);
    }

    public List<Material> findLowStockMaterials() {
        return materialRepository.findLowStockMaterials();
    }

    public long countLowStockMaterials() {
        return materialRepository.countLowStockMaterials();
    }

    public List<Material> findByStatus(String status) {
        return materialRepository.findByStatus(status);
    }

    @Transactional
    public Map<String, Object> createMaterial(Material material, Long categoryId, Long managerId) {
        MaterialCategory category = categoryRepository.findById(categoryId).orElse(null);
        if (category == null) {
            return Map.of("success", false, "message", "物资类别不存在");
        }

        if (material.getMaterialCode() == null || material.getMaterialCode().isEmpty()) {
            material.setMaterialCode("MAT" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        }

        if (materialRepository.existsByMaterialCode(material.getMaterialCode())) {
            return Map.of("success", false, "message", "物资编码已存在");
        }

        material.setCategory(category);
        material.setCurrentStock(0);

        if (managerId != null) {
            Employee manager = employeeRepository.findById(managerId).orElse(null);
            material.setManager(manager);
        }

        Material saved = materialRepository.save(material);
        return Map.of("success", true, "message", "创建成功", "data", saved);
    }

    @Transactional
    public Map<String, Object> updateMaterial(Long id, Material material, Long categoryId, Long managerId) {
        Material existing = materialRepository.findById(id).orElse(null);
        if (existing == null) {
            return Map.of("success", false, "message", "物资不存在");
        }

        if (categoryId != null && !categoryId.equals(existing.getCategory().getId())) {
            MaterialCategory category = categoryRepository.findById(categoryId).orElse(null);
            if (category == null) {
                return Map.of("success", false, "message", "物资类别不存在");
            }
            existing.setCategory(category);
        }

        existing.setMaterialName(material.getMaterialName());
        existing.setSpecification(material.getSpecification());
        existing.setUnit(material.getUnit());
        existing.setUnitPrice(material.getUnitPrice());
        existing.setMinStock(material.getMinStock());
        existing.setMaxStock(material.getMaxStock());
        existing.setStorageLocation(material.getStorageLocation());
        existing.setStatus(material.getStatus());
        existing.setRemark(material.getRemark());

        if (managerId != null) {
            Employee manager = employeeRepository.findById(managerId).orElse(null);
            existing.setManager(manager);
        }

        Material saved = materialRepository.save(existing);
        return Map.of("success", true, "message", "更新成功", "data", saved);
    }

    @Transactional
    public Map<String, Object> deleteMaterial(Long id) {
        if (!materialRepository.existsById(id)) {
            return Map.of("success", false, "message", "物资不存在");
        }
        materialRepository.deleteById(id);
        return Map.of("success", true, "message", "删除成功");
    }

    @Transactional
    public Map<String, Object> updateStock(Long id, Integer quantity) {
        Material material = materialRepository.findById(id).orElse(null);
        if (material == null) {
            return Map.of("success", false, "message", "物资不存在");
        }

        int newStock = (material.getCurrentStock() == null ? 0 : material.getCurrentStock()) + quantity;
        if (newStock < 0) {
            return Map.of("success", false, "message", "库存不足");
        }

        material.setCurrentStock(newStock);
        materialRepository.save(material);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "库存更新成功");
        result.put("stockBefore", material.getCurrentStock() - quantity);
        result.put("stockAfter", newStock);
        result.put("isLowStock", newStock <= material.getMinStock());
        return result;
    }

    public Map<String, Object> getStatistics() {
        Map<String, Object> result = new HashMap<>();
        result.put("totalCount", materialRepository.count());
        result.put("lowStockCount", materialRepository.countLowStockMaterials());
        return result;
    }
}
