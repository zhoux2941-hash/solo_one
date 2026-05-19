package com.oms.service;

import com.oms.config.TenantContext;
import com.oms.entity.Product;
import com.oms.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    @Transactional
    public Product createProduct(Product product) {
        Long currentTenantId = TenantContext.getTenantId();
        if (currentTenantId == null) {
            throw new RuntimeException("未找到租户信息，请重新登录");
        }
        
        product.setTenantId(currentTenantId);
        if (product.getStatus() == null) {
            product.setStatus(Product.ProductStatus.ACTIVE);
        }
        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(Long id, Product productDetails) {
        Long currentTenantId = TenantContext.getTenantId();
        
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("商品不存在"));

        if (!product.getTenantId().equals(currentTenantId)) {
            throw new RuntimeException("无权限访问此商品");
        }
        
        product.setProductName(productDetails.getProductName());
        product.setCategory(productDetails.getCategory());
        product.setBrand(productDetails.getBrand());
        product.setUnit(productDetails.getUnit());
        product.setCostPrice(productDetails.getCostPrice());
        product.setSalePrice(productDetails.getSalePrice());
        product.setVipPrice(productDetails.getVipPrice());
        product.setStockQuantity(productDetails.getStockQuantity());
        product.setBarcode(productDetails.getBarcode());
        product.setSpecifications(productDetails.getSpecifications());
        product.setImageUrl(productDetails.getImageUrl());
        
        return productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Long currentTenantId = TenantContext.getTenantId();
        
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("商品不存在"));

        if (!product.getTenantId().equals(currentTenantId)) {
            throw new RuntimeException("无权限访问此商品");
        }
        
        product.setStatus(Product.ProductStatus.DISCONTINUED);
        productRepository.save(product);
    }

    public List<Product> getCurrentTenantProducts() {
        Long currentTenantId = TenantContext.getTenantId();
        if (currentTenantId == null) {
            throw new RuntimeException("未找到租户信息，请重新登录");
        }
        return productRepository.findByTenantId(currentTenantId);
    }

    public Product getProductById(Long id) {
        Long currentTenantId = TenantContext.getTenantId();
        
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("商品不存在"));

        if (!product.getTenantId().equals(currentTenantId)) {
            throw new RuntimeException("无权限访问此商品");
        }
        
        return product;
    }

    @Transactional
    public Product updateStock(Long id, Integer quantity) {
        Long currentTenantId = TenantContext.getTenantId();
        
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("商品不存在"));

        if (!product.getTenantId().equals(currentTenantId)) {
            throw new RuntimeException("无权限访问此商品");
        }
        
        product.setStockQuantity(quantity);
        return productRepository.save(product);
    }
}
