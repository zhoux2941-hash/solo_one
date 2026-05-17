package com.wenwan.bracelet.service;

import com.wenwan.bracelet.entity.Material;
import com.wenwan.bracelet.repository.MaterialRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MaterialService {

    @Autowired
    private MaterialRepository materialRepository;

    public List<Material> findAll() {
        return materialRepository.findAll();
    }

    public Material findById(Long id) {
        return materialRepository.findById(id).orElse(null);
    }

    public List<Material> findByCategory(Material.MaterialCategory category) {
        return materialRepository.findByCategory(category);
    }

    public List<Material> searchByName(String name) {
        return materialRepository.findByNameContaining(name);
    }

    public Material save(Material material) {
        return materialRepository.save(material);
    }

    public Material update(Long id, Material materialDetails) {
        Material material = findById(id);
        if (material != null) {
            material.setName(materialDetails.getName());
            material.setCategory(materialDetails.getCategory());
            material.setMaterial(materialDetails.getMaterial());
            material.setSizeSpec(materialDetails.getSizeSpec());
            material.setPatternDescription(materialDetails.getPatternDescription());
            material.setOrigin(materialDetails.getOrigin());
            material.setReferencePrice(materialDetails.getReferencePrice());
            material.setStockQuantity(materialDetails.getStockQuantity());
            material.setUnit(materialDetails.getUnit());
            material.setImageUrl(materialDetails.getImageUrl());
            material.setDescription(materialDetails.getDescription());
            return materialRepository.save(material);
        }
        return null;
    }

    public void delete(Long id) {
        materialRepository.deleteById(id);
    }

    public List<Material> findAvailableMaterials() {
        return materialRepository.findByStockQuantityGreaterThan(0);
    }
}