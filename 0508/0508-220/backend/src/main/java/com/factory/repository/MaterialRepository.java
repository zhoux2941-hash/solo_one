package com.factory.repository;

import com.factory.entity.Material;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {
    Optional<Material> findByMaterialCode(String materialCode);
    boolean existsByMaterialCode(String materialCode);
    Page<Material> findByMaterialNameContaining(String materialName, Pageable pageable);
    Page<Material> findByMaterialType(String materialType, Pageable pageable);
}