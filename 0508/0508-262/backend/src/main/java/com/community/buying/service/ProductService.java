package com.community.buying.service;

import com.community.buying.dto.ProductImportDTO;
import com.community.buying.entity.Category;
import com.community.buying.entity.Product;
import com.community.buying.repository.CategoryRepository;
import com.community.buying.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    public Product save(Product product) {
        return productRepository.save(product);
    }

    public Product findById(Long id) {
        return productRepository.findById(id).orElse(null);
    }

    public List<Product> findAll() {
        return productRepository.findAll();
    }

    public List<Product> findByStatus(Integer status) {
        return productRepository.findByStatus(status);
    }

    public List<Product> findByCategoryIdAndStatus(Long categoryId, Integer status) {
        return productRepository.findByCategoryIdAndStatus(categoryId, status);
    }

    public List<Product> findRecommendProducts() {
        return productRepository.findRecommendProducts();
    }

    public void deleteById(Long id) {
        productRepository.deleteById(id);
    }

    public Product updateStatus(Long id, Integer status) {
        Product product = findById(id);
        if (product != null) {
            product.setStatus(status);
            return productRepository.save(product);
        }
        return null;
    }

    public Map<String, Object> batchImportProducts(List<ProductImportDTO> importList) {
        List<Product> successList = new ArrayList<>();
        List<Map<String, Object>> failedList = new ArrayList<>();

        for (int i = 0; i < importList.size(); i++) {
            ProductImportDTO dto = importList.get(i);
            try {
                Product product = new Product();
                product.setProductName(dto.getProductName());
                product.setDescription(dto.getDescription());
                product.setImages(dto.getImages());
                product.setOriginalPrice(dto.getOriginalPrice());
                product.setGroupPrice(dto.getGroupPrice());
                product.setStock(dto.getStock() != null ? dto.getStock() : 0);
                product.setUnit(dto.getUnit());
                product.setSpecs(dto.getSpecs());
                product.setIsRecommend(dto.getIsRecommend() != null ? dto.getIsRecommend() : 0);
                product.setStatus(dto.getStatus() != null ? dto.getStatus() : 1);

                if (dto.getCategoryId() != null) {
                    Category category = categoryRepository.findById(dto.getCategoryId()).orElse(null);
                    product.setCategory(category);
                }

                Product savedProduct = productRepository.save(product);
                successList.add(savedProduct);
            } catch (Exception e) {
                Map<String, Object> failInfo = new HashMap<>();
                failInfo.put("index", i);
                failInfo.put("productName", dto.getProductName());
                failInfo.put("reason", e.getMessage());
                failedList.add(failInfo);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("successCount", successList.size());
        result.put("failedCount", failedList.size());
        result.put("successList", successList);
        result.put("failedList", failedList);
        return result;
    }
}