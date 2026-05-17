package com.scenic.repository;

import com.scenic.entity.Material;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {

    Optional<Material> findByMaterialCode(String materialCode);

    @Query("SELECT m FROM Material m WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR m.materialCode LIKE %:keyword% OR m.materialName LIKE %:keyword%) AND " +
           "(:status IS NULL OR :status = '' OR m.status = :status) AND " +
           "(:categoryId IS NULL OR m.category.id = :categoryId)")
    Page<Material> findByConditions(
            @Param("keyword") String keyword,
            @Param("status") String status,
            @Param("categoryId") Long categoryId,
            Pageable pageable);

    @Query("SELECT m FROM Material m WHERE m.currentStock <= m.minStock")
    List<Material> findLowStockMaterials();

    @Query("SELECT COUNT(m) FROM Material m WHERE m.currentStock <= m.minStock")
    long countLowStockMaterials();

    List<Material> findByStatus(String status);

    boolean existsByMaterialCode(String materialCode);
}
