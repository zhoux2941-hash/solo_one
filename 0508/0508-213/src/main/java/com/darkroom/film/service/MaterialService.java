package com.darkroom.film.service;

import com.darkroom.film.entity.Material;
import com.darkroom.film.repository.MaterialRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MaterialService {
    @Autowired
    private MaterialRepository materialRepository;

    public List<Material> findAll() {
        return materialRepository.findAll();
    }

    public Page<Material> findAll(Pageable pageable) {
        return materialRepository.findAll(pageable);
    }

    public Optional<Material> findById(Long id) {
        return materialRepository.findById(id);
    }

    public List<Material> findByType(String type) {
        return materialRepository.findByType(type);
    }

    public Material save(Material material) {
        return materialRepository.save(material);
    }

    public void deleteById(Long id) {
        materialRepository.deleteById(id);
    }

    public Material updateStock(Long id, int quantity) {
        Optional<Material> optional = materialRepository.findById(id);
        if (optional.isPresent()) {
            Material material = optional.get();
            material.setQuantity(material.getQuantity() + quantity);
            return materialRepository.save(material);
        }
        return null;
    }
}