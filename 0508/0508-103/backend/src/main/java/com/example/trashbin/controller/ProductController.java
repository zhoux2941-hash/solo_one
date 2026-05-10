package com.example.trashbin.controller;

import com.example.trashbin.common.Result;
import com.example.trashbin.dto.ProductDTO;
import com.example.trashbin.entity.Product;
import com.example.trashbin.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/product")
public class ProductController {

    @Autowired
    private ProductService productService;

    @PostMapping
    public Result<Product> create(@Validated @RequestBody ProductDTO dto) {
        try {
            Product product = productService.create(dto);
            return Result.success(product);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping
    public Result<Product> update(@Validated @RequestBody ProductDTO dto) {
        try {
            Product product = productService.update(dto);
            return Result.success(product);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        try {
            productService.delete(id);
            return Result.success();
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/list")
    public Result<List<Product>> list() {
        return Result.success(productService.listAll());
    }

    @GetMapping("/{id}")
    public Result<Product> getById(@PathVariable Long id) {
        try {
            Product product = productService.getById(id);
            return Result.success(product);
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }
}
