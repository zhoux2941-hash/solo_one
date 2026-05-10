package com.example.trashbin.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.trashbin.dto.ProductDTO;
import com.example.trashbin.entity.Product;
import com.example.trashbin.mapper.ProductMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService extends ServiceImpl<ProductMapper, Product> {

    @Transactional(rollbackFor = Exception.class)
    public Product create(ProductDTO dto) {
        Product product = new Product();
        product.setName(dto.getName());
        product.setPointsRequired(dto.getPointsRequired());
        product.setStock(dto.getStock());
        this.save(product);
        return product;
    }

    @Transactional(rollbackFor = Exception.class)
    public Product update(ProductDTO dto) {
        Product product = this.getById(dto.getId());
        if (product == null) {
            throw new RuntimeException("商品不存在");
        }
        product.setName(dto.getName());
        product.setPointsRequired(dto.getPointsRequired());
        product.setStock(dto.getStock());
        this.updateById(product);
        return product;
    }

    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        this.removeById(id);
    }

    public List<Product> listAll() {
        return this.list();
    }

    public Product getById(Long id) {
        Product product = super.getById(id);
        if (product == null) {
            throw new RuntimeException("商品不存在");
        }
        return product;
    }

    public boolean decreaseStock(Long productId, int quantity) {
        Product product = this.getById(productId);
        if (product.getStock() < quantity) {
            return false;
        }
        product.setStock(product.getStock() - quantity);
        return this.updateById(product);
    }

    public boolean increaseStock(Long productId, int quantity) {
        Product product = this.getById(productId);
        product.setStock(product.getStock() + quantity);
        return this.updateById(product);
    }
}
