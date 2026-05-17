package com.wenwan.bracelet.service;

import com.wenwan.bracelet.entity.Product;
import com.wenwan.bracelet.entity.User;
import com.wenwan.bracelet.repository.ProductRepository;
import com.wenwan.bracelet.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Product> findAll() {
        return productRepository.findAll();
    }

    public List<Product> findPublished() {
        return productRepository.findByIsPublishedTrue();
    }

    public Product findById(Long id) {
        return productRepository.findById(id).orElse(null);
    }

    public List<Product> findByCraftsmanId(Long craftsmanId) {
        return productRepository.findByCraftsmanId(craftsmanId);
    }

    public List<Product> findByStyle(Product.ProductStyle style) {
        return productRepository.findByStyle(style);
    }

    public Product createProduct(Product product, Long craftsmanId) {
        User craftsman = userRepository.findById(craftsmanId).orElse(null);
        if (craftsman != null && craftsman.getRole() == User.UserRole.CRAFTSMAN) {
            product.setCraftsman(craftsman);
            return productRepository.save(product);
        }
        return null;
    }

    public Product updateProduct(Long id, Product productDetails) {
        Product product = findById(id);
        if (product != null) {
            product.setName(productDetails.getName());
            product.setStyle(productDetails.getStyle());
            product.setDescription(productDetails.getDescription());
            product.setMaterialList(productDetails.getMaterialList());
            product.setPrice(productDetails.getPrice());
            product.setMainImageUrl(productDetails.getMainImageUrl());
            product.setImageUrls(productDetails.getImageUrls());
            product.setPublished(productDetails.getPublished());
            return productRepository.save(product);
        }
        return null;
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    public Product incrementViewCount(Long id) {
        Product product = findById(id);
        if (product != null) {
            product.setViewCount(product.getViewCount() + 1);
            return productRepository.save(product);
        }
        return null;
    }

    public Product incrementLikeCount(Long id) {
        Product product = findById(id);
        if (product != null) {
            product.setLikeCount(product.getLikeCount() + 1);
            return productRepository.save(product);
        }
        return null;
    }
}