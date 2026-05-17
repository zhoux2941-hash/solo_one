package com.wenwan.bracelet.repository;

import com.wenwan.bracelet.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {

    List<Material> findByCategory(Material.MaterialCategory category);

    List<Material> findByNameContaining(String name);

    List<Material> findByStockQuantityGreaterThan(Integer quantity);
}