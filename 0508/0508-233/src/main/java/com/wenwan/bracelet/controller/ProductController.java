package com.wenwan.bracelet.controller;

import com.wenwan.bracelet.entity.Product;
import com.wenwan.bracelet.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    @Autowired
    private ProductService productService;

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.findAll());
    }

    @GetMapping("/published")
    public ResponseEntity<List<Product>> getPublishedProducts() {
        return ResponseEntity.ok(productService.findPublished());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        Product product = productService.findById(id);
        return product != null ? ResponseEntity.ok(product) : ResponseEntity.notFound().build();
    }

    @GetMapping("/craftsman/{craftsmanId}")
    public ResponseEntity<List<Product>> getProductsByCraftsman(@PathVariable Long craftsmanId) {
        return ResponseEntity.ok(productService.findByCraftsmanId(craftsmanId));
    }

    @GetMapping("/style/{style}")
    public ResponseEntity<List<Product>> getProductsByStyle(@PathVariable String style) {
        try {
            Product.ProductStyle productStyle = Product.ProductStyle.valueOf(style);
            return ResponseEntity.ok(productService.findByStyle(productStyle));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/craftsman/{craftsmanId}")
    public ResponseEntity<Product> createProduct(@RequestBody Product product, @PathVariable Long craftsmanId) {
        Product newProduct = productService.createProduct(product, craftsmanId);
        return newProduct != null ? ResponseEntity.ok(newProduct) : ResponseEntity.badRequest().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product productDetails) {
        Product product = productService.updateProduct(id, productDetails);
        return product != null ? ResponseEntity.ok(product) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<Product> incrementViewCount(@PathVariable Long id) {
        Product product = productService.incrementViewCount(id);
        return product != null ? ResponseEntity.ok(product) : ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<Product> incrementLikeCount(@PathVariable Long id) {
        Product product = productService.incrementLikeCount(id);
        return product != null ? ResponseEntity.ok(product) : ResponseEntity.notFound().build();
    }
}