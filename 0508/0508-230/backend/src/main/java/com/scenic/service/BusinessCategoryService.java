package com.scenic.service;

import com.scenic.entity.BusinessCategory;
import com.scenic.repository.BusinessCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class BusinessCategoryService {

    @Autowired
    private BusinessCategoryRepository categoryRepository;

    public Map<String, Object> save(BusinessCategory category) {
        BusinessCategory savedCat;
        
        if (category.getId() == null) {
            // 新增分类
            if (categoryRepository.existsByCategoryCode(category.getCategoryCode())) {
                return Map.of("success", false, "message", "分类编码已存在");
            }
            if (categoryRepository.existsByCategoryName(category.getCategoryName())) {
                return Map.of("success", false, "message", "分类名称已存在");
            }
            savedCat = categoryRepository.save(category);
        } else {
            // 更新分类
            BusinessCategory existCat = categoryRepository.findById(category.getId()).orElse(null);
            if (existCat == null) {
                return Map.of("success", false, "message", "分类不存在");
            }
            
            // 检查编码是否被其他分类占用
            BusinessCategory catByCode = categoryRepository.findByCategoryCode(category.getCategoryCode()).orElse(null);
            if (catByCode != null && !catByCode.getId().equals(category.getId())) {
                return Map.of("success", false, "message", "分类编码已存在");
            }
            
            // 检查名称是否被其他分类占用
            BusinessCategory catByName = categoryRepository.findByCategoryName(category.getCategoryName()).orElse(null);
            if (catByName != null && !catByName.getId().equals(category.getId())) {
                return Map.of("success", false, "message", "分类名称已存在");
            }
            
            // 更新字段
            existCat.setCategoryCode(category.getCategoryCode());
            existCat.setCategoryName(category.getCategoryName());
            existCat.setCategoryDesc(category.getCategoryDesc());
            existCat.setIcon(category.getIcon());
            existCat.setSortOrder(category.getSortOrder());
            existCat.setStatus(category.getStatus());
            
            savedCat = categoryRepository.save(existCat);
        }

        return Map.of("success", true, "message", "保存成功", "data", savedCat);
    }

    public Map<String, Object> delete(Long id) {
        if (!categoryRepository.existsById(id)) {
            return Map.of("success", false, "message", "分类不存在");
        }
        categoryRepository.deleteById(id);
        return Map.of("success", true, "message", "删除成功");
    }

    public Optional<BusinessCategory> findById(Long id) {
        return categoryRepository.findById(id);
    }

    public List<BusinessCategory> findAll() {
        return categoryRepository.findAll();
    }

    public List<BusinessCategory> findActive() {
        return categoryRepository.findByStatus(true);
    }

    public Page<BusinessCategory> findByPage(String keyword, Pageable pageable) {
        Specification<BusinessCategory> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(keyword)) {
                predicates.add(cb.or(
                        cb.like(root.get("categoryCode"), "%" + keyword + "%"),
                        cb.like(root.get("categoryName"), "%" + keyword + "%")
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return categoryRepository.findAll(spec, pageable);
    }
}
