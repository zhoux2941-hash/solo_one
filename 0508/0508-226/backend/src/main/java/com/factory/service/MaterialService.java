package com.factory.service;

import com.factory.common.Result;
import com.factory.entity.Material;
import com.factory.repository.MaterialRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class MaterialService {

    private static final Logger logger = LoggerFactory.getLogger(MaterialService.class);

    @Autowired
    private MaterialRepository materialRepository;

    public Result<Page<Material>> findAll(int page, int size, String keyword, String type) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<Material> materials;
        
        if (keyword != null && !keyword.isEmpty()) {
            materials = materialRepository.findByMaterialNameContaining(keyword, pageable);
        } else if (type != null && !type.isEmpty()) {
            materials = materialRepository.findByMaterialType(type, pageable);
        } else {
            materials = materialRepository.findAll(pageable);
        }
        
        logger.info("查询物料列表完成，共{}条记录", materials.getTotalElements());
        return Result.success(materials);
    }

    public Result<Material> findById(Long id) {
        logger.info("查询物料详情 - id: {}", id);
        Optional<Material> material = materialRepository.findById(id);
        return material.map(Result::success).orElseGet(() -> Result.error("物料不存在"));
    }

    public Result<Material> save(Material material) {
        logger.info("开始保存物料 - code: {}, name: {}", material.getMaterialCode(), material.getMaterialName());
        
        if (materialRepository.existsByMaterialCode(material.getMaterialCode())) {
            logger.warn("物料编码已存在 - code: {}", material.getMaterialCode());
            return Result.error("物料编码已存在");
        }
        
        try {
            Material saved = materialRepository.save(material);
            logger.info("物料保存成功 - id: {}, code: {}", saved.getId(), saved.getMaterialCode());
            return Result.success(saved);
        } catch (Exception e) {
            logger.error("物料保存失败", e);
            return Result.error("物料保存失败: " + e.getMessage());
        }
    }

    public Result<Material> update(Long id, Material material) {
        logger.info("开始更新物料 - id: {}, code: {}", id, material.getMaterialCode());
        
        Optional<Material> existingOptional = materialRepository.findById(id);
        if (!existingOptional.isPresent()) {
            logger.warn("物料不存在 - id: {}", id);
            return Result.error("物料不存在");
        }

        Material existing = existingOptional.get();
        
        if (!existing.getMaterialCode().equals(material.getMaterialCode()) 
                && materialRepository.existsByMaterialCode(material.getMaterialCode())) {
            logger.warn("物料编码已存在 - code: {}", material.getMaterialCode());
            return Result.error("物料编码已存在");
        }

        material.setId(id);
        material.setCreateTime(existing.getCreateTime());
        
        try {
            Material updated = materialRepository.save(material);
            logger.info("物料更新成功 - id: {}, code: {}", updated.getId(), updated.getMaterialCode());
            return Result.success(updated);
        } catch (Exception e) {
            logger.error("物料更新失败", e);
            return Result.error("物料更新失败: " + e.getMessage());
        }
    }

    public Result<Void> delete(Long id) {
        logger.info("开始删除物料 - id: {}", id);
        
        if (!materialRepository.existsById(id)) {
            logger.warn("物料不存在 - id: {}", id);
            return Result.error("物料不存在");
        }
        
        try {
            materialRepository.deleteById(id);
            logger.info("物料删除成功 - id: {}", id);
            return Result.success();
        } catch (Exception e) {
            logger.error("物料删除失败", e);
            return Result.error("物料删除失败: " + e.getMessage());
        }
    }
}