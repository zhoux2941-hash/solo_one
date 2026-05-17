package com.scenic.repository;

import com.scenic.entity.MaterialCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialCategoryRepository extends JpaRepository<MaterialCategory, Long> {

    Optional<MaterialCategory> findByCategoryCode(String categoryCode);

    @Query("SELECT c FROM MaterialCategory c WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR c.categoryCode LIKE %:keyword% OR c.categoryName LIKE %:keyword%) AND " +
           "(:status IS NULL OR :status = '' OR c.status = :status)")
    List<MaterialCategory> findByConditions(
            @Param("keyword") String keyword,
            @Param("status") String status);

    List<MaterialCategory> findByStatus(String status);

    boolean existsByCategoryCode(String categoryCode);
}
