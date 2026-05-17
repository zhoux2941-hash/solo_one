package com.construction.service;

import com.construction.common.PageResult;
import com.construction.common.Result;
import com.construction.entity.Material;
import com.construction.entity.MaterialInventory;
import com.construction.repository.MaterialRepository;
import com.construction.repository.MaterialInventoryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import javax.annotation.Resource;
import javax.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

@Service
public class MaterialService {

    @Resource
    private MaterialRepository materialRepository;

    @Resource
    private MaterialInventoryRepository materialInventoryRepository;

    public Result<PageResult<Material>> getMaterialList(Integer pageNum, Integer pageSize, String keyword, String materialType, Long projectId) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));

        Specification<Material> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (projectId != null) {
                predicates.add(criteriaBuilder.equal(root.get("projectId"), projectId));
            }

            if (StringUtils.hasText(keyword)) {
                Predicate nameLike = criteriaBuilder.like(root.get("materialName"), "%" + keyword + "%");
                Predicate codeLike = criteriaBuilder.like(root.get("materialCode"), "%" + keyword + "%");
                predicates.add(criteriaBuilder.or(nameLike, codeLike));
            }

            if (StringUtils.hasText(materialType)) {
                predicates.add(criteriaBuilder.equal(root.get("materialType"), materialType));
            }

            predicates.add(criteriaBuilder.equal(root.get("status"), 1));

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Page<Material> page = materialRepository.findAll(spec, pageable);
        return Result.success(PageResult.of(page));
    }

    public Result<Material> getMaterialById(Long id) {
        Material material = materialRepository.findById(id).orElse(null);
        if (material == null) {
            return Result.error("物料不存在");
        }
        return Result.success(material);
    }

    @Transactional
    public Result<Material> addMaterial(Material material) {
        if (materialRepository.existsByMaterialNameAndProjectId(material.getMaterialName(), material.getProjectId())) {
            return Result.error("该项目下已存在同名物料");
        }

        material.setId(null);
        Material saved = materialRepository.save(material);

        MaterialInventory inventory = new MaterialInventory();
        inventory.setMaterialId(saved.getId());
        inventory.setProjectId(saved.getProjectId());
        materialInventoryRepository.save(inventory);

        return Result.success("添加成功", saved);
    }

    @Transactional
    public Result<Material> updateMaterial(Long id, Material material) {
        Material existing = materialRepository.findById(id).orElse(null);
        if (existing == null) {
            return Result.error("物料不存在");
        }

        if (materialRepository.existsByMaterialNameAndProjectIdAndIdNot(material.getMaterialName(), material.getProjectId(), id)) {
            return Result.error("该项目下已存在同名物料");
        }

        existing.setMaterialName(material.getMaterialName());
        existing.setMaterialCode(material.getMaterialCode());
        existing.setMaterialType(material.getMaterialType());
        existing.setSpecification(material.getSpecification());
        existing.setUnit(material.getUnit());
        existing.setUnitPrice(material.getUnitPrice());
        existing.setSupplier(material.getSupplier());
        existing.setMinStockQuantity(material.getMinStockQuantity());
        existing.setDescription(material.getDescription());

        Material updated = materialRepository.save(existing);
        return Result.success("更新成功", updated);
    }

    @Transactional
    public Result<Void> deleteMaterial(Long id) {
        if (!materialRepository.existsById(id)) {
            return Result.error("物料不存在");
        }
        materialRepository.deleteById(id);
        return Result.success("删除成功");
    }

    public Result<List<Material>> getMaterialsByProjectId(Long projectId) {
        List<Material> materials = materialRepository.findByProjectId(projectId);
        return Result.success(materials);
    }
}
