package com.wenwan.bracelet.repository;

import com.wenwan.bracelet.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByCraftsmanId(Long craftsmanId);

    List<Product> findByIsPublishedTrue();

    List<Product> findByStyle(Product.ProductStyle style);

    List<Product> findByCraftsmanIdAndIsPublished(Long craftsmanId, Boolean isPublished);
}