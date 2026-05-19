package com.community.buying.controller;

import com.community.buying.common.Result;
import com.community.buying.dto.ProductImportDTO;
import com.community.buying.entity.Product;
import com.community.buying.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @GetMapping("/public/list")
    public Result<List<Product>> getPublicProducts() {
        return Result.success(productService.findByStatus(1));
    }

    @GetMapping("/public/recommend")
    public Result<List<Product>> getRecommendProducts() {
        return Result.success(productService.findRecommendProducts());
    }

    @GetMapping("/public/category/{categoryId}")
    public Result<List<Product>> getProductsByCategory(@PathVariable Long categoryId) {
        return Result.success(productService.findByCategoryIdAndStatus(categoryId, 1));
    }

    @GetMapping("/public/{id}")
    public Result<Product> getProductDetail(@PathVariable Long id) {
        Product product = productService.findById(id);
        if (product != null) {
            return Result.success(product);
        }
        return Result.error("商品不存在");
    }

    @GetMapping
    @PreAuthorize("hasAuthority('product:read')")
    public Result<List<Product>> getAllProducts() {
        return Result.success(productService.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('product:write')")
    public Result<Product> createProduct(@RequestBody Product product) {
        return Result.success("创建成功", productService.save(product));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('product:write')")
    public Result<Product> updateProduct(@PathVariable Long id, @RequestBody Product product) {
        product.setId(id);
        return Result.success("更新成功", productService.save(product));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('product:write')")
    public Result<Product> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        Product product = productService.updateStatus(id, status);
        if (product != null) {
            return Result.success("状态更新成功", product);
        }
        return Result.error("商品不存在");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('product:write')")
    public Result<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteById(id);
        return Result.success("删除成功");
    }

    @PostMapping("/batch-import")
    @PreAuthorize("hasAuthority('product:write')")
    public Result<Map<String, Object>> batchImportProducts(@RequestBody List<ProductImportDTO> importList) {
        Map<String, Object> result = productService.batchImportProducts(importList);
        return Result.success("批量导入完成", result);
    }
}