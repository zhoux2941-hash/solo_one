package com.factory.service;

import com.factory.common.Result;
import com.factory.entity.Material;
import com.factory.repository.MaterialRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class MaterialService {

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
        
        return Result.success(materials);
    }

    public Result<Material> findById(Long id) {
        Optional<Material> material = materialRepository.findById(id);
        return material.map(Result::success).orElseGet(() -> Result.error("物料不存在"));
    }

    public Result<Material> save(Material material) {
        if (materialRepository.existsByMaterialCode(material.getMaterialCode())) {
            return Result.error("物料编码已存在");
        }
        Material saved = materialRepository.save(material);
        return Result.success(saved);
    }

    public Result<Material> update(Long id, Material material) {
        Optional<Material> existingOptional = materialRepository.findById(id);
        if (!existingOptional.isPresent()) {
            return Result.error("物料不存在");
        }

        Material existing = existingOptional.get();
        
        if (!existing.getMaterialCode().equals(material.getMaterialCode()) 
                && materialRepository.existsByMaterialCode(material.getMaterialCode())) {
            return Result.error("物料编码已存在");
        }

        material.setId(id);
        material.setCreateTime(existing.getCreateTime());
        Material updated = materialRepository.save(material);
        return Result.success(updated);
    }

    public Result<Void> delete(Long id) {
        if (!materialRepository.existsById(id)) {
            return Result.error("物料不存在");
        }
        materialRepository.deleteById(id);
        return Result.success();
    }
}