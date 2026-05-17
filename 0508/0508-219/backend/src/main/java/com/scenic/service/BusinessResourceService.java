package com.scenic.service;

import com.scenic.entity.BusinessResource;
import com.scenic.repository.BusinessResourceRepository;
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
public class BusinessResourceService {

    @Autowired
    private BusinessResourceRepository resourceRepository;

    public Map<String, Object> save(BusinessResource resource) {
        BusinessResource savedRes;
        
        if (resource.getId() == null) {
            // 新增资源
            if (resourceRepository.existsByResourceCode(resource.getResourceCode())) {
                return Map.of("success", false, "message", "资源编码已存在");
            }
            savedRes = resourceRepository.save(resource);
        } else {
            // 更新资源
            BusinessResource existRes = resourceRepository.findById(resource.getId()).orElse(null);
            if (existRes == null) {
                return Map.of("success", false, "message", "资源不存在");
            }
            
            // 检查编码是否被其他资源占用
            BusinessResource resByCode = resourceRepository.findByResourceCode(resource.getResourceCode()).orElse(null);
            if (resByCode != null && !resByCode.getId().equals(resource.getId())) {
                return Map.of("success", false, "message", "资源编码已存在");
            }
            
            // 更新字段
            existRes.setResourceCode(resource.getResourceCode());
            existRes.setResourceName(resource.getResourceName());
            existRes.setCategory(resource.getCategory());
            existRes.setDescription(resource.getDescription());
            existRes.setLocation(resource.getLocation());
            existRes.setOpenTime(resource.getOpenTime());
            existRes.setCloseTime(resource.getCloseTime());
            existRes.setCapacity(resource.getCapacity());
            existRes.setPrice(resource.getPrice());
            existRes.setChargeStandard(resource.getChargeStandard());
            existRes.setManager(resource.getManager());
            existRes.setStatus(resource.getStatus());
            
            savedRes = resourceRepository.save(existRes);
        }

        return Map.of("success", true, "message", "保存成功", "data", savedRes);
    }

    public Map<String, Object> delete(Long id) {
        if (!resourceRepository.existsById(id)) {
            return Map.of("success", false, "message", "资源不存在");
        }
        resourceRepository.deleteById(id);
        return Map.of("success", true, "message", "删除成功");
    }

    public Optional<BusinessResource> findById(Long id) {
        return resourceRepository.findById(id);
    }

    public List<BusinessResource> findAll() {
        return resourceRepository.findAll();
    }

    public Page<BusinessResource> findByPage(String keyword, Long categoryId, String status, Pageable pageable) {
        Specification<BusinessResource> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(keyword)) {
                predicates.add(cb.or(
                        cb.like(root.get("resourceCode"), "%" + keyword + "%"),
                        cb.like(root.get("resourceName"), "%" + keyword + "%"),
                        cb.like(root.get("location"), "%" + keyword + "%")
                ));
            }
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            if (StringUtils.hasText(status)) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return resourceRepository.findAll(spec, pageable);
    }
}
