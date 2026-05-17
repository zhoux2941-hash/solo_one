package com.construction.repository;

import com.construction.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long>, JpaSpecificationExecutor<Material> {

    List<Material> findByProjectId(Long projectId);

    boolean existsByMaterialNameAndProjectId(String materialName, Long projectId);

    boolean existsByMaterialNameAndProjectIdAndIdNot(String materialName, Long projectId, Long id);
}
