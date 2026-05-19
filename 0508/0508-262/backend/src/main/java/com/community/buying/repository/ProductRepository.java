package com.community.buying.repository;

import com.community.buying.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByStatus(Integer status);
    List<Product> findByCategoryIdAndStatus(Long categoryId, Integer status);
    
    @Query("SELECT p FROM Product p WHERE p.isRecommend = 1 AND p.status = 1 ORDER BY p.sortOrder ASC")
    List<Product> findRecommendProducts();
}