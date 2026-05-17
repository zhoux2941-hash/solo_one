package com.construction.repository;

import com.construction.entity.MaterialInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialInventoryRepository extends JpaRepository<MaterialInventory, Long>, JpaSpecificationExecutor<MaterialInventory> {

    Optional<MaterialInventory> findByMaterialId(Long materialId);

    List<MaterialInventory> findByProjectId(Long projectId);

    boolean existsByMaterialId(Long materialId);
}
