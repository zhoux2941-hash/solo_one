package com.oms.repository;

import com.oms.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySkuCode(String skuCode);
    List<Product> findByTenantId(Long tenantId);
    List<Product> findByTenantIdAndCategory(Long tenantId, String category);
}
