package com.scenic.service;

import com.scenic.entity.Employee;
import com.scenic.entity.MaterialCategory;
import com.scenic.repository.EmployeeRepository;
import com.scenic.repository.MaterialCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class MaterialCategoryService {

    @Autowired
    private MaterialCategoryRepository categoryRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    public Optional<MaterialCategory> findById(Long id) {
        return categoryRepository.findById(id);
    }

    public Optional<MaterialCategory> findByCategoryCode(String categoryCode) {
        return categoryRepository.findByCategoryCode(categoryCode);
    }

    public List<MaterialCategory> findByConditions(String keyword, String status) {
        return categoryRepository.findByConditions(keyword, status);
    }

    public List<MaterialCategory> findByStatus(String status) {
        return categoryRepository.findByStatus(status);
    }

    @Transactional
    public Map<String, Object> createCategory(MaterialCategory category, Long managerId) {
        if (category.getCategoryCode() == null || category.getCategoryCode().isEmpty()) {
            category.setCategoryCode("MC" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        }

        if (categoryRepository.existsByCategoryCode(category.getCategoryCode())) {
            return Map.of("success", false, "message", "类别编码已存在");
        }

        if (managerId != null) {
            Employee manager = employeeRepository.findById(managerId).orElse(null);
            category.setManager(manager);
        }

        MaterialCategory saved = categoryRepository.save(category);
        return Map.of("success", true, "message", "创建成功", "data", saved);
    }

    @Transactional
    public Map<String, Object> updateCategory(Long id, MaterialCategory category, Long managerId) {
        MaterialCategory existing = categoryRepository.findById(id).orElse(null);
        if (existing == null) {
            return Map.of("success", false, "message", "类别不存在");
        }

        existing.setCategoryName(category.getCategoryName());
        existing.setDescription(category.getDescription());
        existing.setStatus(category.getStatus());
        existing.setRemark(category.getRemark());

        if (managerId != null) {
            Employee manager = employeeRepository.findById(managerId).orElse(null);
            existing.setManager(manager);
        }

        MaterialCategory saved = categoryRepository.save(existing);
        return Map.of("success", true, "message", "更新成功", "data", saved);
    }

    @Transactional
    public Map<String, Object> deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            return Map.of("success", false, "message", "类别不存在");
        }
        categoryRepository.deleteById(id);
        return Map.of("success", true, "message", "删除成功");
    }

    public Map<String, Object> getStatistics() {
        Map<String, Object> result = new HashMap<>();
        result.put("totalCount", categoryRepository.count());
        result.put("activeCount", categoryRepository.findByStatus("启用").size());
        return result;
    }
}
